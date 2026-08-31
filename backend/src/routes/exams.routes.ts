import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(authenticateToken);
router.use(authorize('ADMIN', 'FACULTY'));

router.get('/', async (req, res, next) => {
  try {
    const { academicYearId, classId } = req.query;
    const where: any = {};
    if (academicYearId) where.academicYearId = String(academicYearId);
    if (classId) where.classId = String(classId);

    const exams = await prisma.exam.findMany({ where, include: { class: true, division: true } });
    res.json({ success: true, data: exams });
  } catch (err) { next(err); }
});

router.post('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, academicYearId, classId, divisionId, startDate, endDate } = req.body;
    const ex = await prisma.exam.create({
      data: { name, academicYearId, classId, divisionId, startDate: startDate ? new Date(startDate) : null, endDate: endDate ? new Date(endDate) : null }
    });
    res.json({ success: true, data: ex });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, startDate, endDate, isActive } = req.body;
    const ex = await prisma.exam.update({
      where: { id: req.params.id },
      data: { name, isActive, startDate: startDate ? new Date(startDate) : null, endDate: endDate ? new Date(endDate) : null }
    });
    res.json({ success: true, data: ex });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.exam.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
