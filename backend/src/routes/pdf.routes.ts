import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';
import { computeWorkingDays, computeAttendancePercentage, computeGrade } from '../utils/helpers.js';
import { getBannerDataUri, getStudentPhotoDataUri, renderPdf } from '../utils/pdf.js';

const router = Router();
router.use(authenticateToken);

// Generate and stream PDF for a report card
router.get('/report-card/:id', authorize('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const reportCard = await prisma.reportCard.findUnique({
      where: { id: req.params.id },
      include: {
        student: true,
        class: true,
        division: true,
        academicYear: true,
        sections: true,
        assessment: true,
      },
    });
    if (!reportCard) return res.status(404).json({ success: false, error: 'Report card not found' });

    const settings = await prisma.schoolSettings.findFirst();
    const rules = await prisma.gradeRule.findMany({ orderBy: { minPercentage: 'desc' } });

    const className = String(reportCard.class.name).trim().toLowerCase();
    const isSecondary = ['8th', '9th', '10th', '8', '9', '10', 'viii', 'ix', 'x'].includes(className);

    if (isSecondary) {
      // -------------------------------------------------------------
      // Secondary 3-Panel Landscape brochure report card (Std 8, 9, 10)
      // -------------------------------------------------------------
      const is10th = /^(10|10th|X)$/i.test(reportCard.class.name);
      const is9th = /^(9|9th|IX)$/i.test(reportCard.class.name);
      const is8th = !is10th && !is9th; // Default to 8th if secondary

      const stdCode = is10th ? 'STD.X' : is9th ? 'STD.IX' : 'STD.VIII';
      const academicYear = reportCard.academicYear?.name || '2026 - 27';

      // Merge student details
      const dobFormatted = reportCard.student?.dob ? new Date(reportCard.student.dob).toLocaleDateString('en-GB') : '';
      const stud = {
        name: reportCard.student?.name ?? '',
        rollNo: reportCard.student?.rollNo ?? '',
        admissionNo: reportCard.student?.admissionNo ?? '',
        regNo: reportCard.student?.admissionNo ?? '',
        idNo: reportCard.student?.admissionNo ?? '',
        uidNo: reportCard.student?.admissionNo ?? '',
        fatherName: reportCard.student?.fatherName ?? '',
        fatherOccupation: reportCard.student?.fatherOccupation ?? '',
        motherName: reportCard.student?.motherName ?? '',
        motherOccupation: reportCard.student?.motherOccupation ?? '',
        motherTongue: reportCard.student?.motherTongue ?? 'Marathi',
        dob: dobFormatted,
        mobile: reportCard.student?.parentContact ?? '',
        weight: reportCard.student?.weight ?? '',
        height: reportCard.student?.height ?? '',
        address: reportCard.student?.address ?? '',
        photo: reportCard.student?.photo ?? '',
        division: reportCard.division?.name ?? 'A',
      };

      const bannerBase64 = getBannerDataUri();
      const studentPhotoBase64 = getStudentPhotoDataUri(stud.photo);

      // Extract saved section / additionalData
      const getSecData = (key: string) => {
        const sec = reportCard.sections.find((s: any) => s.sectionKey === key);
        return (sec?.additionalData as any) || {};
      };

      const secDesc = getSecData('SECONDARY_DESCRIPTIVE');
      const secComp = getSecData('SECONDARY_COMPETENCY');
      const secAttendance = getSecData('SECONDARY_ATTENDANCE');
      const secMarks = getSecData('SECONDARY_MARKS');
      const secGeneral = getSecData('SECONDARY_GENERAL');

      // Months for attendance chart
      const months = ['June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.', 'Jan.', 'Feb.', 'Mar.'];
      const attendanceMonthly = months.map(m => ({
        month: m,
        wDays: secAttendance[m]?.wDays ?? '',
        pDays: secAttendance[m]?.pDays ?? '',
      }));

      const totalWDays = attendanceMonthly.reduce((acc, curr) => acc + (Number(curr.wDays) || 0), 0);
      const totalPDays = attendanceMonthly.reduce((acc, curr) => acc + (Number(curr.pDays) || 0), 0);
      const attendancePercentage = totalWDays > 0 ? ((totalPDays / totalWDays) * 100).toFixed(1) + '%' : '';

      // Subjects configuration
      const std10Subjects = [
        { id: 'eng', name: 'I Language ENGLISH', writtenMax: 80, oralMax: 20, totalMax: 100 },
        { id: 'hin', name: 'II Language HINDI', writtenMax: 80, oralMax: 20, totalMax: 100 },
        { id: 'mar', name: 'III Language MARATHI', writtenMax: 80, oralMax: 20, totalMax: 100 },
        { id: 'math', name: 'MATHS I & II', writtenMax: 80, oralMax: 20, totalMax: 100 },
        { id: 'sci', name: 'SCIENCE & TECHNOLOGY', writtenMax: 80, oralMax: 20, totalMax: 100 },
        { id: 'soc', name: 'SOCIAL SCIENCE', writtenMax: 80, oralMax: 20, totalMax: 100 },
      ];

      const std10GradeSubjects = [
        { id: 'g_hpe', name: 'Health & Physical Education' },
        { id: 'g_art', name: 'Self Development & Art Appriciation' },
        { id: 'g_ws', name: 'Water Security' },
      ];

      const std9Subjects = [
        { id: 'eng', name: 'I Language ENGLISH' },
        { id: 'hin', name: 'II Language HINDI' },
        { id: 'mar', name: 'III Language MARATHI' },
        { id: 'math', name: 'MATHS I & II' },
        { id: 'sci', name: 'SCIENCE & TECHNOLOGY' },
        { id: 'soc', name: 'SOCIAL SCIENCE' },
      ];

      const std9GradeSubjects = [
        { id: 'g_hpe', name: 'Health & Phy. Education' },
        { id: 'g_art', name: 'Self Dev. & Art Appr.' },
        { id: 'g_ws', name: 'Water Security' },
      ];

      const std8Subjects = [
        { id: 'eng', name: 'I Language ENGLISH' },
        { id: 'hin', name: 'II Language HINDI' },
        { id: 'mar', name: 'III Language MARATHI' },
        { id: 'math', name: 'MATHS' },
        { id: 'sci', name: 'G.SCIENCE' },
        { id: 'soc', name: 'SOCIAL SCIENCE' },
      ];

      const std8GradeSubjects = [
        { id: 'g_hpe', name: 'Health & Phy. Education' },
        { id: 'g_gk', name: 'G.K./LBV' },
        { id: 'g_comp', name: 'Computer' },
        { id: 'g_art', name: 'Art' },
      ];

      // Helper to read marks
      const getSubMark = (subId: string, exam: string, type: 'w' | 'o' | 't' | 'g') => {
        return secMarks[`${subId}_${exam}_${type}`] ?? '';
      };

      // Calculate totals for Std 10th
      const get10thColTotal = (exam: string, type: 'w' | 'o' | 't') => {
        let sum = 0;
        let hasVal = false;
        std10Subjects.forEach(s => {
          const v = secMarks[`${s.id}_${exam}_${type}`];
          if (v !== undefined && v !== '' && !isNaN(Number(v))) {
            sum += Number(v);
            hasVal = true;
          }
        });
        return hasVal ? sum : '';
      };

      // Calculate totals for 8th & 9th
      const get9th8thTotals = () => {
        const subjectsList = is8th ? std8Subjects : std9Subjects;
        let t1_w = 0, t1_o = 0, t1_t = 0;
        let a2_w = 0, a2_o = 0, a2_t = 0;
        let t2_w = 0, t2_o = 0, t2_t = 0;
        let b2_w = 0, b2_o = 0, b2_t = 0;
        let sumA1A2 = 0, sumB1B2 = 0, grandTotal = 0;

        let hasAny = false;
        subjectsList.forEach(s => {
          const w1 = Number(secMarks[`${s.id}_t1_w`]) || 0;
          const o1 = Number(secMarks[`${s.id}_t1_o`]) || 0;
          const tot1 = (secMarks[`${s.id}_t1_t`] !== undefined && secMarks[`${s.id}_t1_t`] !== '') ? Number(secMarks[`${s.id}_t1_t`]) : (w1 + o1);

          const w2 = Number(secMarks[`${s.id}_a2_w`]) || 0;
          const o2 = Number(secMarks[`${s.id}_a2_o`]) || 0;
          const tot2 = (secMarks[`${s.id}_a2_t`] !== undefined && secMarks[`${s.id}_a2_t`] !== '') ? Number(secMarks[`${s.id}_a2_t`]) : (w2 + o2);

          const w3 = Number(secMarks[`${s.id}_t2_w`]) || 0;
          const o3 = Number(secMarks[`${s.id}_t2_o`]) || 0;
          const tot3 = (secMarks[`${s.id}_t2_t`] !== undefined && secMarks[`${s.id}_t2_t`] !== '') ? Number(secMarks[`${s.id}_t2_t`]) : (w3 + o3);

          const w4 = Number(secMarks[`${s.id}_b2_w`]) || 0;
          const o4 = Number(secMarks[`${s.id}_b2_o`]) || 0;
          const tot4 = (secMarks[`${s.id}_b2_t`] !== undefined && secMarks[`${s.id}_b2_t`] !== '') ? Number(secMarks[`${s.id}_b2_t`]) : (w4 + o4);

          const rowA1A2 = (secMarks[`${s.id}_totA`] !== undefined && secMarks[`${s.id}_totA`] !== '') ? Number(secMarks[`${s.id}_totA`]) : (tot1 + tot2);
          const rowB1B2 = (secMarks[`${s.id}_totB`] !== undefined && secMarks[`${s.id}_totB`] !== '') ? Number(secMarks[`${s.id}_totB`]) : (tot3 + tot4);
          const rowGrand = (secMarks[`${s.id}_totGrand`] !== undefined && secMarks[`${s.id}_totGrand`] !== '') ? Number(secMarks[`${s.id}_totGrand`]) : (rowA1A2 + rowB1B2);

          if (secMarks[`${s.id}_t1_w`] || secMarks[`${s.id}_a2_w`] || secMarks[`${s.id}_t2_w`] || secMarks[`${s.id}_b2_w`]) {
            hasAny = true;
          }

          t1_w += w1; t1_o += o1; t1_t += tot1;
          a2_w += w2; a2_o += o2; a2_t += tot2;
          t2_w += w3; t2_o += o3; t2_t += tot3;
          b2_w += w4; b2_o += o4; b2_t += tot4;
          sumA1A2 += rowA1A2; sumB1B2 += rowB1B2; grandTotal += rowGrand;
        });

        return {
          hasAny,
          t1_w: t1_w || '', t1_o: t1_o || '', t1_t: t1_t || '',
          a2_w: a2_w || '', a2_o: a2_o || '', a2_t: a2_t || '',
          t2_w: t2_w || '', t2_o: t2_o || '', t2_t: t2_t || '',
          b2_w: b2_w || '', b2_o: b2_o || '', b2_t: b2_t || '',
          sumA1A2: sumA1A2 || '', sumB1B2: sumB1B2 || '', grandTotal: grandTotal || '',
          percentage: grandTotal ? ((grandTotal / 1800) * 100).toFixed(1) + '%' : '',
        };
      };

      const totals89 = get9th8thTotals();

      // 10th Academic subjects rows
      let marksRows10th = '';
      std10Subjects.forEach(s => {
        const t1_w = getSubMark(s.id, 't1', 'w');
        const t1_o = getSubMark(s.id, 't1', 'o');
        const t1_t = getSubMark(s.id, 't1', 't') || (t1_w !== '' || t1_o !== '' ? (Number(t1_w) || 0) + (Number(t1_o) || 0) : '');

        const t2_w = getSubMark(s.id, 't2', 'w');
        const t2_o = getSubMark(s.id, 't2', 'o');
        const t2_t = getSubMark(s.id, 't2', 't') || (t2_w !== '' || t2_o !== '' ? (Number(t2_w) || 0) + (Number(t2_o) || 0) : '');

        const p1_w = getSubMark(s.id, 'p1', 'w');
        const p1_o = getSubMark(s.id, 'p1', 'o');
        const p1_t = getSubMark(s.id, 'p1', 't') || (p1_w !== '' || p1_o !== '' ? (Number(p1_w) || 0) + (Number(p1_o) || 0) : '');

        marksRows10th += `
          <tr class="border-b border-slate-700">
            <td class="border-r border-slate-700 p-0.5 text-left pl-1 font-semibold">${s.name}</td>
            <td class="border-r border-slate-700 p-0.5">${t1_w}</td>
            <td class="border-r border-slate-700 p-0.5">${t1_o}</td>
            <td class="border-r border-slate-700 p-0.5 font-bold bg-slate-50">${t1_t}</td>
            <td class="border-r border-slate-700 p-0.5">${t2_w}</td>
            <td class="border-r border-slate-700 p-0.5">${t2_o}</td>
            <td class="border-r border-slate-700 p-0.5 font-bold bg-slate-50">${t2_t}</td>
            <td class="border-r border-slate-700 p-0.5">${p1_w}</td>
            <td class="border-r border-slate-700 p-0.5">${p1_o}</td>
            <td class="p-0.5 font-bold bg-slate-50">${p1_t}</td>
          </tr>
        `;
      });

      let gradeRows10th = '';
      std10GradeSubjects.forEach(g => {
        const t1_g = secMarks[`${g.id}_t1`] || 'A';
        const t2_g = secMarks[`${g.id}_t2`] || 'A';
        const p1_g = secMarks[`${g.id}_p1`] || 'A';
        gradeRows10th += `
          <tr class="border-b border-slate-700">
            <td class="border-r border-slate-700 p-0.5 text-left pl-1 text-[8px]">${g.name}</td>
            <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${t1_g}</td>
            <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${t2_g}</td>
            <td colSpan="3" class="p-0.5 font-bold">${p1_g}</td>
          </tr>
        `;
      });

      let marksRows89 = '';
      const subjectsList = is8th ? std8Subjects : std9Subjects;
      subjectsList.forEach(s => {
        const w1 = getSubMark(s.id, 't1', 'w');
        const o1 = getSubMark(s.id, 't1', 'o');
        const tot1 = getSubMark(s.id, 't1', 't') || (w1 !== '' || o1 !== '' ? (Number(w1) || 0) + (Number(o1) || 0) : '');

        const w2 = getSubMark(s.id, 'a2', 'w');
        const o2 = getSubMark(s.id, 'a2', 'o');
        const tot2 = getSubMark(s.id, 'a2', 't') || (w2 !== '' || o2 !== '' ? (Number(w2) || 0) + (Number(o2) || 0) : '');

        const w3 = getSubMark(s.id, 't2', 'w');
        const o3 = getSubMark(s.id, 't2', 'o');
        const tot3 = getSubMark(s.id, 't2', 't') || (w3 !== '' || o3 !== '' ? (Number(w3) || 0) + (Number(o3) || 0) : '');

        const w4 = getSubMark(s.id, 'b2', 'w');
        const o4 = getSubMark(s.id, 'b2', 'o');
        const tot4 = getSubMark(s.id, 'b2', 't') || (w4 !== '' || o4 !== '' ? (Number(w4) || 0) + (Number(o4) || 0) : '');

        const totA = getSubMark(s.id, 'totA', 't') || (tot1 !== '' || tot2 !== '' ? (Number(tot1) || 0) + (Number(tot2) || 0) : '');
        const totB = getSubMark(s.id, 'totB', 't') || (tot3 !== '' || tot4 !== '' ? (Number(tot3) || 0) + (Number(tot4) || 0) : '');
        const grand = getSubMark(s.id, 'totGrand', 't') || (totA !== '' || totB !== '' ? (Number(totA) || 0) + (Number(totB) || 0) : '');

        marksRows89 += `
          <tr class="border-b border-slate-700">
            <td class="border-r border-slate-700 p-0.5 text-left pl-1 font-semibold">${s.name}</td>
            <td class="border-r border-slate-700 p-0.5">${w1}</td>
            <td class="border-r border-slate-700 p-0.5">${o1}</td>
            <td class="border-r border-slate-700 p-0.5 font-bold bg-slate-50">${tot1}</td>
            <td class="border-r border-slate-700 p-0.5">${w2}</td>
            <td class="border-r border-slate-700 p-0.5">${o2}</td>
            <td class="border-r border-slate-700 p-0.5 font-bold bg-slate-50">${tot2}</td>
            <td class="border-r border-slate-700 p-0.5">${w3}</td>
            <td class="border-r border-slate-700 p-0.5">${o3}</td>
            <td class="border-r border-slate-700 p-0.5 font-bold bg-slate-50">${tot3}</td>
            <td class="border-r border-slate-700 p-0.5">${w4}</td>
            <td class="border-r border-slate-700 p-0.5">${o4}</td>
            <td class="border-r border-slate-700 p-0.5 font-bold bg-slate-50">${tot4}</td>
            <td class="border-r border-slate-700 p-0.5 font-bold bg-slate-50">${totA}</td>
            <td class="border-r border-slate-700 p-0.5 font-bold bg-slate-50">${totB}</td>
            <td class="p-0.5 font-bold bg-slate-100">${grand}</td>
          </tr>
        `;
      });

      let gradeRows89 = '';
      const gradeSubjectsList = is8th ? std8GradeSubjects : std9GradeSubjects;
      gradeSubjectsList.forEach(g => {
        const t1_g = secMarks[`${g.id}_t1`] || 'A';
        const a2_g = secMarks[`${g.id}_a2`] || 'A';
        const t2_g = secMarks[`${g.id}_t2`] || 'A';
        const b2_g = secMarks[`${g.id}_b2`] || 'A';
        const totA = secMarks[`${g.id}_totA`] || 'A';
        const totB = secMarks[`${g.id}_totB`] || 'A';
        const totGrand = secMarks[`${g.id}_totGrand`] || 'A';

        gradeRows89 += `
          <tr class="border-b border-slate-700">
            <td class="border-r border-slate-700 p-0.5 text-left pl-1 text-[7.5px]">${g.name}</td>
            <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${t1_g}</td>
            <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${a2_g}</td>
            <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${t2_g}</td>
            <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${b2_g}</td>
            <td class="border-r border-slate-700 p-0.5 font-bold">${totA}</td>
            <td class="border-r border-slate-700 p-0.5 font-bold">${totB}</td>
            <td class="p-0.5 font-bold">${totGrand}</td>
          </tr>
        `;
      });

      // 4. Build Competencies Cards
      const COMPETENCY_DOMAINS_LOCAL = [
        {
          id: 1, titleEn: '1. Scholastic', titleMr: 'शैक्षणिक विकास',
          items: [
            { id: 1, titleEn: 'Concept Understanding', titleMr: 'संकल्पना समजण्याची क्षमता' },
            { id: 2, titleEn: 'Subject Knowledge', titleMr: 'विषयाचे ज्ञान' },
            { id: 3, titleEn: 'Problem-Solving Ability', titleMr: 'समस्या सोडविण्याची क्षमता' },
            { id: 4, titleEn: 'Critical Thinking', titleMr: 'विचारपूर्वक आणि सखोल विचार करण्याची क्षमता' },
            { id: 5, titleEn: 'Independent Learning', titleMr: 'स्वावलंबीपणे शिकण्याची क्षमता' },
          ]
        },
        {
          id: 2, titleEn: '2. Language & Communication', titleMr: 'भाषा व संवाद कौशल्ये',
          items: [
            { id: 1, titleEn: 'Listening Skills', titleMr: 'ऐकण्याची क्षमता' },
            { id: 2, titleEn: 'Speaking Skills', titleMr: 'बोलण्याची क्षमता' },
            { id: 3, titleEn: 'Reading Comprehension', titleMr: 'वाचन आकलन क्षमता' },
            { id: 4, titleEn: 'Writing Skills', titleMr: 'लेखन कौशल्य' },
            { id: 5, titleEn: 'Presentation Skills', titleMr: 'सादरीकरण कौशल्य' },
          ]
        },
        {
          id: 3, titleEn: '3. Critical Thinking & Problem-Solving', titleMr: 'विचारशक्ती व समस्या सोडविणे',
          items: [
            { id: 1, titleEn: 'Observation Skills', titleMr: 'निरीक्षण करण्याची क्षमता' },
            { id: 2, titleEn: 'Logical Reasoning', titleMr: 'तर्कशुद्ध विचार' },
            { id: 3, titleEn: 'Decision Making', titleMr: 'निर्णय घेण्याची क्षमता' },
            { id: 4, titleEn: 'Questioning / Inquiry', titleMr: 'प्रश्न विचारण्याची व शोध घेण्याची वृत्ती' },
            { id: 5, titleEn: 'Evaluation Skills', titleMr: 'मूल्यांकन करण्याची क्षमता' },
          ]
        },
        {
          id: 4, titleEn: '4. Personal, Social & Ethical', titleMr: 'वैयक्तिक, सामाजिक व नैतिक विकास',
          items: [
            { id: 1, titleEn: 'Responsibility', titleMr: 'जबाबदारीची जाणीव' },
            { id: 2, titleEn: 'Confidence / Self-awareness', titleMr: 'आत्मविश्वास व स्व-जाणीव' },
            { id: 3, titleEn: 'Teamwork / Cooperation', titleMr: 'संघभावना व सहकार्य' },
            { id: 4, titleEn: 'Honesty / Integrity', titleMr: 'प्रामाणिकपणा व सचोटी' },
            { id: 5, titleEn: 'Emotional Control', titleMr: 'भावनांवर नियंत्रण' },
          ]
        },
        {
          id: 5, titleEn: '5. Career Orientation & Life Skills', titleMr: 'करिअर व जीवन कौशल्ये',
          items: [
            { id: 1, titleEn: 'Career Awareness', titleMr: 'करिअरची जाणीव' },
            { id: 2, titleEn: 'Goal Setting', titleMr: 'उद्दिष्ट निश्चित करणे' },
            { id: 3, titleEn: 'Self-Management', titleMr: 'स्वतःचे व्यवस्थापन' },
            { id: 4, titleEn: 'Leadership & Entrepreneurship', titleMr: 'नेतृत्व व उद्योजकता' },
            { id: 5, titleEn: 'Future Readiness', titleMr: 'भविष्यासाठी तयारी' },
          ]
        },
        {
          id: 6, titleEn: '6. Physical & Emotional Well-being', titleMr: 'शारीरिक व भावनिक स्वास्थ्य',
          items: [
            { id: 1, titleEn: 'Physical Fitness', titleMr: 'शारीरिक तंदुरुस्ती' },
            { id: 2, titleEn: 'Participation in Sports / Physical Activities', titleMr: 'खेळ व शारीरिक उपक्रमात सहभाग' },
            { id: 3, titleEn: 'Health & Hygiene Habits', titleMr: 'आरोग्य व स्वच्छतेच्या सवयी' },
            { id: 4, titleEn: 'Healthy Lifestyle Choices', titleMr: 'निरोगी जीवनशैली निवडणे' },
            { id: 5, titleEn: 'Positive Attitude', titleMr: 'सकारात्मक दृष्टिकोन' },
          ]
        }
      ];

      const renderCompetenciesCard = (doms: any[]) => {
        return doms.map(dom => {
          let rows = '';
          dom.items.forEach((it: any) => {
            const r1 = secComp[`dom_${dom.id}_it_${it.id}_t1`] ?? '4';
            const r2 = secComp[`dom_${dom.id}_it_${it.id}_t2`] ?? '5';
            rows += `
              <tr class="border-b border-slate-300 last:border-b-0 hover:bg-slate-50">
                <td class="p-0.5 text-center font-bold border-r border-slate-700 text-[7.5px]">${it.id}</td>
                <td class="p-0.5 border-r border-slate-700 leading-tight">
                  <span class="font-semibold text-red-900">· ${it.titleEn}</span><br />
                  <span class="text-slate-600 text-[7.5px]">${it.titleMr}</span>
                </td>
                <td class="p-0.5 text-center font-bold border-r border-slate-700 text-[9px] bg-pink-50/50">${r1}</td>
                <td class="p-0.5 text-center font-bold text-[9px] bg-teal-50/50">${r2}</td>
              </tr>
            `;
          });

          return `
            <div class="border border-slate-700 rounded-sm overflow-hidden text-[8px] mb-1">
              <div class="bg-[#005580] text-white font-bold p-0.5 text-center text-[8.5px]">
                ${dom.titleEn} (${dom.titleMr})
              </div>
              <table class="w-full border-collapse text-left">
                <thead>
                  <tr class="bg-slate-100 border-b border-slate-700 font-semibold text-[7.5px]">
                    <th class="p-0.5 w-6 text-center border-r border-slate-700">Sr.</th>
                    <th class="p-0.5 border-r border-slate-700">Criteria / निकष</th>
                    <th class="p-0.5 w-10 text-center border-r border-slate-700 bg-pink-900 text-white font-bold">I TERM</th>
                    <th class="p-0.5 w-10 text-center bg-teal-900 text-white font-bold">II TERM</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>
          `;
        }).join('');
      };

      const photoUrl = stud.photo ? (stud.photo.startsWith('http') || stud.photo.startsWith('data:') ? stud.photo : (stud.photo.startsWith('/') ? `http://localhost:3000${stud.photo}` : `http://localhost:3000/${stud.photo}`)) : '';

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 8px; color: #1a1a1a; line-height: 1.25; }
    @page { size: 16.5in 8.5in; margin: 0; }
    .page {
      width: 16.5in;
      height: 8.5in;
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-after: always;
      break-after: page;
      padding: 4.5mm 5mm;
      display: flex;
      justify-content: space-between;
      box-sizing: border-box;
      background: #ffffff;
      position: relative;
      overflow: hidden;
    }
    .panel {
      width: 130mm;
      height: 100%;
      border: 2.5px solid #005082;
      border-radius: 4px;
      padding: 2.5mm 3.5mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
      position: relative;
    }
    .panel::before {
      content: '';
      position: absolute;
      top: 1.5px;
      left: 1.5px;
      right: 1.5px;
      bottom: 1.5px;
      border: 1px solid #c8a96a;
      border-radius: 2px;
      pointer-events: none;
    }
    .vertical-text {
      position: absolute;
      left: 0.5mm;
      top: 100mm;
      transform: translateY(-50%) rotate(-90deg);
      transform-origin: left center;
      color: #b91c1c;
      font-weight: 900;
      font-size: 8.5px;
      letter-spacing: 1.5px;
      white-space: nowrap;
    }
    @media print {
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page {
        width: 297mm;
        height: 210mm;
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-after: always;
        break-after: page;
        margin: 0;
        border: none;
        overflow: hidden;
      }
    }
  </style>
</head>
<body>

  <!-- ========================================== -->
  <!-- PAGE 1: OUTSIDE BROCHURE (P1, P2, P3)      -->
  <!-- ========================================== -->
  <div class="page">
    
    <!-- PANEL 1: BACK FLAP (Attendance & Charts) -->
    <div class="panel">
      <!-- 1. Monthly Attendance Chart -->
      <div>
        <div class="text-center font-bold text-[10px] bg-slate-100 py-0.5 border border-slate-700 uppercase tracking-wider mb-0.5">
          Monthly Attendance Chart
        </div>
        <table class="w-full border-collapse border border-slate-700 text-center text-[7.5px] mb-1">
          <thead>
            <tr class="bg-slate-50 font-semibold border-b border-slate-700">
              <th class="border-r border-slate-700 p-0.5">Months</th>
              ${months.map(m => `<th class="border-r border-slate-700 p-0.5">${m.substring(0, 3)}</th>`).join('')}
              <th class="border-r border-slate-700 p-0.5">Total</th>
              <th class="p-0.5">Per. %</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-slate-700">
              <td class="border-r border-slate-700 font-semibold p-0.5">W.Days</td>
              ${attendanceMonthly.map(a => `<td class="border-r border-slate-700 p-0.5">${a.wDays || '-'}</td>`).join('')}
              <td class="border-r border-slate-700 font-semibold p-0.5">${totalWDays || '-'}</td>
              <td rowSpan="2" class="font-bold p-0.5 align-middle bg-slate-50">${attendancePercentage}</td>
            </tr>
            <tr>
              <td class="border-r border-slate-700 font-semibold p-0.5">P.Days</td>
              ${attendanceMonthly.map(a => `<td class="border-r border-slate-700 p-0.5">${a.pDays || '-'}</td>`).join('')}
              <td class="border-r border-slate-700 font-semibold p-0.5">${totalPDays || '-'}</td>
            </tr>
          </tbody>
        </table>

        <!-- 2. Scholastic Performance Chart -->
        <div class="text-center font-bold text-[10px] bg-slate-100 py-0.5 border border-slate-700 uppercase tracking-wider mb-0.5">
          Scholastic Performance Chart
        </div>
        <table class="w-full border-collapse border border-slate-700 text-center text-[7.5px] leading-none mb-1">
          <tbody>
            <tr class="border-b border-slate-700 font-semibold bg-slate-50">
              <td class="border-r border-slate-700 p-0.5">Percentage</td>
              <td class="border-r border-slate-700 p-0.5">91% to 100%</td>
              <td class="border-r border-slate-700 p-0.5">81% to 90%</td>
              <td class="border-r border-slate-700 p-0.5">71% to 80%</td>
              <td class="border-r border-slate-700 p-0.5">61% to 70%</td>
              <td class="border-r border-slate-700 p-0.5">51% to 60%</td>
              <td class="border-r border-slate-700 p-0.5">41% to 50%</td>
              <td class="border-r border-slate-700 p-0.5">31% to 40%</td>
              <td class="border-r border-slate-700 p-0.5">21% to 30%</td>
              <td class="p-0.5">20% to less than 20%</td>
            </tr>
            <tr class="border-b border-slate-700 font-bold">
              <td class="border-r border-slate-700 p-0.5">Grade</td>
              <td class="border-r border-slate-700 p-0.5">A - 1</td>
              <td class="border-r border-slate-700 p-0.5">A - 2</td>
              <td class="border-r border-slate-700 p-0.5">B - 1</td>
              <td class="border-r border-slate-700 p-0.5">B - 2</td>
              <td class="border-r border-slate-700 p-0.5">C - 1</td>
              <td class="border-r border-slate-700 p-0.5">C - 2</td>
              <td class="border-r border-slate-700 p-0.5">D</td>
              <td class="border-r border-slate-700 p-0.5">E - 1</td>
              <td class="p-0.5">E - 2</td>
            </tr>
            <tr class="text-[7px]">
              <td class="border-r border-slate-700 font-semibold p-0.5">Performance</td>
              <td class="border-r border-slate-700 p-0.5">Out Standing</td>
              <td class="border-r border-slate-700 p-0.5">Excellent</td>
              <td class="border-r border-slate-700 p-0.5">Very Good</td>
              <td class="border-r border-slate-700 p-0.5">Good</td>
              <td class="border-r border-slate-700 p-0.5">Average</td>
              <td class="border-r border-slate-700 p-0.5">Fair</td>
              <td class="border-r border-slate-700 p-0.5">Marginal</td>
              <td class="border-r border-slate-700 p-0.5">Poor</td>
              <td class="p-0.5">Very Poor</td>
            </tr>
          </tbody>
        </table>

        <!-- 3. Co-Scholastic Performance Chart Scale Point -->
        <div class="text-center font-bold text-[9.5px] bg-slate-100 py-0.5 border border-slate-700 uppercase tracking-wider mb-0.5">
          Co-Scholastic Performance Chart Scale Point
        </div>
        <table class="w-full border-collapse border border-slate-700 text-center text-[7.5px] mb-1">
          <tbody>
            <tr class="border-b border-slate-700 font-bold bg-slate-50">
              <td class="border-r border-slate-700 p-0.5 w-1/5">5</td>
              <td class="border-r border-slate-700 p-0.5 w-1/5">4</td>
              <td class="border-r border-slate-700 p-0.5 w-1/5">3</td>
              <td class="border-r border-slate-700 p-0.5 w-1/5">2</td>
              <td class="p-0.5 w-1/5">1</td>
            </tr>
            <tr>
              <td class="border-r border-slate-700 p-0.5">Excellent</td>
              <td class="border-r border-slate-700 p-0.5">Very Good</td>
              <td class="border-r border-slate-700 p-0.5">Good</td>
              <td class="border-r border-slate-700 p-0.5">Needs Improvement</td>
              <td class="p-0.5">Special Attention Needed</td>
            </tr>
          </tbody>
        </table>

        <!-- 4. Annual Performance -->
        <div class="text-center font-bold text-[10px] bg-slate-100 py-0.5 border border-slate-700 uppercase tracking-wider mb-0.5">
          Annual Performance
        </div>
        <table class="w-full border-collapse border border-slate-700 text-[8px] mb-1">
          <thead>
            <tr class="border-b border-slate-700 font-semibold bg-slate-50">
              <th class="border-r border-slate-700 p-0.5 w-10 text-center">Sr.No.</th>
              <th class="border-r border-slate-700 p-0.5 text-left pl-2">Domain of Performance</th>
              <th class="p-0.5 w-24 text-center">Achievement</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-slate-700">
              <td class="border-r border-slate-700 p-0.5 text-center font-bold">1.</td>
              <td class="border-r border-slate-700 p-0.5 font-semibold pl-2">Scholastic Performance</td>
              <td class="p-0.5 text-center font-bold">${secGeneral.scholasticAchievement || ''}</td>
            </tr>
            <tr>
              <td class="border-r border-slate-700 p-0.5 text-center font-bold">2.</td>
              <td class="border-r border-slate-700 p-0.5 font-semibold pl-2">Co-Scholastic Performance Point</td>
              <td class="p-0.5 text-center font-bold">${secGeneral.coScholasticPoint || ''}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 5. Signatures Grid -->
      <div>
        <div class="border border-slate-700 p-1 text-[8px] mb-1">
          <div class="grid grid-cols-3 gap-1">
            <div>
              <div class="font-bold underline mb-0.5">Class Teacher's Sign.</div>
              <div class="space-y-1">
                <div>1. ${secGeneral.ctSign1 || '...........................'}</div>
                <div>2. ${secGeneral.ctSign2 || '...........................'}</div>
                <div>3. ${secGeneral.ctSign3 || '...........................'}</div>
                ${!is10th ? `<div>4. ${secGeneral.ctSign4 || '...........................'}</div>` : ''}
              </div>
            </div>
            <div>
              <div class="font-bold underline mb-0.5">H.M.'s Sign.& Stamp</div>
              <div class="space-y-1">
                <div>1. ${secGeneral.hmSign1 || ''}</div>
                <div>2. ${secGeneral.hmSign2 || ''}</div>
                <div>3. ${secGeneral.hmSign3 || ''}</div>
                ${!is10th ? `<div>4. ${secGeneral.hmSign4 || ''}</div>` : ''}
              </div>
            </div>
            <div>
              <div class="font-bold underline mb-0.5">Parent's Sign.</div>
              <div class="space-y-1">
                <div>1. ${secGeneral.parentSign1 || '...........................'}</div>
                <div>2. ${secGeneral.parentSign2 || '...........................'}</div>
                <div>3. ${secGeneral.parentSign3 || '...........................'}</div>
                ${!is10th ? `<div>4. ${secGeneral.parentSign4 || '...........................'}</div>` : ''}
              </div>
            </div>
          </div>
        </div>

        <div class="text-[8px] font-medium space-y-0.5 pt-0.5">
          <div>
            School Will Reopen For The Second Term on <span class="font-bold underline">${secGeneral.reopenTerm2 || '_____________________'}</span>
          </div>
          ${!is10th ? `
            <div>
              School Will Reopen For The New Academic Year 2026 -27 on <span class="font-bold underline">${secGeneral.reopenNewYear || '____________'}</span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- PANEL 2: COVER PAGE (Middle) -->
    <div class="panel flex flex-col justify-between text-center relative">
      <div>
        <div class="w-full overflow-hidden rounded-sm border border-slate-700 bg-[#003366] shadow-sm">
          <img 
            src="${bannerBase64}" 
            alt="Mother Teresa English School" 
            style="width: 100%; height: auto; display: block;"
          />
        </div>

        <div class="text-center mt-3">
          <div style="width: 25mm; height: 31mm; border: 2.5px solid #002244; border-radius: 4px; margin: 0 auto; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fafafa; box-shadow: inset 0 2px 4px rgb(0 0 0 / 0.05);">
            ${studentPhotoBase64 ? `<img src="${studentPhotoBase64}" style="width:100%; height:100%; object-fit:cover;" />` : (photoUrl ? `<img src="${photoUrl}" style="width:100%; height:100%; object-fit:cover;" />` : `<div style="font-size: 7.5px; color: #94a3b8; font-weight: bold;">Passport Photo</div>`)}
          </div>
        </div>

        <div class="py-1 text-center">
          <h3 class="text-[11px] font-black tracking-wider text-slate-900 uppercase font-serif leading-tight">
            MY PROGRESS REPORT 2026-27
          </h3>
          <h4 class="text-[10px] font-black text-indigo-950 uppercase tracking-widest leading-tight">
            ${stdCode}
          </h4>
        </div>

        <div class="text-left space-y-1.5 text-[8.5px] px-1 text-slate-800">
          <div class="flex items-baseline">
            <span class="font-bold w-16 shrink-0">Name :</span>
            <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-bold text-slate-950">${stud.name}</span>
          </div>

          <div class="flex justify-between gap-4">
            <div class="flex items-baseline w-1/2">
              <span class="font-bold w-8 shrink-0">Std. :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-semibold text-slate-950">${reportCard.class.name}</span>
            </div>
            <div class="flex items-baseline w-1/2">
              <span class="font-bold w-12 shrink-0">Division :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-semibold text-slate-950">${stud.division}</span>
            </div>
          </div>

          <div class="flex justify-between gap-4">
            <div class="flex items-baseline w-1/2">
              <span class="font-bold w-12 shrink-0">Roll No. :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-semibold text-slate-950">${stud.rollNo}</span>
            </div>
            <div class="flex items-baseline w-1/2">
              <span class="font-bold w-12 shrink-0">UID No. :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-semibold text-slate-950">${stud.uidNo}</span>
            </div>
          </div>

          <div class="flex justify-between gap-4">
            <div class="flex items-baseline w-1/2">
              <span class="font-bold w-12 shrink-0">Reg.No. :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-semibold text-slate-950">${stud.regNo}</span>
            </div>
            <div class="flex items-baseline w-1/2">
              <span class="font-bold w-12 shrink-0">ID No. :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-semibold text-slate-950">${stud.idNo}</span>
            </div>
          </div>

          <div class="flex justify-between gap-2">
            <div class="flex items-baseline w-[64%]">
              <span class="font-bold w-[54px] shrink-0">Father's Name :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-medium truncate">${stud.fatherName}</span>
            </div>
            <div class="flex items-baseline w-[36%]">
              <span class="font-bold w-14 shrink-0">Occupation :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-medium truncate">${stud.fatherOccupation}</span>
            </div>
          </div>

          <div class="flex justify-between gap-2">
            <div class="flex items-baseline w-[64%]">
              <span class="font-bold w-[56px] shrink-0">Mother's Name :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-medium truncate">${stud.motherName}</span>
            </div>
            <div class="flex items-baseline w-[36%]">
              <span class="font-bold w-14 shrink-0">Occupation :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-medium truncate">${stud.motherOccupation}</span>
            </div>
          </div>

          <div class="flex justify-between gap-4">
            <div class="flex items-baseline w-[52%]">
              <span class="font-bold w-[64px] shrink-0">Mother Tongue :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-medium">${stud.motherTongue}</span>
            </div>
            <div class="flex items-baseline w-[48%]">
              <span class="font-bold w-[54px] shrink-0">Date of Birth :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-semibold text-slate-950">${stud.dob}</span>
            </div>
          </div>

          <div class="flex justify-between gap-2">
            <div class="flex items-baseline w-[44%]">
              <span class="font-bold w-9 shrink-0">Mobile :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-semibold text-slate-950">${stud.mobile}</span>
            </div>
            <div class="flex items-baseline w-[28%]">
              <span class="font-bold w-9 shrink-0">Weight :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-medium">${stud.weight}</span>
            </div>
            <div class="flex items-baseline w-[28%]">
              <span class="font-bold w-9 shrink-0">Height :</span>
              <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-medium">${stud.height}</span>
            </div>
          </div>

          <div class="flex items-baseline">
            <span class="font-bold w-12 shrink-0">Address :</span>
            <span class="flex-1 border-b border-dotted border-slate-600 pb-0.5 truncate">${stud.address}</span>
          </div>
        </div>
      </div>

      <div class="text-center font-serif italic text-[9.5px] text-pink-700 font-semibold pt-1 border-t border-slate-200">
        Growth & Progress Everyday...... in Every Way.
      </div>
    </div>

    <!-- PANEL 3: ACADEMIC MARKS (Right) -->
    <div class="panel">
      <!-- Vertical text if not 10th -->
      ${!is10th ? `
        <div class="vertical-text">
          ${stdCode} PROGRESS REPORT ${academicYear}
        </div>
      ` : ''}

      <div class="${!is10th ? 'ml-4' : ''} flex-1 flex flex-col justify-between">
        <!-- Horizontal title for 10th only -->
        ${is10th ? `
          <div class="text-center font-black text-[10.5px] text-red-700 uppercase tracking-wide border-b border-slate-700 pb-0.5 mb-1">
            STD.X PROGRESS REPORT 2026 - 27
          </div>
        ` : ''}

        ${is10th ? `
          <!-- 10th Table -->
          <table class="w-full border-collapse border border-slate-700 text-[8.5px] text-center">
            <thead>
              <tr class="border-b border-slate-700 bg-slate-50 font-bold">
                <th rowSpan="2" class="border-r border-slate-700 p-0.5 text-left pl-1">Subject</th>
                <th colSpan="3" class="border-r border-slate-700 p-0.5">First Test</th>
                <th colSpan="3" class="border-r border-slate-700 p-0.5">Second Test</th>
                <th colSpan="3" class="p-0.5">First Prelim</th>
              </tr>
              <tr class="border-b border-slate-700 text-[7.5px] font-semibold">
                <th class="border-r border-slate-700 p-0.5">Written</th>
                <th class="border-r border-slate-700 p-0.5">Pra./Oral</th>
                <th class="border-r border-slate-700 p-0.5 font-bold">Total</th>
                <th class="border-r border-slate-700 p-0.5">Written</th>
                <th class="border-r border-slate-700 p-0.5">Pra./Oral</th>
                <th class="border-r border-slate-700 p-0.5 font-bold">Total</th>
                <th class="border-r border-slate-700 p-0.5">Written</th>
                <th class="border-r border-slate-700 p-0.5">Pra./Oral</th>
                <th class="p-0.5 font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-slate-700 bg-slate-50 text-[7.5px] font-semibold text-slate-600">
                <td class="border-r border-slate-700 p-0.5 text-left pl-1">Max Marks</td>
                <td class="border-r border-slate-700 p-0.5">80</td>
                <td class="border-r border-slate-700 p-0.5">20</td>
                <td class="border-r border-slate-700 p-0.5 font-bold">100</td>
                <td class="border-r border-slate-700 p-0.5">80</td>
                <td class="border-r border-slate-700 p-0.5">20</td>
                <td class="border-r border-slate-700 p-0.5 font-bold">100</td>
                <td class="border-r border-slate-700 p-0.5">80</td>
                <td class="border-r border-slate-700 p-0.5">20</td>
                <td class="p-0.5 font-bold">100</td>
              </tr>
              ${marksRows10th}
              <tr class="border-b border-slate-700 bg-slate-100 font-bold">
                <td colSpan="10" class="p-0.5 text-left pl-1 text-[8px] uppercase">Grade Subjects</td>
              </tr>
              ${gradeRows10th}
              <tr class="border-b border-slate-700 font-bold bg-slate-50">
                <td class="border-r border-slate-700 p-0.5 text-left pl-1">Total (480/120/600)</td>
                <td class="border-r border-slate-700 p-0.5">${get10thColTotal('t1', 'w')}</td>
                <td class="border-r border-slate-700 p-0.5">${get10thColTotal('t1', 'o')}</td>
                <td class="border-r border-slate-700 p-0.5 bg-slate-100">${get10thColTotal('t1', 't')}</td>
                <td class="border-r border-slate-700 p-0.5">${get10thColTotal('t2', 'w')}</td>
                <td class="border-r border-slate-700 p-0.5">${get10thColTotal('t2', 'o')}</td>
                <td class="border-r border-slate-700 p-0.5 bg-slate-100">${get10thColTotal('t2', 't')}</td>
                <td class="border-r border-slate-700 p-0.5">${get10thColTotal('p1', 'w')}</td>
                <td class="border-r border-slate-700 p-0.5">${get10thColTotal('p1', 'o')}</td>
                <td class="p-0.5 bg-slate-100">${get10thColTotal('p1', 't')}</td>
              </tr>
              <tr class="border-b border-slate-700 font-semibold">
                <td class="border-r border-slate-700 p-0.5 text-left pl-1">Pass/Fail</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold text-emerald-700">${secMarks['t1_status'] || 'Pass'}</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold text-emerald-700">${secMarks['t2_status'] || 'Pass'}</td>
                <td colSpan="3" class="p-0.5 font-bold text-emerald-700">${secMarks['p1_status'] || 'Pass'}</td>
              </tr>
              <tr class="border-b border-slate-700 font-semibold">
                <td class="border-r border-slate-700 p-0.5 text-left pl-1">Percentage</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">
                  ${secMarks['t1_pct'] || (get10thColTotal('t1', 't') ? ((Number(get10thColTotal('t1', 't')) / 600) * 100).toFixed(1) + '%' : '')}
                </td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">
                  ${secMarks['t2_pct'] || (get10thColTotal('t2', 't') ? ((Number(get10thColTotal('t2', 't')) / 600) * 100).toFixed(1) + '%' : '')}
                </td>
                <td colSpan="3" class="p-0.5 font-bold">
                  ${secMarks['p1_pct'] || (get10thColTotal('p1', 't') ? ((Number(get10thColTotal('p1', 't')) / 600) * 100).toFixed(1) + '%' : '')}
                </td>
              </tr>
              <tr class="font-semibold">
                <td class="border-r border-slate-700 p-0.5 text-left pl-1">Rank</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${secMarks['t1_rank'] || '-'}</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${secMarks['t2_rank'] || '-'}</td>
                <td colSpan="3" class="p-0.5 font-bold">${secMarks['p1_rank'] || '-'}</td>
              </tr>
            </tbody>
          </table>
        ` : `
          <!-- 8th & 9th Table -->
          <table class="w-full border-collapse border border-slate-700 text-[7px] text-center">
            <thead>
              <tr class="border-b border-slate-700 bg-slate-50 font-bold text-[6.5px]">
                <th rowSpan="2" class="border-r border-slate-700 p-0.5 text-left pl-1">Subject</th>
                <th colSpan="3" class="border-r border-slate-700 p-0.5">First Unit Test (A1)</th>
                <th colSpan="3" class="border-r border-slate-700 p-0.5">First Term(A2)</th>
                <th colSpan="3" class="border-r border-slate-700 p-0.5">Second Unit Test (B1)</th>
                <th colSpan="3" class="border-r border-slate-700 p-0.5">Second Term (B2)</th>
                <th class="border-r border-slate-700 p-0.5">Total A1+A2</th>
                <th class="border-r border-slate-700 p-0.5">B1+B2</th>
                <th class="p-0.5 font-bold">Total / Avg</th>
              </tr>
              <tr class="border-b border-slate-700 text-[5.5px]">
                <th class="border-r border-slate-700 p-0.5">W</th>
                <th class="border-r border-slate-700 p-0.5">O</th>
                <th class="border-r border-slate-700 p-0.5 font-bold">Tot</th>
                <th class="border-r border-slate-700 p-0.5">W</th>
                <th class="border-r border-slate-700 p-0.5">O</th>
                <th class="border-r border-slate-700 p-0.5 font-bold">Tot</th>
                <th class="border-r border-slate-700 p-0.5">W</th>
                <th class="border-r border-slate-700 p-0.5">O</th>
                <th class="border-r border-slate-700 p-0.5 font-bold">Tot</th>
                <th class="border-r border-slate-700 p-0.5">W</th>
                <th class="border-r border-slate-700 p-0.5">O</th>
                <th class="border-r border-slate-700 p-0.5 font-bold">Tot</th>
                <th class="border-r border-slate-700 p-0.5">300</th>
                <th class="border-r border-slate-700 p-0.5">300</th>
                <th class="p-0.5">1800</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-slate-700 bg-slate-50 text-[5.5px] text-slate-600 font-semibold">
                <td class="border-r border-slate-700 p-0.5 text-left pl-1">Max Marks</td>
                <td class="border-r border-slate-700 p-0.5">40</td>
                <td class="border-r border-slate-700 p-0.5">10</td>
                <td class="border-r border-slate-700 p-0.5 font-bold">50</td>
                <td class="border-r border-slate-700 p-0.5">80</td>
                <td class="border-r border-slate-700 p-0.5">20</td>
                <td class="border-r border-slate-700 p-0.5 font-bold">100</td>
                <td class="border-r border-slate-700 p-0.5">40</td>
                <td class="border-r border-slate-700 p-0.5">10</td>
                <td class="border-r border-slate-700 p-0.5 font-bold">50</td>
                <td class="border-r border-slate-700 p-0.5">80</td>
                <td class="border-r border-slate-700 p-0.5">20</td>
                <td class="border-r border-slate-700 p-0.5 font-bold">100</td>
                <td class="border-r border-slate-700 p-0.5 font-bold">300</td>
                <td class="border-r border-slate-700 p-0.5 font-bold">300</td>
                <td class="p-0.5 font-bold">1800</td>
              </tr>
              ${marksRows89}
              <tr class="border-b border-slate-700 bg-slate-100 font-bold">
                <td colSpan="16" class="p-0.5 text-left pl-1 text-[6.5px] uppercase">Grade Subjects</td>
              </tr>
              ${gradeRows89}
              <tr class="border-b border-slate-700 font-bold bg-slate-50 text-[6.5px]">
                <td class="border-r border-slate-700 p-0.5 text-left pl-1">Total</td>
                <td class="border-r border-slate-700 p-0.5">${totals89.t1_w}</td>
                <td class="border-r border-slate-700 p-0.5">${totals89.t1_o}</td>
                <td class="border-r border-slate-700 p-0.5 bg-slate-100">${totals89.t1_t}</td>
                <td class="border-r border-slate-700 p-0.5">${totals89.a2_w}</td>
                <td class="border-r border-slate-700 p-0.5">${totals89.a2_o}</td>
                <td class="border-r border-slate-700 p-0.5 bg-slate-100">${totals89.a2_t}</td>
                <td class="border-r border-slate-700 p-0.5">${totals89.t2_w}</td>
                <td class="border-r border-slate-700 p-0.5">${totals89.t2_o}</td>
                <td class="border-r border-slate-700 p-0.5 bg-slate-100">${totals89.t2_t}</td>
                <td class="border-r border-slate-700 p-0.5">${totals89.b2_w}</td>
                <td class="border-r border-slate-700 p-0.5">${totals89.b2_o}</td>
                <td class="border-r border-slate-700 p-0.5 bg-slate-100">${totals89.b2_t}</td>
                <td class="border-r border-slate-700 p-0.5 bg-slate-100">${totals89.sumA1A2}</td>
                <td class="border-r border-slate-700 p-0.5 bg-slate-100">${totals89.sumB1B2}</td>
                <td class="p-0.5 bg-slate-200">${totals89.grandTotal}</td>
              </tr>
              <tr class="border-b border-slate-700 font-semibold">
                <td class="border-r border-slate-700 p-0.5 text-left pl-1">Pass/Fail</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold text-emerald-700">${secMarks['t1_status'] || 'Pass'}</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold text-emerald-700">${secMarks['a2_status'] || 'Pass'}</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold text-emerald-700">${secMarks['t2_status'] || 'Pass'}</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold text-emerald-700">${secMarks['b2_status'] || 'Pass'}</td>
                <td class="border-r border-slate-700 p-0.5 font-bold text-emerald-700">${secMarks['totA_status'] || 'Pass'}</td>
                <td class="border-r border-slate-700 p-0.5 font-bold text-emerald-700">${secMarks['totB_status'] || 'Pass'}</td>
                <td class="p-0.5 font-bold text-emerald-700">${secMarks['grand_status'] || 'Pass'}</td>
              </tr>
              <tr class="border-b border-slate-700 font-semibold">
                <td class="border-r border-slate-700 p-0.5 text-left pl-1">Percentage</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${secMarks['t1_pct'] || ''}</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${secMarks['a2_pct'] || ''}</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${secMarks['t2_pct'] || ''}</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${secMarks['b2_pct'] || ''}</td>
                <td class="border-r border-slate-700 p-0.5 font-bold">${secMarks['totA_pct'] || ''}</td>
                <td class="border-r border-slate-700 p-0.5 font-bold">${secMarks['totB_pct'] || ''}</td>
                <td class="p-0.5 font-bold bg-slate-100">${totals89.percentage || secMarks['grand_pct'] || ''}</td>
              </tr>
              <tr class="font-semibold">
                <td class="border-r border-slate-700 p-0.5 text-left pl-1">Rank</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${secMarks['t1_rank'] || '-'}</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${secMarks['a2_rank'] || '-'}</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${secMarks['t2_rank'] || '-'}</td>
                <td colSpan="3" class="border-r border-slate-700 p-0.5 font-bold">${secMarks['b2_rank'] || '-'}</td>
                <td class="border-r border-slate-700 p-0.5 font-bold">${secMarks['totA_rank'] || '-'}</td>
                <td class="border-r border-slate-700 p-0.5 font-bold">${secMarks['totB_rank'] || '-'}</td>
                <td class="p-0.5 font-bold">${secMarks['grand_rank'] || '-'}</td>
              </tr>
            </tbody>
          </table>
        `}
      </div>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- PAGE 2: INSIDE BROCHURE (P4, P5, P6)       -->
  <!-- ========================================== -->
  <div class="page">
    
    <!-- PANEL 4: DESCRIPTIVE REMARKS (Left) -->
    <div class="panel">
      <div class="flex-grow flex flex-col justify-between h-full space-y-2">
        <!-- Test 1 / Second Test Box -->
        <div class="border border-slate-700 rounded-sm overflow-hidden flex-grow flex flex-col h-[94px]">
          <div class="grid grid-cols-12 border-b border-slate-700 bg-slate-50 text-[7.5px] font-bold text-center">
            <div class="col-span-2 border-r border-slate-700 p-1 flex items-center justify-center bg-slate-100">
              ${is10th ? 'Second Test' : 'First Test'}
            </div>
            <div class="col-span-5 border-r border-slate-700 p-1 text-slate-800">
              Special Progress Made
            </div>
            <div class="col-span-5 p-1 text-slate-800">
              Improvement Needed
            </div>
          </div>

          <div class="grid grid-cols-12 flex-grow text-[7px] h-full">
            <div class="col-span-2 border-r border-slate-700 bg-slate-50 flex items-center justify-center font-bold text-slate-700 text-center p-0.5">
              ${is10th ? 'Test II' : 'Test I'}
            </div>
            <div class="col-span-5 border-r border-slate-700 p-1 space-y-1">
              <div class="min-h-[30px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                ${secDesc.test1_prog1 || '1. Strong conceptual clarity & analytical thinking.'}
              </div>
              <div class="min-h-[30px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                ${secDesc.test1_prog2 || '2. Consistent effort in completing tasks.'}
              </div>
            </div>
            <div class="col-span-5 p-1 space-y-1">
              <div class="min-h-[30px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                ${secDesc.test1_imp1 || '1. Needs regular practice in mathematical calculations.'}
              </div>
              <div class="min-h-[30px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                ${secDesc.test1_imp2 || '2. Focus on exam time management.'}
              </div>
            </div>
          </div>
        </div>

        <!-- Test 2 / Prelim Box -->
        <div class="border border-slate-700 rounded-sm overflow-hidden flex-grow flex flex-col h-[94px] mt-2">
          <div class="grid grid-cols-12 border-b border-slate-700 bg-slate-50 text-[7.5px] font-bold text-center">
            <div class="col-span-2 border-r border-slate-700 p-1 flex items-center justify-center bg-slate-100">
              ${is10th ? 'Prelim' : 'Second Test'}
            </div>
            <div class="col-span-5 border-r border-slate-700 p-1 text-slate-800">
              Special Progress Made
            </div>
            <div class="col-span-5 p-1 text-slate-800">
              Improvement Needed
            </div>
          </div>

          <div class="grid grid-cols-12 flex-grow text-[7px] h-full">
            <div class="col-span-2 border-r border-slate-700 bg-slate-50 flex items-center justify-center font-bold text-slate-700 text-center p-0.5">
              ${is10th ? 'Prelim' : 'Test II'}
            </div>
            <div class="col-span-5 border-r border-slate-700 p-1 space-y-1">
              <div class="min-h-[30px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                ${secDesc.test2_prog1 || '1. Active participation in discussions.'}
              </div>
              <div class="min-h-[30px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                ${secDesc.test2_prog2 || '2. Shows good improvement.'}
              </div>
            </div>
            <div class="col-span-5 p-1 space-y-1">
              <div class="min-h-[30px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                ${secDesc.test2_imp1 || '1. Regular revision of diagrams.'}
              </div>
              <div class="min-h-[30px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                ${secDesc.test2_imp2 || '2. Daily reading habit.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center font-semibold text-[6.5px] text-slate-700 pt-0.5">
        Descriptive Assessment of Scholastic Areas to be assessed twice in a year. (Test I & II)
      </div>
    </div>

    <!-- PANEL 5: COMPETENCIES (Middle) -->
    <div class="panel">
      <div>
        <div class="text-center mb-1">
          <span class="bg-[#003366] text-white px-6 py-0.5 rounded-full font-bold text-[9px] tracking-wide shadow-sm inline-block">
            Co-scholastic performance
          </span>
        </div>

        <div class="text-center font-bold text-[8.5px] text-red-700 uppercase tracking-wide mb-1">
          COMPETANCY – BASED PROGRESS CARD 2026-27 (STD : VIII TO X)
        </div>

        <div>
          ${renderCompetenciesCard(COMPETENCY_DOMAINS_LOCAL.slice(0, 3))}
        </div>
      </div>
      <div class="border-t border-slate-700 pt-1 text-center font-black text-[7.5px] text-pink-800 tracking-wide flex justify-around uppercase">
        <span>5. EXCELLENT</span>
        <span>4. GOOD</span>
        <span>3. SATISFACTORY</span>
        <span>2. IMPROVING</span>
        <span>1. NEEDS SUPPORT</span>
      </div>
    </div>

    <!-- PANEL 6: COMPETENCIES (Right) -->
    <div class="panel">
      <div>
        <div class="text-center mb-1">
          <span class="bg-[#003366] text-white px-6 py-0.5 rounded-full font-bold text-[9px] tracking-wide shadow-sm inline-block">
            Co-scholastic performance
          </span>
        </div>

        <div class="text-center font-bold text-[8.5px] text-red-700 uppercase tracking-wide mb-1">
          COMPETANCY – BASED PROGRESS CARD 2026-27 (STD : VIII TO X)
        </div>

        <div>
          ${renderCompetenciesCard(COMPETENCY_DOMAINS_LOCAL.slice(3, 6))}
        </div>
      </div>
      <div class="border-t border-slate-700 pt-1 text-center font-black text-[7.5px] text-pink-800 tracking-wide flex justify-around uppercase">
        <span>5. EXCELLENT</span>
        <span>4. GOOD</span>
        <span>3. SATISFACTORY</span>
        <span>2. IMPROVING</span>
        <span>1. NEEDS SUPPORT</span>
      </div>
    </div>

  </div>

</body>
</html>`;

      const pdfBuffer = await renderPdf(
        html,
        {
          width: '16.5in',
          height: '8.5in',
          printBackground: true,
          margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        },
        (page) => page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 2 })
      );

      const filename = `${reportCard.student.name.replace(/\s+/g, '_')}_Std${reportCard.class.name}_ReportCard_${academicYear}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
      return;
    }
    const latestExam = await prisma.exam.findFirst({
      where: { classId: reportCard.classId, academicYearId: reportCard.academicYearId },
      orderBy: { createdAt: 'desc' },
    });

    let marks: any[] = [];
    if (latestExam) {
      marks = await prisma.mark.findMany({
        where: {
          studentId: reportCard.studentId,
          examId: latestExam.id,
        },
        include: { subject: true },
        orderBy: { subject: { displayOrder: 'asc' } },
      });
    }

    // Fetch attendance
    const ay = reportCard.academicYear;
    const holidays = await prisma.holiday.findMany({ where: { academicYearId: ay.id } });
    const workingDays = computeWorkingDays(ay.startDate, ay.endDate, holidays.map(h => h.date));
    const presentCount = await prisma.attendance.count({
      where: { studentId: reportCard.studentId, academicYearId: ay.id, status: 'PRESENT' },
    });
    const attendancePct = computeAttendancePercentage(presentCount, workingDays);

    // Build marks table HTML
    const totalObtained = marks.reduce((s, m) => s + (m.marksObtained || 0), 0);
    const totalMax = marks.reduce((s, m) => s + m.subject.maxMarks, 0);
    const overallPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const overallGrade = computeGrade(overallPct, rules);

    const isKG = reportCard.class.reportCardTemplate === 'KG';

    const getSection = (key: string) => {
      const sec = reportCard.sections.find((s: any) => s.sectionKey === key);
      return {
        progress: sec?.progressShown ? sec.progressShown.split('\n').filter(Boolean) : [],
        challenges: sec?.challengesFaced ? sec.challengesFaced.split('\n').filter(Boolean) : [],
      };
    };

    const sectionRows = (data: { progress: string[]; challenges: string[] }) => {
      let rows = '';
      for (let i = 0; i < 3; i++) {
        rows += `
          <tr>
            <td style="padding:4px 6px; border-bottom:1px solid #c8a96a; border-right:1px solid #c8a96a; font-size:10px;">
              ${i + 1}) ${data.progress[i] || ''}
            </td>
            <td style="padding:4px 6px; border-bottom:1px solid #c8a96a; font-size:10px;">
              ${i + 1}) ${data.challenges[i] || ''}
            </td>
          </tr>`;
      }
      return rows;
    };

    const marksRows = marks.map(m => {
      const subPct = m.marksObtained !== null ? (m.marksObtained / m.subject.maxMarks) * 100 : 0;
      const subGrade = m.isAbsent ? 'AB' : computeGrade(subPct, rules);
      return `
        <tr>
          <td style="padding:3px 6px; border-bottom:1px solid #c8a96a; font-size:10px;">${m.subject.name}</td>
          <td style="padding:3px 6px; border-bottom:1px solid #c8a96a; text-align:center; font-size:10px;">${m.subject.maxMarks}</td>
          <td style="padding:3px 6px; border-bottom:1px solid #c8a96a; text-align:center; font-size:10px;">${m.isAbsent ? 'AB' : (m.marksObtained ?? '')}</td>
          <td style="padding:3px 6px; border-bottom:1px solid #c8a96a; text-align:center; font-size:10px;">${subGrade}</td>
        </tr>`;
    }).join('');

    const kgSections = isKG ? `
      <!-- Section A -->
      <div style="margin-bottom:8px;">
        <div style="background:#5a0020; color:white; padding:3px 8px; font-size:10px; font-weight:bold;">
          A. Physical &amp; Motor Development | शारीरीक आणि मोटर विकास
        </div>
        <table style="width:100%; border-collapse:collapse; border:1px solid #c8a96a;">
          <thead>
            <tr style="background:#f5e6c8;">
              <th style="padding:4px 6px; font-size:9px; border-bottom:1px solid #c8a96a; border-right:1px solid #c8a96a; width:50%;">Progress Shown During the Academic Year</th>
              <th style="padding:4px 6px; font-size:9px; border-bottom:1px solid #c8a96a; width:50%;">Challenges to be Faced During the Next Academic Year</th>
            </tr>
          </thead>
          <tbody>${sectionRows(getSection('A'))}</tbody>
        </table>
      </div>
      <!-- Section B -->
      <div style="margin-bottom:8px;">
        <div style="background:#5a0020; color:white; padding:3px 8px; font-size:10px; font-weight:bold;">
          B. Social Emotional Development | सामाजिक – भावनीक विकास
        </div>
        <table style="width:100%; border-collapse:collapse; border:1px solid #c8a96a;">
          <thead>
            <tr style="background:#f5e6c8;">
              <th style="padding:4px 6px; font-size:9px; border-bottom:1px solid #c8a96a; border-right:1px solid #c8a96a; width:50%;">Progress Shown During the Academic Year</th>
              <th style="padding:4px 6px; font-size:9px; border-bottom:1px solid #c8a96a; width:50%;">Challenges to be Faced During the Next Academic Year</th>
            </tr>
          </thead>
          <tbody>${sectionRows(getSection('B'))}</tbody>
        </table>
      </div>
      <!-- Section C -->
      <div style="margin-bottom:8px;">
        <div style="background:#5a0020; color:white; padding:3px 8px; font-size:10px; font-weight:bold;">
          C. Cognitive Development | संज्ञानात्मक विकास
        </div>
        <table style="width:100%; border-collapse:collapse; border:1px solid #c8a96a;">
          <thead>
            <tr style="background:#f5e6c8;">
              <th style="padding:4px 6px; font-size:9px; border-bottom:1px solid #c8a96a; border-right:1px solid #c8a96a; width:50%;">Progress Shown During the Academic Year</th>
              <th style="padding:4px 6px; font-size:9px; border-bottom:1px solid #c8a96a; width:50%;">Challenges to be Faced During the Next Academic Year</th>
            </tr>
          </thead>
          <tbody>${sectionRows(getSection('C'))}</tbody>
        </table>
      </div>
      <!-- Section D -->
      <div style="margin-bottom:8px;">
        <div style="background:#5a0020; color:white; padding:3px 8px; font-size:10px; font-weight:bold;">
          D. Language &amp; Literacy Development | भाषा आणि साक्षरता विकास
        </div>
        <table style="width:100%; border-collapse:collapse; border:1px solid #c8a96a;">
          <thead>
            <tr style="background:#f5e6c8;">
              <th style="padding:4px 6px; font-size:9px; border-bottom:1px solid #c8a96a; border-right:1px solid #c8a96a; width:50%;">Progress Shown During the Academic Year</th>
              <th style="padding:4px 6px; font-size:9px; border-bottom:1px solid #c8a96a; width:50%;">Challenges to be Faced During the Next Academic Year</th>
            </tr>
          </thead>
          <tbody>${sectionRows(getSection('D'))}</tbody>
        </table>
      </div>
      <!-- Section E -->
      <div style="margin-bottom:8px;">
        <div style="background:#5a0020; color:white; padding:3px 8px; font-size:10px; font-weight:bold;">
          E. Creative &amp; Aesthetic Development | सर्जनशील आणि कलात्मक विकास
        </div>
        <table style="width:100%; border-collapse:collapse; border:1px solid #c8a96a;">
          <thead>
            <tr style="background:#f5e6c8;">
              <th style="padding:4px 6px; font-size:9px; border-bottom:1px solid #c8a96a; border-right:1px solid #c8a96a; width:50%;">Progress Shown During the Academic Year</th>
              <th style="padding:4px 6px; font-size:9px; border-bottom:1px solid #c8a96a; width:50%;">Challenges to be Faced During the Next Academic Year</th>
            </tr>
          </thead>
          <tbody>${sectionRows(getSection('E'))}</tbody>
        </table>
      </div>
    ` : '';

    const primaryTeacherRemark = isKG ? '' : `
      <div style="margin-bottom:8px;">
        <div style="background:#1e3a5f; color:white; padding:3px 8px; font-size:10px; font-weight:bold;">Teacher's Remarks</div>
        <div style="border:1px solid #93c5fd; padding:6px 8px; min-height:40px; font-size:10px;">
          ${reportCard.assessment?.additionalSupportNeeded || ''}
        </div>
      </div>`;

    const assessmentSection = isKG ? `
      <!-- Section G -->
      <div style="margin-bottom:8px;">
        <div style="background:#5a0020; color:white; padding:3px 8px; font-size:10px; font-weight:bold;">G. Assessment &amp; Progress Details</div>
        <table style="width:100%; border-collapse:collapse; border:1px solid #c8a96a;">
          <tr>
            <td style="padding:4px 6px; font-size:10px; border-bottom:1px solid #c8a96a; width:50%;">
              Shows all-round development? <strong>${reportCard.assessment?.allRoundDevelopment?.replace(/_/g, ' ') || ''}</strong>
            </td>
            <td style="padding:4px 6px; font-size:10px; border-bottom:1px solid #c8a96a; width:50%;">
              Strength Identified: ${reportCard.assessment?.strengthIdentified || ''}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding:4px 6px; font-size:10px;">
              Additional Support Needed: ${reportCard.assessment?.additionalSupportNeeded || ''}
            </td>
          </tr>
        </table>
      </div>
      <!-- Section H — Parent Feedback -->
      <div style="margin-bottom:8px;">
        <div style="background:#5a0020; color:white; padding:3px 8px; font-size:10px; font-weight:bold;">H. Parent's Feedback</div>
        <div style="border:1px solid #c8a96a; min-height:50px; padding:6px 8px; font-size:10px;">&nbsp;</div>
      </div>
    ` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; }
    @page { size: A4; margin: 10mm; }
    .page { width: 190mm; min-height: 277mm; border: 6px solid #b45309; padding: 8px; }
    table { border-collapse: collapse; }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div style="background:linear-gradient(to right, #5a0020, #7a003a); color:white; text-align:center; padding:10px 8px; margin-bottom:8px;">
    <div style="font-size:9px; letter-spacing:2px;">HUMAN RESOURCE DEVELOPMENT CENTER'S</div>
    <div style="font-size:14px; font-weight:bold; letter-spacing:1px;">BHARAT RATNA</div>
    <div style="font-size:13px; font-weight:bold;">MOTHER TERESA FOUNDATION SCHOOL</div>
    <div style="font-size:10px;">${settings?.address || 'Gangapur Dist. Chha. Sambhajinagar - 431109'}</div>
    <div style="font-size:12px; font-weight:bold; margin-top:4px;">PROGRESS REPORT CARD — ${ay.name}</div>
  </div>

  <!-- Student Info -->
  <table style="width:100%; border:1px solid #c8a96a; margin-bottom:8px;">
    <tr>
      <td style="padding:4px 8px; font-size:10px; width:25%; border-right:1px solid #c8a96a;">
        <strong>Name:</strong><br/>${reportCard.student.name}
      </td>
      <td style="padding:4px 8px; font-size:10px; width:20%; border-right:1px solid #c8a96a;">
        <strong>Class:</strong> ${reportCard.class.name}<br/>
        <strong>Division:</strong> ${reportCard.division.name}
      </td>
      <td style="padding:4px 8px; font-size:10px; width:20%; border-right:1px solid #c8a96a;">
        <strong>Roll No:</strong> ${reportCard.student.rollNo || ''}<br/>
        <strong>Admission No:</strong> ${reportCard.student.admissionNo}
      </td>
      <td style="padding:4px 8px; font-size:10px; width:20%; border-right:1px solid #c8a96a;">
        <strong>Academic Year:</strong><br/>${ay.name}
      </td>
      <td style="padding:4px 8px; font-size:10px; width:15%; text-align:center;">
        ${reportCard.student.photo ? `
          <img src="${reportCard.student.photo}" style="width:60px; height:70px; object-fit:cover; border:1px solid #c8a96a; display:block; margin:auto;" />
        ` : `
          <div style="border:1px dashed #999; width:60px; height:70px; margin:auto; display:flex; align-items:center; justify-content:center; font-size:8px; color:#999;">Photo</div>
        `}
      </td>
    </tr>
  </table>

  ${kgSections}
  ${primaryTeacherRemark}

  <!-- Section F / Marks Table -->
  <div style="margin-bottom:8px;">
    <div style="background:${isKG ? '#5a0020' : '#1e3a5f'}; color:white; padding:3px 8px; font-size:10px; font-weight:bold;">
      ${isKG ? 'F. ' : ''}Subject-wise Marks
    </div>
    <table style="width:100%; border-collapse:collapse; border:1px solid ${isKG ? '#c8a96a' : '#93c5fd'};">
      <thead>
        <tr style="background:${isKG ? '#f5e6c8' : '#dbeafe'};">
          <th style="padding:4px 6px; text-align:left; font-size:10px; border-bottom:1px solid #ddd; border-right:1px solid #ddd; width:40%;">Subject</th>
          <th style="padding:4px 6px; text-align:center; font-size:10px; border-bottom:1px solid #ddd; border-right:1px solid #ddd; width:20%;">Max Marks</th>
          <th style="padding:4px 6px; text-align:center; font-size:10px; border-bottom:1px solid #ddd; border-right:1px solid #ddd; width:20%;">Marks Obtained</th>
          <th style="padding:4px 6px; text-align:center; font-size:10px; border-bottom:1px solid #ddd; width:20%;">Grade</th>
        </tr>
      </thead>
      <tbody>
        ${marksRows}
        <tr style="background:#f0f0f0; font-weight:bold;">
          <td style="padding:4px 6px; font-size:10px; border-top:2px solid #999;">Total</td>
          <td style="padding:4px 6px; text-align:center; font-size:10px; border-top:2px solid #999;">${totalMax}</td>
          <td style="padding:4px 6px; text-align:center; font-size:10px; border-top:2px solid #999;">${totalObtained}</td>
          <td style="padding:4px 6px; text-align:center; font-size:10px; border-top:2px solid #999;">${overallGrade}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Attendance Block -->
  <div style="margin-bottom:8px;">
    <div style="background:${isKG ? '#5a0020' : '#1e3a5f'}; color:white; padding:3px 8px; font-size:10px; font-weight:bold;">Attendance</div>
    <table style="width:100%; border-collapse:collapse; border:1px solid ${isKG ? '#c8a96a' : '#93c5fd'};">
      <tr style="background:${isKG ? '#f5e6c8' : '#dbeafe'};">
        <th style="padding:4px 6px; font-size:10px; border-right:1px solid #ddd;">Date Range</th>
        <th style="padding:4px 6px; font-size:10px; border-right:1px solid #ddd;">Working Days</th>
        <th style="padding:4px 6px; font-size:10px; border-right:1px solid #ddd;">Present Days</th>
        <th style="padding:4px 6px; font-size:10px; border-right:1px solid #ddd;">Attendance %</th>
        <th style="padding:4px 6px; font-size:10px;">Cumulative Grade</th>
      </tr>
      <tr>
        <td style="padding:4px 6px; font-size:10px; border-right:1px solid #ddd;">
          ${new Date(ay.startDate).toLocaleDateString('en-IN')} – ${new Date(ay.endDate).toLocaleDateString('en-IN')}
        </td>
        <td style="padding:4px 6px; text-align:center; font-size:10px; border-right:1px solid #ddd;">${workingDays}</td>
        <td style="padding:4px 6px; text-align:center; font-size:10px; border-right:1px solid #ddd;">${presentCount}</td>
        <td style="padding:4px 6px; text-align:center; font-size:10px; border-right:1px solid #ddd;">${attendancePct.toFixed(1)}%</td>
        <td style="padding:4px 6px; text-align:center; font-size:10px;">${overallGrade}</td>
      </tr>
    </table>
  </div>

  ${assessmentSection}

  <!-- Signature Lines -->
  <table style="width:100%; margin-top:16px;">
    <tr>
      <td style="padding:4px 6px; text-align:center; font-size:10px; width:33%;">
        <div style="border-top:1px solid #333; margin-top:30px; padding-top:4px;">Class Teacher's Signature</div>
      </td>
      <td style="padding:4px 6px; text-align:center; font-size:10px; width:34%;">
        <div style="border-top:1px solid #333; margin-top:30px; padding-top:4px;">H.M.'s Signature</div>
      </td>
      <td style="padding:4px 6px; text-align:center; font-size:10px; width:33%;">
        <div style="border-top:1px solid #333; margin-top:30px; padding-top:4px;">Parent's Signature</div>
      </td>
    </tr>
  </table>
</div>
</body>
</html>`;

    const pdfBuffer = await renderPdf(html, {
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    const filename = `${reportCard.student.name.replace(/\s+/g, '_')}_${reportCard.class.name}${reportCard.division.name}_ReportCard_${ay.name}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
});

export default router;
