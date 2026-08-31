import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';
import { computeWorkingDays, computeAttendancePercentage, computeGrade } from '../utils/helpers.js';

const router = Router();

router.use(authenticateToken);
router.use(authorize('ADMIN'));

// Full dashboard stats — all from live DB queries
router.get('/dashboard', async (req, res, next) => {
  try {
    const { academicYearId } = req.query;

    // Get active academic year if not provided
    let ayId = String(academicYearId || '');
    if (!ayId) {
      const activeAy = await prisma.academicYear.findFirst({ where: { isActive: true } });
      ayId = activeAy?.id || '';
    }

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalDivisions,
    ] = await Promise.all([
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.teacher.count({ where: { user: { status: 'ACTIVE' } } }),
      prisma.class.count(),
      prisma.division.count(),
    ]);

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today;

    const todayAttendance = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        date: todayStr,
        ...(ayId && { academicYearId: ayId }),
      },
      _count: { status: true },
    });

    const presentToday = todayAttendance.find(a => a.status === 'PRESENT')?._count?.status || 0;
    const absentToday = todayAttendance.find(a => a.status === 'ABSENT')?._count?.status || 0;
    const leaveToday = todayAttendance.find(a => a.status === 'LEAVE')?._count?.status || 0;

    // Pending marks: enrollments without any mark record in the active year
    const totalEnrollments = ayId
      ? await prisma.studentEnrollment.count({ where: { academicYearId: ayId } })
      : 0;

    const studentsWithMarks = ayId
      ? await prisma.mark.groupBy({
          by: ['studentId'],
          where: { academicYearId: ayId },
        })
      : [];

    const pendingMarks = Math.max(0, totalEnrollments - studentsWithMarks.length);

    // Completed report cards
    const completedReportCards = ayId
      ? await prisma.reportCard.count({
          where: { academicYearId: ayId, status: 'FINALIZED' },
        })
      : 0;

    const totalReportCards = ayId
      ? await prisma.reportCard.count({ where: { academicYearId: ayId } })
      : 0;

    // At-risk students: attendance < 75% OR avg marks < 40%
    let atRiskCount = 0;
    if (ayId) {
      const enrollments = await prisma.studentEnrollment.findMany({
        where: { academicYearId: ayId },
        include: { student: true },
      });

      const academicYear = await prisma.academicYear.findUnique({ where: { id: ayId } });
      const holidays = academicYear
        ? await prisma.holiday.findMany({ where: { academicYearId: ayId } })
        : [];
      const holidayDates = holidays.map(h => h.date);
      const workingDays = academicYear
        ? computeWorkingDays(academicYear.startDate, academicYear.endDate, holidayDates)
        : 220;

      for (const enroll of enrollments.slice(0, 200)) { // limit for perf
        const attCount = await prisma.attendance.count({
          where: { studentId: enroll.studentId, academicYearId: ayId, status: 'PRESENT' },
        });
        const attPct = computeAttendancePercentage(attCount, workingDays);

        if (attPct < 75) {
          atRiskCount++;
          continue;
        }

        const marks = await prisma.mark.findMany({
          where: { studentId: enroll.studentId, academicYearId: ayId },
          include: { subject: true },
        });
        if (marks.length > 0) {
          const totalObtained = marks.reduce((s, m) => s + (m.marksObtained || 0), 0);
          const totalMax = marks.reduce((s, m) => s + m.subject.maxMarks, 0);
          const avgPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 100;
          if (avgPct < 40) atRiskCount++;
        }
      }
    }

    // Average attendance across all students in active year
    let avgAttendance = 0;
    if (ayId) {
      const attendanceCounts = await prisma.attendance.groupBy({
        by: ['studentId'],
        where: { academicYearId: ayId, status: 'PRESENT' },
        _count: { status: true },
      });
      if (attendanceCounts.length > 0) {
        const academicYear = await prisma.academicYear.findUnique({ where: { id: ayId } });
        const holidays = academicYear
          ? await prisma.holiday.findMany({ where: { academicYearId: ayId } })
          : [];
        const holidayDates = holidays.map(h => h.date);
        const workingDays = academicYear
          ? computeWorkingDays(academicYear.startDate, academicYear.endDate, holidayDates)
          : 220;
        const totalPct = attendanceCounts.reduce(
          (sum, a) => sum + computeAttendancePercentage(a._count.status, workingDays),
          0
        );
        avgAttendance = Number((totalPct / attendanceCounts.length).toFixed(1));
      }
    }

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalDivisions,
        presentToday,
        absentToday,
        leaveToday,
        pendingMarks,
        completedReportCards,
        totalReportCards,
        atRiskStudents: atRiskCount,
        avgAttendance,
      },
    });
  } catch (err) { next(err); }
});

