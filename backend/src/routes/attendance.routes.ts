import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';
import { computeWorkingDays, computeAttendancePercentage } from '../utils/helpers.js';

const router = Router();

router.use(authenticateToken);

// Get attendance for a class/division/date (for marking/editing)
router.get('/', authorize('ADMIN', 'FACULTY'), async (req: AuthRequest, res, next) => {
  try {
    const { classId, divisionId, date, academicYearId } = req.query;

    const where: any = {};
    if (classId) where.classId = String(classId);
    if (divisionId) where.divisionId = String(divisionId);
    if (academicYearId) where.academicYearId = String(academicYearId);
    if (date) where.date = new Date(String(date));

    const att = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, rollNo: true, admissionNo: true } },
        markedBy: { select: { name: true } },
      },
      orderBy: [{ student: { rollNo: 'asc' } }],
    });
    res.json({ success: true, data: att });
  } catch (err) { next(err); }
});

// Bulk save/upsert attendance for a class/date
router.post('/', authorize('ADMIN', 'FACULTY'), async (req: AuthRequest, res, next) => {
  try {
    const records = Array.isArray(req.body) ? req.body : (req.body.records || []);
    if (!records || records.length === 0) {
      return res.status(400).json({ success: false, error: 'No attendance records provided' });
    }

    const teacher = await prisma.teacher.findFirst({ where: { userId: req.user?.id } });
    const markedById = teacher?.id || null;

    // Active academic year fallback
    let defaultYearId = req.body.academicYearId;
    if (!defaultYearId) {
      const activeAy = await prisma.academicYear.findFirst({ where: { isActive: true } });
      defaultYearId = activeAy?.id;
    }

    const defaultDateStr = req.body.date || new Date().toISOString().split('T')[0];

    let finalMarkedById = teacher?.id;
    if (!finalMarkedById) {
      const anyTeacher = await prisma.teacher.findFirst();
      finalMarkedById = anyTeacher?.id || '';
    }

    for (const r of records) {
      const dateVal = new Date(r.date || defaultDateStr);
      const ayId = r.academicYearId || defaultYearId;
      const cId = r.classId || req.body.classId;
      const dId = r.divisionId || req.body.divisionId;

      if (!r.studentId || isNaN(dateVal.getTime()) || !ayId || !cId || !dId || !finalMarkedById) {
        continue;
      }

      await prisma.attendance.upsert({
        where: {
          studentId_date_academicYearId: {
            studentId: r.studentId,
            date: dateVal,
            academicYearId: ayId,
          },
        },
        update: { 
          status: r.status || 'PRESENT', 
          markedById: finalMarkedById,
        },
        create: {
          studentId: r.studentId,
          classId: cId,
          divisionId: dId,
          academicYearId: ayId,
          date: dateVal,
          status: r.status || 'PRESENT',
          markedById: finalMarkedById,
        },
      });
    }
    res.json({ success: true, message: 'Attendance saved successfully' });
  } catch (err) { next(err); }
});

// Per-student attendance stats
router.get('/student/:studentId', async (req, res, next) => {
  try {
    const { academicYearId } = req.query;

    const ay = await prisma.academicYear.findUnique({ where: { id: String(academicYearId) } });
    if (!ay) return res.status(404).json({ success: false, error: 'Academic year not found' });

    const holidays = await prisma.holiday.findMany({ where: { academicYearId: ay.id } });
    const holidayDates = holidays.map(h => h.date);
    const workingDays = computeWorkingDays(ay.startDate, ay.endDate, holidayDates);

    const atts = await prisma.attendance.findMany({
      where: { studentId: req.params.studentId, academicYearId: ay.id },
      orderBy: { date: 'asc' },
    });

    const presentDays = atts.filter(a => a.status === 'PRESENT').length;
    const absentDays = atts.filter(a => a.status === 'ABSENT').length;
    const leaveDays = atts.filter(a => a.status === 'LEAVE').length;
    const pct = computeAttendancePercentage(presentDays, workingDays);

    res.json({
      success: true,
      data: {
        history: atts,
        stats: {
          workingDays,
          presentDays,
          absentDays,
          leaveDays,
          percentage: pct,
          academicYear: ay.name,
          startDate: ay.startDate,
          endDate: ay.endDate,
        },
      },
    });
  } catch (err) { next(err); }
});

// Class-level attendance report: per student — workingDays, present, absent, leave, %
router.get('/report', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { classId, divisionId, academicYearId, month } = req.query;
    if (!classId || !divisionId || !academicYearId) {
      return res.status(400).json({ success: false, error: 'classId, divisionId, academicYearId are required' });
    }

    const ay = await prisma.academicYear.findUnique({ where: { id: String(academicYearId) } });
    if (!ay) return res.status(404).json({ success: false, error: 'Academic year not found' });

    const holidays = await prisma.holiday.findMany({ where: { academicYearId: String(academicYearId) } });
    const holidayDates = holidays.map(h => h.date);

    // If month filter provided, compute working days for that month only
    let startDate = ay.startDate;
    let endDate = ay.endDate;
    if (month) {
      const [year, monthNum] = String(month).split('-').map(Number);
      startDate = new Date(year, monthNum - 1, 1);
      endDate = new Date(year, monthNum, 0, 23, 59, 59);
    }

    const workingDays = computeWorkingDays(startDate, endDate, holidayDates);

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { classId: String(classId), divisionId: String(divisionId), academicYearId: String(academicYearId) },
      include: { student: { select: { id: true, name: true, rollNo: true, admissionNo: true } } },
    });

    const results = await Promise.all(
      enrollments.map(async (enroll) => {
        const attWhere: any = {
          studentId: enroll.studentId,
          academicYearId: String(academicYearId),
          date: { gte: startDate, lte: endDate },
        };

        const atts = await prisma.attendance.findMany({ where: attWhere });
        const presentDays = atts.filter(a => a.status === 'PRESENT').length;
        const absentDays = atts.filter(a => a.status === 'ABSENT').length;
        const leaveDays = atts.filter(a => a.status === 'LEAVE').length;
        const percentage = computeAttendancePercentage(presentDays, workingDays);

        return {
          studentId: enroll.studentId,
          name: enroll.student.name,
          admissionNo: enroll.student.admissionNo,
          rollNo: enroll.student.rollNo || enroll.rollNo,
          workingDays,
          presentDays,
          absentDays,
          leaveDays,
          percentage,
          isAtRisk: percentage < 75,
        };
      })
    );

    results.sort((a, b) => (a.rollNo || '').localeCompare(b.rollNo || '', undefined, { numeric: true }));

    res.json({ success: true, data: results, workingDays });
  } catch (err) { next(err); }
});

// Today's attendance summary across all classes
router.get('/today-summary', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { academicYearId } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = { date: today };
    if (academicYearId) where.academicYearId = String(academicYearId);

    const grouped = await prisma.attendance.groupBy({
      by: ['classId', 'status'],
      where,
      _count: { status: true },
    });

    const classes = await prisma.class.findMany({ orderBy: { displayOrder: 'asc' } });
    const result = classes.map(cls => {
      const clsData = grouped.filter(g => g.classId === cls.id);
      return {
        class: cls.name,
        classId: cls.id,
        present: clsData.find(d => d.status === 'PRESENT')?._count?.status || 0,
        absent: clsData.find(d => d.status === 'ABSENT')?._count?.status || 0,
        leave: clsData.find(d => d.status === 'LEAVE')?._count?.status || 0,
      };
    });

    res.json({ success: true, data: result.filter(r => r.present + r.absent + r.leave > 0) });
  } catch (err) { next(err); }
});

export default router;
