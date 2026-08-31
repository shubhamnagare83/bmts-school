import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(authenticateToken);

// Faculty self routes
router.get('/me/assignments', authorize('FACULTY', 'ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user?.id }
    });
    if (!teacher) return res.status(404).json({ success: false, error: 'Teacher profile not found' });
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId: teacher.id },
      include: { class: true, division: true, subject: true, academicYear: true }
    });
    res.json({ success: true, data: assignments });
  } catch (err) { next(err); }
});

router.post('/me/assignments', authorize('FACULTY', 'ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user?.id }
    });
    if (!teacher) return res.status(404).json({ success: false, error: 'Teacher profile not found' });
    const { classId, divisionId, subjectId, academicYearId } = req.body;

    const exists = await prisma.teacherAssignment.findFirst({
      where: { teacherId: teacher.id, classId, divisionId, subjectId, academicYearId }
    });
    if (exists) {
      return res.json({ success: true, data: exists, message: 'Already assigned' });
    }

    const a = await prisma.teacherAssignment.create({
      data: { teacherId: teacher.id, classId, divisionId, subjectId, academicYearId },
      include: { class: true, division: true, subject: true, academicYear: true }
    });
    res.json({ success: true, data: a });
  } catch (err) { next(err); }
});

// Admin-only teacher management routes
router.get('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: { user: { select: { email: true, username: true, status: true } } }
    });
    res.json({ success: true, data: teachers });
  } catch (err) { next(err); }
});

router.get('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const t = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        assignments: { include: { class: true, division: true, subject: true, academicYear: true } }
      }
    });
    if (!t) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: t });
  } catch (err) { next(err); }
});

router.post('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, email, phone, username, password, qualification, department, photo } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email, username, passwordHash: hash, role: 'FACULTY',
        teacher: {
          create: { name, phone, qualification, department, photo: photo || null }
        }
      },
      include: { teacher: true }
    });
    res.json({ success: true, data: user.teacher });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, phone, qualification, department, photo } = req.body;
    const t = await prisma.teacher.update({
      where: { id: req.params.id },
      data: { 
        name, 
        phone, 
        qualification, 
        department,
        photo: photo !== undefined ? photo : undefined,
      }
    });
    res.json({ success: true, data: t });
  } catch (err) { next(err); }
});

router.put('/:id/toggle-finalize', authorize('ADMIN'), async (req, res, next) => {
  try {
    const t = await prisma.teacher.findUnique({ where: { id: req.params.id } });
    const updated = await prisma.teacher.update({
      where: { id: req.params.id },
      data: { canFinalizeReportCards: !t?.canFinalizeReportCards }
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.post('/:id/reset-password', authorize('ADMIN'), async (req, res, next) => {
  try {
    const t = await prisma.teacher.findUnique({ where: { id: req.params.id } });
    if (!t) return res.status(404).json({ success: false, error: 'Not found' });
    const hash = await bcrypt.hash(req.body.newPassword, 10);
    await prisma.user.update({ where: { id: t.userId }, data: { passwordHash: hash } });
    res.json({ success: true, message: 'Password reset' });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const t = await prisma.teacher.findUnique({ where: { id: req.params.id } });
    if (t) {
      await prisma.user.update({ where: { id: t.userId }, data: { status: 'INACTIVE' } });
    }
    res.json({ success: true, message: 'Teacher deactivated' });
  } catch (err) { next(err); }
});

router.get('/:id/assignments', authorize('ADMIN'), async (req, res, next) => {
  try {
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId: req.params.id, academicYearId: String(req.query.academicYearId || '') },
      include: { class: true, division: true, subject: true }
    });
    res.json({ success: true, data: assignments });
  } catch (err) { next(err); }
});

router.post('/:id/assignments', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { classId, divisionId, subjectId, academicYearId } = req.body;
    const a = await prisma.teacherAssignment.create({
      data: { teacherId: req.params.id, classId, divisionId, subjectId, academicYearId }
    });
    res.json({ success: true, data: a });
  } catch (err) { next(err); }
});

router.delete('/assignments/:assignmentId', authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.teacherAssignment.delete({ where: { id: req.params.assignmentId } });
    res.json({ success: true, message: 'Assignment removed' });
  } catch (err) { next(err); }
});

export default router;
