import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const { classId, divisionId } = req.query;
    const hw = await prisma.homework.findMany({
      where: { classId: String(classId), divisionId: String(divisionId) },
      include: { subject: true }
    });
    res.json({ success: true, data: hw });
  } catch (err) { next(err); }
});

router.post('/', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const t = await prisma.teacher.findFirst({ where: { userId: (req as any).user.id } });
    const hw = await prisma.homework.create({
      data: { ...req.body, teacherId: t?.id || req.body.teacherId }
    });
    res.json({ success: true, data: hw });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const hw = await prisma.homework.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: hw });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    await prisma.homework.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

router.post('/:id/submit', async (req, res, next) => {
  try {
    const s = await prisma.student.findFirst({ where: { userId: (req as any).user.id } });
    if (!s) return res.status(403).json({ success: false, error: 'Only students can submit' });
    const sub = await prisma.homeworkSubmission.create({
      data: { homeworkId: req.params.id, studentId: s.id, filePath: req.body.filePath, status: 'SUBMITTED' }
    });
    res.json({ success: true, data: sub });
  } catch (err) { next(err); }
});

router.put('/submissions/:id/review', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const sub = await prisma.homeworkSubmission.update({
      where: { id: req.params.id },
      data: { status: 'REVIEWED', grade: req.body.grade, feedback: req.body.feedback }
    });
    res.json({ success: true, data: sub });
  } catch (err) { next(err); }
});

export default router;
