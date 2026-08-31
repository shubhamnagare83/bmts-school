import React, { useState, useEffect } from 'react';
import api from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Plus, Edit2, Trash2, CheckCircle, ListFilter, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const FIELD_KEYS = [
  { key: 'kg_sec_a_progress', label: 'KG Sec A — Physical Progress Shown' },
  { key: 'kg_sec_a_challenges', label: 'KG Sec A — Physical Challenges to Face' },
  { key: 'kg_sec_b_progress', label: 'KG Sec B — Social Emotional Progress Shown' },
  { key: 'kg_sec_b_challenges', label: 'KG Sec B — Social Emotional Challenges' },
  { key: 'kg_sec_c_progress', label: 'KG Sec C — Cognitive Progress Shown' },
  { key: 'kg_sec_c_challenges', label: 'KG Sec C — Cognitive Challenges' },
  { key: 'kg_sec_d_progress', label: 'KG Sec D — Language Progress Shown' },
  { key: 'kg_sec_d_challenges', label: 'KG Sec D — Language Challenges' },
  { key: 'kg_sec_e_progress', label: 'KG Sec E — Creative Progress Shown' },
  { key: 'kg_sec_e_challenges', label: 'KG Sec E — Creative Challenges' },
  { key: 'kg_sec_g_strength', label: 'KG Sec G — Strengths Identified' },
  { key: 'kg_sec_g_support', label: 'KG Sec G — Additional Support Needed' },
  { key: 'primary_teacher_remarks', label: 'Primary/Secondary (1st–10th) — Teacher Remarks' },
];

export default function RemarkBankManagement() {
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>('kg_sec_a_progress');
  const [remarks, setRemarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRemark, setEditingRemark] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    textEn: '',
    textMr: '',
  });

  useEffect(() => {
    fetchRemarks();
  }, [selectedFieldKey]);

  const fetchRemarks = () => {
    setLoading(true);
    api.get('/remark-bank', { params: { fieldKey: selectedFieldKey } })
      .then((res) => {
        if (res.data.success) setRemarks(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.textEn) {
      toast.error('English text is required');
      return;
    }

    try {
      if (editingRemark) {
        await api.put(`/remark-bank/${editingRemark.id}`, {
          textEn: formData.textEn,
          textMr: formData.textMr,
        });
        toast.success('Remark updated successfully!');
      } else {
        await api.post('/remark-bank', {
          fieldKey: selectedFieldKey,
          textEn: formData.textEn,
          textMr: formData.textMr,
        });
        toast.success('New remark option added to bank!');
      }

      setIsModalOpen(false);
      setEditingRemark(null);
      setFormData({ textEn: '', textMr: '' });
      fetchRemarks();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save remark');
    }
  };

  const handleToggleActive = async (remark: any) => {
    try {
      await api.put(`/remark-bank/${remark.id}`, { active: !remark.active });
      toast.success(`Remark ${!remark.active ? 'activated' : 'deactivated'}`);
      fetchRemarks();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this remark option from the bank?')) return;
    try {
      await api.delete(`/remark-bank/${id}`);
      toast.success('Remark deleted');
      fetchRemarks();
    } catch (err: any) {
      toast.error('Failed to delete remark');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Remark Bank Management</h1>
          <p className="text-slate-500 text-sm">
            Maintain pre-configured 8–10 bilingual remarks per field for Faculty quick selection
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRemark(null);
            setFormData({ textEn: '', textMr: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Remark Option
        </Button>
      </div>

      {/* Field Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <label className="block text-xs font-semibold text-slate-700">Select Report Card Field Category</label>
        <Select
          value={selectedFieldKey}
          onChange={(e) => setSelectedFieldKey(e.target.value)}
        >
          {FIELD_KEYS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </Select>
      </div>

      {/* Remarks Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Configured Bank Options ({remarks.length})
          </CardTitle>
          <span className="text-xs text-slate-500">
            Recommended: 8 to 10 options per field category
          </span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : remarks.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-slate-500 text-sm">No remarks configured for this category yet.</p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingRemark(null);
                  setFormData({ textEn: '', textMr: '' });
                  setIsModalOpen(true);
                }}
              >
                Add First Remark Option
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-medium text-xs uppercase">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">English Text</th>
                    <th className="py-3 px-4">Marathi Translation</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {remarks.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{r.textEn}</td>
                      <td className="py-3 px-4 font-serif text-slate-700 text-xs">{r.textMr || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(r)}
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            r.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {r.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingRemark(r);
                              setFormData({ textEn: r.textEn, textMr: r.textMr || '' });
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-indigo-600"
                            title="Edit Remark"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="Delete Remark"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRemark ? 'Edit Remark Option' : 'Add New Remark Option'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              English Remark Text
            </label>
            <Textarea
              rows={3}
              value={formData.textEn}
              onChange={(e) => setFormData({ ...formData, textEn: e.target.value })}
              placeholder="e.g. Demonstrates excellent fine motor coordination in writing and drawing."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Marathi Translation (Optional)
            </label>
            <Textarea
              rows={3}
              value={formData.textMr}
              onChange={(e) => setFormData({ ...formData, textMr: e.target.value })}
              placeholder="उदा. लेखन आणि चित्रकलेत उत्तम सुक्ष्म स्नायू समन्वय दाखवतो/दाखवते."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingRemark ? 'Update Remark' : 'Add to Remark Bank'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
