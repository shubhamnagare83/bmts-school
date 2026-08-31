import React, { useEffect, useState } from 'react';
import { studentsApi } from '@/api/students';
import { marksApi } from '@/api/marks';
import { academicYearsApi } from '@/api/academicYears';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Award, BookOpen } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function MyMarks() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [marksRecords, setMarksRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      studentsApi.getMe(),
      academicYearsApi.getAll(),
    ]).then(([studRes, yearRes]) => {
      if (studRes.data.success && studRes.data.data) {
        setStudentId(studRes.data.data.id);
      }
      if (yearRes.data.success && yearRes.data.data.length > 0) {
        setAcademicYears(yearRes.data.data);
        const active = yearRes.data.data.find((y: any) => y.isActive) || yearRes.data.data[0];
        setSelectedYearId(active.id);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (studentId && selectedYearId) {
      fetchMarks();
    }
  }, [studentId, selectedYearId]);

  const fetchMarks = () => {
    setLoading(true);
    marksApi.getByStudent(studentId, { academicYearId: selectedYearId })
      .then((res: any) => {
        if (res.data.success) setMarksRecords(res.data.data);
      })
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Exam Marks & Subject Performance</h1>
          <p className="text-slate-500 text-sm">View subject scores and grades across term exams</p>
        </div>
        <div className="w-48">
          <Select value={selectedYearId} onChange={(e) => setSelectedYearId(e.target.value)}>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" /> Subject Exam Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : marksRecords.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-sm">No exam marks published yet for this academic year.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-medium text-xs uppercase">
                    <th className="py-3 px-4">Exam Name</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 text-center">Max Marks</th>
                    <th className="py-3 px-4 text-center">Marks Obtained</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marksRecords.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800">{m.exam?.name}</td>
                      <td className="py-3 px-4 text-slate-700 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-indigo-600" /> {m.subject?.name}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-mono">{m.subject?.maxMarks || 100}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 font-mono">
                        {m.isAbsent ? '-' : m.marksObtained ?? '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          m.isAbsent ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {m.isAbsent ? 'Absent' : 'Present'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
