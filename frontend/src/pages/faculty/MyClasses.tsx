import React, { useEffect, useState } from 'react';
import { teachersApi } from '@/api/teachers';
import { studentsApi } from '@/api/students';
import { subjectsApi } from '@/api/subjects';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  School, Users, BookOpen, Plus, Search, Eye, 
  Phone, Mail, MapPin, Calendar, UserCheck 
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function MyClasses() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Student Details Modal
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Add Subject Modal
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [submittingSubject, setSubmittingSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    maxMarks: '100',
    passingMarks: '35',
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = () => {
    setLoading(true);
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
  };

  useEffect(() => {
    if (selectedAssignment) {
      setLoadingStudents(true);
      Promise.all([
        studentsApi.getAll({
          classId: selectedAssignment.classId,
          divisionId: selectedAssignment.divisionId,
          academicYearId: selectedAssignment.academicYearId,
        }),
        subjectsApi.getByClass(selectedAssignment.classId),
      ])
        .then(([studRes, subRes]) => {
          if (studRes.data.success) setStudents(studRes.data.data);
          if (subRes.data.success) setClassSubjects(subRes.data.data);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingStudents(false));
    }
  }, [selectedAssignment]);

  const handleOpenAddSubject = () => {
    setSubjectForm({ name: '', code: '', maxMarks: '100', passingMarks: '35' });
    setIsAddSubjectModalOpen(true);
  };

  const handleCreateAndAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !subjectForm.name.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    setSubmittingSubject(true);
    try {
      // 1. Create subject for the class
      const subRes = await subjectsApi.create({
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim() || undefined,
        classId: selectedAssignment.classId,
        maxMarks: Number(subjectForm.maxMarks) || 100,
        passingMarks: Number(subjectForm.passingMarks) || 35,
      });

      const newSubject = subRes.data.data;

      // 2. Assign subject to teacher
      await teachersApi.assignMySubject({
        classId: selectedAssignment.classId,
        divisionId: selectedAssignment.divisionId,
        subjectId: newSubject.id,
        academicYearId: selectedAssignment.academicYearId,
      });

      toast.success(`Subject "${newSubject.name}" added and assigned to your class!`);
      setIsAddSubjectModalOpen(false);

      // Refresh data
      fetchAssignments();
      subjectsApi.getByClass(selectedAssignment.classId).then((res) => {
        if (res.data.success) setClassSubjects(res.data.data);
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add subject');
    } finally {
      setSubmittingSubject(false);
    }
  };

  const filteredStudents = students.filter((s) =>
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.rollNo || '').includes(searchTerm) ||
    (s.admissionNo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Classes & Student Profiles</h1>
          <p className="text-slate-500 text-sm">
            Select an allocated class to view student rosters, details, and manage class subjects
          </p>
        </div>
        {selectedAssignment && (
          <Button onClick={handleOpenAddSubject} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Subject to Class
          </Button>
        )}
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500 text-sm">
            You currently have no class allocations assigned.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Class Selection List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Allocated Classes</h2>
            <div className="space-y-2.5 max-h-[78vh] overflow-y-auto pr-1">
              {assignments.map((item) => {
                const isSelected = selectedAssignment?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAssignment(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 text-base">
                        Class {item.class?.name} - Div {item.division?.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 font-semibold text-indigo-700">
                        {item.academicYear?.name}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Subject: <strong className="text-slate-800">{item.subject?.name}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student Roster & Subjects (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Subjects Overview Card */}
            <Card>
              <CardHeader className="flex flex-row justify-between items-center pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Subjects in Class {selectedAssignment?.class?.name} ({classSubjects.length})
                </CardTitle>
                <Button size="sm" variant="outline" onClick={handleOpenAddSubject} className="text-xs h-7 gap-1">
                  <Plus className="w-3 h-3" /> Add Subject
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {classSubjects.map((sub) => (
                    <span
                      key={sub.id}
                      className={`px-3 py-1 text-xs rounded-lg border font-medium ${
                        selectedAssignment?.subjectId === sub.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {sub.name} (Max: {sub.maxMarks}m)
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Student Roster Card */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> Student Information Roster
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Class {selectedAssignment?.class?.name} - Division {selectedAssignment?.division?.name} ({students.length} Enrolled)
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search name or roll no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-xs pl-9 h-8"
                  />
                </div>
              </CardHeader>

              <CardContent>
                {loadingStudents ? (
                  <div className="py-12 flex justify-center">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-center py-12 text-slate-500 text-sm">
                    {searchTerm ? 'No matching students found.' : 'No students enrolled in this class division yet.'}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs uppercase">
                          <th className="py-2.5 px-3">Roll</th>
                          <th className="py-2.5 px-3">Admission No</th>
                          <th className="py-2.5 px-3">Student Name</th>
                          <th className="py-2.5 px-3">Gender</th>
                          <th className="py-2.5 px-3">Parent Contact</th>
                          <th className="py-2.5 px-3 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-indigo-50/40 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 text-xs">
                              #{s.rollNo || '-'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500 text-xs">
                              {s.admissionNo}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900 text-xs sm:text-sm">{s.name}</div>
                              {s.fatherName && (
                                <div className="text-[11px] text-slate-400">Father: {s.fatherName}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-xs">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                s.gender === 'FEMALE' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'
                              }`}>
                                {s.gender || 'N/A'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-xs font-mono">
                              {s.parentContact || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedStudent(s);
                                  setIsStudentModalOpen(true);
                                }}
                                className="h-7 px-2 text-xs text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> View Info
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        title={`Student Profile — ${selectedStudent?.name || ''}`}
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Full Name</span>
                <span className="font-bold text-slate-900 text-sm">{selectedStudent.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Admission & Roll No</span>
                <span className="font-mono font-bold text-indigo-700">
                  {selectedStudent.admissionNo} (Roll #{selectedStudent.rollNo || '-'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Gender</span>
                <span className="font-medium text-slate-800">{selectedStudent.gender || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                <span className="font-medium text-slate-800">
                  {selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
              <h3 className="font-bold text-slate-800 text-xs border-b pb-1">Family & Contact Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Father's Name</span>
                  <span className="font-medium text-slate-800">{selectedStudent.fatherName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mother's Name</span>
                  <span className="font-medium text-slate-800">{selectedStudent.motherName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Parent Contact Number</span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-indigo-600" /> {selectedStudent.parentContact || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Parent Email</span>
                  <span className="font-medium text-slate-800">{selectedStudent.parentEmail || 'N/A'}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Residential Address</span>
                <span className="font-medium text-slate-800 flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  {selectedStudent.address || 'Address not registered'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setIsStudentModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Subject Modal */}
      <Modal
        isOpen={isAddSubjectModalOpen}
        onClose={() => setIsAddSubjectModalOpen(false)}
        title={`Add New Subject for Class ${selectedAssignment?.class?.name || ''}`}
      >
        <form onSubmit={handleCreateAndAssignSubject} className="space-y-4">
          <p className="text-xs text-slate-600">
            Create a curriculum subject for <strong>Class {selectedAssignment?.class?.name}</strong> and assign it to your teaching allocations:
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name *</label>
            <Input
              type="text"
              placeholder="e.g. Sanskrit, Science, Environmental Studies"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Code (Optional)</label>
              <Input
                type="text"
                placeholder="e.g. SCI01"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Marks</label>
              <Input
                type="number"
                value={subjectForm.maxMarks}
                onChange={(e) => setSubjectForm({ ...subjectForm, maxMarks: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Passing Marks</label>
              <Input
                type="number"
                value={subjectForm.passingMarks}
                onChange={(e) => setSubjectForm({ ...subjectForm, passingMarks: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAddSubjectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submittingSubject} className="bg-indigo-600 hover:bg-indigo-700">
              {submittingSubject ? 'Adding...' : 'Add & Assign Subject'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
