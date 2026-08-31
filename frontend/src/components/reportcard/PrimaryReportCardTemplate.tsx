import React from 'react';

interface PrimaryReportCardTemplateProps {
  reportCard?: any;
  student?: any;
  classNameDetails?: any;
  divisionDetails?: any;
  academicYearDetails?: any;
  marksData?: any[];
  attendanceData?: { workingDays: number; presentDays: number; percentage: string };
  teacherRemarks?: string;
  schoolSettings?: any;
}

export const PrimaryReportCardTemplate: React.FC<PrimaryReportCardTemplateProps> = ({
  reportCard,
  student,
  classNameDetails,
  divisionDetails,
  academicYearDetails,
  marksData = [],
  attendanceData = { workingDays: 220, presentDays: 208, percentage: '94.5%' },
  teacherRemarks = 'Demonstrates excellent academic performance, active participation in classroom discussions, and exemplary discipline.',
  schoolSettings = {
    schoolName: 'Bharat Ratna MOTHER TERESA ENGLISH SCHOOL',
    address: 'Gangapur Dist.Chha.Sambhajinagar - 431109',
  },
}) => {
  const defaultSubjects = [
    { name: 'English', max: 100, marksObtained: null, grade: '—', pass: false },
    { name: 'Hindi', max: 100, marksObtained: null, grade: '—', pass: false },
    { name: 'Marathi', max: 100, marksObtained: null, grade: '—', pass: false },
    { name: 'Mathematics', max: 100, marksObtained: null, grade: '—', pass: false },
    { name: 'Science', max: 100, marksObtained: null, grade: '—', pass: false },
    { name: 'Social Studies', max: 100, marksObtained: null, grade: '—', pass: false },
    { name: 'Computer Science', max: 100, marksObtained: null, grade: '—', pass: false },
    { name: 'Drawing & Art', max: 100, marksObtained: null, grade: '—', pass: false },
  ];

  const subjectsToRender = (marksData && marksData.length > 0)
    ? marksData.map(m => ({
        name: m.subject?.name || m.name || '',
        max: m.subject?.maxMarks || m.max || 100,
        marksObtained: m.isAbsent ? 'AB' : (m.marksObtained !== null && m.marksObtained !== undefined ? m.marksObtained : (m.marks !== undefined ? m.marks : null)),
        grade: m.grade || '—',
        pass: m.isPassing !== undefined ? m.isPassing : m.pass,
      }))
    : defaultSubjects;

  const totalMax = subjectsToRender.reduce((sum, s) => sum + (s.max || 100), 0);
  const totalObtained = subjectsToRender.reduce((sum, s) => {
    const val = s.marksObtained;
    if (val === 'AB' || val === null || val === '—') return sum;
    return sum + Number(val);
  }, 0);
  const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0.0';

  let overallGrade = '—';
  if (totalMax > 0 && totalObtained > 0) {
    const percNum = Number(percentage);
    if (percNum >= 90) overallGrade = 'A+';
    else if (percNum >= 80) overallGrade = 'A';
    else if (percNum >= 70) overallGrade = 'B+';
    else if (percNum >= 60) overallGrade = 'B';
    else if (percNum >= 50) overallGrade = 'C';
    else if (percNum >= 40) overallGrade = 'D';
    else overallGrade = 'E';
  }

  const studentName = student?.name || reportCard?.student?.name || 'ADITI SHARMA';
  const className = classNameDetails?.name || reportCard?.class?.name || '5th';
  const divName = divisionDetails?.name || reportCard?.division?.name || 'A';
  const rollNo = student?.rollNo || reportCard?.student?.rollNo || '14';
  const admissionNo = student?.admissionNo || reportCard?.student?.admissionNo || 'ADM2025-089';
  const academicYearName = academicYearDetails?.name || reportCard?.academicYear?.name || '2025-2026';

  return (
    <div className="w-[210mm] mx-auto bg-white text-slate-900 font-sans p-6 border-4 border-indigo-950 rounded-sm space-y-4 print:w-full print:p-0 print:border-4">
      {/* Header Banner */}
      <div className="bg-indigo-950 text-white p-3 rounded-sm flex items-center justify-between border-2 border-indigo-900">
        <div className="w-16 h-16 rounded-full bg-white border-2 border-amber-400 flex flex-col items-center justify-center font-bold text-indigo-950 text-[10px] text-center p-1 leading-tight shrink-0">
          <span>Mother</span>
          <span>Teresa</span>
        </div>

        <div className="text-center space-y-0.5 flex-1 px-3">
          <p className="text-[11px] font-medium tracking-wide text-amber-200 uppercase">
            Human Resource Development Center's
          </p>
          <h1 className="text-xl font-extrabold tracking-wider text-amber-400 uppercase font-serif">
            Bharat Ratna
          </h1>
          <h2 className="text-lg font-black tracking-widest text-white uppercase">
            MOTHER TERESA ENGLISH SCHOOL
          </h2>
          <p className="text-[10px] text-slate-200">
            {schoolSettings?.address || 'Gangapur Dist.Chha.Sambhajinagar - 431109'}
          </p>
        </div>

        <div className="w-16 h-16 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center font-bold text-indigo-950 text-[9px] text-center p-1 leading-tight shrink-0">
          <span>School</span>
          <span>Logo</span>
        </div>
      </div>

      {/* Title */}
      <div className="bg-indigo-50 border border-indigo-900 text-center py-1.5 px-3 rounded-sm">
        <h3 className="text-xs font-bold text-indigo-950 uppercase">
          Annual Progress Report Card — Class {className} (Academic Year {academicYearName})
        </h3>
        <p className="text-[11px] font-bold text-indigo-900 font-serif">
          वार्षिक प्रगती अहवाल पत्रक (इयत्ता १ ली ते १० वी)
        </p>
      </div>

      {/* Student Profile Info */}
      <div className="flex justify-between items-start border border-indigo-900/40 p-3 rounded-sm bg-indigo-50/20 text-xs">
        <div className="space-y-2 flex-1 pr-4">
          <div>
            <span className="font-bold text-indigo-950">Student Name : </span>
            <span className="font-semibold text-slate-900 underline uppercase decoration-slate-300 underline-offset-4">{studentName}</span>
          </div>
          <div className="flex gap-6">
            <div>
              <span className="font-bold text-indigo-950">Admission No : </span>
              <span className="font-mono font-semibold text-slate-800">{admissionNo}</span>
            </div>
            <div>
              <span className="font-bold text-indigo-950">Class : </span>
              <span className="font-semibold text-slate-800">{className}</span>
            </div>
            <div>
              <span className="font-bold text-indigo-950">Div : </span>
              <span className="font-semibold text-slate-800">{divName}</span>
            </div>
            <div>
              <span className="font-bold text-indigo-950">Roll No : </span>
              <span className="font-semibold text-slate-800">{rollNo}</span>
            </div>
          </div>
        </div>

        {/* Photo Box */}
        <div className="w-20 h-24 border-2 border-indigo-900/60 rounded-sm flex flex-col items-center justify-center text-center p-0.5 text-[10px] bg-white shrink-0 overflow-hidden shadow-sm">
          {(student?.photo || reportCard?.student?.photo) ? (
            <img 
              src={student?.photo || reportCard?.student?.photo} 
              alt={studentName} 
              className="w-full h-full object-cover rounded-sm" 
            />
          ) : (
            <div className="text-indigo-900/60 font-semibold text-[9px] flex flex-col items-center">
              <span>Affix</span>
              <span>Photo</span>
            </div>
          )}
        </div>
      </div>

      {/* Subject Marks Table */}
      <div className="border border-indigo-900 rounded-sm overflow-hidden text-xs">
        <div className="bg-indigo-900 text-white px-3 py-1 font-bold text-center">
          Academic Performance Summary ({academicYearName})
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-indigo-100/70 text-indigo-950 font-bold border-b border-indigo-900 text-[11px]">
              <th className="p-2 border-r border-indigo-900 w-12 text-center">#</th>
              <th className="p-2 border-r border-indigo-900">Subject Name</th>
              <th className="p-2 border-r border-indigo-900 text-center">Max Marks</th>
              <th className="p-2 border-r border-indigo-900 text-center">Marks Obtained</th>
              <th className="p-2 border-r border-indigo-900 text-center">Grade</th>
              <th className="p-2 text-center">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-900/30 font-medium text-slate-800">
            {subjectsToRender.map((s, idx) => (
              <tr key={idx} className="hover:bg-indigo-50/30">
                <td className="p-2 text-center font-mono text-slate-500 border-r border-indigo-900/30">{idx + 1}</td>
                <td className="p-2 border-r border-indigo-900/30 font-semibold">{s.name}</td>
                <td className="p-2 border-r border-indigo-900/30 text-center font-mono">{s.max || 100}</td>
                <td className="p-2 border-r border-indigo-900/30 text-center font-mono font-bold text-slate-900">
                  {s.marksObtained !== null && s.marksObtained !== undefined ? s.marksObtained : '—'}
                </td>
                <td className="p-2 border-r border-indigo-900/30 text-center font-bold text-indigo-900">
                  {s.grade || '—'}
                </td>
                <td className={`p-2 text-center font-bold ${s.marksObtained === null ? 'text-slate-500' : s.pass ? 'text-emerald-700' : 'text-red-600'}`}>
                  {s.marksObtained === null ? '—' : s.pass ? 'PASS' : 'FAIL'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-indigo-100 font-extrabold border-t-2 border-indigo-900 text-indigo-950 text-xs">
              <td colSpan={2} className="p-2 border-r border-indigo-900 text-right uppercase">Grand Total:</td>
              <td className="p-2 border-r border-indigo-900 text-center font-mono">{totalMax}</td>
              <td className="p-2 border-r border-indigo-900 text-center font-mono text-sm">{totalObtained}</td>
              <td className="p-2 border-r border-indigo-900 text-center text-sm">{overallGrade}</td>
              <td className="p-2 text-center text-emerald-800 text-sm">PASSED</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary KPI & Attendance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="border border-indigo-900 rounded-sm p-3 bg-indigo-50/30 space-y-2">
          <h4 className="font-bold text-indigo-950 border-b border-indigo-900/40 pb-1">
            Overall Result KPI
          </h4>
          <div className="grid grid-cols-3 text-center gap-2 pt-1">
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Percentage</p>
              <p className="font-extrabold text-indigo-900 text-sm font-mono">{percentage}%</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Overall Grade</p>
              <p className="font-extrabold text-indigo-900 text-sm">{overallGrade}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Class Rank</p>
              <p className="font-extrabold text-emerald-700 text-sm font-mono">3rd</p>
            </div>
          </div>
        </div>

        <div className="border border-indigo-900 rounded-sm p-3 bg-indigo-50/30 space-y-2">
          <h4 className="font-bold text-indigo-950 border-b border-indigo-900/40 pb-1">
            Attendance Record (उपस्थिती)
          </h4>
          <div className="grid grid-cols-3 text-center gap-2 pt-1">
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Working Days</p>
              <p className="font-bold text-slate-800 font-mono">{attendanceData.workingDays}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Present Days</p>
              <p className="font-bold text-slate-800 font-mono">{attendanceData.presentDays}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Percentage</p>
              <p className="font-extrabold text-emerald-700 font-mono">{attendanceData.percentage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Remarks Section */}
      <div className="border border-indigo-900 rounded-sm p-3 space-y-1.5 text-xs bg-white">
        <h4 className="font-bold text-indigo-950 border-b border-indigo-900/40 pb-1">
          Class Teacher Remarks & Evaluation (शिक्षक अभिप्राय) :
        </h4>
        <p className="pl-2 font-medium text-slate-800 leading-relaxed pt-1">
          {teacherRemarks}
        </p>
      </div>

      {/* Section H: Parent's Feedback (MUST REMAIN BLANK FOR HANDWRITING) */}
      <div className="border border-indigo-900 rounded-sm p-3 space-y-2 text-xs bg-white">
        <h4 className="font-bold text-indigo-950">
          Parent's Feedback along with suggestions for his / her improvement : (पालकांचा अभिप्राय व सूचना)
        </h4>
        {/* Lined area left empty */}
        <div className="space-y-4 pt-2 pb-4 px-2">
          <div className="border-b border-dashed border-slate-300 h-4"></div>
          <div className="border-b border-dashed border-slate-300 h-4"></div>
          <div className="border-b border-dashed border-slate-300 h-4"></div>
        </div>
      </div>

      {/* Signatures Footer */}
      <div className="pt-8 flex justify-between items-center text-xs font-bold text-indigo-950 px-4">
        <div className="text-center space-y-1">
          <div className="w-32 border-b border-indigo-900"></div>
          <p>Class Teacher's Sign.</p>
        </div>

        <div className="text-center space-y-1">
          <div className="w-32 border-b border-indigo-900"></div>
          <p>H.M.'s Sign.</p>
        </div>

        <div className="text-center space-y-1">
          <div className="w-32 border-b border-indigo-900"></div>
          <p>Parent's Sign.</p>
        </div>
      </div>
    </div>
  );
};

export default PrimaryReportCardTemplate;
