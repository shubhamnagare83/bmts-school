import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(authenticateToken);
router.use(authorize('ADMIN'));

router.get('/', async (req, res, next) => {
  try {
    const rules = await prisma.gradeRule.findMany({ orderBy: { displayOrder: 'asc' } });
    res.json({ success: true, data: rules });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, minPercentage, maxPercentage, displayOrder } = req.body;
    const r = await prisma.gradeRule.create({
      data: { name, minPercentage, maxPercentage, displayOrder }
    });
    res.json({ success: true, data: r });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, minPercentage, maxPercentage, displayOrder } = req.body;
    const r = await prisma.gradeRule.update({
      where: { id: req.params.id },
      data: { name, minPercentage, maxPercentage, displayOrder }
    });
    res.json({ success: true, data: r });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.gradeRule.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
