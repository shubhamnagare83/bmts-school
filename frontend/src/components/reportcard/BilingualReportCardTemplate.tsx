import React from 'react';

interface BilingualReportCardTemplateProps {
  reportCard?: any;
  student?: any;
  classNameDetails?: any;
  divisionDetails?: any;
  academicYearDetails?: any;
  marksData?: any[];
  attendanceData?: { workingDays: number; presentDays: number; percentage: string };
  schoolSettings?: any;
}

export const BilingualReportCardTemplate: React.FC<BilingualReportCardTemplateProps> = ({
  reportCard,
  student,
  classNameDetails,
  divisionDetails,
  academicYearDetails,
  marksData = [],
  attendanceData = { workingDays: 220, presentDays: 205, percentage: '93.1%' },
  schoolSettings = {
    schoolName: 'Mother Teresa Foundation School',
    subHeader: "Human Resource Development Center's",
    title: 'Bharat Ratna MOTHER TERESA FOUNDATION SCHOOL',
    address: 'Gangapur Dist. Chha. Sambhajinagar - 431109',
  },
}) => {
  const getSectionLines = (key: string) => {
    const sec = reportCard?.sections?.find((s: any) => s.sectionKey === key);
    const parseLines = (raw: string | undefined) => {
      if (!raw) return [];
      return raw.split('\n').map(l => l.trim()).filter(Boolean);
    };
    return {
      progress: parseLines(sec?.progressShown),
      challenges: parseLines(sec?.challengesFaced),
    };
  };

  const secA = getSectionLines('A');
  const secB = getSectionLines('B');
  const secC = getSectionLines('C');
  const secD = getSectionLines('D');
  const secE = getSectionLines('E');

  const assessment = reportCard?.assessment || {};

  const defaultSubjects = [
    { name: 'English Reading', max: 100, marksObtained: 92, grade: 'A+' },
    { name: 'English Writing', max: 100, marksObtained: 88, grade: 'A' },
    { name: 'English Recitation', max: 100, marksObtained: 95, grade: 'A+' },
    { name: 'Hindi', max: 100, marksObtained: 85, grade: 'A' },
    { name: 'Marathi', max: 100, marksObtained: 90, grade: 'A+' },
    { name: 'Maths (Numeracy)', max: 100, marksObtained: 94, grade: 'A+' },
    { name: 'Environment Studies', max: 100, marksObtained: 89, grade: 'A' },
    { name: 'Social Emotional', max: 100, marksObtained: 91, grade: 'A+' },
    { name: 'Drawing', max: 100, marksObtained: 96, grade: 'A+' },
  ];

  const subjectsToRender = (marksData && marksData.length > 0)
    ? marksData.map(m => ({
        name: m.subject?.name || m.name || '',
        max: m.subject?.maxMarks || m.max || 100,
        marksObtained: m.isAbsent ? 'AB' : (m.marksObtained !== null && m.marksObtained !== undefined ? m.marksObtained : (m.marks !== undefined ? m.marks : null)),
        grade: m.grade || '—',
      }))
    : defaultSubjects;

  const totalMax = subjectsToRender.reduce((sum, s) => sum + (s.max || 100), 0);
  const totalObtained = subjectsToRender.reduce((sum, s) => {
    const val = s.marksObtained;
    if (val === 'AB' || val === null || val === '—') return sum;
    return sum + Number(val);
  }, 0);

  let cumulativeGrade = 'A+';
  if (totalMax > 0 && totalObtained > 0) {
    const pct = (totalObtained / totalMax) * 100;
    if (pct >= 90) cumulativeGrade = 'A+';
    else if (pct >= 80) cumulativeGrade = 'A';
    else if (pct >= 70) cumulativeGrade = 'B+';
    else if (pct >= 60) cumulativeGrade = 'B';
    else if (pct >= 50) cumulativeGrade = 'C';
    else if (pct >= 40) cumulativeGrade = 'D';
    else cumulativeGrade = 'E';
  }

  const studentName = student?.name || reportCard?.student?.name || '________________________________________________';
  const className = classNameDetails?.name || reportCard?.class?.name || 'Sr.KG';
  const divName = divisionDetails?.name || reportCard?.division?.name || 'A';
  const rollNo = student?.rollNo || reportCard?.student?.rollNo || '________________';
  const academicYearName = academicYearDetails?.name || reportCard?.academicYear?.name || '2025-2026';

  const renderSectionTableRows = (secData: { progress: string[]; challenges: string[] }) => {
    const rowsCount = 3; // Exactly 3 rows matching updated report card layout
    const rows = [];
    for (let i = 0; i < rowsCount; i++) {
      const progText = secData.progress[i] || '';
      const chalText = secData.challenges[i] || '';
      rows.push(
        <tr key={i} className="border-b border-red-900/30 text-xs min-h-[28px]">
          <td className="p-2 border-r border-red-900/40 text-slate-900 font-medium w-1/2 align-top">
            {progText ? progText : ''}
          </td>
          <td className="p-2 text-slate-900 font-medium w-1/2 align-top">
            {chalText ? chalText : ''}
          </td>
        </tr>
      );
    }
    return rows;
  };

  return (
    <div className="w-[210mm] mx-auto text-slate-900 font-sans print:w-full print:p-0 bg-white">
      {/* ==================== PAGE 1 ==================== */}
      <div className="border-2 border-red-900 p-5 bg-white space-y-4 print:border-2 print:border-red-900 min-h-[297mm]">
        {/* Header Title Block */}
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-red-900">Mother Teresa Foundation School</p>
          <p className="text-xs font-medium text-slate-700">Human Resource Development Center's</p>
          <p className="text-xs font-bold text-red-900">Bharat Ratna</p>
          <h1 className="text-xl font-extrabold text-red-950 uppercase tracking-wide">
            MOTHER TERESA FOUNDATION SCHOOL
          </h1>
          <p className="text-xs text-slate-700 font-medium">Gangapur Dist. Chha. Sambhajinagar - 431109</p>
          <div className="pt-2">
            <h2 className="text-sm font-bold text-slate-900">
              Annual Progress Report Card {className} (From 16th June 2025 to 4th April 2026)
            </h2>
            <h3 className="text-sm font-bold text-red-900 font-serif">
              वार्षिक प्रगती अहवाल पत्रक २०२५ - २०२६
            </h3>
          </div>
        </div>

        {/* Student Details & Photo Box */}
        <div className="flex justify-between items-start pt-2">
          <div className="space-y-3 text-xs flex-1 pr-6 pt-1">
            <div className="flex items-baseline">
              <span className="font-bold text-slate-900 min-w-[70px]">Name :</span>
              <span className="font-semibold text-slate-900 border-b border-dotted border-slate-700 flex-1 px-1">{studentName}</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-baseline">
                <span className="font-bold text-slate-900 mr-2">Class :</span>
                <span className="font-semibold text-slate-900 border-b border-dotted border-slate-700 min-w-[80px] px-1">{className}</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold text-slate-900 mr-2">Div :</span>
                <span className="font-semibold text-slate-900 border-b border-dotted border-slate-700 min-w-[80px] px-1">{divName}</span>
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold text-slate-900 min-w-[70px]">Roll No. :</span>
              <span className="font-semibold text-slate-900 border-b border-dotted border-slate-700 min-w-[120px] px-1">{rollNo}</span>
            </div>
          </div>

          {/* Photo Box */}
          <div className="w-24 h-28 border-2 border-red-900/60 rounded-sm flex flex-col items-center justify-center text-center p-0.5 text-xs bg-white shrink-0 overflow-hidden shadow-sm">
            {(student?.photo || reportCard?.student?.photo) ? (
              <img 
                src={student?.photo || reportCard?.student?.photo} 
                alt={studentName} 
                className="w-full h-full object-cover rounded-sm" 
              />
            ) : (
              <div className="text-slate-400 font-semibold text-[11px] flex flex-col items-center">
                <span>Student</span>
                <span>Photo</span>
              </div>
            )}
          </div>
        </div>

        {/* Section A */}
        <div className="border border-red-900 rounded-sm overflow-hidden">
          <div className="bg-white px-3 py-1 font-bold text-xs text-red-950 border-b border-red-900">
            A. Physical & Motor Development : (शारीरिक आणि मोटर विकास)
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-red-50/50 text-slate-900 border-b border-red-900 text-xs font-bold">
                <th className="p-2 w-1/2 border-r border-red-900 align-top">
                  Progress Shown During the Academic Year 2025-26<br />
                  <span className="font-normal text-[11px] text-red-900">शैक्षणिक वर्षात केलेली विशेष प्रगती</span>
                </th>
                <th className="p-2 w-1/2 align-top">
                  Challenges to be Faced During the Next Academic year 2026-27<br />
                  <span className="font-normal text-[11px] text-red-900">पुढील शैक्षणिक वर्षासाठी असलेली आव्हाने</span>
                </th>
              </tr>
            </thead>
            <tbody>{renderSectionTableRows(secA)}</tbody>
          </table>
        </div>

        {/* Section B */}
        <div className="border border-red-900 rounded-sm overflow-hidden">
          <div className="bg-white px-3 py-1 font-bold text-xs text-red-950 border-b border-red-900">
            B. Social Emotional Development / Personal & Social Qualities : (सामाजिक - भावनिक विकास / वैयक्तिक आणि सामाजिक गुण)
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-red-50/50 text-slate-900 border-b border-red-900 text-xs font-bold">
                <th className="p-2 w-1/2 border-r border-red-900 align-top">
                  Progress Shown During the Academic Year 2025-26<br />
                  <span className="font-normal text-[11px] text-red-900">शैक्षणिक वर्षात केलेली विशेष प्रगती</span>
                </th>
                <th className="p-2 w-1/2 align-top">
                  Challenges to be Faced During the Next Academic year 2026-27<br />
                  <span className="font-normal text-[11px] text-red-900">पुढील शैक्षणिक वर्षासाठी असलेली आव्हाने</span>
                </th>
              </tr>
            </thead>
            <tbody>{renderSectionTableRows(secB)}</tbody>
          </table>
        </div>

        {/* Section C */}
        <div className="border border-red-900 rounded-sm overflow-hidden">
          <div className="bg-white px-3 py-1 font-bold text-xs text-red-950 border-b border-red-900">
            C. Cognitive Development : (संज्ञानात्मक विकास)
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-red-50/50 text-slate-900 border-b border-red-900 text-xs font-bold">
                <th className="p-2 w-1/2 border-r border-red-900 align-top">
                  Progress Shown During the Academic Year 2025-26<br />
                  <span className="font-normal text-[11px] text-red-900">शैक्षणिक वर्षात केलेली विशेष प्रगती</span>
                </th>
                <th className="p-2 w-1/2 align-top">
                  Challenges to be Faced During the Next Academic year 2026-27<br />
                  <span className="font-normal text-[11px] text-red-900">पुढील शैक्षणिक वर्षासाठी असलेली आव्हाने</span>
                </th>
              </tr>
            </thead>
            <tbody>{renderSectionTableRows(secC)}</tbody>
          </table>
        </div>

        {/* Section D */}
        <div className="border border-red-900 rounded-sm overflow-hidden">
          <div className="bg-white px-3 py-1 font-bold text-xs text-red-950 border-b border-red-900">
            D. Language & Literacy Development : (भाषा आणि साक्षरता विकास)
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-red-50/50 text-slate-900 border-b border-red-900 text-xs font-bold">
                <th className="p-2 w-1/2 border-r border-red-900 align-top">
                  Progress Shown During the Academic Year 2025-26<br />
                  <span className="font-normal text-[11px] text-red-900">शैक्षणिक वर्षात केलेली विशेष प्रगती</span>
                </th>
                <th className="p-2 w-1/2 align-top">
                  Challenges to be Faced During the Next Academic year 2026-27<br />
                  <span className="font-normal text-[11px] text-red-900">पुढील शैक्षणिक वर्षासाठी असलेली आव्हाने</span>
                </th>
              </tr>
            </thead>
            <tbody>{renderSectionTableRows(secD)}</tbody>
          </table>
        </div>
      </div>

      {/* ==================== PAGE 2 ==================== */}
      <div className="border-2 border-red-900 p-5 bg-white space-y-4 my-8 print:my-0 print:border-2 print:border-red-900 min-h-[297mm]">
        {/* Section E */}
        <div className="border border-red-900 rounded-sm overflow-hidden">
          <div className="bg-white px-3 py-1 font-bold text-xs text-red-950 border-b border-red-900">
            E. Creative & Aesthetic Development : (सर्जनशील आणि कलात्मक विकास)
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-red-50/50 text-slate-900 border-b border-red-900 text-xs font-bold">
                <th className="p-2 w-1/2 border-r border-red-900 align-top">
                  Progress Shown During the Academic Year 2025-26<br />
                  <span className="font-normal text-[11px] text-red-900">शैक्षणिक वर्षात केलेली विशेष प्रगती</span>
                </th>
                <th className="p-2 w-1/2 align-top">
                  Challenges to be Faced During the Next Academic year 2026-27<br />
                  <span className="font-normal text-[11px] text-red-900">पुढील शैक्षणिक वर्षासाठी असलेली आव्हाने</span>
                </th>
              </tr>
            </thead>
            <tbody>{renderSectionTableRows(secE)}</tbody>
          </table>
        </div>

        {/* Section F Title & Table */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs text-red-950">
            F. Average Marks / Grades obtained during the academic year 2025-26 :
          </h3>

          <div className="border border-red-900 rounded-sm overflow-hidden">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-red-50/30 text-slate-900 font-bold border-b border-red-900 text-[11px]">
                  <th className="p-2 border-r border-red-900 text-left font-bold w-24">Subject</th>
                  {subjectsToRender.map((s, idx) => (
                    <th key={idx} className="p-1 border-r border-red-900 font-semibold">{s.name}</th>
                  ))}
                  <th className="p-1 font-extrabold w-16">Total</th>
                </tr>
                <tr className="border-b border-red-900 text-xs">
                  <td className="p-1.5 border-r border-red-900 text-left font-bold">Max Marks</td>
                  {subjectsToRender.map((s, idx) => (
                    <td key={idx} className="p-1 border-r border-red-900 font-medium">{s.max || 100}</td>
                  ))}
                  <td className="p-1 font-bold">{totalMax}</td>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-red-900 text-xs">
                  <td className="p-1.5 border-r border-red-900 font-bold text-left">Marks</td>
                  {subjectsToRender.map((s, idx) => (
                    <td key={idx} className="p-1 border-r border-red-900 font-medium">
                      {s.marksObtained !== null && s.marksObtained !== undefined ? s.marksObtained : '—'}
                    </td>
                  ))}
                  <td className="p-1 font-bold">{totalObtained}</td>
                </tr>
                <tr className="text-xs">
                  <td className="p-1.5 border-r border-red-900 font-bold text-left">Grades</td>
                  {subjectsToRender.map((s, idx) => (
                    <td key={idx} className="p-1 border-r border-red-900 font-bold text-red-950">
                      {s.grade || '—'}
                    </td>
                  ))}
                  <td className="p-1 font-bold text-red-950">{cumulativeGrade}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Attendance & Cumulative Average Grade Side by Side */}
          <div className="flex justify-between items-center gap-6 pt-2">
            <div className="border border-red-900 rounded-sm overflow-hidden text-xs flex-1">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-red-50/30 text-slate-900 font-bold border-b border-red-900 text-xs">
                    <th className="p-1.5 border-r border-red-900 w-1/3">Attendance</th>
                    <th className="p-1.5 border-r border-red-900 w-1/4">Working Days</th>
                    <th className="p-1.5 border-r border-red-900 w-1/4">Present Days</th>
                    <th className="p-1.5 w-1/4">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-xs">
                    <td className="p-2 border-r border-red-900 text-left font-medium text-[11px] leading-tight">
                      From 16th June 2025 to 4th April 2026
                    </td>
                    <td className="p-2 border-r border-red-900 font-semibold">{attendanceData.workingDays}</td>
                    <td className="p-2 border-r border-red-900 font-semibold">{attendanceData.presentDays}</td>
                    <td className="p-2 font-bold text-emerald-800">{attendanceData.percentage}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-4 border border-red-900 rounded-sm p-3 bg-white min-w-[280px]">
              <div>
                <p className="font-bold text-xs text-slate-900">Cumulative Average Grade</p>
                <p className="text-xs font-bold text-red-900 font-serif">संचयी सरासरी श्रेणी</p>
              </div>
              <div className="w-20 h-12 border border-slate-700 bg-white flex items-center justify-center font-bold text-lg text-slate-900 ml-auto">
                {cumulativeGrade}
              </div>
            </div>
          </div>
        </div>

        {/* Section G: Assessment & Progress Details */}
        <div className="space-y-3 pt-2 text-xs">
          <h3 className="font-bold text-xs text-red-950">
            G. Assessment & Progress Details :
          </h3>

          <div className="space-y-2 pl-1">
            <p className="font-semibold text-slate-900">
              1) Shows all round development in the academic year 2025-2026 (या शैक्षणिक वर्षामध्ये सर्वांगीण विकास दिसून आला का?)
            </p>
            <div className="flex items-center space-x-8 pl-4">
              <label className="flex items-center space-x-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={assessment.allRoundDevelopment === 'YES' || !assessment.allRoundDevelopment}
                  readOnly
                  className="w-4 h-4 text-red-900 border-slate-800 rounded-none focus:ring-0"
                />
                <span>Yes / होय</span>
              </label>

              <label className="flex items-center space-x-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={assessment.allRoundDevelopment === 'SATISFACTORY'}
                  readOnly
                  className="w-4 h-4 text-red-900 border-slate-800 rounded-none focus:ring-0"
                />
                <span>Satisfactory / समाधानकारक</span>
              </label>

              <label className="flex items-center space-x-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={assessment.allRoundDevelopment === 'NOT_SATISFACTORY'}
                  readOnly
                  className="w-4 h-4 text-red-900 border-slate-800 rounded-none focus:ring-0"
                />
                <span>Not Satisfactory / असमाधानकारक</span>
              </label>
            </div>
          </div>

          <div className="space-y-1 pl-1">
            <p className="font-semibold text-slate-900">
              2) Any one Strength Identified during the academic year : (शैक्षणिक वर्षामध्ये ओळखलेली बलस्थाने)
            </p>
            <div className="min-h-[30px] border-b border-slate-300 pl-4 py-1 font-medium text-slate-800">
              {assessment.strengthIdentified || ''}
            </div>
          </div>

          <div className="space-y-1 pl-1">
            <p className="font-semibold text-slate-900">
              3) Additional Support Needed in the academic year 2026-2027 : (शैक्षणिक वर्षामध्ये अतिरिक्त मदतीची गरज असलेले क्षेत्र)
            </p>
            <div className="min-h-[30px] border-b border-slate-300 pl-4 py-1 font-medium text-slate-800">
              {assessment.additionalSupportNeeded || ''}
            </div>
          </div>
        </div>

        {/* Section H: Parent's Feedback */}
        <div className="space-y-2 pt-2 text-xs">
          <h3 className="font-bold text-xs text-red-950">
            H. Parent's Feedback along with suggestions for his / her improvement : (विद्यार्थ्याच्या प्रगतीसाठी पालकांचा अभिप्राय व सूचना)
          </h3>
          <div className="space-y-4 pt-4 pb-2 px-2">
            <div className="border-b border-slate-400 h-2"></div>
            <div className="border-b border-slate-400 h-2"></div>
          </div>
        </div>

        {/* Signatures Footer */}
        <div className="pt-8 flex justify-between items-center text-xs font-bold text-slate-900 px-8">
          <span>Class Teacher's Sign.</span>
          <span>H.M's Sign.</span>
          <span>Parent's Sign.</span>
        </div>
      </div>
    </div>
  );
};

export default BilingualReportCardTemplate;
