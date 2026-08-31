import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const { academicYearId } = req.query;
    const where = academicYearId ? { academicYearId: String(academicYearId) } : {};
    const h = await prisma.holiday.findMany({ where, orderBy: { date: 'asc' } });
    res.json({ success: true, data: h });
  } catch (err) { next(err); }
});

router.post('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const h = await prisma.holiday.create({ data: { ...req.body, date: new Date(req.body.date) } });
    res.json({ success: true, data: h });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const h = await prisma.holiday.update({
      where: { id: req.params.id },
      data: { ...req.body, date: req.body.date ? new Date(req.body.date) : undefined }
    });
    res.json({ success: true, data: h });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.holiday.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
