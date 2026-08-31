import React from 'react';

export function KGReportCardPreview({ student, marks, attendance, remarks, signatures }: any) {
  return (
    <div className="print-area bg-white text-black p-8 max-w-4xl mx-auto border shadow-sm font-sans">
      <div className="text-center mb-6 border-b-2 border-blue-900 pb-4">
        <h1 className="text-xl font-bold text-blue-900 uppercase">Human Resource Development Center's</h1>
        <h2 className="text-2xl font-bold text-blue-900">Bharat Ratna Mother Teresa Foundation School</h2>
        <p className="text-sm">123 School Address, City, State</p>
        <h3 className="mt-4 text-lg font-semibold bg-blue-100 py-1 border border-blue-900">
          Annual Progress Report Card [Jr.KG/Sr.KG] (2024 - 2025)
        </h3>
      </div>
      
      <div className="flex justify-between items-start mb-6 border border-slate-300 p-4 rounded">
        <div className="space-y-2">
          <p><span className="font-semibold">Student Name:</span> {student?.name || 'John Doe'}</p>
          <p><span className="font-semibold">Class:</span> {student?.class || 'Sr.KG'} &nbsp;&nbsp;&nbsp; <span className="font-semibold">Div:</span> {student?.division || 'A'}</p>
          <p><span className="font-semibold">Roll No:</span> {student?.rollNo || '12'}</p>
        </div>
        <div className="w-24 h-32 border-2 border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50">
          Photo
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-bold text-blue-900 bg-blue-50 p-2 border border-blue-200">Section F: Academic Performance</h4>
        <table className="w-full border-collapse border border-slate-300 mt-2 text-sm text-center">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-2 text-left">Subject</th>
              <th className="border border-slate-300 p-2">Max Marks</th>
              <th className="border border-slate-300 p-2">Marks Obtained</th>
              <th className="border border-slate-300 p-2">Grade</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="border border-slate-300 p-2 text-left">English Reading</td><td className="border p-2">100</td><td className="border p-2">95</td><td className="border p-2">A+</td></tr>
            <tr><td className="border border-slate-300 p-2 text-left">Maths (Numeracy)</td><td className="border p-2">100</td><td className="border p-2">88</td><td className="border p-2">A</td></tr>
            <tr><td className="border border-slate-300 p-2 text-left">Drawing</td><td className="border p-2">50</td><td className="border p-2">45</td><td className="border p-2">A+</td></tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-slate-300 p-4">
          <h4 className="font-bold mb-2">Attendance</h4>
          <p>Working Days: 220</p>
          <p>Present Days: 210</p>
          <p className="font-semibold mt-2">Percentage: 95.45%</p>
        </div>
        <div className="border border-slate-300 p-4 flex flex-col justify-center items-center bg-blue-50">
          <h4 className="font-bold text-lg">Cumulative Average Grade</h4>
          <span className="text-4xl font-bold text-blue-900 mt-2">A</span>
        </div>
      </div>

      <div className="mt-12 flex justify-between px-8 border-t border-slate-300 pt-16">
        <div className="text-center">
          <div className="w-32 border-b border-black mb-2"></div>
          <p className="font-semibold text-sm">Class Teacher's Sign</p>
        </div>
        <div className="text-center">
          <div className="w-32 border-b border-black mb-2"></div>
          <p className="font-semibold text-sm">H.M.'s Sign</p>
        </div>
        <div className="text-center">
          <div className="w-32 border-b border-black mb-2"></div>
          <p className="font-semibold text-sm">Parent's Sign</p>
        </div>
      </div>
    </div>
  );
}