// Attendance trends — last 30 days
router.get('/attendance-trends', async (req, res, next) => {
  try {
    const { academicYearId, days = '30', classId } = req.query;

    let ayId = String(academicYearId || '');
    if (!ayId) {
      const activeAy = await prisma.academicYear.findFirst({ where: { isActive: true } });
      ayId = activeAy?.id || '';
    }

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    startDate.setHours(0, 0, 0, 0);

    const where: any = {
      date: { gte: startDate, lte: endDate },
      ...(ayId && { academicYearId: ayId }),
      ...(classId && { classId: String(classId) }),
    };

    const records = await prisma.attendance.groupBy({
      by: ['date', 'status'],
      where,
      _count: { status: true },
      orderBy: { date: 'asc' },
    });

    // Build date-indexed map
    const dateMap: Record<string, { date: string; present: number; absent: number; leave: number }> = {};
    for (const rec of records) {
      const dateKey = new Date(rec.date).toISOString().split('T')[0];
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { date: dateKey, present: 0, absent: 0, leave: 0 };
      }
      if (rec.status === 'PRESENT') dateMap[dateKey].present = rec._count.status;
      if (rec.status === 'ABSENT') dateMap[dateKey].absent = rec._count.status;
      if (rec.status === 'LEAVE') dateMap[dateKey].leave = rec._count.status;
    }

    res.json({ success: true, data: Object.values(dateMap) });
  } catch (err) { next(err); }
});

