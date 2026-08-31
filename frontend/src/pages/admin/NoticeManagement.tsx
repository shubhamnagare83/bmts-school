import React, { useEffect, useState } from 'react';
import { noticesApi } from '@/api/notices';
import { classesApi } from '@/api/classes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Megaphone, Plus, Trash2, Calendar, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function NoticeManagement() {
  const [notices, setNotices] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    scope: 'SCHOOL',
    targetClassId: '',
  });

  useEffect(() => {
    classesApi.getAll().then((res) => {
      if (res.data.success) setClasses(res.data.data);
    });
    fetchNotices();
  }, []);

  const fetchNotices = () => {
    setLoading(true);
    noticesApi.getAll()
      .then((res) => {
        if (res.data.success) setNotices(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('Title and Content are required');
      return;
    }
    try {
      await noticesApi.create({
        ...formData,
        targetClassId: formData.scope === 'CLASS' ? formData.targetClassId : null,
      });
      toast.success('Notice published successfully');
      setIsModalOpen(false);
      setFormData({ title: '', content: '', scope: 'SCHOOL', targetClassId: '' });
      fetchNotices();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to publish notice');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await noticesApi.remove(id);
      toast.success('Notice deleted');
      fetchNotices();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete notice');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notice Board Management</h1>
          <p className="text-slate-500 text-sm">Publish announcements for whole school or specific classes</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Publish New Notice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-600" /> Active Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No active announcements published.
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map((notice) => (
                <div key={notice.id} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-all bg-white">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          notice.scope === 'SCHOOL' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {notice.scope === 'SCHOOL' ? 'Entire School' : `Class ${notice.targetClass?.name}`}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {new Date(notice.publishedAt || notice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">{notice.title}</h3>
                    </div>
                    <button
                      onClick={() => handleDelete(notice.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 whitespace-pre-wrap">{notice.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Publish Announcement Notice">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Holiday Announcement / Parent-Teacher Meeting"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Scope Audience</label>
            <Select
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
            >
              <option value="SCHOOL">Entire School</option>
              <option value="CLASS">Specific Class</option>
            </Select>
          </div>

          {formData.scope === 'CLASS' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class</label>
              <Select
                value={formData.targetClassId}
                onChange={(e) => setFormData({ ...formData, targetClassId: e.target.value })}
                required
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>Class {c.name}</option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Content Details</label>
            <Textarea
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write the notice details here..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Publish Notice</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
