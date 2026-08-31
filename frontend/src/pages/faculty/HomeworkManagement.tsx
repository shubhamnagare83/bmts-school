import React, { useEffect, useState } from 'react';
import { teachersApi } from '@/api/teachers';
import { homeworkApi } from '@/api/homework';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { BookMarked, Plus, Calendar, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function HomeworkManagement() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    assignmentId: '',
    title: '',
    description: '',
    dueDate: '',
  });

  useEffect(() => {
    teachersApi.getMyAssignments().then((res) => {
      if (res.data.success) {
        setAssignments(res.data.data);
        if (res.data.data.length > 0) {
          setFormData((prev) => ({ ...prev, assignmentId: res.data.data[0].id }));
        }
      }
    });
    fetchHomework();
  }, []);

  const fetchHomework = () => {
    setLoading(true);
    homeworkApi.getAll()
      .then((res) => {
        if (res.data.success) setHomeworkList(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const foundAssignment = assignments.find((a) => a.id === formData.assignmentId);
    if (!foundAssignment || !formData.title) {
      toast.error('Title and Class selection required');
      return;
    }

    try {
      await homeworkApi.create({
        classId: foundAssignment.classId,
        divisionId: foundAssignment.divisionId,
        subjectId: foundAssignment.subjectId,
        academicYearId: foundAssignment.academicYearId,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate || null,
      });
      toast.success('Homework assigned successfully!');
      setIsModalOpen(false);
      setFormData({ assignmentId: assignments[0]?.id || '', title: '', description: '', dueDate: '' });
      fetchHomework();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to assign homework');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this homework?')) return;
    try {
      await homeworkApi.remove(id);
      toast.success('Homework deleted');
      fetchHomework();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Homework & Assignment Management</h1>
          <p className="text-slate-500 text-sm">Create and assign homework for your classes</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Create Homework Assignment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-600" /> My Assigned Homework
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : homeworkList.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-sm">No homework assignments posted yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {homeworkList.map((hw) => (
                <div key={hw.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-sm bg-white space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      Class {hw.class?.name} - Div {hw.division?.name}
                    </span>
                    <button
                      onClick={() => handleDelete(hw.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800 text-base">{hw.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Subject: {hw.subject?.name}</p>
                  </div>

                  {hw.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded">
                      {hw.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Homework Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Homework Assignment">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class & Subject</label>
            <Select
              value={formData.assignmentId}
              onChange={(e) => setFormData({ ...formData, assignmentId: e.target.value })}
              required
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  Class {a.class?.name} - Div {a.division?.name} ({a.subject?.name})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Chapter 4 Exercises 1-10"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions / Description</label>
            <Textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Write detailed homework instructions..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Publish Homework</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
