import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';
import { computeGrade } from '../utils/helpers.js';

const router = Router();

router.use(authenticateToken);

// Get marks for a class/division/exam/subject (bulk marks entry view)
router.get('/', authorize('ADMIN', 'FACULTY'), async (req: AuthRequest, res, next) => {
  try {
    const { examId, classId, divisionId, subjectId } = req.query;

    const where: any = {};
    if (examId) where.examId = String(examId);
    if (classId) where.classId = String(classId);
    if (divisionId) where.divisionId = String(divisionId);
    if (subjectId) where.subjectId = String(subjectId);

    const marks = await prisma.mark.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, rollNo: true, admissionNo: true } },
        subject: { select: { name: true, maxMarks: true, passingMarks: true } },
      },
      orderBy: [
        { student: { rollNo: 'asc' } },
      ],
    });
    res.json({ success: true, data: marks });
  } catch (err) { next(err); }
});

// Bulk save/upsert marks for a class
router.post('/', authorize('ADMIN', 'FACULTY'), async (req: AuthRequest, res, next) => {
  try {
    const records = req.body.records;
    const teacher = await prisma.teacher.findFirst({ where: { userId: req.user?.id } });
    if (!teacher) return res.status(403).json({ success: false, error: 'Only teachers can enter marks' });

    const rules = await prisma.gradeRule.findMany();
    const saved = [];

    for (const r of records) {
      // Validate marks don't exceed max
      if (r.marksObtained !== null && r.marksObtained !== undefined && !r.isAbsent) {
        const subject = await prisma.subject.findUnique({ where: { id: r.subjectId } });
        if (subject && r.marksObtained > subject.maxMarks) {
          return res.status(400).json({
            success: false,
            error: `Marks for ${subject.name} cannot exceed max marks (${subject.maxMarks})`,
          });
        }
      }

      const mark = await prisma.mark.upsert({
        where: {
          studentId_examId_subjectId: {
            studentId: r.studentId,
            examId: r.examId,
            subjectId: r.subjectId,
          },
        },
        update: {
          marksObtained: r.isAbsent ? null : r.marksObtained,
          isAbsent: r.isAbsent,
          enteredById: teacher.id,
        },
        create: {
          studentId: r.studentId,
          examId: r.examId,
          subjectId: r.subjectId,
          classId: r.classId,
          divisionId: r.divisionId,
          academicYearId: r.academicYearId,
          marksObtained: r.isAbsent ? null : r.marksObtained,
          isAbsent: r.isAbsent,
          enteredById: teacher.id,
        },
        include: { subject: true },
      });
      saved.push(mark);
    }

    res.json({ success: true, message: 'Marks saved successfully', count: saved.length });
  } catch (err) { next(err); }
});

