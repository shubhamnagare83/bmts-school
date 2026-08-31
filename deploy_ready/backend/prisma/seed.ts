import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const KG_CLASSES = ['Jr.KG', 'Sr.KG'];
const ALL_CLASS_NAMES = ['Jr.KG', 'Sr.KG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
const DIVISIONS = ['A', 'B', 'C'];

const KG_SUBJECTS = [
  'English Reading', 'English Writing', 'English Recitation',
  'Hindi', 'Marathi', 'Maths (Numeracy)',
  'Environment Studies', 'Social Emotional', 'Drawing'
];

const PRIMARY_SUBJECTS_BY_CLASS: Record<string, string[]> = {
  '1st':  ['English', 'Hindi', 'Marathi', 'Mathematics', 'Environmental Studies', 'Drawing'],
  '2nd':  ['English', 'Hindi', 'Marathi', 'Mathematics', 'Environmental Studies', 'Drawing'],
  '3rd':  ['English', 'Hindi', 'Marathi', 'Mathematics', 'Environmental Studies', 'Drawing', 'General Knowledge'],
  '4th':  ['English', 'Hindi', 'Marathi', 'Mathematics', 'Environmental Studies', 'Drawing', 'General Knowledge'],
  '5th':  ['English', 'Hindi', 'Marathi', 'Mathematics', 'Science', 'Social Studies', 'Drawing', 'Computer Science'],
  '6th':  ['English', 'Hindi', 'Marathi', 'Mathematics', 'Science', 'Social Studies', 'Drawing', 'Computer Science'],
  '7th':  ['English', 'Hindi', 'Marathi', 'Mathematics', 'Science', 'Social Studies', 'Drawing', 'Computer Science'],
  '8th':  ['English', 'Hindi', 'Marathi', 'Mathematics', 'Science', 'Social Studies', 'Drawing', 'Computer Science'],
  '9th':  ['English', 'Hindi', 'Marathi', 'Mathematics', 'Science', 'History & Civics', 'Geography', 'Computer Science'],
  '10th': ['English', 'Hindi', 'Marathi', 'Mathematics', 'Science', 'History & Civics', 'Geography', 'Computer Science'],
};

// 12 Teachers - one for each class from Jr.KG to 10th
const TWELVE_TEACHERS = [
  { className: 'Jr.KG', email: 'teacher.jrkg@mtfschool.edu', username: 'teacher_jrkg', name: 'Mrs. Meena Deshmukh', phone: '9820010001', department: 'Pre-Primary', qualification: 'B.A., D.Ed.' },
  { className: 'Sr.KG', email: 'teacher.srkg@mtfschool.edu', username: 'teacher_srkg', name: 'Mrs. Priya Sharma', phone: '9820010002', department: 'Pre-Primary', qualification: 'M.A., Montessori' },
  { className: '1st',   email: 'teacher.1st@mtfschool.edu',  username: 'teacher_1st',  name: 'Mrs. Sunita Patil', phone: '9820010003', department: 'Primary', qualification: 'B.Sc., B.Ed.' },
  { className: '2nd',   email: 'teacher.2nd@mtfschool.edu',  username: 'teacher_2nd',  name: 'Mrs. Kavita Jadhav', phone: '9820010004', department: 'Primary', qualification: 'M.Sc., B.Ed.' },
  { className: '3rd',   email: 'teacher.3rd@mtfschool.edu',  username: 'teacher_3rd',  name: 'Mrs. Anjali Shinde', phone: '9820010005', department: 'Primary', qualification: 'B.A., B.Ed.' },
  { className: '4th',   email: 'teacher.4th@mtfschool.edu',  username: 'teacher_4th',  name: 'Mr. Rajesh Kulkarni', phone: '9820010006', department: 'Primary', qualification: 'M.A., B.Ed.' },
  { className: '5th',   email: 'teacher.5th@mtfschool.edu',  username: 'teacher_5th',  name: 'Mr. Suresh More', phone: '9820010007', department: 'Middle School', qualification: 'B.Sc., M.Ed.' },
  { className: '6th',   email: 'teacher.6th@mtfschool.edu',  username: 'teacher_6th',  name: 'Mrs. Deepa Joshi', phone: '9820010008', department: 'Middle School', qualification: 'M.A., B.Ed.' },
  { className: '7th',   email: 'teacher.7th@mtfschool.edu',  username: 'teacher_7th',  name: 'Mr. Amol Pawar', phone: '9820010009', department: 'Middle School', qualification: 'M.Sc., B.Ed.' },
  { className: '8th',   email: 'teacher.8th@mtfschool.edu',  username: 'teacher_8th',  name: 'Mrs. Pooja Gaikwad', phone: '9820010010', department: 'Secondary', qualification: 'B.A., M.Ed.' },
  { className: '9th',   email: 'teacher.9th@mtfschool.edu',  username: 'teacher_9th',  name: 'Mr. Nitin Chavan', phone: '9820010011', department: 'Secondary', qualification: 'M.Sc., B.Ed.' },
  { className: '10th',  email: 'teacher.10th@mtfschool.edu', username: 'teacher_10th', name: 'Dr. Sanjay Bhosale', phone: '9820010012', department: 'Secondary', qualification: 'Ph.D., M.Ed.' },
];

// Student First & Last names template
const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Rahul', 'Pooja', 'Rohan', 
  'Sneha', 'Arjun', 'Tanvi', 'Omkar', 'Ananya',
  'Sahil', 'Riya', 'Vedant', 'Isha', 'Atharva',
  'Gauri', 'Pranav', 'Shreya', 'Siddharth', 'Bhavna'
];

