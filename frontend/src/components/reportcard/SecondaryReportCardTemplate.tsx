import React from 'react';
import { COMPETENCY_DOMAINS } from '@/utils/remarks';
import schoolHeaderBanner from '@/assets/school_header_banner.png';
import motherTeresaPhoto from '@/assets/mother_teresa_photo.png';

export interface SecondaryReportCardTemplateProps {
  reportCard?: any;
  student?: any;
  classNameDetails?: any;
  divisionDetails?: any;
  academicYearDetails?: any;
  marksData?: any[];
  attendanceData?: any;
  schoolSettings?: any;
  customDetails?: any;
}

export const SecondaryReportCardTemplate: React.FC<SecondaryReportCardTemplateProps> = ({
  reportCard,
  student,
  classNameDetails,
  divisionDetails,
  academicYearDetails,
  marksData = [],
  attendanceData,
  schoolSettings = {
    schoolName: 'MOTHER TERESA ENGLISH SCHOOL',
    subHeader: "Human Resource Development Center's Bharat Ratna",
    address: 'Gangapur Dist.Chha.Sambhajinagar - 431109',
  },
  customDetails,
}) => {
  // Determine standard class (8th, 9th, 10th)
  const rawClassName = (classNameDetails?.name || reportCard?.class?.name || '10th').trim();
  const is10th = /^(10|10th|X)$/i.test(rawClassName);
  const is9th = /^(9|9th|IX)$/i.test(rawClassName);
  const is8th = !is10th && !is9th; // Default to 8th if secondary

  const stdCode = is10th ? 'STD.X' : is9th ? 'STD.IX' : 'STD.VIII';
  const academicYear = academicYearDetails?.name || reportCard?.academicYear?.name || '2026 - 27';

  // Merge student details
  const stud = {
    name: customDetails?.studentName ?? student?.name ?? reportCard?.student?.name ?? '',
    rollNo: customDetails?.rollNo ?? student?.rollNo ?? reportCard?.student?.rollNo ?? '',
    admissionNo: customDetails?.admissionNo ?? student?.admissionNo ?? reportCard?.student?.admissionNo ?? '',
    regNo: customDetails?.regNo ?? student?.admissionNo ?? reportCard?.student?.admissionNo ?? '',
    idNo: customDetails?.idNo ?? student?.admissionNo ?? reportCard?.student?.admissionNo ?? '',
    uidNo: customDetails?.uidNo ?? student?.admissionNo ?? reportCard?.student?.admissionNo ?? '',
    fatherName: customDetails?.fatherName ?? student?.fatherName ?? reportCard?.student?.fatherName ?? '',
    fatherOccupation: customDetails?.fatherOccupation ?? student?.fatherOccupation ?? reportCard?.student?.fatherOccupation ?? '',
    motherName: customDetails?.motherName ?? student?.motherName ?? reportCard?.student?.motherName ?? '',
    motherOccupation: customDetails?.motherOccupation ?? student?.motherOccupation ?? reportCard?.student?.motherOccupation ?? '',
    motherTongue: customDetails?.motherTongue ?? student?.motherTongue ?? reportCard?.student?.motherTongue ?? 'Marathi',
    dob: customDetails?.dob ?? (student?.dob ? new Date(student.dob).toLocaleDateString('en-GB') : reportCard?.student?.dob ? new Date(reportCard.student.dob).toLocaleDateString('en-GB') : ''),
    mobile: customDetails?.mobile ?? student?.parentContact ?? reportCard?.student?.parentContact ?? '',
    weight: customDetails?.weight ?? student?.weight ?? reportCard?.student?.weight ?? '',
    height: customDetails?.height ?? student?.height ?? reportCard?.student?.height ?? '',
    address: customDetails?.address ?? student?.address ?? reportCard?.student?.address ?? '',
    photo: customDetails?.photo ?? student?.photo ?? reportCard?.student?.photo ?? '',
    division: customDetails?.division ?? divisionDetails?.name ?? reportCard?.division?.name ?? 'A',
  };

  // Extract saved section / additionalData
  const secDesc = reportCard?.sections?.find((s: any) => s.sectionKey === 'SECONDARY_DESCRIPTIVE')?.additionalData || customDetails?.descriptiveData || {};
  const secComp = reportCard?.sections?.find((s: any) => s.sectionKey === 'SECONDARY_COMPETENCY')?.additionalData || customDetails?.competencyData || {};
  const secAttendance = reportCard?.sections?.find((s: any) => s.sectionKey === 'SECONDARY_ATTENDANCE')?.additionalData || customDetails?.attendanceData || {};
  const secMarks = reportCard?.sections?.find((s: any) => s.sectionKey === 'SECONDARY_MARKS')?.additionalData || customDetails?.marksData || {};
  const secGeneral = reportCard?.sections?.find((s: any) => s.sectionKey === 'SECONDARY_GENERAL')?.additionalData || customDetails?.generalData || {};

  // Months for attendance chart
  const months = ['June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.', 'Jan.', 'Feb.', 'Mar.'];
  const attendanceMonthly = months.map(m => ({
    month: m,
    wDays: secAttendance[m]?.wDays ?? (attendanceData?.monthly?.[m]?.wDays || ''),
    pDays: secAttendance[m]?.pDays ?? (attendanceData?.monthly?.[m]?.pDays || ''),
  }));

  const totalWDays = attendanceMonthly.reduce((acc, curr) => acc + (Number(curr.wDays) || 0), 0) || (attendanceData?.workingDays || 220);
  const totalPDays = attendanceMonthly.reduce((acc, curr) => acc + (Number(curr.pDays) || 0), 0) || (attendanceData?.presentDays || 208);
  const attendancePercentage = totalWDays > 0 ? ((totalPDays / totalWDays) * 100).toFixed(1) + '%' : (attendanceData?.percentage || '94.5%');

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
    const subjects = is8th ? std8Subjects : std9Subjects;
    let t1_w = 0, t1_o = 0, t1_t = 0;
    let a2_w = 0, a2_o = 0, a2_t = 0;
    let t2_w = 0, t2_o = 0, t2_t = 0;
    let b2_w = 0, b2_o = 0, b2_t = 0;
    let sumA1A2 = 0, sumB1B2 = 0, grandTotal = 0;

    let hasAny = false;
    subjects.forEach(s => {
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

  return (
    <div className="w-full text-slate-900 font-sans print:p-0 bg-white select-text overflow-x-auto">
      {/* ========================================================================= */}
      {/* PAGE 1: FRONT / OUTER 3-PANEL SPREAD                                      */}
      {/* ========================================================================= */}
      <div 
        id="secondary-report-card-page-1"
        className="secondary-report-card-page mx-auto bg-white flex justify-between text-[9px] leading-tight page-break-after overflow-hidden print:p-0"
        style={{ 
          boxSizing: 'border-box', 
          width: '16.5in', 
          height: '8.5in',
          padding: '4.5mm 5mm',
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact'
        }}
      >

        {/* ----------------- LEFT PANEL: ATTENDANCE, SCALES & SIGNS ----------------- */}
        <div 
          className="flex flex-col justify-between h-full bg-white relative space-y-1"
          style={{
            boxSizing: 'border-box',
            width: '130mm',
            height: '100%',
            border: '2.5px solid #005082',
            borderRadius: '4px',
            padding: '2.5mm 3.5mm'
          }}
        >
          {/* Gold inner border */}
          <div style={{
            position: 'absolute',
            top: '1.5px',
            left: '1.5px',
            right: '1.5px',
            bottom: '1.5px',
            border: '1px solid #c8a96a',
            borderRadius: '2px',
            pointerEvents: 'none'
          }} />
          {/* 1. Monthly Attendance Chart */}
          <div>
            <div className="text-center font-bold text-[11px] bg-slate-100 py-0.5 border border-slate-700 uppercase tracking-wider mb-0.5">
              Monthly Attendance Chart
            </div>
            <table className="w-full border-collapse border border-slate-700 text-center text-[8.5px]">
              <thead>
                <tr className="bg-slate-50 font-semibold border-b border-slate-700">
                  <th className="border-r border-slate-700 p-0.5">Months</th>
                  {months.slice(0, 5).map(m => (
                    <th key={m} className="border-r border-slate-700 p-0.5">{m}</th>
                  ))}
                  <th className="border-r border-slate-700 p-0.5">Total</th>
                  {months.slice(5).map(m => (
                    <th key={m} className="border-r border-slate-700 p-0.5">{m}</th>
                  ))}
                  <th className="border-r border-slate-700 p-0.5">Total</th>
                  <th className="p-0.5">Per. %</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700">
                  <td className="border-r border-slate-700 font-semibold p-0.5">W.Days</td>
                  {attendanceMonthly.slice(0, 5).map((a, i) => (
                    <td key={i} className="border-r border-slate-700 p-0.5">{a.wDays || '-'}</td>
                  ))}
                  <td className="border-r border-slate-700 font-semibold p-0.5">
                    {attendanceMonthly.slice(0, 5).reduce((acc, c) => acc + (Number(c.wDays) || 0), 0) || '-'}
                  </td>
                  {attendanceMonthly.slice(5).map((a, i) => (
                    <td key={i} className="border-r border-slate-700 p-0.5">{a.wDays || '-'}</td>
                  ))}
                  <td className="border-r border-slate-700 font-semibold p-0.5">
                    {attendanceMonthly.slice(5).reduce((acc, c) => acc + (Number(c.wDays) || 0), 0) || '-'}
                  </td>
                  <td rowSpan={2} className="font-bold p-0.5 align-middle bg-slate-50">
                    {attendancePercentage}
                  </td>
                </tr>
                <tr>
                  <td className="border-r border-slate-700 font-semibold p-0.5">P.Days</td>
                  {attendanceMonthly.slice(0, 5).map((a, i) => (
                    <td key={i} className="border-r border-slate-700 p-0.5">{a.pDays || '-'}</td>
                  ))}
                  <td className="border-r border-slate-700 font-semibold p-0.5">
                    {attendanceMonthly.slice(0, 5).reduce((acc, c) => acc + (Number(c.pDays) || 0), 0) || '-'}
                  </td>
                  {attendanceMonthly.slice(5).map((a, i) => (
                    <td key={i} className="border-r border-slate-700 p-0.5">{a.pDays || '-'}</td>
                  ))}
                  <td className="border-r border-slate-700 font-semibold p-0.5">
                    {attendanceMonthly.slice(5).reduce((acc, c) => acc + (Number(c.pDays) || 0), 0) || '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. Scholastic Performance Chart */}
          <div>
            <div className="text-center font-bold text-[10.5px] bg-slate-100 py-0.5 border border-slate-700 uppercase tracking-wider mb-0.5">
              Scholastic Performance Chart
            </div>
            <table className="w-full border-collapse border border-slate-700 text-center text-[8px] leading-none">
              <tbody>
                <tr className="border-b border-slate-700 font-semibold bg-slate-50">
                  <td className="border-r border-slate-700 p-0.5">Percentage</td>
                  <td className="border-r border-slate-700 p-0.5">91 % to 100 %</td>
                  <td className="border-r border-slate-700 p-0.5">81 % to 90 %</td>
                  <td className="border-r border-slate-700 p-0.5">71 % to 80 %</td>
                  <td className="border-r border-slate-700 p-0.5">61 % to 70 %</td>
                  <td className="border-r border-slate-700 p-0.5">51 % to 60 %</td>
                  <td className="border-r border-slate-700 p-0.5">41 % to 50 %</td>
                  <td className="border-r border-slate-700 p-0.5">31 % to 40 %</td>
                  <td className="border-r border-slate-700 p-0.5">21 % to 30 %</td>
                  <td className="p-0.5">20 % to less than 20 %</td>
                </tr>
                <tr className="border-b border-slate-700 font-bold">
                  <td className="border-r border-slate-700 p-0.5">Grade</td>
                  <td className="border-r border-slate-700 p-0.5">A - 1</td>
                  <td className="border-r border-slate-700 p-0.5">A - 2</td>
                  <td className="border-r border-slate-700 p-0.5">B - 1</td>
                  <td className="border-r border-slate-700 p-0.5">B - 2</td>
                  <td className="border-r border-slate-700 p-0.5">C - 1</td>
                  <td className="border-r border-slate-700 p-0.5">C - 2</td>
                  <td className="border-r border-slate-700 p-0.5">D</td>
                  <td className="border-r border-slate-700 p-0.5">E - 1</td>
                  <td className="p-0.5">E - 2</td>
                </tr>
                <tr className="text-[7.5px]">
                  <td className="border-r border-slate-700 font-semibold p-0.5">Performance</td>
                  <td className="border-r border-slate-700 p-0.5">Out Standing</td>
                  <td className="border-r border-slate-700 p-0.5">Excellent</td>
                  <td className="border-r border-slate-700 p-0.5">Very Good</td>
                  <td className="border-r border-slate-700 p-0.5">Good</td>
                  <td className="border-r border-slate-700 p-0.5">Average</td>
                  <td className="border-r border-slate-700 p-0.5">Fair</td>
                  <td className="border-r border-slate-700 p-0.5">Marginal</td>
                  <td className="border-r border-slate-700 p-0.5">Poor</td>
                  <td className="p-0.5">Very Poor</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. Co-Scholastic Performance Chart Scale Point */}
          <div>
            <div className="text-center font-bold text-[10px] bg-slate-100 py-0.5 border border-slate-700 uppercase tracking-wider mb-0.5">
              Co-Scholastic Performance Chart Scale Point
            </div>
            <table className="w-full border-collapse border border-slate-700 text-center text-[8.5px]">
              <tbody>
                <tr className="border-b border-slate-700 font-bold bg-slate-50">
                  <td className="border-r border-slate-700 p-0.5 w-1/5">5</td>
                  <td className="border-r border-slate-700 p-0.5 w-1/5">4</td>
                  <td className="border-r border-slate-700 p-0.5 w-1/5">3</td>
                  <td className="border-r border-slate-700 p-0.5 w-1/5">2</td>
                  <td className="p-0.5 w-1/5">1</td>
                </tr>
                <tr>
                  <td className="border-r border-slate-700 p-0.5">Excellent</td>
                  <td className="border-r border-slate-700 p-0.5">Very Good</td>
                  <td className="border-r border-slate-700 p-0.5">Good</td>
                  <td className="border-r border-slate-700 p-0.5">Needs Improvement</td>
                  <td className="p-0.5">Special Attention Needed</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Annual Performance */}
          <div>
            <div className="text-center font-bold text-[10.5px] bg-slate-100 py-0.5 border border-slate-700 uppercase tracking-wider mb-0.5">
              Annual Performance
            </div>
            <table className="w-full border-collapse border border-slate-700 text-[9px]">
              <thead>
                <tr className="border-b border-slate-700 font-semibold bg-slate-50">
                  <th className="border-r border-slate-700 p-0.5 w-10 text-center">Sr.No.</th>
                  <th className="border-r border-slate-700 p-0.5 text-left pl-2">Domain of Performance</th>
                  <th className="p-0.5 w-24 text-center">Achievement</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700">
                  <td className="border-r border-slate-700 p-0.5 text-center font-bold">1.</td>
                  <td className="border-r border-slate-700 p-0.5 font-semibold pl-2">Scholastic Performance</td>
                  <td className="p-0.5 text-center font-bold">{secGeneral.scholasticAchievement || 'A - 1'}</td>
                </tr>
                <tr>
                  <td className="border-r border-slate-700 p-0.5 text-center font-bold">2.</td>
                  <td className="border-r border-slate-700 p-0.5 font-semibold pl-2">Co-Scholastic Performance Point</td>
                  <td className="p-0.5 text-center font-bold">{secGeneral.coScholasticPoint || '4.6'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. Signatures Grid */}
          <div className="border border-slate-700 p-1 text-[9px]">
            <div className="grid grid-cols-3 gap-1">
              <div>
                <div className="font-bold underline mb-0.5">Class Teacher's Sign.</div>
                <div className="space-y-1">
                  <div>1. {secGeneral.ctSign1 || '...........................'}</div>
                  <div>2. {secGeneral.ctSign2 || '...........................'}</div>
                  <div>3. {secGeneral.ctSign3 || '...........................'}</div>
                  {!is10th && <div>4. {secGeneral.ctSign4 || '...........................'}</div>}
                </div>
              </div>

              <div>
                <div className="font-bold underline mb-0.5">H.M.'s Sign.& Stamp</div>
                <div className="space-y-1">
                  <div>1. {secGeneral.hmSign1 || ''}</div>
                  <div>2. {secGeneral.hmSign2 || ''}</div>
                  <div>3. {secGeneral.hmSign3 || ''}</div>
                  {!is10th && <div>4. {secGeneral.hmSign4 || ''}</div>}
                </div>
              </div>

              <div>
                <div className="font-bold underline mb-0.5">Parent's Sign.</div>
                <div className="space-y-1">
                  <div>1. {secGeneral.parentSign1 || '...........................'}</div>
                  <div>2. {secGeneral.parentSign2 || '...........................'}</div>
                  <div>3. {secGeneral.parentSign3 || '...........................'}</div>
                  {!is10th && <div>4. {secGeneral.parentSign4 || '...........................'}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* 6. School Reopening Notes */}
          <div className="text-[9px] font-medium space-y-0.5 pt-0.5">
            <div>
              School Will Reopen For The Second Term on <span className="font-bold underline">{secGeneral.reopenTerm2 || '_____________________'}</span>
            </div>
            {!is10th && (
              <div>
                School Will Reopen For The New Academic Year 2026 -27 on <span className="font-bold underline">{secGeneral.reopenNewYear || '____________'}</span>
              </div>
            )}
          </div>
        </div>

        {/* ----------------- MIDDLE PANEL: COVER & STUDENT PROFILE ----------------- */}
        <div 
          className="flex flex-col justify-between h-full bg-white text-center relative"
          style={{
            boxSizing: 'border-box',
            width: '130mm',
            height: '100%',
            border: '2.5px solid #005082',
            borderRadius: '4px',
            padding: '2.5mm 3.5mm'
          }}
        >
          {/* Gold inner border */}
          <div style={{
            position: 'absolute',
            top: '1.5px',
            left: '1.5px',
            right: '1.5px',
            bottom: '1.5px',
            border: '1px solid #c8a96a',
            borderRadius: '2px',
            pointerEvents: 'none'
          }} />
          {/* Header & Emblem */}
          <div className="space-y-0.5">
            {/* Exact School Header Banner Image with Mother Teresa photo & School Crest Logo */}
            <div className="w-full overflow-hidden rounded-sm border border-slate-700 bg-[#003366] shadow-sm">
              <img 
                src={schoolHeaderBanner} 
                alt="Mother Teresa English School" 
                className="w-full h-auto object-contain block"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            <div className="py-0.5 text-center">
              <h3 className="text-sm font-black tracking-wider text-slate-900 uppercase font-serif leading-tight">
                MY PROGRESS REPORT 2026-27
              </h3>
              <h4 className="text-base font-black text-indigo-950 uppercase tracking-widest leading-tight">
                {stdCode}
              </h4>
            </div>
          </div>

          {/* Student Profile Photo Frame */}
          <div className="flex justify-center my-0.5">
            <div 
              className="w-24 h-28 border-2 border-slate-700 rounded bg-slate-50 flex flex-col items-center justify-center overflow-hidden p-0.5 shadow-sm"
              style={{ minWidth: '6rem', minHeight: '7rem', width: '6rem', height: '7rem' }}
            >
              {stud.photo ? (
                <img 
                  src={stud.photo} 
                  alt={stud.name} 
                  className="w-full h-full object-cover rounded" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div className="text-[9px] text-slate-500 font-semibold text-center leading-tight">
                  <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                    📷
                  </div>
                  Student Photo<br/>
                  <span className="text-[7.5px] text-slate-400">(Affix Photo)</span>
                </div>
              )}
            </div>
          </div>



          {/* Student Details Fields */}
          <div className="text-left text-[9.5px] space-y-1 px-2 font-medium">
            <div className="flex items-baseline">
              <span className="font-bold w-24 shrink-0">Name :</span>
              <span className="flex-1 font-bold text-indigo-950 border-b border-dotted border-slate-600 pb-0.5">{stud.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-baseline">
                <span className="font-bold w-12 shrink-0">Std. :</span>
                <span className="flex-1 border-b border-dotted border-slate-600 pb-0.5">{rawClassName}</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold w-16 shrink-0">Division :</span>
                <span className="flex-1 border-b border-dotted border-slate-600 pb-0.5">{stud.division}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-baseline">
                <span className="font-bold w-16 shrink-0">Roll No. :</span>
                <span className="flex-1 border-b border-dotted border-slate-600 pb-0.5">{stud.rollNo}</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold w-16 shrink-0">UID No. :</span>
                <span className="flex-1 border-b border-dotted border-slate-600 pb-0.5">{stud.uidNo}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-baseline">
                <span className="font-bold w-16 shrink-0">Reg.No. :</span>
                <span className="flex-1 border-b border-dotted border-slate-600 pb-0.5">{stud.regNo}</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold w-16 shrink-0">ID No. :</span>
                <span className="flex-1 border-b border-dotted border-slate-600 pb-0.5">{stud.idNo}</span>
              </div>
            </div>

            <div className="flex items-baseline">
              <span className="font-bold w-24 shrink-0">Father’s Name :</span>
              <span className="flex-1 border-b border-dotted border-slate-600 pb-0.5">{stud.fatherName}</span>
              <span className="font-bold ml-2 shrink-0">Occupation :</span>
              <span className="w-20 border-b border-dotted border-slate-600 pb-0.5 ml-1">{stud.fatherOccupation}</span>
            </div>

            <div className="flex items-baseline">
              <span className="font-bold w-24 shrink-0">Mother’s Name :</span>
              <span className="flex-1 border-b border-dotted border-slate-600 pb-0.5">{stud.motherName}</span>
              <span className="font-bold ml-2 shrink-0">Occupation :</span>
              <span className="w-20 border-b border-dotted border-slate-600 pb-0.5 ml-1">{stud.motherOccupation}</span>
            </div>

            <div className="flex items-baseline">
              <span className="font-bold w-24 shrink-0">Mother Tongue :</span>
              <span className="flex-1 border-b border-dotted border-slate-600 pb-0.5">{stud.motherTongue}</span>
            </div>

            <div className="flex items-baseline">
              <span className="font-bold w-24 shrink-0">Date of Birth :</span>
              <span className="flex-1 border-b border-dotted border-slate-600 pb-0.5">{stud.dob}</span>
            </div>

            <div className="grid grid-cols-3 gap-1">
              <div className="flex items-baseline col-span-1">
                <span className="font-bold w-12 shrink-0">Mobile :</span>
                <span className="flex-1 border-b border-dotted border-slate-600 pb-0.5">{stud.mobile}</span>
              </div>
              <div className="flex items-baseline col-span-1">
                <span className="font-bold w-12 shrink-0">Weight :</span>
                <span className="flex-1 border-b border-dotted border-slate-600 pb-0.5">{stud.weight}</span>
              </div>
              <div className="flex items-baseline col-span-1">
                <span className="font-bold w-12 shrink-0">Height :</span>
                <span className="flex-1 border-b border-dotted border-slate-600 pb-0.5">{stud.height}</span>
              </div>
            </div>

            <div className="flex items-baseline">
              <span className="font-bold w-16 shrink-0">Address :</span>
              <span className="flex-1 border-b border-dotted border-slate-600 pb-0.5">{stud.address}</span>
            </div>
          </div>

          {/* Footer Motto */}
          <div className="text-center font-serif italic text-[9.5px] text-pink-700 font-semibold pt-1 border-t border-slate-200">
            Growth & Progress Everyday...... in Every Way.
          </div>
        </div>

        {/* ----------------- RIGHT PANEL: ACADEMIC MARKS PROGRESS REPORT ----------------- */}
        <div 
          className="flex flex-col justify-between h-full bg-white relative"
          style={{
            boxSizing: 'border-box',
            width: '130mm',
            height: '100%',
            border: '2.5px solid #005082',
            borderRadius: '4px',
            padding: '2.5mm 3.5mm'
          }}
        >
          {/* Gold inner border */}
          <div style={{
            position: 'absolute',
            top: '1.5px',
            left: '1.5px',
            right: '1.5px',
            bottom: '1.5px',
            border: '1px solid #c8a96a',
            borderRadius: '2px',
            pointerEvents: 'none'
          }} />

          {/* Vertical text if not 10th */}
          {!is10th && (
            <div className="vertical-text" style={{
              position: 'absolute',
              left: '0.5mm',
              top: '100mm',
              transform: 'translateY(-50%) rotate(-90deg)',
              transformOrigin: 'left center',
              color: '#b91c1c',
              fontWeight: 900,
              fontSize: '8.5px',
              letterSpacing: '1.5px',
              whiteSpace: 'nowrap'
            }}>
              {stdCode} PROGRESS REPORT {academicYear}
            </div>
          )}

          <div 
            className="flex-grow flex flex-col justify-between h-full"
            style={{ marginLeft: !is10th ? '5mm' : '0' }}
          >
            {is10th && (
              <div className="text-center font-black text-[10.5px] text-red-700 uppercase tracking-wide border-b border-slate-700 pb-0.5 mb-1">
                STD.X PROGRESS REPORT 2026 - 27
              </div>
            )}

            {/* 10th Grade Table */}
            {is10th && (
              <div className="flex-grow flex flex-col justify-between">
              <table className="w-full border-collapse border border-slate-700 text-[8.5px] text-center">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-50 font-bold">
                    <th rowSpan={2} className="border-r border-slate-700 p-0.5 text-left pl-1">Subject</th>
                    <th colSpan={3} className="border-r border-slate-700 p-0.5">First Test</th>
                    <th colSpan={3} className="border-r border-slate-700 p-0.5">Second Test</th>
                    <th colSpan={3} className="p-0.5">First Prelim</th>
                  </tr>
                  <tr className="border-b border-slate-700 text-[7.5px] font-semibold">
                    <th className="border-r border-slate-700 p-0.5">Written</th>
                    <th className="border-r border-slate-700 p-0.5">Pra./Oral</th>
                    <th className="border-r border-slate-700 p-0.5 font-bold">Total</th>
                    <th className="border-r border-slate-700 p-0.5">Written</th>
                    <th className="border-r border-slate-700 p-0.5">Pra./Oral</th>
                    <th className="border-r border-slate-700 p-0.5 font-bold">Total</th>
                    <th className="border-r border-slate-700 p-0.5">Written</th>
                    <th className="border-r border-slate-700 p-0.5">Pra./Oral</th>
                    <th className="p-0.5 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Maximum marks row */}
                  <tr className="border-b border-slate-700 bg-slate-50 text-[7.5px] font-semibold text-slate-600">
                    <td className="border-r border-slate-700 p-0.5 text-left pl-1">Max Marks</td>
                    <td className="border-r border-slate-700 p-0.5">80</td>
                    <td className="border-r border-slate-700 p-0.5">20</td>
                    <td className="border-r border-slate-700 p-0.5 font-bold">100</td>
                    <td className="border-r border-slate-700 p-0.5">80</td>
                    <td className="border-r border-slate-700 p-0.5">20</td>
                    <td className="border-r border-slate-700 p-0.5 font-bold">100</td>
                    <td className="border-r border-slate-700 p-0.5">80</td>
                    <td className="border-r border-slate-700 p-0.5">20</td>
                    <td className="p-0.5 font-bold">100</td>
                  </tr>

                  {/* 6 Academic Subjects */}
                  {std10Subjects.map(s => {
                    const t1_w = getSubMark(s.id, 't1', 'w');
                    const t1_o = getSubMark(s.id, 't1', 'o');
                    const t1_t = getSubMark(s.id, 't1', 't') || (t1_w !== '' || t1_o !== '' ? (Number(t1_w) || 0) + (Number(t1_o) || 0) : '');

                    const t2_w = getSubMark(s.id, 't2', 'w');
                    const t2_o = getSubMark(s.id, 't2', 'o');
                    const t2_t = getSubMark(s.id, 't2', 't') || (t2_w !== '' || t2_o !== '' ? (Number(t2_w) || 0) + (Number(t2_o) || 0) : '');

                    const p1_w = getSubMark(s.id, 'p1', 'w');
                    const p1_o = getSubMark(s.id, 'p1', 'o');
                    const p1_t = getSubMark(s.id, 'p1', 't') || (p1_w !== '' || p1_o !== '' ? (Number(p1_w) || 0) + (Number(p1_o) || 0) : '');

                    return (
                      <tr key={s.id} className="border-b border-slate-700">
                        <td className="border-r border-slate-700 p-0.5 text-left pl-1 font-semibold">{s.name}</td>
                        <td className="border-r border-slate-700 p-0.5">{t1_w}</td>
                        <td className="border-r border-slate-700 p-0.5">{t1_o}</td>
                        <td className="border-r border-slate-700 p-0.5 font-bold bg-slate-50">{t1_t}</td>
                        <td className="border-r border-slate-700 p-0.5">{t2_w}</td>
                        <td className="border-r border-slate-700 p-0.5">{t2_o}</td>
                        <td className="border-r border-slate-700 p-0.5 font-bold bg-slate-50">{t2_t}</td>
                        <td className="border-r border-slate-700 p-0.5">{p1_w}</td>
                        <td className="border-r border-slate-700 p-0.5">{p1_o}</td>
                        <td className="p-0.5 font-bold bg-slate-50">{p1_t}</td>
                      </tr>
                    );
                  })}

                  {/* Grade Subjects Header */}
                  <tr className="border-b border-slate-700 bg-slate-100 font-bold">
                    <td colSpan={10} className="p-0.5 text-left pl-1 text-[8px] uppercase">Grade Subjects</td>
                  </tr>

                  {/* Grade Subjects */}
                  {std10GradeSubjects.map(g => (
                    <tr key={g.id} className="border-b border-slate-700">
                      <td className="border-r border-slate-700 p-0.5 text-left pl-1 text-[8px]">{g.name}</td>
                      <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks[`${g.id}_t1`] || 'A'}</td>
                      <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks[`${g.id}_t2`] || 'A'}</td>
                      <td colSpan={3} className="p-0.5 font-bold">{secMarks[`${g.id}_p1`] || 'A'}</td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  <tr className="border-b border-slate-700 font-bold bg-slate-50">
                    <td className="border-r border-slate-700 p-0.5 text-left pl-1">Total (480 / 120 / 600)</td>
                    <td className="border-r border-slate-700 p-0.5">{get10thColTotal('t1', 'w')}</td>
                    <td className="border-r border-slate-700 p-0.5">{get10thColTotal('t1', 'o')}</td>
                    <td className="border-r border-slate-700 p-0.5 bg-slate-100">{get10thColTotal('t1', 't')}</td>
                    <td className="border-r border-slate-700 p-0.5">{get10thColTotal('t2', 'w')}</td>
                    <td className="border-r border-slate-700 p-0.5">{get10thColTotal('t2', 'o')}</td>
                    <td className="border-r border-slate-700 p-0.5 bg-slate-100">{get10thColTotal('t2', 't')}</td>
                    <td className="border-r border-slate-700 p-0.5">{get10thColTotal('p1', 'w')}</td>
                    <td className="border-r border-slate-700 p-0.5">{get10thColTotal('p1', 'o')}</td>
                    <td className="p-0.5 bg-slate-100">{get10thColTotal('p1', 't')}</td>
                  </tr>

                  {/* Pass/Fail */}
                  <tr className="border-b border-slate-700 font-semibold">
                    <td className="border-r border-slate-700 p-0.5 text-left pl-1">Pass/Fail</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold text-emerald-700">{secMarks['t1_status'] || 'Pass'}</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold text-emerald-700">{secMarks['t2_status'] || 'Pass'}</td>
                    <td colSpan={3} className="p-0.5 font-bold text-emerald-700">{secMarks['p1_status'] || 'Pass'}</td>
                  </tr>

                  {/* Percentage */}
                  <tr className="border-b border-slate-700 font-semibold">
                    <td className="border-r border-slate-700 p-0.5 text-left pl-1">Percentage</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">
                      {secMarks['t1_pct'] || (get10thColTotal('t1', 't') ? ((Number(get10thColTotal('t1', 't')) / 600) * 100).toFixed(1) + '%' : '')}
                    </td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">
                      {secMarks['t2_pct'] || (get10thColTotal('t2', 't') ? ((Number(get10thColTotal('t2', 't')) / 600) * 100).toFixed(1) + '%' : '')}
                    </td>
                    <td colSpan={3} className="p-0.5 font-bold">
                      {secMarks['p1_pct'] || (get10thColTotal('p1', 't') ? ((Number(get10thColTotal('p1', 't')) / 600) * 100).toFixed(1) + '%' : '')}
                    </td>
                  </tr>

                  {/* Rank */}
                  <tr className="font-semibold">
                    <td className="border-r border-slate-700 p-0.5 text-left pl-1">Rank</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks['t1_rank'] || '-'}</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks['t2_rank'] || '-'}</td>
                    <td colSpan={3} className="p-0.5 font-bold">{secMarks['p1_rank'] || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 8th & 9th Grade Table */}
          {!is10th && (
            <div className="flex-1 flex flex-col justify-between overflow-x-auto">
              <table className="w-full border-collapse border border-slate-700 text-[8px] text-center">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-50 font-bold text-[7.5px]">
                    <th rowSpan={2} className="border-r border-slate-700 p-0.5 text-left pl-1">Subject</th>
                    <th colSpan={3} className="border-r border-slate-700 p-0.5">First Unit Test (A1)</th>
                    <th colSpan={3} className="border-r border-slate-700 p-0.5">First Term(A2)</th>
                    <th colSpan={3} className="border-r border-slate-700 p-0.5">Second Unit Test (B1)</th>
                    <th colSpan={3} className="border-r border-slate-700 p-0.5">Second Term (B2)</th>
                    <th className="border-r border-slate-700 p-0.5">Total A1+A2</th>
                    <th className="border-r border-slate-700 p-0.5">B1+B2</th>
                    <th className="p-0.5 font-bold">Total / Avg</th>
                  </tr>
                  <tr className="border-b border-slate-700 text-[7px]">
                    <th className="border-r border-slate-700 p-0.5">W</th>
                    <th className="border-r border-slate-700 p-0.5">O</th>
                    <th className="border-r border-slate-700 p-0.5 font-bold">Tot</th>
                    <th className="border-r border-slate-700 p-0.5">W</th>
                    <th className="border-r border-slate-700 p-0.5">O</th>
                    <th className="border-r border-slate-700 p-0.5 font-bold">Tot</th>
                    <th className="border-r border-slate-700 p-0.5">W</th>
                    <th className="border-r border-slate-700 p-0.5">O</th>
                    <th className="border-r border-slate-700 p-0.5 font-bold">Tot</th>
                    <th className="border-r border-slate-700 p-0.5">W</th>
                    <th className="border-r border-slate-700 p-0.5">O</th>
                    <th className="border-r border-slate-700 p-0.5 font-bold">Tot</th>
                    <th className="border-r border-slate-700 p-0.5">300</th>
                    <th className="border-r border-slate-700 p-0.5">300</th>
                    <th className="p-0.5">1800</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Max Marks Row */}
                  <tr className="border-b border-slate-700 bg-slate-50 text-[7px] text-slate-600 font-semibold">
                    <td className="border-r border-slate-700 p-0.5 text-left pl-1">Max Marks</td>
                    <td className="border-r border-slate-700 p-0.5">40</td>
                    <td className="border-r border-slate-700 p-0.5">10</td>
                    <td className="border-r border-slate-700 p-0.5 font-bold">50</td>
                    <td className="border-r border-slate-700 p-0.5">80</td>
                    <td className="border-r border-slate-700 p-0.5">20</td>
                    <td className="border-r border-slate-700 p-0.5 font-bold">100</td>
                    <td className="border-r border-slate-700 p-0.5">40</td>
                    <td className="border-r border-slate-700 p-0.5">10</td>
                    <td className="border-r border-slate-700 p-0.5 font-bold">50</td>
                    <td className="border-r border-slate-700 p-0.5">80</td>
                    <td className="border-r border-slate-700 p-0.5">20</td>
                    <td className="border-r border-slate-700 p-0.5 font-bold">100</td>
                    <td className="border-r border-slate-700 p-0.5">300</td>
                    <td className="border-r border-slate-700 p-0.5">300</td>
                    <td className="p-0.5 font-bold">1800</td>
                  </tr>

                  {/* Academic Subjects */}
                  {(is8th ? std8Subjects : std9Subjects).map(s => {
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

                    return (
                      <tr key={s.id} className="border-b border-slate-700">
                        <td className="border-r border-slate-700 p-0.5 text-left pl-1 font-semibold">{s.name}</td>
                        <td className="border-r border-slate-700 p-0.5">{w1}</td>
                        <td className="border-r border-slate-700 p-0.5">{o1}</td>
                        <td className="border-r border-slate-700 p-0.5 font-bold bg-slate-50">{tot1}</td>
                        <td className="border-r border-slate-700 p-0.5">{w2}</td>
                        <td className="border-r border-slate-700 p-0.5">{o2}</td>
                        <td className="border-r border-slate-700 p-0.5 font-bold bg-slate-50">{tot2}</td>
                        <td className="border-r border-slate-700 p-0.5">{w3}</td>
                        <td className="border-r border-slate-700 p-0.5">{o3}</td>
                        <td className="border-r border-slate-700 p-0.5 font-bold bg-slate-50">{tot3}</td>
                        <td className="border-r border-slate-700 p-0.5">{w4}</td>
                        <td className="border-r border-slate-700 p-0.5">{o4}</td>
                        <td className="border-r border-slate-700 p-0.5 font-bold bg-slate-50">{tot4}</td>
                        <td className="border-r border-slate-700 p-0.5 font-bold bg-slate-50">{totA}</td>
                        <td className="border-r border-slate-700 p-0.5 font-bold bg-slate-50">{totB}</td>
                        <td className="p-0.5 font-bold bg-slate-100">{grand}</td>
                      </tr>
                    );
                  })}

                  {/* Grade Subjects Header */}
                  <tr className="border-b border-slate-700 bg-slate-100 font-bold">
                    <td colSpan={16} className="p-0.5 text-left pl-1 text-[7.5px] uppercase">Grade Subjects</td>
                  </tr>

                  {/* Grade Subjects */}
                  {(is8th ? std8GradeSubjects : std9GradeSubjects).map(g => (
                    <tr key={g.id} className="border-b border-slate-700">
                      <td className="border-r border-slate-700 p-0.5 text-left pl-1 text-[7.5px]">{g.name}</td>
                      <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks[`${g.id}_t1`] || 'A'}</td>
                      <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks[`${g.id}_a2`] || 'A'}</td>
                      <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks[`${g.id}_t2`] || 'A'}</td>
                      <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks[`${g.id}_b2`] || 'A'}</td>
                      <td className="border-r border-slate-700 p-0.5 font-bold">{secMarks[`${g.id}_totA`] || 'A'}</td>
                      <td className="border-r border-slate-700 p-0.5 font-bold">{secMarks[`${g.id}_totB`] || 'A'}</td>
                      <td className="p-0.5 font-bold">{secMarks[`${g.id}_totGrand`] || 'A'}</td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  <tr className="border-b border-slate-700 font-bold bg-slate-50 text-[7.5px]">
                    <td className="border-r border-slate-700 p-0.5 text-left pl-1">Total</td>
                    <td className="border-r border-slate-700 p-0.5">{totals89.t1_w}</td>
                    <td className="border-r border-slate-700 p-0.5">{totals89.t1_o}</td>
                    <td className="border-r border-slate-700 p-0.5 bg-slate-100">{totals89.t1_t}</td>
                    <td className="border-r border-slate-700 p-0.5">{totals89.a2_w}</td>
                    <td className="border-r border-slate-700 p-0.5">{totals89.a2_o}</td>
                    <td className="border-r border-slate-700 p-0.5 bg-slate-100">{totals89.a2_t}</td>
                    <td className="border-r border-slate-700 p-0.5">{totals89.t2_w}</td>
                    <td className="border-r border-slate-700 p-0.5">{totals89.t2_o}</td>
                    <td className="border-r border-slate-700 p-0.5 bg-slate-100">{totals89.t2_t}</td>
                    <td className="border-r border-slate-700 p-0.5">{totals89.b2_w}</td>
                    <td className="border-r border-slate-700 p-0.5">{totals89.b2_o}</td>
                    <td className="border-r border-slate-700 p-0.5 bg-slate-100">{totals89.b2_t}</td>
                    <td className="border-r border-slate-700 p-0.5 bg-slate-100">{totals89.sumA1A2}</td>
                    <td className="border-r border-slate-700 p-0.5 bg-slate-100">{totals89.sumB1B2}</td>
                    <td className="p-0.5 bg-slate-200">{totals89.grandTotal}</td>
                  </tr>

                  {/* Pass/Fail */}
                  <tr className="border-b border-slate-700 font-semibold">
                    <td className="border-r border-slate-700 p-0.5 text-left pl-1">Pass/Fail</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold text-emerald-700">{secMarks['t1_status'] || 'Pass'}</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold text-emerald-700">{secMarks['a2_status'] || 'Pass'}</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold text-emerald-700">{secMarks['t2_status'] || 'Pass'}</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold text-emerald-700">{secMarks['b2_status'] || 'Pass'}</td>
                    <td className="border-r border-slate-700 p-0.5 font-bold text-emerald-700">{secMarks['totA_status'] || 'Pass'}</td>
                    <td className="border-r border-slate-700 p-0.5 font-bold text-emerald-700">{secMarks['totB_status'] || 'Pass'}</td>
                    <td className="p-0.5 font-bold text-emerald-700">{secMarks['grand_status'] || 'Pass'}</td>
                  </tr>

                  {/* Percentage */}
                  <tr className="border-b border-slate-700 font-semibold">
                    <td className="border-r border-slate-700 p-0.5 text-left pl-1">Percentage</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks['t1_pct'] || ''}</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks['a2_pct'] || ''}</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks['t2_pct'] || ''}</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks['b2_pct'] || ''}</td>
                    <td className="border-r border-slate-700 p-0.5 font-bold">{secMarks['totA_pct'] || ''}</td>
                    <td className="border-r border-slate-700 p-0.5 font-bold">{secMarks['totB_pct'] || ''}</td>
                    <td className="p-0.5 font-bold bg-slate-100">{totals89.percentage || secMarks['grand_pct'] || ''}</td>
                  </tr>

                  {/* Rank */}
                  <tr className="font-semibold">
                    <td className="border-r border-slate-700 p-0.5 text-left pl-1">Rank</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks['t1_rank'] || '-'}</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks['a2_rank'] || '-'}</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks['t2_rank'] || '-'}</td>
                    <td colSpan={3} className="border-r border-slate-700 p-0.5 font-bold">{secMarks['b2_rank'] || '-'}</td>
                    <td className="border-r border-slate-700 p-0.5 font-bold">{secMarks['totA_rank'] || '-'}</td>
                    <td className="border-r border-slate-700 p-0.5 font-bold">{secMarks['totB_rank'] || '-'}</td>
                    <td className="p-0.5 font-bold">{secMarks['grand_rank'] || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2: INSIDE / BACK SPREAD                                              */}
      {/* ========================================================================= */}
      <div 
        id="secondary-report-card-page-2"
        className="secondary-report-card-page mx-auto bg-white flex justify-between text-[9px] leading-tight page-break-after overflow-hidden print:mt-0 print:p-0"
        style={{ 
          boxSizing: 'border-box', 
          width: '16.5in', 
          height: '8.5in',
          padding: '4.5mm 5mm',
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact',
          marginTop: '1rem'
        }}
      >


        {/* ----------------- LEFT PANEL: DESCRIPTIVE ASSESSMENT ----------------- */}
        <div 
          className="flex flex-col justify-between h-full bg-white relative space-y-1"
          style={{
            boxSizing: 'border-box',
            width: '130mm',
            height: '100%',
            border: '2.5px solid #005082',
            borderRadius: '4px',
            padding: '2.5mm 3.5mm'
          }}
        >
          {/* Gold inner border */}
          <div style={{
            position: 'absolute',
            top: '1.5px',
            left: '1.5px',
            right: '1.5px',
            bottom: '1.5px',
            border: '1px solid #c8a96a',
            borderRadius: '2px',
            pointerEvents: 'none'
          }} />
          {/* Test 1 / Second Test Box */}
          <div className="border border-slate-700 rounded-sm overflow-hidden flex-1 flex flex-col">
            <div className="grid grid-cols-12 border-b border-slate-700 bg-slate-50 text-[9px] font-bold text-center">
              <div className="col-span-2 border-r border-slate-700 p-1 flex items-center justify-center bg-slate-100">
                {is10th ? 'Second Test' : 'First Test'}
              </div>
              <div className="col-span-5 border-r border-slate-700 p-1 text-slate-800">
                Special Progress Made
              </div>
              <div className="col-span-5 p-1 text-slate-800">
                Improvement Needed
              </div>
            </div>

            <div className="grid grid-cols-12 flex-1 text-[8.5px]">
              <div className="col-span-2 border-r border-slate-700 bg-slate-50 flex items-center justify-center font-bold text-slate-700 text-center p-1">
                {is10th ? 'Test II' : 'Test I'}
              </div>
              <div className="col-span-5 border-r border-slate-700 p-1.5 space-y-1.5">
                <div className="min-h-[34px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                  {secDesc.test1_prog1 || '1. Strong conceptual clarity & analytical thinking.'}
                </div>
                <div className="min-h-[34px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                  {secDesc.test1_prog2 || '2. Consistent effort in completing practical & oral tasks.'}
                </div>
              </div>
              <div className="col-span-5 p-1.5 space-y-1.5">
                <div className="min-h-[34px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                  {secDesc.test1_imp1 || '1. Needs regular practice in mathematical calculations.'}
                </div>
                <div className="min-h-[34px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                  {secDesc.test1_imp2 || '2. Focus on exam time management and neat handwriting.'}
                </div>
              </div>
            </div>
          </div>

          {/* Test 2 / Prelim Box */}
          <div className="border border-slate-700 rounded-sm overflow-hidden flex-1 flex flex-col">
            <div className="grid grid-cols-12 border-b border-slate-700 bg-slate-50 text-[9px] font-bold text-center">
              <div className="col-span-2 border-r border-slate-700 p-1 flex items-center justify-center bg-slate-100">
                {is10th ? 'Prelim' : 'Second Test'}
              </div>
              <div className="col-span-5 border-r border-slate-700 p-1 text-slate-800">
                Special Progress Made
              </div>
              <div className="col-span-5 p-1 text-slate-800">
                Improvement Needed
              </div>
            </div>

            <div className="grid grid-cols-12 flex-1 text-[8.5px]">
              <div className="col-span-2 border-r border-slate-700 bg-slate-50 flex items-center justify-center font-bold text-slate-700 text-center p-1">
                {is10th ? 'Prelim' : 'Test II'}
              </div>
              <div className="col-span-5 border-r border-slate-700 p-1.5 space-y-1.5">
                <div className="min-h-[34px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                  {secDesc.test2_prog1 || '1. Active participation in classroom discussions.'}
                </div>
                <div className="min-h-[34px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                  {secDesc.test2_prog2 || '2. Shows good improvement in scientific reasoning.'}
                </div>
              </div>
              <div className="col-span-5 p-1.5 space-y-1.5">
                <div className="min-h-[34px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                  {secDesc.test2_imp1 || '1. Regular revision of diagrams, formulae & definitions.'}
                </div>
                <div className="min-h-[34px] border-b border-dotted border-slate-400 pb-0.5 text-slate-900 font-medium">
                  {secDesc.test2_imp2 || '2. Daily reading habit for vocabulary enhancement.'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Label */}
          <div className="text-center font-semibold text-[8px] text-slate-700 pt-0.5">
            Descriptive Assessment of Scholastic Areas to be assessed twice in a year. (Test I & II)
          </div>
        </div>

        {/* ----------------- MIDDLE PANEL: COMPETENCY-BASED PROGRESS CARD (DOMAINS 1-3) ----------------- */}
        <div 
          className="flex flex-col justify-between h-full bg-white relative"
          style={{
            boxSizing: 'border-box',
            width: '130mm',
            height: '100%',
            border: '2.5px solid #005082',
            borderRadius: '4px',
            padding: '2.5mm 3.5mm'
          }}
        >
          {/* Gold inner border */}
          <div style={{
            position: 'absolute',
            top: '1.5px',
            left: '1.5px',
            right: '1.5px',
            bottom: '1.5px',
            border: '1px solid #c8a96a',
            borderRadius: '2px',
            pointerEvents: 'none'
          }} />

          <div className="flex-grow flex flex-col justify-between h-full">
            <div>
              <div className="text-center mb-1">
                <span className="bg-[#003366] text-white px-6 py-0.5 rounded-full font-bold text-[9px] tracking-wide shadow-sm inline-block">
                  Co-scholastic performance
                </span>
              </div>
              <div className="text-center font-bold text-[8.5px] text-red-700 uppercase tracking-wide mb-1">
                COMPETANCY – BASED PROGRESS CARD 2026-27 (STD : VIII TO X)
              </div>
            </div>

            <div className="space-y-1">
              {COMPETENCY_DOMAINS.slice(0, 3).map(dom => (
                <div key={dom.id} className="border border-slate-700 rounded-sm overflow-hidden text-[7.5px]">
                  <div className="bg-[#005580] text-white font-bold p-0.5 text-center text-[8px]">
                    {dom.titleEn} ({dom.titleMr})
                  </div>
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-700 font-semibold text-[7px]">
                        <th className="p-0.5 w-6 text-center border-r border-slate-700">Sr.</th>
                        <th className="p-0.5 border-r border-slate-700">Criteria / निकष</th>
                        <th className="p-0.5 w-10 text-center border-r border-slate-700 bg-pink-900 text-white font-bold">I TERM</th>
                        <th className="p-0.5 w-10 text-center bg-teal-900 text-white font-bold">II TERM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dom.items.map(it => {
                        const r1 = secComp[`dom_${dom.id}_it_${it.id}_t1`] ?? '4';
                        const r2 = secComp[`dom_${dom.id}_it_${it.id}_t2`] ?? '5';
                        return (
                          <tr key={it.id} className="border-b border-slate-300 last:border-b-0 hover:bg-slate-50">
                            <td className="p-0.5 text-center font-bold border-r border-slate-700 text-[7px]">{it.id}</td>
                            <td className="p-0.5 border-r border-slate-700 leading-tight">
                              <span className="font-semibold text-red-900">· {it.titleEn}</span><br />
                              <span className="text-slate-600 text-[6.5px]">{it.titleMr}</span>
                            </td>
                            <td className="p-0.5 text-center font-bold border-r border-slate-700 text-[8px] bg-pink-50/50">
                              {r1}
                            </td>
                            <td className="p-0.5 text-center font-bold text-[8px] bg-teal-50/50">
                              {r2}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-700 pt-1 text-center font-black text-[7.5px] text-pink-800 tracking-wide flex justify-around uppercase">
              <span>5. EXCELLENT</span>
              <span>4. GOOD</span>
              <span>3. SATISFACTORY</span>
              <span>2. IMPROVING</span>
              <span>1. NEEDS SUPPORT</span>
            </div>
          </div>
        </div>

        {/* ----------------- RIGHT PANEL: COMPETENCY-BASED PROGRESS CARD (DOMAINS 4-6) ----------------- */}
        <div 
          className="flex flex-col justify-between h-full bg-white relative"
          style={{
            boxSizing: 'border-box',
            width: '130mm',
            height: '100%',
            border: '2.5px solid #005082',
            borderRadius: '4px',
            padding: '2.5mm 3.5mm'
          }}
        >
          {/* Gold inner border */}
          <div style={{
            position: 'absolute',
            top: '1.5px',
            left: '1.5px',
            right: '1.5px',
            bottom: '1.5px',
            border: '1px solid #c8a96a',
            borderRadius: '2px',
            pointerEvents: 'none'
          }} />

          <div className="flex-grow flex flex-col justify-between h-full">
            <div>
              <div className="text-center mb-1">
                <span className="bg-[#003366] text-white px-6 py-0.5 rounded-full font-bold text-[9px] tracking-wide shadow-sm inline-block">
                  Co-scholastic performance
                </span>
              </div>
              <div className="text-center font-bold text-[8.5px] text-red-700 uppercase tracking-wide mb-1">
                COMPETANCY – BASED PROGRESS CARD 2026-27 (STD : VIII TO X)
              </div>
            </div>

            <div className="space-y-1">
              {COMPETENCY_DOMAINS.slice(3, 6).map(dom => (
                <div key={dom.id} className="border border-slate-700 rounded-sm overflow-hidden text-[7.5px]">
                  <div className="bg-[#005580] text-white font-bold p-0.5 text-center text-[8px]">
                    {dom.titleEn} ({dom.titleMr})
                  </div>
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-700 font-semibold text-[7px]">
                        <th className="p-0.5 w-6 text-center border-r border-slate-700">Sr.</th>
                        <th className="p-0.5 border-r border-slate-700">Criteria / निकष</th>
                        <th className="p-0.5 w-10 text-center border-r border-slate-700 bg-pink-900 text-white font-bold">I TERM</th>
                        <th className="p-0.5 w-10 text-center bg-teal-900 text-white font-bold">II TERM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dom.items.map(it => {
                        const r1 = secComp[`dom_${dom.id}_it_${it.id}_t1`] ?? '4';
                        const r2 = secComp[`dom_${dom.id}_it_${it.id}_t2`] ?? '5';
                        return (
                          <tr key={it.id} className="border-b border-slate-300 last:border-b-0 hover:bg-slate-50">
                            <td className="p-0.5 text-center font-bold border-r border-slate-700 text-[7px]">{it.id}</td>
                            <td className="p-0.5 border-r border-slate-700 leading-tight">
                              <span className="font-semibold text-red-900">· {it.titleEn}</span><br />
                              <span className="text-slate-600 text-[6.5px]">{it.titleMr}</span>
                            </td>
                            <td className="p-0.5 text-center font-bold border-r border-slate-700 text-[8px] bg-pink-50/50">
                              {r1}
                            </td>
                            <td className="p-0.5 text-center font-bold text-[8px] bg-teal-50/50">
                              {r2}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-700 pt-1 text-center font-black text-[7.5px] text-pink-800 tracking-wide flex justify-around uppercase">
              <span>5. EXCELLENT</span>
              <span>4. GOOD</span>
              <span>3. SATISFACTORY</span>
              <span>2. IMPROVING</span>
              <span>1. NEEDS SUPPORT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
