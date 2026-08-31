import React, { useEffect, useState } from 'react';
import { teachersApi } from '@/api/teachers';
import { studentsApi } from '@/api/students';
import { reportCardsApi } from '@/api/reportCards';
import { marksApi } from '@/api/marks';
import { attendanceApi } from '@/api/attendance';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  Printer, ListChecks, CheckCircle, Eye, Edit3, 
  Save, Sparkles, FileText, Download 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BilingualReportCardTemplate } from '@/components/reportcard/BilingualReportCardTemplate';
import { PrimaryReportCardTemplate } from '@/components/reportcard/PrimaryReportCardTemplate';
import { SecondaryReportCardTemplate } from '@/components/reportcard/SecondaryReportCardTemplate';
import { SecondaryReportCardEditor } from '@/components/reportcard/SecondaryReportCardEditor';
import { REMARKS_BANK, RemarkItem } from '@/utils/remarks';
import { printReportCard } from '@/utils/printReportCard';
import apiClient from '@/api/client';

export default function ReportCardDrafting() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [reportCard, setReportCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [marksData, setMarksData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>({ workingDays: 220, presentDays: 205, percentage: '93.1%' });

  // Main Modal Tab: Preview vs Edit Remarks
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'preview' | 'edit'>('preview');

  // Remarks Bank Picker Modal State
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [activeRemarkCategory, setActiveRemarkCategory] = useState<string>('PHYSICAL_MOTOR');
  const [selectedRemarkIds, setSelectedRemarkIds] = useState<string[]>([]);
  const [targetField, setTargetField] = useState<{ secKey: string; field: 'progress' | 'challenges' | 'STRENGTHS' | 'SUPPORT' }>({
    secKey: 'A',
    field: 'progress',
  });

  // Sections A, B, C, D, E with 3 line slots for progress and 3 line slots for challenges
  const [sectionsData, setSectionsData] = useState<{
    [key: string]: {
      progress: [string, string, string];
      challenges: [string, string, string];
    };
  }>({
    A: { progress: ['', '', ''], challenges: ['', '', ''] },
    B: { progress: ['', '', ''], challenges: ['', '', ''] },
    C: { progress: ['', '', ''], challenges: ['', '', ''] },
    D: { progress: ['', '', ''], challenges: ['', '', ''] },
    E: { progress: ['', '', ''], challenges: ['', '', ''] },
  });

  const [assessmentData, setAssessmentData] = useState({
    allRoundDevelopment: 'YES',
    strengthIdentified: '',
    additionalSupportNeeded: '',
  });

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
      studentsApi.getAll({
        classId: selectedAssignment.classId,
        divisionId: selectedAssignment.divisionId,
        academicYearId: selectedAssignment.academicYearId,
      }).then((res) => {
        if (res.data.success) {
          setStudents(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedStudentId(res.data.data[0].id);
          } else {
            setSelectedStudentId('');
            setReportCard(null);
          }
        }
      }).catch((err) => console.error(err));
    }
  }, [selectedAssignment]);

  useEffect(() => {
    if (selectedStudentId && selectedAssignment) {
      loadStudentReportCard(selectedStudentId);
    }
  }, [selectedStudentId, selectedAssignment]);

  const loadStudentReportCard = async (studentId: string) => {
    if (!selectedAssignment) return;

    try {
      const [rcRes, mRes, aRes] = await Promise.all([
        reportCardsApi.getAll({
          studentId,
          academicYearId: selectedAssignment.academicYearId,
        }),
        marksApi.getByStudent(studentId, {
          academicYearId: selectedAssignment.academicYearId,
        }),
        attendanceApi.getStudentAttendance(studentId, selectedAssignment.academicYearId),
      ]);

      if (rcRes.data?.success && rcRes.data.data?.length > 0) {
        const rc = rcRes.data.data[0];
        setReportCard(rc);
        populateFormFromReportCard(rc);
      } else {
        setReportCard(null);
        resetForm();
      }

      if (mRes.data?.success) {
        setMarksData(mRes.data.data);
      }

      if (aRes.data?.success && aRes.data.data?.stats) {
        setAttendanceData({
          workingDays: aRes.data.data.stats.workingDays,
          presentDays: aRes.data.data.stats.presentDays,
          percentage: `${aRes.data.data.stats.percentage}%`,
        });
      }
    } catch (err) {
      console.error('Error loading report card bundle:', err);
    }
  };


  const populateFormFromReportCard = (rc: any) => {
    const newSec: any = {
      A: { progress: ['', '', ''], challenges: ['', '', ''] },
      B: { progress: ['', '', ''], challenges: ['', '', ''] },
      C: { progress: ['', '', ''], challenges: ['', '', ''] },
      D: { progress: ['', '', ''], challenges: ['', '', ''] },
      E: { progress: ['', '', ''], challenges: ['', '', ''] },
    };

    if (rc.sections && Array.isArray(rc.sections)) {
      rc.sections.forEach((sec: any) => {
        const k = sec.sectionKey;
        if (newSec[k]) {
          const progLines = (sec.progressShown || '').split('\n').filter(Boolean);
          const chalLines = (sec.challengesFaced || '').split('\n').filter(Boolean);
          newSec[k].progress = [progLines[0] || '', progLines[1] || '', progLines[2] || ''];
          newSec[k].challenges = [chalLines[0] || '', chalLines[1] || '', chalLines[2] || ''];
        }
      });
    }
    setSectionsData(newSec);

    setAssessmentData({
      allRoundDevelopment: rc.assessment?.allRoundDevelopment || 'YES',
      strengthIdentified: rc.assessment?.strengthIdentified || '',
      additionalSupportNeeded: rc.assessment?.additionalSupportNeeded || '',
    });
  };

  const resetForm = () => {
    setSectionsData({
      A: { progress: ['', '', ''], challenges: ['', '', ''] },
      B: { progress: ['', '', ''], challenges: ['', '', ''] },
      C: { progress: ['', '', ''], challenges: ['', '', ''] },
      D: { progress: ['', '', ''], challenges: ['', '', ''] },
      E: { progress: ['', '', ''], challenges: ['', '', ''] },
    });
    setAssessmentData({
      allRoundDevelopment: 'YES',
      strengthIdentified: '',
      additionalSupportNeeded: '',
    });
  };

  const handleGenerateDraft = async () => {
    if (!selectedStudentId || !selectedAssignment) return;
    setGenerating(true);
    try {
      const res = await reportCardsApi.bulkGenerate({
        classId: selectedAssignment.classId,
        divisionId: selectedAssignment.divisionId,
        academicYearId: selectedAssignment.academicYearId,
      });
      if (res.data.success) {
        toast.success('Report Card Draft generated successfully!');
        loadStudentReportCard(selectedStudentId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate report card');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenRemarksModal = (
    secKey: string,
    field: 'progress' | 'challenges' | 'STRENGTHS' | 'SUPPORT'
  ) => {
    setTargetField({ secKey, field });
    if (field === 'STRENGTHS') {
      setActiveRemarkCategory('STRENGTHS');
    } else if (field === 'SUPPORT') {
      setActiveRemarkCategory('SUPPORT_NEEDED');
    } else {
      const catMap: any = {
        A: 'PHYSICAL_MOTOR',
        B: 'SOCIAL_EMOTIONAL',
        C: 'COGNITIVE',
        D: 'LANGUAGE_LITERACY',
        E: 'CREATIVE_AESTHETIC',
      };
      setActiveRemarkCategory(catMap[secKey] || 'PHYSICAL_MOTOR');
    }
    setSelectedRemarkIds([]);
    setIsRemarksModalOpen(true);
  };

  const handleToggleRemark = (remarkId: string) => {
    if (selectedRemarkIds.includes(remarkId)) {
      setSelectedRemarkIds(selectedRemarkIds.filter((id) => id !== remarkId));
    } else {
      if (selectedRemarkIds.length >= 3) {
        toast.error('You can select a maximum of 3 remarks for this box.', { id: 'max-remark' });
        return;
      }
      setSelectedRemarkIds([...selectedRemarkIds, remarkId]);
    }
  };

  const handleApplyRemarks = () => {
    const bankList: RemarkItem[] = REMARKS_BANK[activeRemarkCategory] || [];
    const selectedTexts = bankList
      .filter((r) => selectedRemarkIds.includes(r.id))
      .map((r) => `${r.en} (${r.mr})`);

    if (targetField.field === 'STRENGTHS') {
      setAssessmentData((prev) => ({
        ...prev,
        strengthIdentified: selectedTexts.join('\n'),
      }));
    } else if (targetField.field === 'SUPPORT') {
      setAssessmentData((prev) => ({
        ...prev,
        additionalSupportNeeded: selectedTexts.join('\n'),
      }));
    } else {
      const { secKey, field } = targetField;
      const newLines: [string, string, string] = ['', '', ''];
      selectedTexts.forEach((txt, idx) => {
        if (idx < 3) newLines[idx] = txt;
      });

      setSectionsData((prev) => ({
        ...prev,
        [secKey]: {
          ...prev[secKey],
          [field]: newLines,
        },
      }));
    }

    toast.success(`Applied ${selectedTexts.length} remark(s) to section.`);
    setIsRemarksModalOpen(false);
  };

  const handleLineChange = (
    secKey: string,
    field: 'progress' | 'challenges',
    lineIndex: number,
    val: string
  ) => {
    setSectionsData((prev) => {
      const updated = [...prev[secKey][field]] as [string, string, string];
      updated[lineIndex] = val;
      return {
        ...prev,
        [secKey]: {
          ...prev[secKey],
          [field]: updated,
        },
      };
    });
  };

  const handleSaveReportCard = async () => {
    if (!reportCard) {
      toast.error('No report card loaded. Please generate draft first.');
      return;
    }
    setSaving(true);
    try {
      const payloadSections = [
        {
          sectionKey: 'A',
          sectionTitle: 'Physical & Motor Development',
          progressShown: sectionsData.A.progress.filter(Boolean).join('\n'),
          challengesFaced: sectionsData.A.challenges.filter(Boolean).join('\n'),
        },
        {
          sectionKey: 'B',
          sectionTitle: 'Social Emotional Development',
          progressShown: sectionsData.B.progress.filter(Boolean).join('\n'),
          challengesFaced: sectionsData.B.challenges.filter(Boolean).join('\n'),
        },
        {
          sectionKey: 'C',
          sectionTitle: 'Cognitive Development',
          progressShown: sectionsData.C.progress.filter(Boolean).join('\n'),
          challengesFaced: sectionsData.C.challenges.filter(Boolean).join('\n'),
        },
        {
          sectionKey: 'D',
          sectionTitle: 'Language & Literacy Development',
          progressShown: sectionsData.D.progress.filter(Boolean).join('\n'),
          challengesFaced: sectionsData.D.challenges.filter(Boolean).join('\n'),
        },
        {
          sectionKey: 'E',
          sectionTitle: 'Creative & Aesthetic Development',
          progressShown: sectionsData.E.progress.filter(Boolean).join('\n'),
          challengesFaced: sectionsData.E.challenges.filter(Boolean).join('\n'),
        },
      ];

      await Promise.all([
        reportCardsApi.updateSections(reportCard.id, { sections: payloadSections }),
        reportCardsApi.updateAssessment(reportCard.id, assessmentData),
      ]);

      toast.success('Report card remarks and assessment saved successfully!');
      loadStudentReportCard(selectedStudentId);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save report card');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    void printReportCard('printable-report-card');
  };

  const handleDownloadPDF = async () => {
    if (!reportCard) return;
    try {
      toast.loading('Generating PDF...', { id: 'pdf-download' });
      const response = await apiClient.get(`/pdf/report-card/${reportCard.id}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${currentStudent?.name.replace(/\s+/g, '_')}_ReportCard.pdf`;
      link.click();
      toast.success('PDF downloaded successfully!', { id: 'pdf-download' });
    } catch (err) {
      toast.error('Failed to download PDF report card', { id: 'pdf-download' });
    }
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);
  const isKG = selectedAssignment?.class?.name?.toLowerCase().includes('kg');
  const isSecondary = /^(8|8th|9|9th|10|10th|VIII|IX|X)$/i.test((selectedAssignment?.class?.name || '').trim());

  const handleSaveSecondary = async (payload: { studentData: any; sections: any[] }) => {
    if (!reportCard) return;
    setSaving(true);
    try {
      await reportCardsApi.updateSections(reportCard.id, {
        studentData: payload.studentData,
        sections: payload.sections,
      });
      toast.success('Report card updated successfully!');
      loadStudentReportCard(selectedStudentId);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Student Report Cards & Remarks Drafting</h1>
          <p className="text-slate-500 text-sm">
            Select student, choose 3 remarks per box from the Remark Bank, and print official report cards with student photo
          </p>
        </div>
        {reportCard && (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setModalTab('preview');
                setIsPreviewOpen(true);
              }}
              variant="outline"
              className="flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" /> View & Print Preview
            </Button>
            <Button
              onClick={() => {
                setModalTab('edit');
                setIsPreviewOpen(true);
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700"
            >
              <Edit3 className="w-4 h-4" /> Edit Remarks
            </Button>
          </div>
        )}
      </div>

      {/* Class & Student Selector Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">My Allocated Class & Div</label>
          <Select
            value={selectedAssignment?.id || ''}
            onChange={(e) => {
              const a = assignments.find((item) => item.id === e.target.value);
              setSelectedAssignment(a || null);
            }}
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                Class {a.class?.name} - Division {a.division?.name} ({a.academicYear?.name})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Select Student ({students.length})</label>
          <Select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                Roll #{s.rollNo || '-'} — {s.name} ({s.admissionNo})
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-end">
          {!reportCard ? (
            <Button
              onClick={handleGenerateDraft}
              disabled={generating || !selectedStudentId}
              className="w-full bg-indigo-600 hover:bg-indigo-700 gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? 'Generating Draft...' : 'Generate Report Card Draft'}
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button
                onClick={handlePrint}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
              >
                <Download className="w-4 h-4" /> PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!reportCard ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500 space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="font-semibold text-slate-700">No report card generated for this student yet.</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click the "Generate Report Card Draft" button above to initialize the official report card template and remark boxes.
            </p>
            <Button
              onClick={handleGenerateDraft}
              disabled={generating || !selectedStudentId}
              className="bg-indigo-600 hover:bg-indigo-700 mt-2"
            >
              <Sparkles className="w-4 h-4 mr-1.5" /> Initialize Report Card Draft
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student Summary & Fast Actions (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Student & Report Card Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  {currentStudent?.photo ? (
                    <img src={currentStudent.photo} alt={currentStudent.name} className="w-12 h-12 rounded-full object-cover border border-slate-300" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold text-base flex items-center justify-center">
                      {currentStudent?.name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{currentStudent?.name}</h3>
                    <p className="text-slate-500 font-mono text-[11px]">Adm #{currentStudent?.admissionNo} | Roll #{currentStudent?.rollNo || '-'}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                      Class {selectedAssignment?.class?.name} - Div {selectedAssignment?.division?.name}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Attendance</span>
                    <strong className="text-slate-800 font-semibold">{attendanceData?.percentage || '93%'}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Template</span>
                    <strong className="text-slate-800 font-semibold">{isKG ? 'Bilingual KG' : 'Primary/Secondary'}</strong>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    onClick={() => {
                      setModalTab('preview');
                      setIsPreviewOpen(true);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" /> Open Full Screen & Print Preview
                  </Button>
                  <Button
                    onClick={handleSaveReportCard}
                    disabled={saving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Remarks to Database'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Editable Remarks Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {isSecondary ? (
              <SecondaryReportCardEditor
                key={reportCard?.id || selectedStudentId}
                reportCard={reportCard}
                onSave={handleSaveSecondary}
                saving={saving}
              />
            ) : (
              <Card>
                <CardHeader className="flex flex-row justify-between items-center pb-3">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-indigo-600" /> Remarks & Development Assessment
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Choose up to 3 remarks per box from the Remark Bank or write custom feedback
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveReportCard}
                    disabled={saving}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save & Update'}
                  </Button>
                </CardHeader>


              <CardContent className="space-y-6 text-xs">
                {/* Section A */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-slate-900 text-xs">
                      A. Physical & Motor Development (शारीरिक आणि मोटर विकास)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700 text-[11px]">
                          Progress Shown (विशेष प्रगती) — 3 Lines
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal('A', 'progress')}
                          className="text-[11px] h-6 px-2 text-indigo-600 border-indigo-200"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Choose Remarks
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {[0, 1, 2].map((idx) => (
                          <Input
                            key={`a-p-${idx}`}
                            placeholder={`Line ${idx + 1}...`}
                            value={sectionsData.A.progress[idx]}
                            onChange={(e) => handleLineChange('A', 'progress', idx, e.target.value)}
                            className="text-xs h-7"
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700 text-[11px]">
                          Challenges to Face (पुढील आव्हाने) — 3 Lines
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal('A', 'challenges')}
                          className="text-[11px] h-6 px-2 text-indigo-600 border-indigo-200"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Choose Remarks
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {[0, 1, 2].map((idx) => (
                          <Input
                            key={`a-c-${idx}`}
                            placeholder={`Line ${idx + 1}...`}
                            value={sectionsData.A.challenges[idx]}
                            onChange={(e) => handleLineChange('A', 'challenges', idx, e.target.value)}
                            className="text-xs h-7"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section B */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-slate-900 text-xs">
                      B. Socio-Emotional & Ethical (सामाजिक-भावनिक आणि नैतिक)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700 text-[11px]">Progress Shown — 3 Lines</label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal('B', 'progress')}
                          className="text-[11px] h-6 px-2 text-indigo-600 border-indigo-200"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Choose Remarks
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {[0, 1, 2].map((idx) => (
                          <Input
                            key={`b-p-${idx}`}
                            placeholder={`Line ${idx + 1}...`}
                            value={sectionsData.B.progress[idx]}
                            onChange={(e) => handleLineChange('B', 'progress', idx, e.target.value)}
                            className="text-xs h-7"
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700 text-[11px]">Challenges to Face — 3 Lines</label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal('B', 'challenges')}
                          className="text-[11px] h-6 px-2 text-indigo-600 border-indigo-200"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Choose Remarks
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {[0, 1, 2].map((idx) => (
                          <Input
                            key={`b-c-${idx}`}
                            placeholder={`Line ${idx + 1}...`}
                            value={sectionsData.B.challenges[idx]}
                            onChange={(e) => handleLineChange('B', 'challenges', idx, e.target.value)}
                            className="text-xs h-7"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-slate-900 text-xs">
                      C. Cognitive Development (संज्ञानात्मक विकास)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700 text-[11px]">Progress Shown — 3 Lines</label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal('C', 'progress')}
                          className="text-[11px] h-6 px-2 text-indigo-600 border-indigo-200"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Choose Remarks
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {[0, 1, 2].map((idx) => (
                          <Input
                            key={`c-p-${idx}`}
                            placeholder={`Line ${idx + 1}...`}
                            value={sectionsData.C.progress[idx]}
                            onChange={(e) => handleLineChange('C', 'progress', idx, e.target.value)}
                            className="text-xs h-7"
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700 text-[11px]">Challenges to Face — 3 Lines</label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal('C', 'challenges')}
                          className="text-[11px] h-6 px-2 text-indigo-600 border-indigo-200"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Choose Remarks
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {[0, 1, 2].map((idx) => (
                          <Input
                            key={`c-c-${idx}`}
                            placeholder={`Line ${idx + 1}...`}
                            value={sectionsData.C.challenges[idx]}
                            onChange={(e) => handleLineChange('C', 'challenges', idx, e.target.value)}
                            className="text-xs h-7"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section D */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-slate-900 text-xs">
                      D. Language & Literacy (भाषा आणि साक्षरता)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700 text-[11px]">Progress Shown — 3 Lines</label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal('D', 'progress')}
                          className="text-[11px] h-6 px-2 text-indigo-600 border-indigo-200"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Choose Remarks
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {[0, 1, 2].map((idx) => (
                          <Input
                            key={`d-p-${idx}`}
                            placeholder={`Line ${idx + 1}...`}
                            value={sectionsData.D.progress[idx]}
                            onChange={(e) => handleLineChange('D', 'progress', idx, e.target.value)}
                            className="text-xs h-7"
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700 text-[11px]">Challenges to Face — 3 Lines</label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal('D', 'challenges')}
                          className="text-[11px] h-6 px-2 text-indigo-600 border-indigo-200"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Choose Remarks
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {[0, 1, 2].map((idx) => (
                          <Input
                            key={`d-c-${idx}`}
                            placeholder={`Line ${idx + 1}...`}
                            value={sectionsData.D.challenges[idx]}
                            onChange={(e) => handleLineChange('D', 'challenges', idx, e.target.value)}
                            className="text-xs h-7"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section E */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-slate-900 text-xs">
                      E. Aesthetic & Cultural (सौंदर्यात्मक आणि सांस्कृतिक विकास)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700 text-[11px]">Progress Shown — 3 Lines</label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal('E', 'progress')}
                          className="text-[11px] h-6 px-2 text-indigo-600 border-indigo-200"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Choose Remarks
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {[0, 1, 2].map((idx) => (
                          <Input
                            key={`e-p-${idx}`}
                            placeholder={`Line ${idx + 1}...`}
                            value={sectionsData.E.progress[idx]}
                            onChange={(e) => handleLineChange('E', 'progress', idx, e.target.value)}
                            className="text-xs h-7"
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700 text-[11px]">Challenges to Face — 3 Lines</label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal('E', 'challenges')}
                          className="text-[11px] h-6 px-2 text-indigo-600 border-indigo-200"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Choose Remarks
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {[0, 1, 2].map((idx) => (
                          <Input
                            key={`e-c-${idx}`}
                            placeholder={`Line ${idx + 1}...`}
                            value={sectionsData.E.challenges[idx]}
                            onChange={(e) => handleLineChange('E', 'challenges', idx, e.target.value)}
                            className="text-xs h-7"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section G Assessment */}
                <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-4">
                  <h3 className="font-bold text-indigo-950 text-xs border-b border-indigo-200 pb-1">
                    G. Over-all Assessment & Holistic Evaluation (सर्वसमावेशक मूल्यमापन)
                  </h3>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-2">
                      All-round Development Progress (सर्वसमावेशक विकास स्थिती):
                    </label>
                    <div className="flex gap-4">
                      {[
                        { val: 'YES', label: 'Yes (होय)' },
                        { val: 'SATISFACTORY', label: 'Satisfactory (समाधानकारक)' },
                        { val: 'NOT_SATISFACTORY', label: 'Needs Support (अधिक मार्गदर्शनाची गरज)' },
                      ].map((item) => (
                        <label key={item.val} className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                          <input
                            type="radio"
                            name="teacher_allRoundDevelopment"
                            value={item.val}
                            checked={assessmentData.allRoundDevelopment === item.val}
                            onChange={(e) => setAssessmentData({ ...assessmentData, allRoundDevelopment: e.target.value })}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">Special Strengths Identified (विशेष कौशल्ये)</label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal('G', 'STRENGTHS')}
                          className="text-[11px] h-6 px-2 text-indigo-600 border-indigo-200"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Choose Strengths
                        </Button>
                      </div>
                      <textarea
                        rows={3}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                        value={assessmentData.strengthIdentified}
                        onChange={(e) => setAssessmentData({ ...assessmentData, strengthIdentified: e.target.value })}
                        placeholder="Key abilities demonstrated by student..."
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">Additional Support / Guidance Needed (मार्गदर्शन)</label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal('G', 'SUPPORT')}
                          className="text-[11px] h-6 px-2 text-indigo-600 border-indigo-200"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Choose Guidance
                        </Button>
                      </div>
                      <textarea
                        rows={3}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                        value={assessmentData.additionalSupportNeeded}
                        onChange={(e) => setAssessmentData({ ...assessmentData, additionalSupportNeeded: e.target.value })}
                        placeholder="Focus areas for next academic session..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveReportCard}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 px-6"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save & Update Report Card'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        </div>
      )}

      {/* Main Full-Screen Preview & Edit Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Report Card — ${currentStudent?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setModalTab('preview')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  modalTab === 'preview' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Official Print Preview
              </button>
              <button
                onClick={() => setModalTab('edit')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  modalTab === 'edit' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isSecondary ? 'Edit Report Card' : 'Edit Remarks (Choose 3 per Box)'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-xs gap-1.5 h-8">
                <Printer className="w-3.5 h-3.5" /> Print Report Card
              </Button>
              <Button onClick={handleDownloadPDF} variant="outline" className="text-xs gap-1.5 h-8">
                <Download className="w-3.5 h-3.5" /> PDF
              </Button>
            </div>
          </div>

          {modalTab === 'preview' ? (
            <div className="max-h-[75vh] overflow-y-auto p-4 bg-slate-100 rounded-xl flex justify-center">
              <div id="printable-report-card" className="w-full max-w-[297mm] bg-white shadow-md p-2">
                {isSecondary ? (
                  <SecondaryReportCardTemplate
                    reportCard={reportCard}
                    student={currentStudent}
                    classNameDetails={selectedAssignment?.class}
                    divisionDetails={selectedAssignment?.division}
                    academicYearDetails={selectedAssignment?.academicYear}
                    marksData={marksData}
                    attendanceData={attendanceData}
                  />
                ) : isKG ? (
                  <BilingualReportCardTemplate
                    reportCard={reportCard}
                    student={currentStudent}
                    classNameDetails={selectedAssignment?.class}
                    divisionDetails={selectedAssignment?.division}
                    academicYearDetails={selectedAssignment?.academicYear}
                    marksData={marksData}
                    attendanceData={attendanceData}
                  />
                ) : (
                  <PrimaryReportCardTemplate
                    reportCard={reportCard}
                    student={currentStudent}
                    classNameDetails={selectedAssignment?.class}
                    divisionDetails={selectedAssignment?.division}
                    academicYearDetails={selectedAssignment?.academicYear}
                    marksData={marksData}
                    attendanceData={attendanceData}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="max-h-[75vh] overflow-y-auto p-2 space-y-4">
              {isSecondary ? (
                <SecondaryReportCardEditor
                  key={reportCard?.id || selectedStudentId}
                  reportCard={reportCard}
                  onSave={handleSaveSecondary}
                  saving={saving}
                />
              ) : (
                <>
                  <p className="text-xs text-slate-500">
                    You can select up to 3 remarks per box from the Remark Bank or write directly into any slot.
                  </p>
                  {/* Sections A to E quick view */}
                  {['A', 'B', 'C', 'D', 'E'].map((k) => (
                    <div key={k} className="p-3 bg-slate-50 border rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center font-bold text-slate-800">
                        <span>Section {k}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal(k, 'progress')}
                          className="text-[11px] h-6 px-2 text-indigo-600"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Remarks Bank
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 block">Progress Lines:</span>
                          {[0, 1, 2].map((idx) => (
                            <Input
                              key={`modal-p-${k}-${idx}`}
                              value={sectionsData[k].progress[idx]}
                              onChange={(e) => handleLineChange(k, 'progress', idx, e.target.value)}
                              className="h-7 text-xs"
                            />
                          ))}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 block">Challenges Lines:</span>
                          {[0, 1, 2].map((idx) => (
                            <Input
                              key={`modal-c-${k}-${idx}`}
                              value={sectionsData[k].challenges[idx]}
                              onChange={(e) => handleLineChange(k, 'challenges', idx, e.target.value)}
                              className="h-7 text-xs"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                      Close
                    </Button>
                    <Button onClick={handleSaveReportCard} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                      {saving ? 'Saving...' : 'Save & Refresh Preview'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Modal>


      {/* Remarks Bank Picker Modal */}
      <Modal
        isOpen={isRemarksModalOpen}
        onClose={() => setIsRemarksModalOpen(false)}
        title="Remark Bank Selection (Choose up to 3 Remarks)"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-indigo-50/80 p-3 rounded-xl border border-indigo-200">
            <div>
              <span className="text-xs font-semibold text-slate-700 block">
                Category: <strong>{activeRemarkCategory.replace(/_/g, ' ')}</strong>
              </span>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white font-bold text-xs">
                Selected: {selectedRemarkIds.length} / 3
              </span>
            </div>
          </div>

          {/* Category Switcher Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
            {Object.keys(REMARKS_BANK).map((catKey) => (
              <button
                key={catKey}
                onClick={() => {
                  setActiveRemarkCategory(catKey);
                  setSelectedRemarkIds([]);
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                  activeRemarkCategory === catKey
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {catKey.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* 10 Remarks List with Multi-Select */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {(REMARKS_BANK[activeRemarkCategory] || []).map((item: RemarkItem, idx: number) => {
              const isSelected = selectedRemarkIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleRemark(item.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by div click
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1 space-y-0.5 text-xs">
                      <div className="font-semibold text-slate-900">
                        {idx + 1}. {item.en}
                      </div>
                      <div className="text-slate-600 font-serif text-[11px]">
                        {item.mr}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2 border-t text-xs">
            <span className="text-slate-500">
              * Selecting up to 3 remarks fills the 3 lines in the box automatically.
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsRemarksModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleApplyRemarks}
                disabled={selectedRemarkIds.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Apply {selectedRemarkIds.length} Remark(s)
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
