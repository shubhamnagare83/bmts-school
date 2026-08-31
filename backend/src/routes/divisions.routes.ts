import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(authenticateToken);

router.get('/', authorize('ADMIN', 'FACULTY', 'STUDENT'), async (req, res, next) => {
  try {
    const { classId } = req.query;
    const where = classId ? { classId: String(classId) } : {};
    const divisions = await prisma.division.findMany({ where, orderBy: { name: 'asc' } });
    res.json({ success: true, data: divisions });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, classId } = req.body;
    const div = await prisma.division.create({ data: { name, classId } });
    res.json({ success: true, data: div });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, classId } = req.body;
    const div = await prisma.division.update({
      where: { id: req.params.id },
      data: { name, classId }
    });
    res.json({ success: true, data: div });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.division.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
