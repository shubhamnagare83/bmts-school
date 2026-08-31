import React, { useState, useEffect } from 'react';
import { studentsApi } from '@/api/students';
import { classesApi } from '@/api/classes';
import { divisionsApi } from '@/api/divisions';
import { academicYearsApi } from '@/api/academicYears';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { 
  Plus, Search, GraduationCap, UserCheck, Trash2, Edit3, 
  Eye, HeartPulse, User, Phone, MapPin, Calendar, Camera 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function StudentManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');
  const [selectedYearId, setSelectedYearId] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const [activeStudent, setActiveStudent] = useState<any | null>(null);
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<any | null>(null);

  // Form State
  const initialForm = {
    name: '',
    surname: '',
    admissionNo: '',
    rollNo: '',
    gender: 'MALE',
    dob: '',
    age: '',
    motherTongue: 'Marathi',
    photo: '',
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: '',
    parentContact: '',
    parentEmail: '',
    address: '',
    bloodGroup: 'B+',
    height: '',
    weight: '',
    classId: '',
    divisionId: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const [enrollData, setEnrollData] = useState({
    classId: '',
    divisionId: '',
    academicYearId: '',
    rollNo: '',
  });

  useEffect(() => {
    academicYearsApi.getAll().then((res) => {
      if (res.data.success && res.data.data.length > 0) {
        setAcademicYears(res.data.data);
        const active = res.data.data.find((y: any) => y.isActive) || res.data.data[0];
        setSelectedYearId(active.id);
        setEnrollData((prev) => ({ ...prev, academicYearId: active.id }));
      }
    });

    classesApi.getAll().then((res) => {
      if (res.data.success && res.data.data.length > 0) {
        setClasses(res.data.data);
        setFormData((prev) => ({ ...prev, classId: res.data.data[0].id }));
        setEnrollData((prev) => ({ ...prev, classId: res.data.data[0].id }));
      }
    });
  }, []);

  useEffect(() => {
    const targetClassId = formData.classId || enrollData.classId;
    if (targetClassId) {
      divisionsApi.getByClass(targetClassId).then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          setDivisions(res.data.data);
          setFormData((prev) => ({ ...prev, divisionId: res.data.data[0].id }));
          setEnrollData((prev) => ({ ...prev, divisionId: res.data.data[0].id }));
        }
      });
    }
  }, [formData.classId, enrollData.classId]);

  useEffect(() => {
    fetchStudents();
  }, [selectedClassId, selectedDivisionId, selectedYearId]);

  const fetchStudents = () => {
    setLoading(true);
    const params: any = {};
    if (selectedClassId) params.classId = selectedClassId;
    if (selectedDivisionId) params.divisionId = selectedDivisionId;
    if (selectedYearId) params.academicYearId = selectedYearId;

    studentsApi.getAll(params)
      .then((res) => {
        if (res.data.success) setStudents(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? String(age) : '';
  };

  const handleDobChange = (dobVal: string) => {
    const calculated = calculateAge(dobVal);
    setFormData((prev) => ({
      ...prev,
      dob: dobVal,
      age: calculated || prev.age,
    }));
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

  const handleOpenCreate = () => {
    setFormData({
      ...initialForm,
      classId: classes[0]?.id || '',
      divisionId: divisions[0]?.id || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.admissionNo.trim()) {
      toast.error('Student First Name and Admission Number are required');
      return;
    }
    setSaving(true);
    try {
      const res = await studentsApi.create(formData);
      toast.success('Student registered successfully!');
      setIsCreateModalOpen(false);

      // Auto-enroll in selected class and division
      if (res.data?.data && formData.classId && selectedYearId) {
        await studentsApi.enroll(res.data.data.id, {
          classId: formData.classId,
          divisionId: formData.divisionId || divisions[0]?.id,
          academicYearId: selectedYearId,
          rollNo: formData.rollNo,
        });
        toast.success('Student enrolled into class!');
      }

      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create student');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (student: any) => {
    setActiveStudent(student);
    const dobFormatted = student.dob ? new Date(student.dob).toISOString().split('T')[0] : '';
    setFormData({
      name: student.name || '',
      surname: student.surname || '',
      admissionNo: student.admissionNo || '',
      rollNo: student.rollNo || '',
      gender: student.gender || 'MALE',
      dob: dobFormatted,
      age: student.age ? String(student.age) : calculateAge(dobFormatted),
      motherTongue: student.motherTongue || 'Marathi',
      photo: student.photo || '',
      fatherName: student.fatherName || '',
      fatherOccupation: student.fatherOccupation || '',
      motherName: student.motherName || '',
      motherOccupation: student.motherOccupation || '',
      parentContact: student.parentContact || '',
      parentEmail: student.parentEmail || '',
      address: student.address || '',
      bloodGroup: student.bloodGroup || 'B+',
      height: student.height || '',
      weight: student.weight || '',
      classId: student.enrollments?.[0]?.classId || classes[0]?.id || '',
      divisionId: student.enrollments?.[0]?.divisionId || divisions[0]?.id || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    setSaving(true);
    try {
      await studentsApi.update(activeStudent.id, formData);
      toast.success('Student profile updated successfully!');
      setIsEditModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenProfile = (student: any) => {
    setActiveStudent(student);
    setIsProfileModalOpen(true);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForEnroll) return;
    try {
      await studentsApi.enroll(selectedStudentForEnroll.id, enrollData);
      toast.success('Student enrolled successfully!');
      setIsEnrollModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to enroll student');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this student?')) return;
    try {
      await studentsApi.remove(id);
      toast.success('Student archived');
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to archive student');
    }
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.admissionNo?.toLowerCase().includes(q) ||
      s.rollNo?.toLowerCase().includes(q) ||
      s.parentContact?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Profile & Enrollment Management</h1>
          <p className="text-slate-500 text-sm">
            Complete student profiles with family, address, health records & photos
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Register New Student
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Year</label>
          <Select value={selectedYearId} onChange={(e) => setSelectedYearId(e.target.value)}>
            <option value="">All Years</option>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Class Filter (Std)</label>
          <Select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>Class {c.name}</option>
            ))}
          </Select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Search Student</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by student name, admission no, roll no, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" /> Enrolled Students ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-sm">No student records found matching your filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs uppercase">
                    <th className="py-3 px-4">Photo</th>
                    <th className="py-3 px-4">Adm No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Class & Div</th>
                    <th className="py-3 px-4">Roll</th>
                    <th className="py-3 px-4">Parents & Contact</th>
                    <th className="py-3 px-4">Health Info</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => {
                    const activeEnrollment = s.enrollments?.[0];
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4">
                          {s.photo ? (
                            <img src={s.photo} alt={s.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                              {s.name.charAt(0)}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs text-slate-600 font-bold">{s.admissionNo}</td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900">{s.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {s.gender || '—'} | DOB: {s.dob ? new Date(s.dob).toLocaleDateString() : '—'}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-xs">
                          {activeEnrollment ? (
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                              Class {activeEnrollment.class?.name} - {activeEnrollment.division?.name}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">Not Enrolled</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs text-slate-700 font-bold">
                          #{s.rollNo || activeEnrollment?.rollNo || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-slate-600">
                          <div>F: {s.fatherName || '—'} {s.fatherOccupation ? `(${s.fatherOccupation})` : ''}</div>
                          <div className="text-slate-500">M: {s.motherName || '—'}</div>
                          <div className="text-slate-400 font-mono">Ph: {s.parentContact || '—'}</div>
                        </td>
                        <td className="py-2.5 px-4 text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 font-medium">
                            <HeartPulse className="w-3 h-3 text-rose-500" />
                            {s.bloodGroup || '—'} | {s.height ? `${s.height}cm` : '—'} | {s.weight ? `${s.weight}kg` : '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleOpenProfile(s)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              title="View Full Student Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit Student Profile"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudentForEnroll(s);
                                setIsEnrollModalOpen(true);
                              }}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-semibold"
                              title="Enroll in Class Division"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Archive Student"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Register New Student Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Register New Student — Complete Profile"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {/* Section 1: Basic & Class Info */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b pb-1">
              <User className="w-4 h-4 text-indigo-600" /> 1. Student Identification & Class Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Aarav"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Surname *</label>
                <Input
                  value={formData.surname}
                  onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  placeholder="e.g. Deshmukh"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admission No *</label>
                <Input
                  value={formData.admissionNo}
                  onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
                  placeholder="e.g. ADM015"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Std (Class) *</label>
                <Select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })}>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>Class {c.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Division *</label>
                <Select value={formData.divisionId} onChange={(e) => setFormData({ ...formData, divisionId: e.target.value })}>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>Division {d.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Roll No</label>
                <Input
                  value={formData.rollNo}
                  onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                  placeholder="e.g. 1"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                <Select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                  <option value="MALE">Male (मुलगा)</option>
                  <option value="FEMALE">Female (मुलगी)</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth (DOB) *</label>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Age (Years)</label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Auto from DOB"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mother Tongue (मातृभाषा)</label>
                <Input
                  value={formData.motherTongue}
                  onChange={(e) => setFormData({ ...formData, motherTongue: e.target.value })}
                  placeholder="e.g. Marathi, Hindi, English"
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-indigo-600" /> Student Profile Photo
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
          </div>

          {/* Section 2: Parents & Contact Info */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b pb-1">
              <Phone className="w-4 h-4 text-emerald-600" /> 2. Parents, Occupation & Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Father's Name</label>
                <Input
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  placeholder="Father's full name"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Father's Occupation</label>
                <Input
                  value={formData.fatherOccupation}
                  onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                  placeholder="e.g. Engineer, Business, Farmer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mother's Name</label>
                <Input
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  placeholder="Mother's full name"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mother's Occupation</label>
                <Input
                  value={formData.motherOccupation}
                  onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                  placeholder="e.g. Homemaker, Teacher, Doctor"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile No (Parent Contact) *</label>
                <Input
                  value={formData.parentContact}
                  onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                  placeholder="e.g. 9821000001"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parent Email</label>
                <Input
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  placeholder="parent@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Residential Address *</label>
              <Textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Complete street address, city, pin code"
                required
              />
            </div>
          </div>

          {/* Section 3: Health & Physical Info */}
          <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200 space-y-3">
            <h3 className="font-bold text-rose-900 text-xs flex items-center gap-1.5 border-b border-rose-200 pb-1">
              <HeartPulse className="w-4 h-4 text-rose-600" /> 3. Health & Physical Metrics
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <Select value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </Select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Height (cm)</label>
                <Input
                  type="text"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="e.g. 115"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Weight (kg)</label>
                <Input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="e.g. 22"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? 'Registering...' : 'Register Student & Enroll'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Profile Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title={`Edit Student Profile — ${activeStudent?.name || ''}`}
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          {/* Section 1: Basic Info */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs border-b pb-1 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" /> Basic Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Surname</label>
                <Input
                  value={formData.surname}
                  onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Roll No</label>
                <Input
                  value={formData.rollNo}
                  onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Age</label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mother Tongue</label>
                <Input
                  value={formData.motherTongue}
                  onChange={(e) => setFormData({ ...formData, motherTongue: e.target.value })}
                />
              </div>
            </div>

            {/* Photo */}
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
          </div>

          {/* Section 2: Parents & Contact */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs border-b pb-1 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-600" /> Parents & Contact
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Father's Name</label>
                <Input
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Father's Occupation</label>
                <Input
                  value={formData.fatherOccupation}
                  onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mother's Name</label>
                <Input
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mother's Occupation</label>
                <Input
                  value={formData.motherOccupation}
                  onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile No</label>
                <Input
                  value={formData.parentContact}
                  onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parent Email</label>
                <Input
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address</label>
              <Textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Section 3: Health */}
          <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200 space-y-3">
            <h3 className="font-bold text-rose-900 text-xs border-b border-rose-200 pb-1 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-600" /> Health Information
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <Select value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </Select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Height (cm)</label>
                <Input
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Weight (kg)</label>
                <Input
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Full Student Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title={`Student Profile — ${activeStudent?.name || ''}`}
        size="lg"
      >
        {activeStudent && (
          <div className="space-y-4 text-xs">
            {/* Header Hero */}
            <div className="p-4 bg-indigo-900 text-white rounded-xl flex items-center gap-4">
              {activeStudent.photo ? (
                <img src={activeStudent.photo} alt={activeStudent.name} className="w-16 h-16 rounded-full object-cover border-2 border-white" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center font-bold text-2xl">
                  {activeStudent.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-bold">{activeStudent.name}</h2>
                <p className="text-indigo-200 text-xs">
                  Adm #{activeStudent.admissionNo} | Roll #{activeStudent.rollNo || '-'} | {activeStudent.gender || '—'}
                </p>
                {activeStudent.enrollments?.[0] && (
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded bg-white/20 text-[11px] font-semibold">
                    Class {activeStudent.enrollments[0].class?.name} - Division {activeStudent.enrollments[0].division?.name}
                  </span>
                )}
              </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-800 text-xs border-b pb-1">Personal Details</h3>
                <div className="space-y-1.5 text-slate-700">
                  <div><span className="text-slate-400">Date of Birth:</span> <strong>{activeStudent.dob ? new Date(activeStudent.dob).toLocaleDateString() : 'N/A'}</strong></div>
                  <div><span className="text-slate-400">Age:</span> <strong>{activeStudent.age ? `${activeStudent.age} Years` : 'N/A'}</strong></div>
                  <div><span className="text-slate-400">Mother Tongue:</span> <strong>{activeStudent.motherTongue || 'Marathi'}</strong></div>
                  <div><span className="text-slate-400">Gender:</span> <strong>{activeStudent.gender || 'N/A'}</strong></div>
                </div>
              </div>

              <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2">
                <h3 className="font-bold text-rose-900 text-xs border-b border-rose-200 pb-1 flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-600" /> Health & Physical Info
                </h3>
                <div className="space-y-1.5 text-slate-700">
                  <div><span className="text-slate-400">Blood Group:</span> <strong className="text-rose-700">{activeStudent.bloodGroup || 'N/A'}</strong></div>
                  <div><span className="text-slate-400">Height:</span> <strong>{activeStudent.height ? `${activeStudent.height} cm` : 'N/A'}</strong></div>
                  <div><span className="text-slate-400">Weight:</span> <strong>{activeStudent.weight ? `${activeStudent.weight} kg` : 'N/A'}</strong></div>
                </div>
              </div>
            </div>

            {/* Family & Contact */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-800 text-xs border-b pb-1">Family & Contact Details</h3>
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div><span className="text-slate-400 block text-[11px]">Father's Name & Occupation</span><strong>{activeStudent.fatherName || 'N/A'}</strong> {activeStudent.fatherOccupation ? `(${activeStudent.fatherOccupation})` : ''}</div>
                <div><span className="text-slate-400 block text-[11px]">Mother's Name & Occupation</span><strong>{activeStudent.motherName || 'N/A'}</strong> {activeStudent.motherOccupation ? `(${activeStudent.motherOccupation})` : ''}</div>
                <div><span className="text-slate-400 block text-[11px]">Parent Mobile Number</span><strong className="font-mono text-indigo-700">{activeStudent.parentContact || 'N/A'}</strong></div>
                <div><span className="text-slate-400 block text-[11px]">Parent Email</span><strong>{activeStudent.parentEmail || 'N/A'}</strong></div>
              </div>
              <div className="pt-1">
                <span className="text-slate-400 block text-[11px]">Residential Address</span>
                <span className="font-medium text-slate-800 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  {activeStudent.address || 'Address not registered'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setIsProfileModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Enroll Modal */}
      <Modal isOpen={isEnrollModalOpen} onClose={() => setIsEnrollModalOpen(false)} title="Enroll Student in Class Division">
        <form onSubmit={handleEnrollSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Class (Std)</label>
            <Select value={enrollData.classId} onChange={(e) => setEnrollData({ ...enrollData, classId: e.target.value })}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>Class {c.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Division</label>
            <Select value={enrollData.divisionId} onChange={(e) => setEnrollData({ ...enrollData, divisionId: e.target.value })}>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>Division {d.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
            <Select value={enrollData.academicYearId} onChange={(e) => setEnrollData({ ...enrollData, academicYearId: e.target.value })}>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Roll No</label>
            <Input
              value={enrollData.rollNo}
              onChange={(e) => setEnrollData({ ...enrollData, rollNo: e.target.value })}
              placeholder="e.g. 1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setIsEnrollModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              Save Enrollment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
