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
    const subjects = await prisma.subject.findMany({ where, orderBy: { displayOrder: 'asc' } });
    res.json({ success: true, data: subjects });
  } catch (err) { next(err); }
});

router.post('/', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { name, code, classId, maxMarks, passingMarks, displayOrder } = req.body;
    const sub = await prisma.subject.create({
      data: { 
        name, 
        code, 
        classId, 
        maxMarks: maxMarks ? Number(maxMarks) : 100, 
        passingMarks: passingMarks ? Number(passingMarks) : 35, 
        displayOrder: displayOrder ? Number(displayOrder) : 1 
      }
    });
    res.json({ success: true, data: sub });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { name, code, classId, maxMarks, passingMarks, displayOrder } = req.body;
    const sub = await prisma.subject.update({
      where: { id: req.params.id },
      data: { 
        name, 
        code, 
        classId, 
        maxMarks: maxMarks ? Number(maxMarks) : 100, 
        passingMarks: passingMarks ? Number(passingMarks) : 35, 
        displayOrder: displayOrder ? Number(displayOrder) : 1 
      }
    });
    res.json({ success: true, data: sub });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