// Grade distribution — count of students per grade band for an exam/year
router.get('/grade-distribution', async (req, res, next) => {
  try {
    const { academicYearId, classId, examId } = req.query;

    let ayId = String(academicYearId || '');
    if (!ayId) {
      const activeAy = await prisma.academicYear.findFirst({ where: { isActive: true } });
      ayId = activeAy?.id || '';
    }

    const rules = await prisma.gradeRule.findMany({ orderBy: { minPercentage: 'desc' } });
    if (rules.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Aggregate per student
    const where: any = { ...(ayId && { academicYearId: ayId }) };
    if (classId) where.classId = String(classId);
    if (examId) where.examId = String(examId);

    const allMarks = await prisma.mark.findMany({
      where,
      include: { subject: true },
    });

    // Group by studentId, compute percentage, assign grade
    const studentMap: Record<string, { obtained: number; max: number }> = {};
    for (const m of allMarks) {
      if (!studentMap[m.studentId]) studentMap[m.studentId] = { obtained: 0, max: 0 };
      studentMap[m.studentId].obtained += m.marksObtained || 0;
      studentMap[m.studentId].max += m.subject.maxMarks;
    }

    const gradeCounts: Record<string, number> = {};
    for (const [, val] of Object.entries(studentMap)) {
      const pct = val.max > 0 ? (val.obtained / val.max) * 100 : 0;
      const grade = computeGrade(pct, rules);
      gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
    }

    const data = Object.entries(gradeCounts).map(([grade, count]) => ({ grade, count }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// At-risk students — attendance < 75% OR marks < 40%
router.get('/at-risk', async (req, res, next) => {
  try {
    const { academicYearId, limit = '20' } = req.query;

    let ayId = String(academicYearId || '');
    if (!ayId) {
      const activeAy = await prisma.academicYear.findFirst({ where: { isActive: true } });
      ayId = activeAy?.id || '';
    }

    if (!ayId) return res.json({ success: true, data: [] });

    const academicYear = await prisma.academicYear.findUnique({ where: { id: ayId } });
    const holidays = await prisma.holiday.findMany({ where: { academicYearId: ayId } });
    const workingDays = computeWorkingDays(
      academicYear!.startDate,
      academicYear!.endDate,
      holidays.map(h => h.date)
    );

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { academicYearId: ayId },
      include: {
        student: { select: { id: true, name: true, admissionNo: true } },
        class: { select: { name: true } },
        division: { select: { name: true } },
      },
      take: 200,
    });

    const atRisk = [];
    for (const enroll of enrollments) {
      const presentCount = await prisma.attendance.count({
        where: { studentId: enroll.studentId, academicYearId: ayId, status: 'PRESENT' },
      });
      const attPct = computeAttendancePercentage(presentCount, workingDays);

      const marks = await prisma.mark.findMany({
        where: { studentId: enroll.studentId, academicYearId: ayId },
        include: { subject: true },
      });

      let avgMarksPct = 100;
      if (marks.length > 0) {
        const totalObtained = marks.reduce((s, m) => s + (m.marksObtained || 0), 0);
        const totalMax = marks.reduce((s, m) => s + m.subject.maxMarks, 0);
        avgMarksPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 100;
      }

      const reasons = [];
      if (attPct < 75) reasons.push(`Low attendance: ${attPct.toFixed(1)}%`);
      if (avgMarksPct < 40 && marks.length > 0) reasons.push(`Low marks: ${avgMarksPct.toFixed(1)}%`);

      if (reasons.length > 0) {
        atRisk.push({
          studentId: enroll.studentId,
          name: enroll.student.name,
          admissionNo: enroll.student.admissionNo,
          class: enroll.class.name,
          division: enroll.division.name,
          attendancePct: attPct,
          marksPct: Number(avgMarksPct.toFixed(1)),
          reasons,
        });
      }

      if (atRisk.length >= Number(limit)) break;
    }

    res.json({ success: true, data: atRisk });
  } catch (err) { next(err); }
});

// Top performing students
router.get('/toppers', async (req, res, next) => {
  try {
    const { academicYearId, examId, classId, limit = '10' } = req.query;

    let ayId = String(academicYearId || '');
    if (!ayId) {
      const activeAy = await prisma.academicYear.findFirst({ where: { isActive: true } });
      ayId = activeAy?.id || '';
    }

    const where: any = { ...(ayId && { academicYearId: ayId }) };
    if (examId) where.examId = String(examId);
    if (classId) where.classId = String(classId);

    const allMarks = await prisma.mark.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, admissionNo: true } },
        subject: { select: { maxMarks: true } },
        class: { select: { name: true } },
        division: { select: { name: true } },
      },
    });

    const rules = await prisma.gradeRule.findMany({ orderBy: { minPercentage: 'desc' } });

    // Aggregate per student
    const studentMap: Record<string, {
      name: string; admissionNo: string; class: string; division: string;
      obtained: number; max: number;
    }> = {};

    for (const m of allMarks) {
      if (!studentMap[m.studentId]) {
        studentMap[m.studentId] = {
          name: m.student.name,
          admissionNo: m.student.admissionNo,
          class: m.class.name,
          division: m.division.name,
          obtained: 0,
          max: 0,
        };
      }
      studentMap[m.studentId].obtained += m.marksObtained || 0;
      studentMap[m.studentId].max += m.subject.maxMarks;
    }

    const sorted = Object.entries(studentMap)
      .map(([studentId, v]) => ({
        studentId,
        name: v.name,
        admissionNo: v.admissionNo,
        class: v.class,
        division: v.division,
        totalMarks: v.obtained,
        maxMarks: v.max,
        percentage: v.max > 0 ? Number(((v.obtained / v.max) * 100).toFixed(2)) : 0,
        grade: computeGrade(v.max > 0 ? (v.obtained / v.max) * 100 : 0, rules),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, Number(limit))
      .map((s, i) => ({ ...s, rank: i + 1 }));

    res.json({ success: true, data: sorted });
  } catch (err) { next(err); }
});

// Class-wise student count
router.get('/class-distribution', async (req, res, next) => {
  try {
    const { academicYearId } = req.query;

    let ayId = String(academicYearId || '');
    if (!ayId) {
      const activeAy = await prisma.academicYear.findFirst({ where: { isActive: true } });
      ayId = activeAy?.id || '';
    }

    const classes = await prisma.class.findMany({ orderBy: { displayOrder: 'asc' } });
    const result = await Promise.all(
      classes.map(async (cls) => {
        const count = ayId
          ? await prisma.studentEnrollment.count({ where: { classId: cls.id, academicYearId: ayId } })
          : 0;
        return { class: cls.name, count };
      })
    );

    res.json({ success: true, data: result.filter(r => r.count > 0) });
  } catch (err) { next(err); }
});

export default router;
