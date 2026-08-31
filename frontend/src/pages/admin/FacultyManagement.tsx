import React, { useState, useEffect } from 'react';
import { teachersApi } from '@/api/teachers';
import { classesApi } from '@/api/classes';
import { divisionsApi } from '@/api/divisions';
import { subjectsApi } from '@/api/subjects';
import { academicYearsApi } from '@/api/academicYears';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { 
  Plus, Search, UserCheck, KeyRound, UserX, Users, 
  BookOpen, Trash2, Edit3, Camera 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function FacultyManagement() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  const initialForm = {
    name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    qualification: '',
    department: '',
    photo: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [newPassword, setNewPassword] = useState('');

  // Assignment Modal States
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [assignmentForm, setAssignmentForm] = useState({
    classId: '',
    divisionId: '',
    subjectId: '',
    academicYearId: '',
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = () => {
    setLoading(true);
    teachersApi.getAll()
      .then((res) => {
        if (res.data.success) setTeachers(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Photo size must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password || !formData.email) {
      toast.error('Name, Username, Password, and Email are required');
      return;
    }
    try {
      await teachersApi.create(formData);
      toast.success('Faculty member created successfully!');
      setIsCreateModalOpen(false);
      setFormData(initialForm);
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create faculty member');
    }
  };

  const handleOpenEdit = (teacher: any) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name || '',
      email: teacher.user?.email || '',
      username: teacher.user?.username || '',
      password: '',
      phone: teacher.phone || '',
      qualification: teacher.qualification || '',
      department: teacher.department || '',
      photo: teacher.photo || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    try {
      await teachersApi.update(selectedTeacher.id, {
        name: formData.name,
        phone: formData.phone,
        qualification: formData.qualification,
        department: formData.department,
        photo: formData.photo,
      });
      toast.success('Faculty profile updated successfully!');
      setIsEditModalOpen(false);
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update faculty member');
    }
  };

  const handleToggleFinalize = async (id: string) => {
    try {
      await teachersApi.toggleFinalize(id);
      toast.success('Finalize permission updated');
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update permission');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !selectedTeacherId) return;
    try {
      await teachersApi.resetPassword(selectedTeacherId, { newPassword });
      toast.success('Password reset successfully');
      setIsResetModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this teacher?')) return;
    try {
      await teachersApi.remove(id);
      toast.success('Teacher account deactivated');
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to deactivate teacher');
    }
  };

  // Load initial settings for assignments
  const loadAssignmentOptions = async () => {
    try {
      const [ayRes, cRes] = await Promise.all([
        academicYearsApi.getAll(),
        classesApi.getAll(),
      ]);

      if (ayRes.data.success && ayRes.data.data.length > 0) {
        setAcademicYears(ayRes.data.data);
        const active = ayRes.data.data.find((y: any) => y.isActive) || ayRes.data.data[0];
        setAssignmentForm(prev => ({ ...prev, academicYearId: active.id }));
      }

      if (cRes.data.success && cRes.data.data.length > 0) {
        setClasses(cRes.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch divisions and subjects when class changes
  useEffect(() => {
    if (assignmentForm.classId) {
      Promise.all([
        divisionsApi.getByClass(assignmentForm.classId),
        subjectsApi.getByClass(assignmentForm.classId),
      ]).then(([dRes, sRes]) => {
        if (dRes.data.success) setDivisions(dRes.data.data);
        if (sRes.data.success) setSubjects(sRes.data.data);
      }).catch(err => console.error(err));
    } else {
      setDivisions([]);
      setSubjects([]);
    }
  }, [assignmentForm.classId]);

  const fetchTeacherAssignments = async (teacherId: string) => {
    try {
      const res = await teachersApi.getAssignments(teacherId);
      if (res.data.success) {
        setTeacherAssignments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAssignmentModal = (teacher: any) => {
    setSelectedTeacher(teacher);
    fetchTeacherAssignments(teacher.id);
    loadAssignmentOptions();
    setIsAssignmentModalOpen(true);
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    const { classId, divisionId, subjectId, academicYearId } = assignmentForm;
    if (!classId || !divisionId || !subjectId || !academicYearId) {
      toast.error('Please complete all assignment fields');
      return;
    }
    try {
      const res = await teachersApi.createAssignment(selectedTeacher.id, assignmentForm);
      if (res.data.success) {
        toast.success('Class assignment created successfully!');
        fetchTeacherAssignments(selectedTeacher.id);
        setAssignmentForm(prev => ({ ...prev, classId: '', divisionId: '', subjectId: '' }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create assignment');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!selectedTeacher) return;
    try {
      const res = await teachersApi.removeAssignment(assignmentId);
      if (res.data.success) {
        toast.success('Assignment removed');
        fetchTeacherAssignments(selectedTeacher.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove assignment');
    }
  };

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.user?.email?.toLowerCase().includes(q) ||
      t.user?.username?.toLowerCase().includes(q) ||
      t.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Faculty Management</h1>
          <p className="text-slate-500 text-sm">Create, manage profile photos, and assign classes for teaching faculty</p>
        </div>
        <Button onClick={() => { setFormData(initialForm); setIsCreateModalOpen(true); }} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Add New Faculty Member
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Teaching Faculty Roster ({filtered.length})
          </CardTitle>
          <div className="w-64">
            <Input
              placeholder="Search by name, email, username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-sm">No faculty members found matching your search.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs uppercase">
                    <th className="py-3 px-4">Photo</th>
                    <th className="py-3 px-4">Faculty Name</th>
                    <th className="py-3 px-4">Account Login</th>
                    <th className="py-3 px-4">Department & Qual</th>
                    <th className="py-3 px-4 text-center">Can Finalize Reports</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4">
                        {t.photo ? (
                          <img src={t.photo} alt={t.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                            {t.name.charAt(0)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div>{t.name}</div>
                        {t.phone && <div className="text-[11px] text-slate-400 font-mono">Ph: {t.phone}</div>}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <div>User: <span className="font-mono text-slate-800">{t.user?.username}</span></div>
                        <div className="text-slate-400">{t.user?.email}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <div className="font-medium text-slate-800">{t.department || 'General'}</div>
                        <div className="text-slate-400">{t.qualification || 'B.Ed / Graduate'}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleFinalize(t.id)}
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            t.canFinalizeReportCards ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {t.canFinalizeReportCards ? 'Yes (Authorized)' : 'No (Standard)'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          t.user?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {t.user?.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit Faculty Profile"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenAssignmentModal(t)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Manage Class & Subject Assignments"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTeacherId(t.id);
                              setIsResetModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(t.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Deactivate Account"
                          >
                            <UserX className="w-4 h-4" />
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

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Faculty Account">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Mrs. Sunita Patil"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="teacher.name@mtfschool.edu"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username *</label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. teacher_patil"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Faculty@123"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9821000000"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Qualification</label>
              <Input
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="e.g. M.Sc, B.Ed"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Science / Primary"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-indigo-600" /> Faculty Profile Photo
            </label>
            <div className="flex items-center gap-3">
              {formData.photo && (
                <img src={formData.photo} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              Create Faculty Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Faculty Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Faculty Profile — ${selectedTeacher?.name || ''}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Qualification</label>
              <Input
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-indigo-600" /> Update Profile Photo
            </label>
            <div className="flex items-center gap-3">
              {formData.photo && (
                <img src={formData.photo} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Reset Faculty Password">
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Password</label>
            <Input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setIsResetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Class & Subject Allocations Modal */}
      <Modal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} title={`Class Allocations — ${selectedTeacher?.name}`}>
        <div className="space-y-4 text-xs">
          <form onSubmit={handleAddAssignment} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" /> Assign New Class & Subject
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
                <Select value={assignmentForm.academicYearId} onChange={(e) => setAssignmentForm({ ...assignmentForm, academicYearId: e.target.value })}>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>{ay.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class (Std)</label>
                <Select value={assignmentForm.classId} onChange={(e) => setAssignmentForm({ ...assignmentForm, classId: e.target.value })}>
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>Class {c.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Division</label>
                <Select value={assignmentForm.divisionId} onChange={(e) => setAssignmentForm({ ...assignmentForm, divisionId: e.target.value })}>
                  <option value="">Select Division</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>Division {d.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <Select value={assignmentForm.subjectId} onChange={(e) => setAssignmentForm({ ...assignmentForm, subjectId: e.target.value })}>
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                + Add Allocation
              </Button>
            </div>
          </form>

          <div>
            <h4 className="font-bold text-slate-800 mb-2">Current Class Allocations ({teacherAssignments.length})</h4>
            {teacherAssignments.length === 0 ? (
              <p className="text-slate-400 text-xs">No classes allocated yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {teacherAssignments.map((a) => (
                  <div key={a.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">Class {a.class?.name} - Div {a.division?.name}</span>
                      <span className="text-slate-500 ml-2">({a.subject?.name})</span>
                    </div>
                    <button
                      onClick={() => handleRemoveAssignment(a.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
