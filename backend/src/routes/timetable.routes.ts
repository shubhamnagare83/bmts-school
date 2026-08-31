import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const { classId, divisionId, academicYearId } = req.query;
    const tt = await prisma.timetable.findMany({
      where: { classId: String(classId), divisionId: String(divisionId), academicYearId: String(academicYearId) }
    });
    res.json({ success: true, data: tt });
  } catch (err) { next(err); }
});

router.post('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const records = req.body.records;
    for (const r of records) {
      await prisma.timetable.upsert({
        where: {
          classId_divisionId_academicYearId_dayOfWeek_periodNumber: {
            classId: r.classId, divisionId: r.divisionId, academicYearId: r.academicYearId,
            dayOfWeek: r.dayOfWeek, periodNumber: r.periodNumber
          }
        },
        update: { subjectId: r.subjectId, teacherId: r.teacherId, room: r.room },
        create: r
      });
    }
    res.json({ success: true, message: 'Timetable saved' });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const tt = await prisma.timetable.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: tt });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.timetable.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
