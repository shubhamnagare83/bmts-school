import React, { useEffect, useState } from 'react';
import { teachersApi } from '@/api/teachers';
import { examsApi } from '@/api/exams';
import { studentsApi } from '@/api/students';
import { marksApi } from '@/api/marks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function MarksEntry() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [marksState, setMarksState] = useState<{ [studentId: string]: { marksObtained: string; isAbsent: boolean } }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    teachersApi.getMyAssignments()
      .then((res) => {
        if (res.data.success) {
          setAssignments(res.data.data);
          if (res.data.data.length > 0) setSelectedAssignment(res.data.data[0]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      examsApi.getAll({
        classId: selectedAssignment.classId,
        academicYearId: selectedAssignment.academicYearId,
      }).then((res) => {
        if (res.data.success) {
          setExams(res.data.data);
          if (res.data.data.length > 0) setSelectedExamId(res.data.data[0].id);
          else setSelectedExamId('');
        }
      });
    }
  }, [selectedAssignment]);

  useEffect(() => {
    if (selectedAssignment && selectedExamId) {
      fetchStudentsAndMarks();
    }
  }, [selectedAssignment, selectedExamId]);

  const fetchStudentsAndMarks = async () => {
    try {
      setLoading(true);
      const [studRes, marksRes] = await Promise.all([
        studentsApi.getAll({
          classId: selectedAssignment.classId,
          divisionId: selectedAssignment.divisionId,
          academicYearId: selectedAssignment.academicYearId,
        }),
        marksApi.get({
          examId: selectedExamId,
          subjectId: selectedAssignment.subjectId,
          classId: selectedAssignment.classId,
          divisionId: selectedAssignment.divisionId,
        }),
      ]);

      const studs = studRes.data?.data || [];
      setStudents(studs);

      const existingMarks = marksRes.data?.data || [];
      const map: { [key: string]: { marksObtained: string; isAbsent: boolean } } = {};

      studs.forEach((s: any) => {
        const found = existingMarks.find((m: any) => m.studentId === s.id);
        map[s.id] = {
          marksObtained: found && found.marksObtained !== null ? String(found.marksObtained) : '',
          isAbsent: found ? found.isAbsent : false,
        };
      });
      setMarksState(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId: string, value: string) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], marksObtained: value, isAbsent: false },
    }));
  };

  const handleAbsentToggle = (studentId: string, isAbsent: boolean) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], isAbsent, marksObtained: isAbsent ? '' : prev[studentId]?.marksObtained },
    }));
  };

  const handleSave = async () => {
    if (!selectedAssignment || !selectedExamId) return;
    setSaving(true);
    try {
      const records = students.map((s) => {
        const entry = marksState[s.id] || { marksObtained: '', isAbsent: false };
        return {
          studentId: s.id,
          examId: selectedExamId,
          subjectId: selectedAssignment.subjectId,
          classId: selectedAssignment.classId,
          divisionId: selectedAssignment.divisionId,
          academicYearId: selectedAssignment.academicYearId,
          marksObtained: entry.isAbsent || entry.marksObtained === '' ? null : Number(entry.marksObtained),
          isAbsent: entry.isAbsent,
        };
      });

      await marksApi.save({ records });
      toast.success('Marks saved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enter Subject Exam Marks</h1>
          <p className="text-slate-500 text-sm">Log student marks for allocated subject exams</p>
        </div>
        <Button onClick={handleSave} disabled={saving || students.length === 0} className="flex items-center gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Marks'}
        </Button>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Allocated Class & Subject</label>
          <Select
            value={selectedAssignment?.id || ''}
            onChange={(e) => {
              const found = assignments.find((a) => a.id === e.target.value);
              if (found) setSelectedAssignment(found);
            }}
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                Class {a.class?.name} - Div {a.division?.name} ({a.subject?.name})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Exam</label>
          <Select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Marks Sheet */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-600" /> Marks Entry Sheet
            {selectedAssignment?.subject && (
              <span className="text-xs font-normal text-slate-500">
                (Max Marks: {selectedAssignment.subject.maxMarks})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-sm">No students found for marks entry.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-medium text-xs uppercase">
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4 w-40">Marks Obtained</th>
                    <th className="py-3 px-4 text-center">Absent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => {
                    const entry = marksState[s.id] || { marksObtained: '', isAbsent: false };
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">{s.rollNo || '-'}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{s.name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">{s.admissionNo}</td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            disabled={entry.isAbsent}
                            value={entry.marksObtained}
                            onChange={(e) => handleMarkChange(s.id, e.target.value)}
                            placeholder="0-100"
                            className="w-28"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={entry.isAbsent}
                            onChange={(e) => handleAbsentToggle(s.id, e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
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
