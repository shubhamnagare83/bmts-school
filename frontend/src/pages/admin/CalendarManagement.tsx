import React, { useEffect, useState } from 'react';
import { holidaysApi } from '@/api/holidays';
import { academicYearsApi } from '@/api/academicYears';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function CalendarManagement() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'HOLIDAY',
  });

  useEffect(() => {
    academicYearsApi.getAll().then((res) => {
      if (res.data.success && res.data.data.length > 0) {
        setAcademicYears(res.data.data);
        const active = res.data.data.find((y: any) => y.isActive) || res.data.data[0];
        setSelectedYearId(active.id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      fetchHolidays(selectedYearId);
    }
  }, [selectedYearId]);

  const fetchHolidays = (yearId: string) => {
    setLoading(true);
    holidaysApi.getAll(yearId)
      .then((res) => {
        if (res.data.success) {
          setHolidays(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !selectedYearId) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await holidaysApi.create({
        ...formData,
        academicYearId: selectedYearId,
      });
      toast.success('Holiday/Event created');
      setIsModalOpen(false);
      setFormData({ name: '', date: '', type: 'HOLIDAY' });
      fetchHolidays(selectedYearId);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create holiday');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday/event?')) return;
    try {
      await holidaysApi.remove(id);
      toast.success('Event deleted');
      fetchHolidays(selectedYearId);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Calendar & Holidays</h1>
          <p className="text-slate-500 text-sm">Manage official school holidays, exam dates, and events</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="w-48"
          >
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name} {y.isActive ? '(Active)' : ''}
              </option>
            ))}
          </Select>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Event / Holiday
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" /> Scheduled Events & Holidays List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No holidays or events scheduled for this academic year yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-medium text-xs uppercase">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Title / Event</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {holidays.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-slate-800">{item.name}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.type === 'HOLIDAY' ? 'bg-red-50 text-red-700' :
                          item.type === 'EXAM_DATE' ? 'bg-amber-50 text-amber-700' :
                          item.type === 'RESULT_DATE' ? 'bg-emerald-50 text-emerald-700' :
                          'bg-purple-50 text-purple-700'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Holiday or Event">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Event / Holiday Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Independence Day / Annual Sports Day"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category Type</label>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="HOLIDAY">Holiday</option>
              <option value="EVENT">School Event</option>
              <option value="EXAM_DATE">Exam Schedule</option>
              <option value="RESULT_DATE">Result Declaration</option>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Event</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