// Get all marks for a student in an academic year (for report card)
router.get('/student/:studentId', async (req, res, next) => {
  try {
    const { academicYearId, examId } = req.query;

    const where: any = { studentId: req.params.studentId };
    if (academicYearId) where.academicYearId = String(academicYearId);
    if (examId) where.examId = String(examId);

    const marks = await prisma.mark.findMany({
      where,
      include: {
        exam: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, maxMarks: true, passingMarks: true } },
      },
      orderBy: [
        { subject: { displayOrder: 'asc' } },
      ],
    });

    const rules = await prisma.gradeRule.findMany({ orderBy: { minPercentage: 'desc' } });

    const formatted = marks.map(m => {
      const pct = m.marksObtained !== null && m.subject.maxMarks > 0
        ? (m.marksObtained / m.subject.maxMarks) * 100
        : 0;
      return {
        ...m,
        percentage: Number(pct.toFixed(2)),
        grade: m.isAbsent ? 'AB' : computeGrade(pct, rules),
        isPassing: !m.isAbsent && m.marksObtained !== null
          ? m.marksObtained >= m.subject.passingMarks
          : false,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) { next(err); }
});

// Class-level marks report: per student — total, max, percentage, grade, rank
router.get('/report', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { classId, divisionId, academicYearId, examId } = req.query;
    if (!classId || !divisionId || !academicYearId || !examId) {
      return res.status(400).json({ success: false, error: 'classId, divisionId, academicYearId, examId are required' });
    }

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { classId: String(classId), divisionId: String(divisionId), academicYearId: String(academicYearId) },
      include: { student: { select: { id: true, name: true, rollNo: true, admissionNo: true } } },
    });

    const rules = await prisma.gradeRule.findMany({ orderBy: { minPercentage: 'desc' } });

    const results = await Promise.all(
      enrollments.map(async (enroll) => {
        const marks = await prisma.mark.findMany({
          where: {
            studentId: enroll.studentId,
            examId: String(examId),
            classId: String(classId),
            divisionId: String(divisionId),
          },
          include: { subject: { select: { name: true, maxMarks: true, passingMarks: true } } },
        });

        const totalObtained = marks.reduce((s, m) => s + (m.marksObtained || 0), 0);
        const totalMax = marks.reduce((s, m) => s + m.subject.maxMarks, 0);
        const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
        const grade = computeGrade(percentage, rules);
        const failedSubjects = marks.filter(m => !m.isAbsent && m.marksObtained !== null && m.marksObtained < m.subject.passingMarks).length;

        return {
          studentId: enroll.studentId,
          name: enroll.student.name,
          admissionNo: enroll.student.admissionNo,
          rollNo: enroll.student.rollNo || enroll.rollNo,
          totalMarks: totalObtained,
          maxMarks: totalMax,
          percentage,
          grade,
          failedSubjects,
          subjectDetails: marks.map(m => ({
            subject: m.subject.name,
            maxMarks: m.subject.maxMarks,
            marksObtained: m.marksObtained,
            isAbsent: m.isAbsent,
            grade: m.isAbsent ? 'AB' : computeGrade(
              m.marksObtained !== null ? (m.marksObtained / m.subject.maxMarks) * 100 : 0,
              rules
            ),
            isPassing: !m.isAbsent && m.marksObtained !== null
              ? m.marksObtained >= m.subject.passingMarks
              : false,
          })),
        };
      })
    );

    // Assign ranks
    const sorted = results
      .sort((a, b) => b.percentage - a.percentage)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    res.json({ success: true, data: sorted });
  } catch (err) { next(err); }
});

// Leaderboard — ranked students filtered by year/class/division/exam
router.get('/leaderboard', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { academicYearId, classId, divisionId, examId, limit = '50' } = req.query;

    let ayId = String(academicYearId || '');
    if (!ayId) {
      const activeAy = await prisma.academicYear.findFirst({ where: { isActive: true } });
      ayId = activeAy?.id || '';
    }

    const where: any = { ...(ayId && { academicYearId: ayId }) };
    if (classId) where.classId = String(classId);
    if (divisionId) where.divisionId = String(divisionId);
    if (examId) where.examId = String(examId);

    const allMarks = await prisma.mark.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, admissionNo: true, rollNo: true } },
        subject: { select: { maxMarks: true } },
        class: { select: { name: true } },
        division: { select: { name: true } },
        exam: { select: { name: true } },
      },
    });

    const rules = await prisma.gradeRule.findMany({ orderBy: { minPercentage: 'desc' } });

    const studentMap: Record<string, {
      name: string; admissionNo: string; rollNo: string | null;
      class: string; division: string; exam: string;
      obtained: number; max: number;
    }> = {};

    for (const m of allMarks) {
      if (!studentMap[m.studentId]) {
        studentMap[m.studentId] = {
          name: m.student.name,
          admissionNo: m.student.admissionNo,
          rollNo: m.student.rollNo,
          class: m.class.name,
          division: m.division.name,
          exam: m.exam.name,
          obtained: 0,
          max: 0,
        };
      }
      studentMap[m.studentId].obtained += m.marksObtained || 0;
      studentMap[m.studentId].max += m.subject.maxMarks;
    }

    const leaderboard = Object.entries(studentMap)
      .map(([studentId, v]) => ({
        studentId,
        name: v.name,
        admissionNo: v.admissionNo,
        rollNo: v.rollNo,
        class: v.class,
        division: v.division,
        exam: v.exam,
        totalMarks: v.obtained,
        maxMarks: v.max,
        percentage: v.max > 0 ? Number(((v.obtained / v.max) * 100).toFixed(2)) : 0,
        grade: computeGrade(v.max > 0 ? (v.obtained / v.max) * 100 : 0, rules),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, Number(limit))
      .map((s, i) => ({ ...s, rank: i + 1 }));

    res.json({ success: true, data: leaderboard });
  } catch (err) { next(err); }
});

export default router;
