import React, { useEffect, useState } from 'react';
import { studentsApi } from '@/api/students';
import { attendanceApi } from '@/api/attendance';
import { academicYearsApi } from '@/api/academicYears';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { ClipboardCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function MyAttendance() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
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
      fetchAttendance();
    }
  }, [studentId, selectedYearId]);

  const fetchAttendance = () => {
    setLoading(true);
    attendanceApi.getStudentAttendance(studentId, selectedYearId)
      .then((res) => {
        if (res.data.success) setAttendanceRecords(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const total = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
  const absentCount = attendanceRecords.filter((a) => a.status === 'ABSENT').length;
  const leaveCount = attendanceRecords.filter((a) => a.status === 'LEAVE').length;
  const attendancePercentage = total > 0 ? ((presentCount / total) * 100).toFixed(1) : '100';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Attendance Record</h1>
          <p className="text-slate-500 text-sm">View attendance percentage and daily logs</p>
        </div>
        <div className="w-48">
          <Select value={selectedYearId} onChange={(e) => setSelectedYearId(e.target.value)}>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Overall Attendance</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{attendancePercentage}%</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Present Days</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{presentCount}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Absent Days</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{absentCount}</p>
          </div>
          <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Leave Days</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{leaveCount}</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Attendance Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" /> Daily Attendance Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : attendanceRecords.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-sm">No attendance records logged yet for this academic year.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-medium text-xs uppercase">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Day</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceRecords.map((item) => {
                    const dateObj = new Date(item.date);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {dateObj.toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {dateObj.toLocaleDateString(undefined, { weekday: 'long' })}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            item.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' :
                            item.status === 'ABSENT' ? 'bg-red-50 text-red-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