const LAST_NAMES = [
  'Deshmukh', 'Sharma', 'Verma', 'Patil', 'Shinde',
  'Kulkarni', 'Desai', 'Joshi', 'More', 'Pawar',
  'Gaikwad', 'Bhosale', 'Jadhav', 'Chavan', 'Wagh',
  'Suryavanshi', 'Kadam', 'Bonde', 'Salunkhe', 'Mane'
];

const OCCUPATIONS = [
  'Business Owner', 'Software Engineer', 'Teacher', 'Farmer',
  'Doctor', 'Government Officer', 'Bank Manager', 'Civil Engineer',
  'Homemaker', 'Accountant', 'Professor', 'Advocate'
];

const BLOOD_GROUPS = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'];

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Bharat Ratna Mother Teresa English School');
  console.log('  Full Database Seed — 12 Classes, 120 Students');
  console.log('  Report Cards for All + Teaching Logs + Attendance');
  console.log('═══════════════════════════════════════════════');

  // ── Settings ──────────────────────────────────────────────
  const existingSettings = await prisma.schoolSettings.findFirst();
  const settingsData = {
    schoolName: 'Bharat Ratna Mother Teresa English School',
    address: 'Gangapur Dist. Chha. Sambhajinagar - 431109',
    phone: '+91 9876543210',
    email: 'contact@mtfschool.edu',
    principalName: 'Dr. S. K. Sharma',
    hmName: 'Mrs. A. R. Kulkarni',
    motto: 'Education for Excellence',
  };
  if (existingSettings) {
    await prisma.schoolSettings.update({ where: { id: existingSettings.id }, data: settingsData });
  } else {
    await prisma.schoolSettings.create({ data: settingsData });
  }
  console.log('✓ School settings updated');

  // ── Admin User ────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@mtfschool.edu' },
    update: { passwordHash: adminHash, status: 'ACTIVE' },
    create: {
      email: 'admin@mtfschool.edu', username: 'admin', passwordHash: adminHash,
      role: 'ADMIN', status: 'ACTIVE',
      admin: { create: { name: 'Super Admin', phone: '0000000000' } }
    }
  });
  console.log('✓ Admin user ready (admin@mtfschool.edu / Admin@123)');

  // ── Academic Year ─────────────────────────────────────────
  let ay = await prisma.academicYear.findUnique({ where: { name: '2025-2026' } });
  if (!ay) {
    ay = await prisma.academicYear.create({
      data: { name: '2025-2026', startDate: new Date('2025-06-16'), endDate: new Date('2026-04-04'), isActive: true }
    });
  }
  console.log(`✓ Academic Year: ${ay.name}`);

  // ── Classes, Divisions, Subjects ─────────────────────────
  const classMap: Record<string, string> = {};
  const divisionMap: Record<string, string> = {};
  const subjectsMap: Record<string, any[]> = {};

  for (let i = 0; i < ALL_CLASS_NAMES.length; i++) {
    const name = ALL_CLASS_NAMES[i];
    const isKG = KG_CLASSES.includes(name);

    let cls = await prisma.class.findUnique({ where: { name } });
    if (!cls) {
      cls = await prisma.class.create({
        data: {
          name,
          displayOrder: i + 1,
          reportCardTemplate: isKG ? 'KG' : 'PRIMARY_SECONDARY'
        }
      });
    } else {
      await prisma.class.update({
        where: { id: cls.id },
        data: { displayOrder: i + 1, reportCardTemplate: isKG ? 'KG' : 'PRIMARY_SECONDARY' }
      });
    }
    classMap[name] = cls.id;

    // Divisions A, B, C
    for (const divName of DIVISIONS) {
      const divExists = await prisma.division.findUnique({
        where: { classId_name: { classId: cls.id, name: divName } }
      });
      let div;
      if (!divExists) {
        div = await prisma.division.create({ data: { name: divName, classId: cls.id } });
      } else {
        div = divExists;
      }
      divisionMap[`${name}|${divName}`] = div.id;
    }

    // Subjects
    const subjects = isKG ? KG_SUBJECTS : (PRIMARY_SUBJECTS_BY_CLASS[name] || []);
    subjectsMap[name] = [];
    for (let subIdx = 0; subIdx < subjects.length; subIdx++) {
      const subName = subjects[subIdx];
      let sub = await prisma.subject.findUnique({
        where: { classId_name: { classId: cls.id, name: subName } }
      });
      if (!sub) {
        sub = await prisma.subject.create({
          data: { name: subName, classId: cls.id, maxMarks: 100, passingMarks: 35, displayOrder: subIdx + 1 }
        });
      }
      subjectsMap[name].push(sub);
    }

    console.log(`  ✓ Class ${name} — Divs: A,B,C — Subjects: ${subjects.length}`);
  }

  // ── 12 Teachers ───────────────────────────────────────────
  const facultyHash = await bcrypt.hash('Faculty@123', 10);
  const teacherIdMap: Record<string, string> = {};

  for (const td of TWELVE_TEACHERS) {
    const u = await prisma.user.upsert({
      where: { email: td.email },
      update: { passwordHash: facultyHash, status: 'ACTIVE' },
      create: {
        email: td.email,
        username: td.username,
        passwordHash: facultyHash,
        role: 'FACULTY',
        status: 'ACTIVE',
        teacher: {
          create: {
            name: td.name,
            phone: td.phone,
            department: td.department,
            qualification: td.qualification,
            canFinalizeReportCards: true
          }
        }
      },
      include: { teacher: true }
    });

    if (u.teacher) {
      teacherIdMap[td.className] = u.teacher.id;
    }
  }
  console.log(`✓ 12 Faculty accounts ready (Password: Faculty@123)`);

  // ── Assign 12 Teachers to Classes ─────────────────────────
  for (const td of TWELVE_TEACHERS) {
    const cId = classMap[td.className];
    const tId = teacherIdMap[td.className];
    if (!cId || !tId) continue;

    const firstSub = subjectsMap[td.className]?.[0];
    if (!firstSub) continue;

    for (const divName of DIVISIONS) {
      const dId = divisionMap[`${td.className}|${divName}`];
      if (!dId) continue;

      const exists = await prisma.teacherAssignment.findFirst({
        where: { teacherId: tId, classId: cId, divisionId: dId, academicYearId: ay.id }
      });
      if (!exists) {
        await prisma.teacherAssignment.create({
          data: { teacherId: tId, classId: cId, divisionId: dId, subjectId: firstSub.id, academicYearId: ay.id }
        });
      }
    }
  }
  console.log(`✓ 12 Teachers allocated to their classes (Divisions A, B, C)`);

  // ── Grade Rules ───────────────────────────────────────────
  const gradeRules = [
    { name: 'A+', minPercentage: 90, maxPercentage: 100, displayOrder: 1 },
    { name: 'A',  minPercentage: 80, maxPercentage: 89.99, displayOrder: 2 },
    { name: 'B+', minPercentage: 70, maxPercentage: 79.99, displayOrder: 3 },
    { name: 'B',  minPercentage: 60, maxPercentage: 69.99, displayOrder: 4 },
    { name: 'C',  minPercentage: 50, maxPercentage: 59.99, displayOrder: 5 },
    { name: 'D',  minPercentage: 35, maxPercentage: 49.99, displayOrder: 6 },
    { name: 'E',  minPercentage: 0,  maxPercentage: 34.99, displayOrder: 7 },
  ];

  for (const gr of gradeRules) {
    const existing = await prisma.gradeRule.findFirst({ where: { name: gr.name } });
    if (!existing) {
      await prisma.gradeRule.create({ data: gr });
    }
  }
  console.log('✓ Grade rules configured');

  // ── 10 Students for Each of 12 Classes (120 Students Total) ──
  const studentHash = await bcrypt.hash('Student@123', 10);
  let totalStudentsCreated = 0;
  let totalReportCardsCreated = 0;

  const sampleRemarks = {
    A: {
      prog: 'Demonstrates excellent motor coordination and active physical agility.\nMaintains good posture and clean hygiene habits.',
      chal: 'Encouraged to practice daily physical exercises.\nNeeds continued attention to neat paper craft.'
    },
    B: {
      prog: 'Helpful and polite towards teachers and classmates.\nShares learning materials willingly with peers.',
      chal: 'Encouraged to express opinions more assertively.\nPractice active listening during group games.'
    },
    C: {
      prog: 'Quick grasp of logical patterns and core mathematical concepts.\nCurious and observant during science and nature topics.',
      chal: 'Needs more practice with multi-step problem solving.\nEncourage asking questions when in doubt.'
    },
    D: {
      prog: 'Fluent oral reading and clear recitation of poems in English and Marathi.\nNeat, legible handwriting with good spacing.',
      chal: 'Daily oral reading practice recommended at home.\nExpand sentence vocabulary in creative writing.'
    },
    E: {
      prog: 'Creative imagination shown in coloring, art, and craft models.\nActive and joyful participation in singing and dance.',
      chal: 'Encouraged to try new color blending techniques.\nEnhance stage confidence in group drama.'
    },
  };

  for (let cIdx = 0; cIdx < ALL_CLASS_NAMES.length; cIdx++) {
    const className = ALL_CLASS_NAMES[cIdx];
    const cId = classMap[className];
    const dId = divisionMap[`${className}|A`]; // Division A
    const tId = teacherIdMap[className];
    const classSubs = subjectsMap[className] || [];

    // Create / ensure an Exam for this class
    let exam = await prisma.exam.findFirst({
      where: { classId: cId, academicYearId: ay.id, name: 'Term-1 Evaluation 2025-26' }
    });
    if (!exam) {
      exam = await prisma.exam.create({
        data: {
          name: 'Term-1 Evaluation 2025-26',
          classId: cId,
          academicYearId: ay.id,
          startDate: new Date('2025-10-15'),
          endDate: new Date('2025-10-25'),
          isActive: true,
        }
      });
    }

    const baseAge = cIdx + 4; // Jr.KG: 4, Sr.KG: 5, 1st: 6, ... 10th: 15
    const birthYear = 2025 - baseAge;

    for (let sIdx = 1; sIdx <= 10; sIdx++) {
      const rollNo = String(sIdx);
      const paddedIdx = String(cIdx * 10 + sIdx).padStart(3, '0');
      const admissionNo = `ADM${paddedIdx}`;

      const fName = FIRST_NAMES[(cIdx * 3 + sIdx) % FIRST_NAMES.length];
      const lName = LAST_NAMES[(cIdx * 2 + sIdx) % LAST_NAMES.length];
      const fullName = `${fName} ${lName}`;
      const gender = sIdx % 2 === 0 ? 'FEMALE' : 'MALE';
      const fatherName = `Mr. Ramesh ${lName}`;
      const motherName = `Mrs. Sunita ${lName}`;
      const fatherOcc = OCCUPATIONS[(sIdx * 2) % OCCUPATIONS.length];
      const motherOcc = OCCUPATIONS[(sIdx * 3) % OCCUPATIONS.length];
      const bloodGroup = BLOOD_GROUPS[sIdx % BLOOD_GROUPS.length];
      const height = `${100 + cIdx * 5 + sIdx} cm`;
      const weight = `${16 + cIdx * 3 + sIdx} kg`;
      const motherTongue = sIdx % 4 === 0 ? 'Hindi' : sIdx % 5 === 0 ? 'English' : 'Marathi';
      const dob = new Date(`${birthYear}-0${(sIdx % 9) + 1}-15`);
      const parentContact = `98210${String(cIdx).padStart(2, '0')}${String(sIdx).padStart(3, '0')}`;
      const address = `Plot No. ${sIdx * 12}, Near Shivaji Chowk, Gangapur, Sambhajinagar`;

      // Upsert Student User & Profile
      const studentEmail = `${admissionNo.toLowerCase()}@student.mtfschool.edu`;
      const username = admissionNo.toLowerCase();

      let studentRecord = await prisma.student.findUnique({ where: { admissionNo } });
      if (!studentRecord) {
        const user = await prisma.user.create({
          data: {
            email: studentEmail,
            username,
            passwordHash: studentHash,
            role: 'STUDENT',
            status: 'ACTIVE',
            student: {
              create: {
                admissionNo,
                rollNo,
                name: fullName,
                surname: lName,
                gender: gender as any,
                parentContact,
                parentEmail: `parent.${admissionNo.toLowerCase()}@gmail.com`,
                fatherName,
                fatherOccupation: fatherOcc,
                motherName,
                motherOccupation: motherOcc,
                motherTongue,
                bloodGroup,
                height,
                weight,
                dob,
                age: baseAge,
                address,
              }
            }
          },
          include: { student: true }
        });
        studentRecord = user.student;
      } else {
        await prisma.student.update({
          where: { id: studentRecord.id },
          data: {
            rollNo,
            name: fullName,
            surname: lName,
            fatherName,
            fatherOccupation: fatherOcc,
            motherName,
            motherOccupation: motherOcc,
            motherTongue,
            bloodGroup,
            height,
            weight,
            dob,
            age: baseAge,
            address,
            parentContact,
          }
        });
      }

      if (!studentRecord) continue;
      totalStudentsCreated++;

      // Enrollment
      const enroll = await prisma.studentEnrollment.findFirst({
        where: { studentId: studentRecord.id, academicYearId: ay.id }
      });
      if (!enroll) {
        await prisma.studentEnrollment.create({
          data: {
            studentId: studentRecord.id,
            classId: cId,
            divisionId: dId,
            academicYearId: ay.id,
            rollNo,
            status: 'ENROLLED'
          }
        });
      }

      // Seed Marks for this Student in Bulk
      if (exam && classSubs.length > 0) {
        const marksToCreate = classSubs.map((sub) => ({
          studentId: studentRecord.id,
          examId: exam.id,
          subjectId: sub.id,
          classId: cId,
          divisionId: dId,
          academicYearId: ay.id,
          marksObtained: Math.min(100, Math.max(50, 70 + (sIdx * 3 + cIdx * 2) % 28)),
          enteredById: tId,
        }));
        for (const markData of marksToCreate) {
          try {
            await prisma.mark.create({ data: markData });
          } catch (e: any) {
            // Skip duplicates
            if (!e.code || e.code !== 'P2002') throw e;
          }
        }
      }

      // Pre-Generate Report Card for Every Student
      let rc = await prisma.reportCard.findFirst({
        where: { studentId: studentRecord.id, academicYearId: ay.id }
      });

      if (!rc) {
        rc = await prisma.reportCard.create({
          data: {
            studentId: studentRecord.id,
            classId: cId,
            divisionId: dId,
            academicYearId: ay.id,
            status: 'DRAFT',
            sections: {
              create: [
                { sectionKey: 'A', sectionTitle: 'Physical & Motor Development', progressShown: sampleRemarks.A.prog, challengesFaced: sampleRemarks.A.chal },
                { sectionKey: 'B', sectionTitle: 'Social Emotional Development', progressShown: sampleRemarks.B.prog, challengesFaced: sampleRemarks.B.chal },
                { sectionKey: 'C', sectionTitle: 'Cognitive Development', progressShown: sampleRemarks.C.prog, challengesFaced: sampleRemarks.C.chal },
                { sectionKey: 'D', sectionTitle: 'Language & Literacy Development', progressShown: sampleRemarks.D.prog, challengesFaced: sampleRemarks.D.chal },
                { sectionKey: 'E', sectionTitle: 'Creative & Aesthetic Development', progressShown: sampleRemarks.E.prog, challengesFaced: sampleRemarks.E.chal },
              ]
            },
            assessment: {
              create: {
                allRoundDevelopment: 'YES',
                strengthIdentified: 'Observant, polite, active participant in class discussions, and neat handwriting.',
                additionalSupportNeeded: 'Encouraged to practice daily mental arithmetic and expand vocabulary through oral reading.'
              }
            }
          }
        });
        totalReportCardsCreated++;
      }

      // Seed Attendance for Last 5 Days in Bulk
      const dates = [
        new Date('2026-08-18'),
        new Date('2026-08-19'),
        new Date('2026-08-20'),
        new Date('2026-08-21'),
        new Date('2026-08-22'),
      ];

      const attToCreate = dates.map((attDate) => ({
        studentId: studentRecord.id,
        classId: cId,
        divisionId: dId,
        academicYearId: ay.id,
        date: attDate,
        status: (sIdx === 7 && attDate.getDay() === 3 ? 'ABSENT' : 'PRESENT') as any,
        markedById: tId,
      }));
      for (const attData of attToCreate) {
        try {
          await prisma.attendance.create({ data: attData });
        } catch (e: any) {
          // Skip duplicates
          if (!e.code || e.code !== 'P2002') throw e;
        }
      }
    }

    // Seed Sample Daily Teaching Log for each class
    if (tId) {
      const todayDate = new Date('2026-08-22');
      const logExists = await prisma.dailyTeachingLog.findFirst({
        where: { classId: cId, divisionId: dId, date: todayDate }
      });
      if (!logExists) {
        await prisma.dailyTeachingLog.create({
          data: {
            classId: cId,
            divisionId: dId,
            teacherId: tId,
            subjectId: classSubs[0]?.id || null,
            date: todayDate,
            topicTaught: `Unit 3 — Essential Concepts & Classroom Exercises for Class ${className}`,
            homeworkGiven: 'Complete Exercise Questions 1 to 5 in Notebook',
            remarks: 'All students actively participated and completed initial classwork on time.',
          }
        });
      }
    }

    console.log(`  ✓ Class ${className} — 10 Students Enrolled & 10 Report Cards Generated!`);
  }

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  Seeding Complete!`);
  console.log(`  Total Students: ${totalStudentsCreated}`);
  console.log(`  Total Report Cards Ready: ${totalReportCardsCreated}`);
  console.log('═══════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
