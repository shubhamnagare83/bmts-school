import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';
import { v4 as uuidv4 } from 'uuid';
import { REMARKS_BANK } from '../utils/remarks.js';

const router = Router();

router.use(authenticateToken);

// Public/Auth Remarks Bank
router.get('/remarks-bank', async (req, res) => {
  res.json({ success: true, data: REMARKS_BANK });
});

router.get('/', authorize('ADMIN', 'FACULTY', 'STUDENT'), async (req: AuthRequest, res, next) => {
  try {
    const { classId, divisionId, academicYearId, status, studentId } = req.query;
    const where: any = {};

    if (req.user?.role === 'STUDENT') {
      const studentObj = await prisma.student.findUnique({
        where: { userId: req.user.id },
        include: { enrollments: true }
      });
      if (studentObj) {
        where.studentId = studentObj.id;
        
        // Auto-create report card if missing for their enrollment
        if (academicYearId || studentObj.enrollments.length > 0) {
          const activeAyId = String(academicYearId || studentObj.enrollments[0]?.academicYearId);
          const activeEnrollment = studentObj.enrollments.find(e => e.academicYearId === activeAyId) || studentObj.enrollments[0];
          
          if (activeEnrollment) {
            let existingRc = await prisma.reportCard.findUnique({
              where: { studentId_academicYearId: { studentId: studentObj.id, academicYearId: activeEnrollment.academicYearId } }
            });
            if (!existingRc) {
              await prisma.reportCard.create({
                data: {
                  studentId: studentObj.id,
                  academicYearId: activeEnrollment.academicYearId,
                  classId: activeEnrollment.classId,
                  divisionId: activeEnrollment.divisionId,
                  status: 'FINALIZED',
                  qrToken: uuidv4(),
                  finalizedAt: new Date(),
                }
              });
            }
          }
        }
      }
    } else {
      if (classId) where.classId = String(classId);
      if (divisionId) where.divisionId = String(divisionId);
      if (academicYearId) where.academicYearId = String(academicYearId);
      if (status) where.status = String(status);
      if (studentId) where.studentId = String(studentId);
    }

    const rcs = await prisma.reportCard.findMany({
      where,
      include: {
        student: true,
        class: { select: { id: true, name: true, reportCardTemplate: true } },
        division: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        sections: true,
        assessment: true,
      }
    });
    res.json({ success: true, data: rcs });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const rc = await prisma.reportCard.findUnique({
      where: { id: req.params.id },
      include: {
        sections: true,
        assessment: true,
        student: true,
        class: true,
        division: true,
        academicYear: true,
      }
    });
    if (!rc) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: rc });
  } catch (err) { next(err); }
});

router.post('/', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { studentId, academicYearId, classId, divisionId } = req.body;
    let rc = await prisma.reportCard.findUnique({
      where: { studentId_academicYearId: { studentId, academicYearId } }
    });
    if (!rc) {
      rc = await prisma.reportCard.create({
        data: { studentId, academicYearId, classId, divisionId }
      });
    }
    res.json({ success: true, data: rc });
  } catch (err) { next(err); }
});

router.put('/:id/sections', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { sections, studentData } = req.body;

    // Optional student info & photo update if provided
    if (studentData) {
      const rc = await prisma.reportCard.findUnique({ where: { id: req.params.id } });
      if (rc && rc.studentId) {
        await prisma.student.update({
          where: { id: rc.studentId },
          data: {
            ...(studentData.name && { name: studentData.name }),
            ...(studentData.rollNo !== undefined && { rollNo: studentData.rollNo }),
            ...(studentData.admissionNo !== undefined && { admissionNo: studentData.admissionNo }),
            ...(studentData.photo !== undefined && { photo: studentData.photo }),
            ...(studentData.fatherName !== undefined && { fatherName: studentData.fatherName }),
            ...(studentData.fatherOccupation !== undefined && { fatherOccupation: studentData.fatherOccupation }),
            ...(studentData.motherName !== undefined && { motherName: studentData.motherName }),
            ...(studentData.motherOccupation !== undefined && { motherOccupation: studentData.motherOccupation }),
            ...(studentData.motherTongue !== undefined && { motherTongue: studentData.motherTongue }),
            ...(studentData.dob !== undefined && { dob: studentData.dob ? new Date(studentData.dob) : null }),
            ...(studentData.parentContact !== undefined && { parentContact: studentData.parentContact }),
            ...(studentData.weight !== undefined && { weight: String(studentData.weight) }),
            ...(studentData.height !== undefined && { height: String(studentData.height) }),
            ...(studentData.address !== undefined && { address: studentData.address }),
          }
        });
      }
    }

    if (Array.isArray(sections)) {
      for (const s of sections) {
        await prisma.reportCardSection.upsert({
          where: { reportCardId_sectionKey: { reportCardId: req.params.id, sectionKey: s.sectionKey } },
          update: { 
            progressShown: s.progressShown, 
            challengesFaced: s.challengesFaced,
            additionalData: s.additionalData !== undefined ? s.additionalData : undefined
          },
          create: { 
            reportCardId: req.params.id, 
            sectionKey: s.sectionKey, 
            sectionTitle: s.sectionTitle, 
            progressShown: s.progressShown, 
            challengesFaced: s.challengesFaced,
            additionalData: s.additionalData !== undefined ? s.additionalData : undefined
          }
        });
      }
    }
    res.json({ success: true, message: 'Sections and details updated' });
  } catch (err) { next(err); }
});

