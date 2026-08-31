import React, { useState, useEffect } from 'react';
import { classesApi } from '@/api/classes';
import { divisionsApi } from '@/api/divisions';
import { studentsApi } from '@/api/students';
import { attendanceApi } from '@/api/attendance';
import { academicYearsApi } from '@/api/academicYears';
import { teachingLogsApi } from '@/api/teachingLogs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { 
  ClipboardCheck, CheckCircle2, XCircle, Clock, Save, 
  Calendar, BookOpen, ChevronLeft, ChevronRight, Users, 
  Sparkles, Search 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AttendanceOverview() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [students, setStudents] = useState<any[]>([]);
  const [attendanceState, setAttendanceState] = useState<{ [studentId: string]: 'PRESENT' | 'ABSENT' | 'LEAVE' }>({});
  const [isExistingRecord, setIsExistingRecord] = useState(false);
  const [teachingLog, setTeachingLog] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInitialOptions();
  }, []);

  const loadInitialOptions = async () => {
    try {
      const [ayRes, cRes] = await Promise.all([
        academicYearsApi.getAll(),
        classesApi.getAll(),
      ]);

      if (ayRes.data.success && ayRes.data.data.length > 0) {
        setAcademicYears(ayRes.data.data);
        const active = ayRes.data.data.find((y: any) => y.isActive) || ayRes.data.data[0];
        setSelectedYearId(active.id);
      }

      if (cRes.data.success && cRes.data.data.length > 0) {
        setClasses(cRes.data.data);
        setSelectedClassId(cRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Error loading options:', err);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      divisionsApi.getByClass(selectedClassId)
        .then((res) => {
          if (res.data.success && res.data.data.length > 0) {
            setDivisions(res.data.data);
            setSelectedDivisionId(res.data.data[0].id);
          } else {
            setDivisions([]);
            setSelectedDivisionId('');
          }
        })
        .catch((err) => console.error(err));
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClassId && selectedDivisionId && selectedYearId && date) {
      fetchClassAttendanceAndLog();
    }
  }, [selectedClassId, selectedDivisionId, selectedYearId, date]);

  const fetchClassAttendanceAndLog = async () => {
    setLoading(true);
    try {
      const [studRes, attRes, logRes] = await Promise.all([
        studentsApi.getAll({
          classId: selectedClassId,
          divisionId: selectedDivisionId,
          academicYearId: selectedYearId,
        }),
        attendanceApi.get({
          classId: selectedClassId,
          divisionId: selectedDivisionId,
          academicYearId: selectedYearId,
          date,
        }),
        teachingLogsApi.getByDate({
          classId: selectedClassId,
          divisionId: selectedDivisionId,
          date,
        }),
      ]);

      const studs = studRes.data?.data || [];
      setStudents(studs);

      const existingAtt = attRes.data?.data || [];
      setIsExistingRecord(existingAtt.length > 0);

      const map: { [key: string]: 'PRESENT' | 'ABSENT' | 'LEAVE' } = {};
      studs.forEach((s: any) => {
        const found = existingAtt.find((a: any) => a.studentId === s.id);
        map[s.id] = found ? found.status : 'PRESENT';
      });
      setAttendanceState(map);

      if (logRes.data.success && logRes.data.data) {
        setTeachingLog(logRes.data.data);
      } else {
        setTeachingLog(null);
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LEAVE') => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    const updated: { [key: string]: 'PRESENT' | 'ABSENT' | 'LEAVE' } = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceState(updated);
  };

  const handleDateShift = (days: number) => {
    const current = new Date(date);
    current.setDate(current.getDate() + days);
    setDate(current.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedDivisionId || !selectedYearId || !date) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        classId: selectedClassId,
        divisionId: selectedDivisionId,
        academicYearId: selectedYearId,
        date,
        status: attendanceState[s.id] || 'PRESENT',
      }));

      await attendanceApi.save(records);
      toast.success(`Attendance for ${date} saved/updated successfully!`);
      setIsExistingRecord(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const totalCount = students.length;
  const presentCount = Object.values(attendanceState).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceState).filter((s) => s === 'ABSENT').length;
  const leaveCount = Object.values(attendanceState).filter((s) => s === 'LEAVE').length;
  const presentPct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance & Daily Teaching Oversight</h1>
          <p className="text-slate-500 text-sm">
            Monitor, review and edit attendance records and daily teaching logs across all 12 classes
          </p>
        </div>
        <Button
          onClick={handleSaveAttendance}
          disabled={saving || students.length === 0}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm"
        >
          <Save className="w-4 h-4" /> {saving ? 'Updating...' : 'Save & Update Attendance'}
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Year</label>
          <Select value={selectedYearId} onChange={(e) => setSelectedYearId(e.target.value)}>
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>{ay.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Class (Std)</label>
          <Select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>Class {c.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Division</label>
          <Select value={selectedDivisionId} onChange={(e) => setSelectedDivisionId(e.target.value)}>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>Division {d.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Date Navigator</label>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDateShift(-1)}
              className="px-2 h-9 border-slate-300 text-xs"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-xs font-semibold"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDateShift(1)}
              className="px-2 h-9 border-slate-300 text-xs"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSetToday}
              className="h-9 px-2 bg-slate-100 text-slate-700 text-xs font-semibold"
            >
              Today
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="sm:col-span-2 p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Date & Status</span>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            isExistingRecord ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {isExistingRecord ? '● Attendance Logged' : '○ Not Marked'}
          </span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
          <span className="text-[11px] text-slate-400 font-medium block">Total Enrolled</span>
          <span className="font-bold text-slate-900 text-base">{totalCount}</span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
          <span className="text-[11px] text-slate-400 font-medium block">Present</span>
          <span className="font-bold text-emerald-600 text-base">{presentCount} ({presentPct}%)</span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
          <span className="text-[11px] text-slate-400 font-medium block">Absent</span>
          <span className="font-bold text-red-600 text-base">{absentCount}</span>
        </div>
      </div>

      {/* Teacher's Daily Lesson Log Record for Selected Date */}
      <Card className="border-indigo-100 bg-indigo-50/20">
        <CardHeader className="py-3 border-b border-indigo-100">
          <CardTitle className="text-sm font-bold text-indigo-950 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" /> Teacher's Daily Lesson Log ({date})
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3 text-xs">
          {teachingLog ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 block text-[11px]">Logged By Teacher:</span>
                <span className="font-bold text-slate-800">{teachingLog.teacher?.name || 'Class Teacher'}</span>
                {teachingLog.subject && (
                  <span className="text-slate-400 block text-[11px]">Subject: {teachingLog.subject.name}</span>
                )}
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="font-semibold text-slate-500 block text-[11px]">Topic / Lesson Taught:</span>
                <p className="font-semibold text-indigo-900 bg-white p-2.5 rounded-lg border border-indigo-100">
                  {teachingLog.topicTaught}
                </p>
                {teachingLog.homeworkGiven && (
                  <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                    <strong>Homework:</strong> {teachingLog.homeworkGiven}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-400 italic">No daily lesson log submitted by the teacher for this date yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Student Attendance Sheet */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" /> Student Attendance Roster ({students.length})
          </CardTitle>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleMarkAll('PRESENT')}
              className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 border border-emerald-200"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll('ABSENT')}
              className="text-xs px-3 py-1.5 bg-red-50 text-red-700 font-semibold rounded-lg hover:bg-red-100 border border-red-200"
            >
              Mark All Absent
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-sm">No students enrolled in this class division.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs uppercase">
                    <th className="py-3 px-4 w-16 text-center">Roll #</th>
                    <th className="py-3 px-4">Student Profile</th>
                    <th className="py-3 px-4">Admission #</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Edit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => {
                    const status = attendanceState[s.id] || 'PRESENT';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-center text-slate-700">
                          {s.rollNo || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {s.photo ? (
                              <img src={s.photo} alt={s.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                                {s.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-900">{s.name}</div>
                              <div className="text-[11px] text-slate-400">Parent: {s.fatherName || s.parentContact || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-600">{s.admissionNo}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              status === 'PRESENT'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : status === 'ABSENT'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {status === 'PRESENT' && <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />}
                            {status === 'ABSENT' && <XCircle className="w-3.5 h-3.5 mr-1 text-red-600" />}
                            {status === 'LEAVE' && <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />}
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex rounded-lg shadow-sm border border-slate-200 p-0.5 bg-slate-50">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, 'PRESENT')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                                status === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, 'ABSENT')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                                status === 'ABSENT'
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, 'LEAVE')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                                status === 'LEAVE'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Leave
                            </button>
                          </div>
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
