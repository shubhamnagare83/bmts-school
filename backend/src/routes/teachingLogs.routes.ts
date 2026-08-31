import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();
router.use(authenticateToken);

// GET /api/teaching-logs — List teaching logs with optional filters
router.get('/', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { classId, divisionId, teacherId, date, startDate, endDate } = req.query;
    const user = (req as any).user;

    const where: any = {};

    if (classId) where.classId = classId as string;
    if (divisionId) where.divisionId = divisionId as string;

    if (teacherId) {
      where.teacherId = teacherId as string;
    } else if (user.role === 'FACULTY' && !classId) {
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
      if (teacher) where.teacherId = teacher.id;
    }

    if (date) {
      where.date = new Date(date as string);
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const logs = await prisma.dailyTeachingLog.findMany({
      where,
      include: {
        class: true,
        division: true,
        subject: true,
        teacher: { select: { id: true, name: true, photo: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

// GET /api/teaching-logs/by-date — Fetch single log for class, division, and date
router.get('/by-date', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { classId, divisionId, date } = req.query;
    if (!classId || !divisionId || !date) {
      return res.status(400).json({ success: false, error: 'classId, divisionId, and date are required' });
    }

    const logs = await prisma.dailyTeachingLog.findMany({
      where: {
        classId: classId as string,
        divisionId: divisionId as string,
        date: new Date(date as string),
      },
      include: {
        class: true,
        division: true,
        subject: true,
        teacher: { select: { id: true, name: true, photo: true } },
      },
    });

    res.json({ success: true, data: logs[0] || null });
  } catch (err) {
    next(err);
  }
});

// POST /api/teaching-logs — Create or update daily teaching log
router.post('/', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const user = (req as any).user;
    const { classId, divisionId, date, subjectId, topicTaught, homeworkGiven, remarks } = req.body;

    if (!classId || !divisionId || !date || !topicTaught) {
      return res.status(400).json({
        success: false,
        error: 'Class, Division, Date, and Topic Taught are required',
      });
    }

    let teacherId = req.body.teacherId;
    if (user.role === 'FACULTY') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
      if (teacher) teacherId = teacher.id;
    }

    if (!teacherId) {
      const firstTeacher = await prisma.teacher.findFirst();
      teacherId = firstTeacher?.id;
    }

    const logDate = new Date(date);

    // Upsert teaching log
    const existing = await prisma.dailyTeachingLog.findFirst({
      where: {
        classId,
        divisionId,
        teacherId,
        date: logDate,
      },
    });

    let result;
    if (existing) {
      result = await prisma.dailyTeachingLog.update({
        where: { id: existing.id },
        data: {
          subjectId: subjectId || null,
          topicTaught,
          homeworkGiven: homeworkGiven || null,
          remarks: remarks || null,
        },
        include: {
          class: true,
          division: true,
          subject: true,
          teacher: { select: { id: true, name: true, photo: true } },
        },
      });
    } else {
      result = await prisma.dailyTeachingLog.create({
        data: {
          classId,
          divisionId,
          teacherId,
          date: logDate,
          subjectId: subjectId || null,
          topicTaught,
          homeworkGiven: homeworkGiven || null,
          remarks: remarks || null,
        },
        include: {
          class: true,
          division: true,
          subject: true,
          teacher: { select: { id: true, name: true, photo: true } },
        },
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/teaching-logs/:id
router.delete('/:id', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    await prisma.dailyTeachingLog.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true, message: 'Teaching log deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
