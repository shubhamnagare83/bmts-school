import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const n = await prisma.notification.findMany({
      where: { userId: (req as any).user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: n });
  } catch (err) { next(err); }
});

router.put('/:id/read', async (req, res, next) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) { next(err); }
});

router.put('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: (req as any).user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) { next(err); }
});

router.get('/unread-count', async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: (req as any).user.id, isRead: false }
    });
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
});

export default router;
