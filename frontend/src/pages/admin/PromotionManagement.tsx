import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowRight, CheckSquare, Square } from 'lucide-react';
import { studentsApi } from '@/api/students';
import { classesApi } from '@/api/classes';
import { divisionsApi } from '@/api/divisions';
import { academicYearsApi } from '@/api/academicYears';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function PromotionManagement() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sourceDivisions, setSourceDivisions] = useState<any[]>([]);
  const [targetDivisions, setTargetDivisions] = useState<any[]>([]);

  // Selection states
  const [sourceYear, setSourceYear] = useState('');
  const [sourceClass, setSourceClass] = useState('');
  const [sourceDivision, setSourceDivision] = useState('');

  const [targetYear, setTargetYear] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [targetDivision, setTargetDivision] = useState('');

  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [promoting, setPromoting] = useState(false);

  // Initial load
  useEffect(() => {
    Promise.all([academicYearsApi.getAll(), classesApi.getAll()])
      .then(([ayRes, clsRes]) => {
        if (ayRes.data.success) {
          setAcademicYears(ayRes.data.data);
          const active = ayRes.data.data.find((y: any) => y.isActive) || ayRes.data.data[0];
          if (active) {
            setSourceYear(active.id);
            // Default target year to the next one if available
            const sorted = [...ayRes.data.data].sort((a, b) => a.name.localeCompare(b.name));
            const activeIdx = sorted.findIndex((y) => y.id === active.id);
            if (activeIdx !== -1 && activeIdx + 1 < sorted.length) {
              setTargetYear(sorted[activeIdx + 1].id);
            } else {
              setTargetYear(active.id);
            }
          }
        }
        if (clsRes.data.success) {
          setClasses(clsRes.data.data);
        }
      })
      .catch((err) => {
        toast.error('Failed to load initial configurations');
      });
  }, []);

  // Fetch source divisions when source class changes
  useEffect(() => {
    if (sourceClass) {
      divisionsApi.getByClass(sourceClass).then((res) => {
        if (res.data.success) {
          setSourceDivisions(res.data.data);
          if (res.data.data.length > 0) setSourceDivision(res.data.data[0].id);
        }
      });
    } else {
      setSourceDivisions([]);
      setSourceDivision('');
    }
  }, [sourceClass]);

  // Fetch target divisions when target class changes
  useEffect(() => {
    if (targetClass) {
      divisionsApi.getByClass(targetClass).then((res) => {
        if (res.data.success) {
          setTargetDivisions(res.data.data);
          if (res.data.data.length > 0) setTargetDivision(res.data.data[0].id);
        }
      });
    } else {
      setTargetDivisions([]);
      setTargetDivision('');
    }
  }, [targetClass]);

  // Fetch students in source class/division/year
  useEffect(() => {
    if (sourceYear && sourceClass && sourceDivision) {
      setLoadingStudents(true);
      studentsApi
        .getAll({
          classId: sourceClass,
          divisionId: sourceDivision,
          academicYearId: sourceYear,
        })
        .then((res) => {
          if (res.data.success) {
            setStudents(res.data.data);
            setSelectedStudentIds([]); // Reset selection
          }
        })
        .catch(() => {
          toast.error('Failed to load students');
        })
        .finally(() => {
          setLoadingStudents(false);
        });
    } else {
      setStudents([]);
      setSelectedStudentIds([]);
    }
  }, [sourceYear, sourceClass, sourceDivision]);

  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handlePromote = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student to promote');
      return;
    }
    if (!targetYear || !targetClass || !targetDivision) {
      toast.error('Please select target academic year, class, and division');
      return;
    }
    if (sourceYear === targetYear && sourceClass === targetClass && sourceDivision === targetDivision) {
      toast.error('Source and target configurations cannot be the same');
      return;
    }

    setPromoting(true);
    try {
      const res = await studentsApi.bulkPromote({
        studentIds: selectedStudentIds,
        targetClassId: targetClass,
        targetDivisionId: targetDivision,
        targetAcademicYearId: targetYear,
      });

      if (res.data.success) {
        toast.success(`Successfully promoted ${selectedStudentIds.length} students!`);
        // Refresh students list
        setStudents(students.filter((s) => !selectedStudentIds.includes(s.id)));
        setSelectedStudentIds([]);
      } else {
        toast.error(res.data.error || 'Failed to promote students');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'An error occurred during promotion');
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Promotion</h1>
        <p className="text-sm text-slate-500 mt-1">
          Promote students from one class/division/year to another class/division/year
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Panel */}
        <Card className="border-t-4 border-indigo-600">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700">Source Configuration</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Academic Year"
              value={sourceYear}
              onChange={(e) => setSourceYear(e.target.value)}
              options={academicYears.map((y) => ({ label: y.name, value: y.id }))}
            />
            <Select
              label="Class"
              value={sourceClass}
              onChange={(e) => setSourceClass(e.target.value)}
              options={[
                { label: 'Select Class', value: '' },
                ...classes.map((c) => ({ label: c.name, value: c.id })),
              ]}
            />
            <Select
              label="Division"
              value={sourceDivision}
              onChange={(e) => setSourceDivision(e.target.value)}
              options={sourceDivisions.map((d) => ({ label: d.name, value: d.id }))}
              disabled={!sourceClass}
            />
          </CardContent>
        </Card>

        {/* Target Panel */}
        <Card className="border-t-4 border-emerald-600">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700">Target Configuration</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Academic Year"
              value={targetYear}
              onChange={(e) => setTargetYear(e.target.value)}
              options={academicYears.map((y) => ({ label: y.name, value: y.id }))}
            />
            <Select
              label="Class"
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              options={[
                { label: 'Select Class', value: '' },
                ...classes.map((c) => ({ label: c.name, value: c.id })),
              ]}
            />
            <Select
              label="Division"
              value={targetDivision}
              onChange={(e) => setTargetDivision(e.target.value)}
              options={targetDivisions.map((d) => ({ label: d.name, value: d.id }))}
              disabled={!targetClass}
            />
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-sm text-slate-600">
          Selected: <strong className="text-indigo-600">{selectedStudentIds.length}</strong> /{' '}
          {students.length} students
        </div>
        <Button
          onClick={handlePromote}
          disabled={promoting || selectedStudentIds.length === 0 || !targetClass || !targetDivision}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white animate-none"
        >
          {promoting ? <LoadingSpinner className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          Promote Selected Students
        </Button>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-base font-semibold text-slate-800">Eligible Students</CardTitle>
          {students.length > 0 && (
            <button
              onClick={handleToggleSelectAll}
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
            >
              {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {loadingStudents ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="font-medium text-slate-600">No students found matching filters</p>
              <p className="text-sm mt-1">Please configure source class filters above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-12 text-left py-2 px-3 text-slate-500 font-semibold">Select</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-semibold">Roll No</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-semibold">Name</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-semibold">Admission No</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-semibold">Gender</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-semibold">Guardian Name</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const isSelected = selectedStudentIds.includes(student.id);
                    return (
                      <tr
                        key={student.id}
                        onClick={() => handleToggleSelectStudent(student.id)}
                        className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300" />
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {student.rollNo || '—'}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">{student.name}</td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-xs">
                          {student.admissionNo}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-xs">{student.gender || '—'}</td>
                        <td className="py-3 px-3 text-slate-500 text-xs">
                          {student.fatherName || student.guardianName || '—'}
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
