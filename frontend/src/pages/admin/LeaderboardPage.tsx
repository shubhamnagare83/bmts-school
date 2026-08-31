import React, { useEffect, useState } from 'react';
import { marksApi } from '@/api/marks';
import { classesApi } from '@/api/classes';
import { divisionsApi } from '@/api/divisions';
import { examsApi } from '@/api/exams';
import { academicYearsApi } from '@/api/academicYears';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Trophy, Medal, Award } from 'lucide-react';

const gradeColor: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-700',
  'A': 'bg-green-100 text-green-700',
  'B+': 'bg-blue-100 text-blue-700',
  'B': 'bg-indigo-100 text-indigo-700',
  'C': 'bg-yellow-100 text-yellow-700',
  'D': 'bg-orange-100 text-orange-700',
  'E': 'bg-red-100 text-red-700',
  'N/A': 'bg-slate-100 text-slate-500',
};

const rankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-400" />;
  if (rank === 3) return <Award className="w-4 h-4 text-amber-600" />;
  return <span className="text-slate-500 font-semibold text-sm">{rank}</span>;
};

export default function LeaderboardPage() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([academicYearsApi.getAll(), classesApi.getAll()]).then(([ayRes, clsRes]) => {
      if (ayRes.data.success) {
        const ays = ayRes.data.data;
        setAcademicYears(ays);
        const active = ays.find((y: any) => y.isActive) || ays[0];
        if (active) setSelectedYear(active.id);
      }
      if (clsRes.data.success) setClasses(clsRes.data.data);
    });
  }, []);

  useEffect(() => {
    if (selectedClass) {
      divisionsApi.getByClass(selectedClass).then((res) => {
        if (res.data.success) setDivisions(res.data.data);
      });
      if (selectedYear) {
        examsApi.getAll({ classId: selectedClass, academicYearId: selectedYear }).then((res) => {
          if (res.data.success) setExams(res.data.data);
        });
      }
    }
  }, [selectedClass, selectedYear]);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedYear, selectedClass, selectedDivision, selectedExam]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (selectedYear) params.academicYearId = selectedYear;
      if (selectedClass) params.classId = selectedClass;
      if (selectedDivision) params.divisionId = selectedDivision;
      if (selectedExam) params.examId = selectedExam;

      const res = await marksApi.getLeaderboard(params);
      if (res.data.success) setLeaderboard(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const schoolTopper = leaderboard[0] || null;
  const classToppers = leaderboard.length > 0
    ? Object.values(
        leaderboard.reduce((acc: Record<string, any>, s: any) => {
          if (!acc[s.class] || acc[s.class].percentage < s.percentage) acc[s.class] = s;
          return acc;
        }, {})
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Rankings based on total marks and percentage</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Select
          label="Academic Year"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          options={[
            { label: 'All Years', value: '' },
            ...academicYears.map((y) => ({ label: y.name, value: y.id })),
          ]}
        />
        <Select
          label="Class"
          value={selectedClass}
          onChange={(e) => { setSelectedClass(e.target.value); setSelectedDivision(''); setSelectedExam(''); }}
          options={[
            { label: 'All Classes', value: '' },
            ...classes.map((c) => ({ label: c.name, value: c.id })),
          ]}
        />
        <Select
          label="Division"
          value={selectedDivision}
          onChange={(e) => setSelectedDivision(e.target.value)}
          options={[
            { label: 'All Divisions', value: '' },
            ...divisions.map((d) => ({ label: d.name, value: d.id })),
          ]}
          disabled={!selectedClass}
        />
        <Select
          label="Exam"
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          options={[
            { label: 'All Exams', value: '' },
            ...exams.map((e) => ({ label: e.name, value: e.id })),
          ]}
          disabled={!selectedClass}
        />
      </div>

      {/* Topper Highlights */}
      {leaderboard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((s, i) => (
            <div
              key={s.studentId}
              className={`rounded-xl p-4 border ${
                i === 0
                  ? 'bg-yellow-50 border-yellow-200'
                  : i === 1
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`text-3xl font-black ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : 'text-amber-600'}`}>
                  #{i + 1}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{s.name}</p>
                  <p className="text-sm text-slate-500">{s.class}-{s.division}</p>
                  <p className="text-sm text-slate-500">{s.admissionNo}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-slate-800">{s.percentage}%</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${gradeColor[s.grade] || gradeColor['N/A']}`}>
                      {s.grade}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{s.totalMarks}/{s.maxMarks} marks</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Class Toppers */}
      {classToppers.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700">Class Toppers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {classToppers.map((s: any) => (
                <div key={s.studentId} className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                  <p className="text-xs text-indigo-500 font-semibold">Class {s.class}</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.division} Division</p>
                  <p className="font-bold text-indigo-700 mt-1">{s.percentage}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Leaderboard Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Full Rankings ({leaderboard.length} students)
            </CardTitle>
            {leaderboard.length === 0 && !loading && (
              <span className="text-xs text-slate-400">No marks data matches the selected filters</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No ranking data available</p>
              <p className="text-sm mt-1">Enter marks for students to see rankings here</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-2 px-3 text-slate-500 text-xs font-semibold">Rank</th>
                    <th className="text-left py-2 px-3 text-slate-500 text-xs font-semibold">Student</th>
                    <th className="text-left py-2 px-3 text-slate-500 text-xs font-semibold">Admission No</th>
                    <th className="text-left py-2 px-3 text-slate-500 text-xs font-semibold">Class</th>
                    <th className="text-left py-2 px-3 text-slate-500 text-xs font-semibold">Division</th>
                    <th className="text-right py-2 px-3 text-slate-500 text-xs font-semibold">Total Marks</th>
                    <th className="text-right py-2 px-3 text-slate-500 text-xs font-semibold">%</th>
                    <th className="text-center py-2 px-3 text-slate-500 text-xs font-semibold">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((s) => (
                    <tr
                      key={s.studentId}
                      className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                        s.rank <= 3 ? 'bg-yellow-50/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">{rankIcon(s.rank)}</div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{s.name}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-xs">{s.admissionNo}</td>
                      <td className="py-2.5 px-3 text-slate-600">{s.class}</td>
                      <td className="py-2.5 px-3 text-slate-500">{s.division}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{s.totalMarks}/{s.maxMarks}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800">{s.percentage}%</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${gradeColor[s.grade] || gradeColor['N/A']}`}>
                          {s.grade}
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
