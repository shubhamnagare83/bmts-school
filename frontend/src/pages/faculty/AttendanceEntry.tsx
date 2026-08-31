import React, { useEffect, useState } from 'react';
import { teachersApi } from '@/api/teachers';
import { studentsApi } from '@/api/students';
import { attendanceApi } from '@/api/attendance';
import { subjectsApi } from '@/api/subjects';
import { teachingLogsApi } from '@/api/teachingLogs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { 
  ClipboardCheck, CheckCircle2, XCircle, Clock, Save, 
  ChevronLeft, ChevronRight, Calendar, BookOpen, Sparkles, 
  History, Users 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AttendanceEntry() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceState, setAttendanceState] = useState<{ [studentId: string]: 'PRESENT' | 'ABSENT' | 'LEAVE' }>({});
  const [isExistingRecord, setIsExistingRecord] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Teaching Log State
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [topicTaught, setTopicTaught] = useState<string>('');
  const [homeworkGiven, setHomeworkGiven] = useState<string>('');
  const [teachingRemarks, setTeachingRemarks] = useState<string>('');
  const [savingLog, setSavingLog] = useState<boolean>(false);

  useEffect(() => {
    teachersApi.getMyAssignments()
      .then((res) => {
        if (res.data.success) {
          setAssignments(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedAssignment(res.data.data[0]);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch subjects for class
  useEffect(() => {
    if (selectedAssignment?.classId) {
      subjectsApi.getByClass(selectedAssignment.classId)
        .then((res) => {
          if (res.data.success) {
            setSubjects(res.data.data);
            if (res.data.data.length > 0) {
              setSelectedSubjectId(selectedAssignment.subjectId || res.data.data[0].id);
            }
          }
        })
        .catch((err) => console.error(err));
    }
  }, [selectedAssignment]);

  useEffect(() => {
    if (selectedAssignment && date) {
      fetchStudentsAndAttendance();
      fetchTeachingLog();
    }
  }, [selectedAssignment, date]);

  const fetchStudentsAndAttendance = async () => {
    try {
      setLoading(true);
      const [studRes, attRes] = await Promise.all([
        studentsApi.getAll({
          classId: selectedAssignment.classId,
          divisionId: selectedAssignment.divisionId,
          academicYearId: selectedAssignment.academicYearId,
        }),
        attendanceApi.get({
          classId: selectedAssignment.classId,
          divisionId: selectedAssignment.divisionId,
          academicYearId: selectedAssignment.academicYearId,
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachingLog = async () => {
    if (!selectedAssignment || !date) return;
    try {
      const res = await teachingLogsApi.getByDate({
        classId: selectedAssignment.classId,
        divisionId: selectedAssignment.divisionId,
        date,
      });
      if (res.data.success && res.data.data) {
        const log = res.data.data;
        setTopicTaught(log.topicTaught || '');
        setHomeworkGiven(log.homeworkGiven || '');
        setTeachingRemarks(log.remarks || '');
        if (log.subjectId) setSelectedSubjectId(log.subjectId);
      } else {
        setTopicTaught('');
        setHomeworkGiven('');
        setTeachingRemarks('');
      }
    } catch (err) {
      console.error('Error fetching teaching log:', err);
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
    if (!selectedAssignment || !date) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        classId: selectedAssignment.classId,
        divisionId: selectedAssignment.divisionId,
        academicYearId: selectedAssignment.academicYearId,
        date,
        status: attendanceState[s.id] || 'PRESENT',
      }));

      await attendanceApi.save(records);

      // Save Teaching Log if entered
      if (topicTaught.trim()) {
        await teachingLogsApi.save({
          classId: selectedAssignment.classId,
          divisionId: selectedAssignment.divisionId,
          date,
          subjectId: selectedSubjectId || undefined,
          topicTaught: topicTaught.trim(),
          homeworkGiven: homeworkGiven.trim() || undefined,
          remarks: teachingRemarks.trim() || undefined,
        });
      }

      toast.success(
        isExistingRecord
          ? `Attendance for ${date} updated successfully!`
          : `Attendance & Teaching Log for ${date} saved successfully!`
      );
      setIsExistingRecord(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTeachingLogOnly = async () => {
    if (!selectedAssignment || !date || !topicTaught.trim()) {
      toast.error('Please enter what you taught today before saving');
      return;
    }
    setSavingLog(true);
    try {
      await teachingLogsApi.save({
        classId: selectedAssignment.classId,
        divisionId: selectedAssignment.divisionId,
        date,
        subjectId: selectedSubjectId || undefined,
        topicTaught: topicTaught.trim(),
        homeworkGiven: homeworkGiven.trim() || undefined,
        remarks: teachingRemarks.trim() || undefined,
      });
      toast.success('Teaching record for this date saved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save teaching record');
    } finally {
      setSavingLog(false);
    }
  };

  // Compute metrics
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
          <h1 className="text-2xl font-bold text-slate-900">Daily Attendance & Teaching Record</h1>
          <p className="text-slate-500 text-sm">
            Mark daily attendance, review & edit past dates, and record what you taught today
          </p>
        </div>
        <Button
          onClick={handleSaveAttendance}
          disabled={saving || students.length === 0}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving Records...' : 'Save Attendance & Lesson Log'}
        </Button>
      </div>

      {/* Date Navigation & Class Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Class Div Selector */}
        <div className="lg:col-span-5">
          <label className="block text-xs font-semibold text-slate-600 mb-1">My Allocated Class & Division</label>
          <Select
            value={selectedAssignment?.id || ''}
            onChange={(e) => {
              const found = assignments.find((a) => a.id === e.target.value);
              if (found) setSelectedAssignment(found);
            }}
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                Class {a.class?.name} - Division {a.division?.name} ({a.academicYear?.name})
              </option>
            ))}
          </Select>
        </div>

        {/* Date Navigator Bar */}
        <div className="lg:col-span-7 space-y-1">
          <label className="block text-xs font-semibold text-slate-600">
            Attendance Date (Select or Navigate Past Dates)
          </label>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDateShift(-1)}
              className="px-2.5 h-9 border-slate-300 hover:bg-slate-50 text-xs text-slate-700"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4 mr-0.5" /> Back
            </Button>

            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-xs font-semibold text-slate-800"
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDateShift(1)}
              className="px-2.5 h-9 border-slate-300 hover:bg-slate-50 text-xs text-slate-700"
              title="Next Day"
            >
              Next <ChevronRight className="w-4 h-4 ml-0.5" />
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSetToday}
              className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold"
            >
              Today
            </Button>
          </div>
        </div>
      </div>

      {/* Date Status Banner & Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="sm:col-span-2 p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Date Selected</span>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            isExistingRecord ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {isExistingRecord ? '● Edit Saved Record' : '○ New Attendance'}
          </span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
          <span className="text-[11px] text-slate-400 font-medium block">Total Students</span>
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

      {/* Daily Teaching Log Section ("What They Teach Today" — Editable) */}
      <Card className="border-indigo-100 bg-indigo-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-indigo-100">
          <div>
            <CardTitle className="text-sm font-bold text-indigo-950 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" /> Daily Lesson Record (आज काय शिकवले / What was taught today)
            </CardTitle>
            <p className="text-slate-500 text-xs mt-0.5">
              Type the topic taught and homework assigned for {date}. Saved per date and fully editable.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveTeachingLogOnly}
            disabled={savingLog || !topicTaught.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-xs gap-1.5 h-8"
          >
            <Save className="w-3.5 h-3.5" /> {savingLog ? 'Saving...' : 'Save Lesson Record'}
          </Button>
        </CardHeader>
        <CardContent className="pt-4 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subject Taught</label>
              <Select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)}>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Topic / Chapter / Activity Taught Today <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Chapter 4: Solar System & Planets — Classroom Discussion & Diagram Drawing"
                value={topicTaught}
                onChange={(e) => setTopicTaught(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Homework / Class Assignment Given</label>
              <Input
                placeholder="e.g. Draw solar system in notebook and answer exercise 4.1 Q1 to Q5"
                value={homeworkGiven}
                onChange={(e) => setHomeworkGiven(e.target.value)}
                className="bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Remarks & Observations (Optional)</label>
              <Input
                placeholder="e.g. Good participation from students; quiz planned for Friday"
                value={teachingRemarks}
                onChange={(e) => setTeachingRemarks(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Sheet Roster */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" /> Student Attendance Sheet ({students.length})
          </CardTitle>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleMarkAll('PRESENT')}
              className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll('ABSENT')}
              className="text-xs px-3 py-1.5 bg-red-50 text-red-700 font-semibold rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
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
            <p className="text-center py-12 text-slate-500 text-sm">No students found in this class division.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs uppercase">
                    <th className="py-3 px-4 w-16 text-center">Roll #</th>
                    <th className="py-3 px-4">Student Profile</th>
                    <th className="py-3 px-4">Admission #</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Quick Mark</th>
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

          <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              * Changing any status and clicking "Save Attendance" will instantly update the record for {date}.
            </span>
            <Button
              onClick={handleSaveAttendance}
              disabled={saving || students.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Attendance & Lesson Record'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
