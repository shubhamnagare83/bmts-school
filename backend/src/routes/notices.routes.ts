import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const notices = await prisma.notice.findMany({ orderBy: { publishedAt: 'desc' } });
    res.json({ success: true, data: notices });
  } catch (err) { next(err); }
});

router.post('/', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { title, content, scope, targetClassId, academicYearId } = req.body;
    const n = await prisma.notice.create({
      data: { title, content, scope, targetClassId, academicYearId, authorId: (req as any).user.id }
    });
    res.json({ success: true, data: n });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const n = await prisma.notice.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: n });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    await prisma.notice.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
