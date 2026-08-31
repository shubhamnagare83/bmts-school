import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';
import { generateCredentials } from '../utils/helpers.js';

const router = Router();

router.use(authenticateToken);

router.get('/me', authorize('STUDENT', 'ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user?.id },
      include: { user: true, enrollments: { include: { class: true, division: true, academicYear: true } } }
    });
    if (!student) return res.status(404).json({ success: false, error: 'Student profile not found' });
    res.json({ success: true, data: student });
  } catch (err) { next(err); }
});

router.get('/', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { classId, divisionId, academicYearId } = req.query;
    let studentIds: string[] | undefined;
    
    if (classId || divisionId || academicYearId) {
      const enrollments = await prisma.studentEnrollment.findMany({
        where: {
          ...(classId && { classId: String(classId) }),
          ...(divisionId && { divisionId: String(divisionId) }),
          ...(academicYearId && { academicYearId: String(academicYearId) })
        },
        select: { studentId: true }
      });
      studentIds = enrollments.map(e => e.studentId);
    }

    const whereClause = studentIds ? { id: { in: studentIds }, status: 'ACTIVE' as const } : { status: 'ACTIVE' as const };
    
    const students = await prisma.student.findMany({
      where: whereClause,
      include: { user: { select: { email: true, username: true } }, enrollments: { include: { class: true, division: true } } }
    });
    res.json({ success: true, data: students });
  } catch (err) { next(err); }
});

router.get('/:id', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const s = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: { user: true, enrollments: { include: { class: true, division: true, academicYear: true } } }
    });
    if (!s) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: s });
  } catch (err) { next(err); }
});

router.post('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { 
      name, surname, admissionNo, rollNo, dob, age, gender, photo, 
      motherTongue, fatherName, fatherOccupation, motherName, motherOccupation, 
      parentContact, parentEmail, address, bloodGroup, height, weight 
    } = req.body;
    
    const fullName = surname ? `${name.trim()} ${surname.trim()}` : name.trim();
    const creds = generateCredentials(fullName);
    const hash = await bcrypt.hash(creds.passwordHash, 10);

    const user = await prisma.user.create({
      data: {
        email: parentEmail || `${creds.username}@student.mtfschool.edu`,
        username: creds.username,
        passwordHash: hash,
        role: 'STUDENT',
        student: {
          create: { 
            name: fullName, 
            surname: surname ? surname.trim() : null,
            admissionNo, 
            rollNo, 
            dob: dob ? new Date(dob) : null, 
            age: age ? Number(age) : null,
            gender: gender || null, 
            photo: photo || null,
            motherTongue: motherTongue || null,
            fatherName: fatherName || null, 
            fatherOccupation: fatherOccupation || null,
            motherName: motherName || null, 
            motherOccupation: motherOccupation || null,
            parentContact: parentContact || null, 
            parentEmail: parentEmail || null, 
            address: address || null,
            bloodGroup: bloodGroup || null,
            height: height ? String(height) : null,
            weight: weight ? String(weight) : null,
          }
        }
      },
      include: { student: true }
    });
    res.json({ success: true, data: user.student, credentials: { username: creds.username, password: creds.passwordHash } });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { 
      name, surname, rollNo, dob, age, gender, photo, 
      motherTongue, fatherName, fatherOccupation, motherName, motherOccupation, 
      parentContact, parentEmail, address, bloodGroup, height, weight 
    } = req.body;

    const s = await prisma.student.update({
      where: { id: req.params.id },
      data: { 
        name: name ? name.trim() : undefined, 
        surname: surname !== undefined ? (surname ? surname.trim() : null) : undefined,
        rollNo, 
        dob: dob ? new Date(dob) : null, 
        age: age !== undefined ? (age ? Number(age) : null) : undefined,
        gender: gender || null, 
        photo: photo !== undefined ? photo : undefined,
        motherTongue: motherTongue !== undefined ? motherTongue : undefined,
        fatherName: fatherName !== undefined ? fatherName : undefined, 
        fatherOccupation: fatherOccupation !== undefined ? fatherOccupation : undefined,
        motherName: motherName !== undefined ? motherName : undefined, 
        motherOccupation: motherOccupation !== undefined ? motherOccupation : undefined,
        parentContact: parentContact !== undefined ? parentContact : undefined, 
        parentEmail: parentEmail !== undefined ? parentEmail : undefined, 
        address: address !== undefined ? address : undefined,
        bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
        height: height !== undefined ? (height ? String(height) : null) : undefined,
        weight: weight !== undefined ? (weight ? String(weight) : null) : undefined,
      }
    });
    res.json({ success: true, data: s });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.student.update({ where: { id: req.params.id }, data: { status: 'ARCHIVED' } });
    const s = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (s) await prisma.user.update({ where: { id: s.userId }, data: { status: 'INACTIVE' } });
    res.json({ success: true, message: 'Student archived' });
  } catch (err) { next(err); }
});

router.post('/:id/enroll', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { classId, divisionId, academicYearId, rollNo } = req.body;
    const e = await prisma.studentEnrollment.create({
      data: { studentId: req.params.id, classId, divisionId, academicYearId, rollNo }
    });
    res.json({ success: true, data: e });
  } catch (err) { next(err); }
});

router.post('/promote', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { studentIds, targetClassId, targetDivisionId, targetAcademicYearId } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, error: 'studentIds must be a non-empty array' });
    }
    if (!targetClassId || !targetDivisionId || !targetAcademicYearId) {
      return res.status(400).json({
        success: false,
        error: 'targetClassId, targetDivisionId and targetAcademicYearId are required',
      });
    }

    // A student may only have one enrollment per academic year. Students
    // already enrolled in the target year are filtered out explicitly instead
    // of using `skipDuplicates` (which becomes INSERT IGNORE on MySQL and would
    // also mask foreign-key errors), so the caller gets an accurate count.
    const existing = await prisma.studentEnrollment.findMany({
      where: { academicYearId: targetAcademicYearId, studentId: { in: studentIds } },
      select: { studentId: true },
    });
    const alreadyEnrolled = new Set(existing.map((e) => e.studentId));

    const creates = studentIds
      .filter((id: string) => !alreadyEnrolled.has(id))
      .map((id: string) => ({
        studentId: id,
        classId: targetClassId,
        divisionId: targetDivisionId,
        academicYearId: targetAcademicYearId,
        status: 'ENROLLED' as const,
      }));

    const resData = creates.length
      ? await prisma.studentEnrollment.createMany({ data: creates })
      : { count: 0 };

    res.json({
      success: true,
      data: { ...resData, skipped: alreadyEnrolled.size },
    });
  } catch (err) { next(err); }
});

export default router;
