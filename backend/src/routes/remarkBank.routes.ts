import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

// Public / Auth read
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { fieldKey, activeOnly } = req.query;
    const where: any = {};
    if (fieldKey) where.fieldKey = String(fieldKey);
    if (activeOnly === 'true') where.active = true;

    const remarks = await prisma.remarkBank.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: remarks });
  } catch (err) { next(err); }
});

// Admin management routes
router.post('/', authenticateToken, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { fieldKey, textEn, textMr } = req.body;
    if (!fieldKey || !textEn) {
      return res.status(400).json({ success: false, error: 'Field key and English text are required' });
    }

    const remark = await prisma.remarkBank.create({
      data: {
        fieldKey,
        textEn,
        textMr: textMr || null,
        active: true,
        createdBy: (req as any).user.id,
      },
    });
    res.json({ success: true, data: remark });
  } catch (err) { next(err); }
});

router.put('/:id', authenticateToken, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { textEn, textMr, active } = req.body;
    const remark = await prisma.remarkBank.update({
      where: { id: req.params.id },
      data: {
        ...(textEn !== undefined && { textEn }),
        ...(textMr !== undefined && { textMr }),
        ...(active !== undefined && { active }),
      },
    });
    res.json({ success: true, data: remark });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticateToken, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.remarkBank.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Remark deleted' });
  } catch (err) { next(err); }
});

export default router;
