import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(authenticateToken);

router.get('/', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const classes = await prisma.class.findMany({
      include: { divisions: true },
      orderBy: { displayOrder: 'asc' }
    });
    res.json({ success: true, data: classes });
  } catch (err) { next(err); }
});

router.get('/:id', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const c = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: { divisions: true, subjects: true }
    });
    if (!c) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: c });
  } catch (err) { next(err); }
});

router.post('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, displayOrder, reportCardTemplate } = req.body;
    const c = await prisma.class.create({
      data: { name, displayOrder, reportCardTemplate }
    });
    res.json({ success: true, data: c });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, displayOrder, reportCardTemplate } = req.body;
    const c = await prisma.class.update({
      where: { id: req.params.id },
      data: { name, displayOrder, reportCardTemplate }
    });
    res.json({ success: true, data: c });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.class.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) { next(err); }
});

export default router;
