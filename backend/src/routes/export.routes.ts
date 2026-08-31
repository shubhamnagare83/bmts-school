import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';
import { computeWorkingDays, computeAttendancePercentage, computeGrade } from '../utils/helpers.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticateToken);

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return '';
    const str = String(v);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  return [headers.map(escape).join(','), ...rows.map(row => row.map(escape).join(','))].join('\n');
}

// Export students list
router.get('/students', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { academicYearId, classId, divisionId } = req.query;

    let ayId = String(academicYearId || '');
    if (!ayId) {
      const activeAy = await prisma.academicYear.findFirst({ where: { isActive: true } });
      ayId = activeAy?.id || '';
    }

    const enrollWhere: any = {};
    if (ayId) enrollWhere.academicYearId = ayId;
    if (classId) enrollWhere.classId = String(classId);
    if (divisionId) enrollWhere.divisionId = String(divisionId);

    const enrollments = await prisma.studentEnrollment.findMany({
      where: enrollWhere,
      include: {
        student: true,
        class: true,
        division: true,
        academicYear: true,
      },
    });

    const rules = await prisma.gradeRule.findMany({ orderBy: { minPercentage: 'desc' } });

    const rows = await Promise.all(enrollments.map(async (e) => {
      const marks = await prisma.mark.findMany({
        where: { studentId: e.studentId, academicYearId: ayId },
        include: { subject: true },
      });
      const totalObtained = marks.reduce((s, m) => s + (m.marksObtained || 0), 0);
      const totalMax = marks.reduce((s, m) => s + m.subject.maxMarks, 0);
      const marksPct = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(1)) : 0;
      const grade = computeGrade(marksPct, rules);

      const presentCount = await prisma.attendance.count({
        where: { studentId: e.studentId, academicYearId: ayId, status: 'PRESENT' },
      });

      const ay = await prisma.academicYear.findUnique({ where: { id: ayId } });
      const workingDays = ay ? computeWorkingDays(ay.startDate, ay.endDate, []) : 0;
      const attPct = computeAttendancePercentage(presentCount, workingDays);

      return [
        e.student.admissionNo,
        e.student.name,
        e.class.name,
        e.division.name,
        e.rollNo || e.student.rollNo || '',
        e.student.gender || '',
        e.student.fatherName || '',
        e.student.motherName || '',
        e.student.parentContact || '',
        e.student.parentEmail || '',
        e.student.address || '',
        e.student.dob ? new Date(e.student.dob).toLocaleDateString('en-IN') : '',
        attPct,
        `${totalObtained}/${totalMax}`,
        marksPct,
        grade,
        e.student.status,
      ];
    }));

    const csv = toCSV(
      ['Admission No', 'Name', 'Class', 'Division', 'Roll No', 'Gender', 'Father Name', 'Mother Name',
        'Contact', 'Email', 'Address', 'DOB', 'Attendance %', 'Total Marks', 'Marks %', 'Grade', 'Status'],
      rows
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
    res.send(csv);
  } catch (err) { next(err); }
});

// Export attendance report
router.get('/attendance', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { classId, divisionId, academicYearId, month } = req.query;
    if (!classId || !divisionId || !academicYearId) {
      return res.status(400).json({ success: false, error: 'classId, divisionId, academicYearId required' });
    }

    const ay = await prisma.academicYear.findUnique({ where: { id: String(academicYearId) } });
    if (!ay) return res.status(404).json({ success: false, error: 'Academic year not found' });

    let startDate = ay.startDate;
    let endDate = ay.endDate;
    if (month) {
      const [year, monthNum] = String(month).split('-').map(Number);
      startDate = new Date(year, monthNum - 1, 1);
      endDate = new Date(year, monthNum, 0, 23, 59, 59);
    }

    const holidays = await prisma.holiday.findMany({ where: { academicYearId: String(academicYearId) } });
    const workingDays = computeWorkingDays(startDate, endDate, holidays.map(h => h.date));

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { classId: String(classId), divisionId: String(divisionId), academicYearId: String(academicYearId) },
      include: { student: true, class: true, division: true },
    });

    const rows = await Promise.all(enrollments.map(async (e) => {
      const atts = await prisma.attendance.findMany({
        where: {
          studentId: e.studentId,
          academicYearId: String(academicYearId),
          date: { gte: startDate, lte: endDate },
        },
      });
      const presentDays = atts.filter(a => a.status === 'PRESENT').length;
      const absentDays = atts.filter(a => a.status === 'ABSENT').length;
      const leaveDays = atts.filter(a => a.status === 'LEAVE').length;
      const pct = computeAttendancePercentage(presentDays, workingDays);

      return [
        e.student.admissionNo,
        e.student.name,
        e.class.name,
        e.division.name,
        e.rollNo || e.student.rollNo || '',
        workingDays,
        presentDays,
        absentDays,
        leaveDays,
        pct,
        pct >= 75 ? 'OK' : 'AT RISK',
      ];
    }));

    rows.sort((a, b) => String(a[4]).localeCompare(String(b[4]), undefined, { numeric: true }));

    const csv = toCSV(
      ['Admission No', 'Name', 'Class', 'Division', 'Roll No', 'Working Days', 'Present', 'Absent', 'Leave', 'Attendance %', 'Status'],
      rows
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
    res.send(csv);
  } catch (err) { next(err); }
});