router.put('/:id/assessment', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { allRoundDevelopment, strengthIdentified, additionalSupportNeeded } = req.body;
    await prisma.reportCardAssessment.upsert({
      where: { reportCardId: req.params.id },
      update: {
        allRoundDevelopment,
        strengthIdentified,
        additionalSupportNeeded,
        parentFeedback: '', // Kept empty for handwriting
      },
      create: {
        reportCardId: req.params.id,
        allRoundDevelopment,
        strengthIdentified,
        additionalSupportNeeded,
        parentFeedback: '',
      }
    });
    res.json({ success: true, message: 'Assessment updated' });
  } catch (err) { next(err); }
});

router.post('/:id/submit', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const rc = await prisma.reportCard.update({ where: { id: req.params.id }, data: { status: 'PENDING_REVIEW' } });
    res.json({ success: true, data: rc });
  } catch (err) { next(err); }
});

router.post('/:id/send-back', authorize('ADMIN'), async (req, res, next) => {
  try {
    const rc = await prisma.reportCard.update({ where: { id: req.params.id }, data: { status: 'DRAFT' } });
    res.json({ success: true, data: rc });
  } catch (err) { next(err); }
});

router.post('/:id/finalize', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const rc = await prisma.reportCard.update({
      where: { id: req.params.id },
      data: { status: 'FINALIZED', qrToken: uuidv4(), finalizedAt: new Date(), finalizedById: (req as any).user.id }
    });
    res.json({ success: true, data: rc });
  } catch (err) { next(err); }
});

router.post('/:id/unlock', authorize('ADMIN'), async (req, res, next) => {
  try {
    const rc = await prisma.reportCard.update({
      where: { id: req.params.id },
      data: { status: 'DRAFT', currentVersion: { increment: 1 } }
    });
    res.json({ success: true, data: rc });
  } catch (err) { next(err); }
});

router.post('/bulk-generate', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { classId, divisionId, academicYearId } = req.body;
    const where: any = { academicYearId };
    if (classId) where.classId = classId;
    if (divisionId) where.divisionId = divisionId;

    const enrollments = await prisma.studentEnrollment.findMany({
      where
    });

    const reportCards = [];
    for (const e of enrollments) {
      let rc = await prisma.reportCard.findUnique({
        where: { studentId_academicYearId: { studentId: e.studentId, academicYearId } }
      });
      if (!rc) {
        rc = await prisma.reportCard.create({
          data: { studentId: e.studentId, academicYearId, classId: e.classId, divisionId: e.divisionId }
        });
      }
      reportCards.push(rc);
    }
    res.json({ success: true, count: reportCards.length, data: reportCards });
  } catch (err) { next(err); }
});

router.get('/:id/versions', authorize('ADMIN'), async (req, res, next) => {
  try {
    const v = await prisma.reportCardVersion.findMany({ where: { reportCardId: req.params.id } });
    res.json({ success: true, data: v });
  } catch (err) { next(err); }
});

router.get('/verify/:token', async (req, res, next) => {
  try {
    const rc = await prisma.reportCard.findUnique({
      where: { qrToken: req.params.token },
      include: {
        student: { select: { name: true, admissionNo: true, rollNo: true } },
        class: { select: { name: true } },
        division: { select: { name: true } },
        academicYear: { select: { name: true } },
      }
    });
    if (!rc) return res.status(404).json({ success: false, error: 'Invalid token' });
    res.json({ success: true, data: rc });
  } catch (err) { next(err); }
});

export default router;
