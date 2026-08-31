import React, { useEffect, useState } from 'react';
import { timetableApi } from '@/api/timetable';
import { classesApi } from '@/api/classes';
import { divisionsApi } from '@/api/divisions';
import { subjectsApi } from '@/api/subjects';
import { teachersApi } from '@/api/teachers';
import { academicYearsApi } from '@/api/academicYears';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Clock, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TimetableManagement() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');

  const [timetableEntries, setTimetableEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    dayOfWeek: 0,
    periodNumber: 1,
    subjectId: '',
    teacherId: '',
    room: '',
  });

  useEffect(() => {
    academicYearsApi.getAll().then((res) => {
      if (res.data.success && res.data.data.length > 0) {
        setAcademicYears(res.data.data);
        const active = res.data.data.find((y: any) => y.isActive) || res.data.data[0];
        setSelectedYearId(active.id);
      }
    });

    classesApi.getAll().then((res) => {
      if (res.data.success) {
        setClasses(res.data.data);
        if (res.data.data.length > 0) setSelectedClassId(res.data.data[0].id);
      }
    });

    teachersApi.getAll().then((res) => {
      if (res.data.success) setTeachers(res.data.data);
    });
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      divisionsApi.getByClass(selectedClassId).then((res) => {
        if (res.data.success) {
          setDivisions(res.data.data);
          if (res.data.data.length > 0) setSelectedDivisionId(res.data.data[0].id);
          else setSelectedDivisionId('');
        }
      });
      subjectsApi.getByClass(selectedClassId).then((res) => {
        if (res.data.success) setSubjects(res.data.data);
      });
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClassId && selectedDivisionId && selectedYearId) {
      fetchTimetable();
    }
  }, [selectedClassId, selectedDivisionId, selectedYearId]);

  const fetchTimetable = () => {
    setLoading(true);
    timetableApi.get({
      classId: selectedClassId,
      divisionId: selectedDivisionId,
      academicYearId: selectedYearId,
    })
      .then((res) => {
        if (res.data.success) setTimetableEntries(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await timetableApi.save({
        classId: selectedClassId,
        divisionId: selectedDivisionId,
        academicYearId: selectedYearId,
        dayOfWeek: Number(formData.dayOfWeek),
        periodNumber: Number(formData.periodNumber),
        subjectId: formData.subjectId || null,
        teacherId: formData.teacherId || null,
        room: formData.room || null,
      });
      toast.success('Period assigned successfully');
      setIsModalOpen(false);
      fetchTimetable();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save timetable period');
    }
  };

  const getSlot = (dayIdx: number, periodNum: number) => {
    return timetableEntries.find(
      (e) => e.dayOfWeek === dayIdx && e.periodNumber === periodNum
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Class Timetable Management</h1>
          <p className="text-slate-500 text-sm">Schedule weekly class periods, subjects, and assigned teachers</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} disabled={!selectedDivisionId} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Assign Period
        </Button>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Year</label>
          <Select value={selectedYearId} onChange={(e) => setSelectedYearId(e.target.value)}>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
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
      </div>

      {/* Timetable Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" /> Weekly Schedule Grid
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : !selectedDivisionId ? (
            <p className="text-slate-500 text-sm text-center py-8">Select a Class and Division to view or edit the timetable.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold">
                    <th className="p-3 border border-slate-200">Day / Period</th>
                    {PERIODS.map((p) => (
                      <th key={p} className="p-3 border border-slate-200">Period {p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day, dayIdx) => (
                    <tr key={day} className="hover:bg-slate-50">
                      <td className="p-3 border border-slate-200 font-semibold text-slate-800 bg-slate-50">
                        {day}
                      </td>
                      {PERIODS.map((periodNum) => {
                        const slot = getSlot(dayIdx, periodNum);
                        return (
                          <td
                            key={periodNum}
                            onClick={() => {
                              setFormData({
                                dayOfWeek: dayIdx,
                                periodNumber: periodNum,
                                subjectId: slot?.subjectId || '',
                                teacherId: slot?.teacherId || '',
                                room: slot?.room || '',
                              });
                              setIsModalOpen(true);
                            }}
                            className={`p-3 border border-slate-200 cursor-pointer transition-colors ${
                              slot ? 'bg-indigo-50/50 hover:bg-indigo-100/50' : 'hover:bg-slate-100'
                            }`}
                          >
                            {slot ? (
                              <div className="space-y-1">
                                <div className="font-semibold text-indigo-900">{slot.subject?.name || 'Subject'}</div>
                                <div className="text-[10px] text-slate-500">{slot.teacher?.name || ''}</div>
                                {slot.room && <div className="text-[10px] text-slate-400">Rm: {slot.room}</div>}
                              </div>
                            ) : (
                              <span className="text-slate-300 text-[10px]">+ Assign</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign Timetable Slot">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Day of Week</label>
              <Select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
              >
                {DAYS.map((day, idx) => (
                  <option key={day} value={idx}>{day}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Period Number</label>
              <Select
                value={formData.periodNumber}
                onChange={(e) => setFormData({ ...formData, periodNumber: Number(e.target.value) })}
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>Period {p}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
            <Select
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Teacher</label>
            <Select
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Classroom / Lab (Optional)</label>
            <Input
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              placeholder="e.g. Room 204 or Science Lab 1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Period Slot</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