// Export marks report
router.get('/marks', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const { classId, divisionId, academicYearId, examId } = req.query;
    if (!classId || !divisionId || !academicYearId || !examId) {
      return res.status(400).json({ success: false, error: 'classId, divisionId, academicYearId, examId required' });
    }

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { classId: String(classId), divisionId: String(divisionId), academicYearId: String(academicYearId) },
      include: { student: true, class: true, division: true },
    });

    const subjects = await prisma.subject.findMany({
      where: { classId: String(classId), isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    const rules = await prisma.gradeRule.findMany({ orderBy: { minPercentage: 'desc' } });

    const headers = [
      'Admission No', 'Name', 'Roll No',
      ...subjects.map(s => s.name),
      'Total Obtained', 'Total Max', 'Percentage', 'Grade',
    ];

    const rows = await Promise.all(enrollments.map(async (e) => {
      const marks = await prisma.mark.findMany({
        where: { studentId: e.studentId, examId: String(examId) },
      });

      const subjectValues = subjects.map(s => {
        const m = marks.find(m => m.subjectId === s.id);
        if (!m) return '';
        if (m.isAbsent) return 'AB';
        return m.marksObtained ?? '';
      });

      const totalObtained = marks.reduce((s, m) => s + (m.marksObtained || 0), 0);
      const totalMax = subjects.reduce((s, sub) => s + sub.maxMarks, 0);
      const pct = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(1)) : 0;
      const grade = computeGrade(pct, rules);

      return [
        e.student.admissionNo,
        e.student.name,
        e.rollNo || e.student.rollNo || '',
        ...subjectValues,
        totalObtained,
        totalMax,
        pct,
        grade,
      ];
    }));

    rows.sort((a, b) => String(a[2]).localeCompare(String(b[2]), undefined, { numeric: true }));

    const csv = toCSV(headers, rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="marks_report.csv"');
    res.send(csv);
  } catch (err) { next(err); }
});

// Import students from CSV
router.post('/students/import', authorize('ADMIN'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const csv = req.file.buffer.toString('utf-8');
    const lines = csv.split('\n').filter(l => l.trim());
    if (lines.length < 2) return res.status(400).json({ success: false, error: 'CSV must have headers and at least one row' });

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const validCount = { added: 0, skipped: 0, errors: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, j) => { row[h] = values[j] || ''; });

      const admissionNo = row['admission_no'] || row['admissionno'] || row['admission no'];
      const name = row['name'];

      if (!admissionNo || !name) {
        validCount.errors.push(`Row ${i + 1}: Missing admission_no or name`);
        validCount.skipped++;
        continue;
      }

      // Check for duplicate
      const existing = await prisma.student.findUnique({ where: { admissionNo } });
      if (existing) {
        validCount.errors.push(`Row ${i + 1}: Admission No ${admissionNo} already exists`);
        validCount.skipped++;
        continue;
      }

      try {
        const username = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(1000 + Math.random() * 9000)}`;
        const { default: bcrypt } = await import('bcryptjs');
        const hash = await bcrypt.hash('Student@123', 10);

        await prisma.user.create({
          data: {
            email: `${username}@school.local`,
            username,
            passwordHash: hash,
            role: 'STUDENT',
            student: {
              create: {
                admissionNo,
                name,
                rollNo: row['roll_no'] || row['rollno'] || null,
                gender: (['MALE', 'FEMALE', 'OTHER'].includes((row['gender'] || '').toUpperCase())
                  ? row['gender'].toUpperCase() : null) as any,
                fatherName: row['father_name'] || null,
                motherName: row['mother_name'] || null,
                parentContact: row['contact'] || null,
                parentEmail: row['email'] || null,
                address: row['address'] || null,
                dob: row['dob'] ? new Date(row['dob']) : null,
              },
            },
          },
        });
        validCount.added++;
      } catch (e: any) {
        validCount.errors.push(`Row ${i + 1}: ${e.message}`);
        validCount.skipped++;
      }
    }

    res.json({
      success: true,
      message: `Import complete: ${validCount.added} added, ${validCount.skipped} skipped`,
      data: validCount,
    });
  } catch (err) { next(err); }
});

export default router;
