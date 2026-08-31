import React, { useState, useEffect } from 'react';
import { reportCardsApi } from '@/api/reportCards';
import { classesApi } from '@/api/classes';
import { divisionsApi } from '@/api/divisions';
import { academicYearsApi } from '@/api/academicYears';
import { marksApi } from '@/api/marks';
import { attendanceApi } from '@/api/attendance';
import apiClient from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { 
  Download, FileText, CheckCircle, Unlock, RefreshCw, Printer, 
  Sparkles, Edit3, Eye, ListChecks, Save 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { printReportCard } from '@/utils/printReportCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BilingualReportCardTemplate } from '@/components/reportcard/BilingualReportCardTemplate';
import { PrimaryReportCardTemplate } from '@/components/reportcard/PrimaryReportCardTemplate';
import { SecondaryReportCardTemplate } from '@/components/reportcard/SecondaryReportCardTemplate';
import { SecondaryReportCardEditor } from '@/components/reportcard/SecondaryReportCardEditor';
import { REMARKS_BANK, RemarkItem } from '@/utils/remarks';

export default function ReportCardManagement() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [marksData, setMarksData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>({ workingDays: 0, presentDays: 0, percentage: '0%' });

  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Modals
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkClassId, setBulkClassId] = useState<string>('');
  const [bulkDivisionId, setBulkDivisionId] = useState<string>('');
  const [bulkYearId, setBulkYearId] = useState<string>('');

  // Main Report Card Modal (View, Edit & Print)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'preview' | 'edit'>('preview');
  const [activeReportCard, setActiveReportCard] = useState<any | null>(null);

  // Remarks Bank Picker Modal State
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [activeRemarkCategory, setActiveRemarkCategory] = useState<string>('PHYSICAL_MOTOR');
  const [selectedRemarkIds, setSelectedRemarkIds] = useState<string[]>([]);
  const [targetField, setTargetField] = useState<{ secKey: string; field: 'progress' | 'challenges' | 'STRENGTHS' | 'SUPPORT' }>({
    secKey: 'A',
    field: 'progress',
  });

  // Edit Sections State (A-E with 3 lines each for progress and challenges)
  const [editSectionsData, setEditSectionsData] = useState<{
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

  const [editAssessmentData, setEditAssessmentData] = useState({
    allRoundDevelopment: 'YES',
    strengthIdentified: '',
    additionalSupportNeeded: '',
  });

  useEffect(() => {
    academicYearsApi.getAll().then((res) => {
      if (res.data.success && res.data.data.length > 0) {
        setAcademicYears(res.data.data);
        const active = res.data.data.find((y: any) => y.isActive) || res.data.data[0];
        setSelectedYearId(active.id);
        setBulkYearId(active.id);
      }
    });

    classesApi.getAll().then((res) => {
      if (res.data.success && res.data.data.length > 0) {
        setClasses(res.data.data);
        setBulkClassId(res.data.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (bulkClassId) {
      divisionsApi.getByClass(bulkClassId).then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          setDivisions(res.data.data);
          setBulkDivisionId(res.data.data[0].id);
        }
      });
    }
  }, [bulkClassId]);

  useEffect(() => {
    fetchReportCards();
  }, [selectedYearId, selectedClassId, selectedDivisionId, selectedStatus]);

  const fetchReportCards = () => {
    setLoading(true);
    const params: any = {};
    if (selectedYearId) params.academicYearId = selectedYearId;
    if (selectedClassId) params.classId = selectedClassId;
    if (selectedDivisionId) params.divisionId = selectedDivisionId;
    if (selectedStatus) params.status = selectedStatus;

    reportCardsApi.getAll(params)
      .then((res) => {
        if (res.data.success) setReportCards(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleBulkGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkClassId || !bulkYearId) {
      toast.error('Select Class and Academic Year');
      return;
    }

    setGenerating(true);
    try {
      const res = await reportCardsApi.bulkGenerate({
        classId: bulkClassId,
        divisionId: bulkDivisionId || undefined,
        academicYearId: bulkYearId,
      });
      toast.success(`Successfully generated/updated ${res.data.count || 0} report cards!`);
      setIsBulkModalOpen(false);
      fetchReportCards();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to bulk generate report cards');
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalize = async (id: string) => {
    try {
      await reportCardsApi.finalize(id);
      toast.success('Report card finalized & locked!');
      fetchReportCards();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to finalize report card');
    }
  };

  const handleUnlock = async (id: string) => {
    if (!confirm('Are you sure you want to unlock this finalized report card for editing?')) return;
    try {
      await reportCardsApi.unlock(id);
      toast.success('Report card unlocked! Reverted to Draft status.');
      fetchReportCards();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to unlock report card');
    }
  };

  const handleDownloadPDF = async (rcId: string, studentName: string) => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-download' });
      const response = await apiClient.get(`/pdf/report-card/${rcId}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${studentName.replace(/\s+/g, '_')}_ReportCard.pdf`;
      link.click();
      toast.success('PDF downloaded successfully!', { id: 'pdf-download' });
    } catch (err) {
      toast.error('Failed to download PDF report card', { id: 'pdf-download' });
    }
  };

  const populateEditState = (rc: any) => {
    const secMap: any = {
      A: { progress: ['', '', ''], challenges: ['', '', ''] },
      B: { progress: ['', '', ''], challenges: ['', '', ''] },
      C: { progress: ['', '', ''], challenges: ['', '', ''] },
      D: { progress: ['', '', ''], challenges: ['', '', ''] },
      E: { progress: ['', '', ''], challenges: ['', '', ''] },
    };

    if (rc.sections && Array.isArray(rc.sections)) {
      rc.sections.forEach((s: any) => {
        if (s.sectionKey && secMap[s.sectionKey]) {
          const progLines = s.progressShown ? s.progressShown.split('\n').filter(Boolean) : [];
          const chalLines = s.challengesFaced ? s.challengesFaced.split('\n').filter(Boolean) : [];
          secMap[s.sectionKey] = {
            progress: [progLines[0] || '', progLines[1] || '', progLines[2] || ''],
            challenges: [chalLines[0] || '', chalLines[1] || '', chalLines[2] || ''],
          };
        }
      });
    }
    setEditSectionsData(secMap);

    if (rc.assessment) {
      setEditAssessmentData({
        allRoundDevelopment: rc.assessment.allRoundDevelopment || 'YES',
        strengthIdentified: rc.assessment.strengthIdentified || '',
        additionalSupportNeeded: rc.assessment.additionalSupportNeeded || '',
      });
    } else {
      setEditAssessmentData({
        allRoundDevelopment: 'YES',
        strengthIdentified: '',
        additionalSupportNeeded: '',
      });
    }
  };

  const handleOpenPrintPreview = (rc: any, initialTab: 'preview' | 'edit' = 'preview') => {
    setActiveReportCard(rc);
    setModalTab(initialTab);
    populateEditState(rc);
    setMarksData([]);
    setAttendanceData({ workingDays: 0, presentDays: 0, percentage: '0%' });
    setIsPreviewOpen(true);

    // Fetch real marks
    marksApi.getByStudent(rc.studentId, { academicYearId: rc.academicYearId })
      .then((res) => {
        if (res.data.success) {
          setMarksData(res.data.data);
        }
      })
      .catch((err) => console.error('Failed to load student marks', err));

    // Fetch real attendance
    attendanceApi.getStudentAttendance(rc.studentId, rc.academicYearId)
      .then((res) => {
        if (res.data.success && res.data.data.stats) {
          setAttendanceData({
            workingDays: res.data.data.stats.workingDays,
            presentDays: res.data.data.stats.presentDays,
            percentage: `${res.data.data.stats.percentage}%`
          });
        }
      })
      .catch((err) => console.error('Failed to load student attendance', err));
  };

  // Remarks Bank Picker Handlers
  const handleOpenRemarksModal = (secKey: string, field: 'progress' | 'challenges' | 'STRENGTHS' | 'SUPPORT') => {
    setTargetField({ secKey, field });
    if (field === 'challenges') {
      setActiveRemarkCategory('CHALLENGES');
    } else if (field === 'STRENGTHS') {
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
        toast.error('You can select a maximum of 3 remarks for each box.');
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
      setEditAssessmentData((prev) => ({
        ...prev,
        strengthIdentified: selectedTexts.join('\n'),
      }));
    } else if (targetField.field === 'SUPPORT') {
      setEditAssessmentData((prev) => ({
        ...prev,
        additionalSupportNeeded: selectedTexts.join('\n'),
      }));
    } else {
      const fieldKey = targetField.field;
      const newLines: [string, string, string] = ['', '', ''];
      selectedTexts.forEach((txt, idx) => {
        if (idx < 3) newLines[idx] = txt;
      });

      setEditSectionsData((prev) => ({
        ...prev,
        [targetField.secKey]: {
          ...prev[targetField.secKey],
          [fieldKey]: newLines,
        },
      }));
    }

    setIsRemarksModalOpen(false);
    toast.success('Remarks assigned to box!');
  };

  const handleLineChange = (secKey: string, field: 'progress' | 'challenges', index: number, value: string) => {
    setEditSectionsData((prev) => {
      const currentLines = [...prev[secKey][field]] as [string, string, string];
      currentLines[index] = value;
      return {
        ...prev,
        [secKey]: {
          ...prev[secKey],
          [field]: currentLines,
        },
      };
    });
  };

  const handleSaveEdit = async () => {
    if (!activeReportCard) return;
    setSavingEdit(true);
    try {
      const payloadSections = [
        {
          sectionKey: 'A',
          sectionTitle: 'Physical & Motor Development',
          progressShown: editSectionsData.A.progress.filter(Boolean).join('\n'),
          challengesFaced: editSectionsData.A.challenges.filter(Boolean).join('\n'),
        },
        {
          sectionKey: 'B',
          sectionTitle: 'Social Emotional Development',
          progressShown: editSectionsData.B.progress.filter(Boolean).join('\n'),
          challengesFaced: editSectionsData.B.challenges.filter(Boolean).join('\n'),
        },
        {
          sectionKey: 'C',
          sectionTitle: 'Cognitive Development',
          progressShown: editSectionsData.C.progress.filter(Boolean).join('\n'),
          challengesFaced: editSectionsData.C.challenges.filter(Boolean).join('\n'),
        },
        {
          sectionKey: 'D',
          sectionTitle: 'Language & Literacy Development',
          progressShown: editSectionsData.D.progress.filter(Boolean).join('\n'),
          challengesFaced: editSectionsData.D.challenges.filter(Boolean).join('\n'),
        },
        {
          sectionKey: 'E',
          sectionTitle: 'Creative & Aesthetic Development',
          progressShown: editSectionsData.E.progress.filter(Boolean).join('\n'),
          challengesFaced: editSectionsData.E.challenges.filter(Boolean).join('\n'),
        },
      ];

      await Promise.all([
        reportCardsApi.updateSections(activeReportCard.id, { sections: payloadSections }),
        reportCardsApi.updateAssessment(activeReportCard.id, editAssessmentData),
      ]);

      // Update active report card in memory
      const updatedRc = {
        ...activeReportCard,
        sections: payloadSections,
        assessment: editAssessmentData,
      };
      setActiveReportCard(updatedRc);

      toast.success('Report card remarks and evaluation saved!');
      fetchReportCards();
      setModalTab('preview');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSavingEdit(false);
    }
  };

  const isSecondaryClass = (name?: string) => {
    if (!name) return false;
    return /^(8|8th|9|9th|10|10th|VIII|IX|X)$/i.test(name.trim());
  };

  const handleSaveSecondary = async (payload: { studentData: any; sections: any[] }) => {
    if (!activeReportCard) return;
    setSavingEdit(true);
    try {
      await reportCardsApi.updateSections(activeReportCard.id, {
        studentData: payload.studentData,
        sections: payload.sections,
      });

      // Update active report card in memory
      const updatedRc = {
        ...activeReportCard,
        student: { ...activeReportCard.student, ...payload.studentData },
        sections: payload.sections,
      };
      setActiveReportCard(updatedRc);

      toast.success('Report card details, marks & evaluation saved!');
      fetchReportCards();
      setModalTab('preview');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSavingEdit(false);
    }
  };

  // Live updated object for template preview

  const livePreviewObj = activeReportCard
    ? {
        ...activeReportCard,
        sections: [
          { sectionKey: 'A', progressShown: editSectionsData.A.progress.filter(Boolean).join('\n'), challengesFaced: editSectionsData.A.challenges.filter(Boolean).join('\n') },
          { sectionKey: 'B', progressShown: editSectionsData.B.progress.filter(Boolean).join('\n'), challengesFaced: editSectionsData.B.challenges.filter(Boolean).join('\n') },
          { sectionKey: 'C', progressShown: editSectionsData.C.progress.filter(Boolean).join('\n'), challengesFaced: editSectionsData.C.challenges.filter(Boolean).join('\n') },
          { sectionKey: 'D', progressShown: editSectionsData.D.progress.filter(Boolean).join('\n'), challengesFaced: editSectionsData.D.challenges.filter(Boolean).join('\n') },
          { sectionKey: 'E', progressShown: editSectionsData.E.progress.filter(Boolean).join('\n'), challengesFaced: editSectionsData.E.challenges.filter(Boolean).join('\n') },
        ],
        assessment: editAssessmentData,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bharat Ratna Mother Teresa English School</h1>
          <p className="text-slate-500 text-sm">Report Card Auto-Generation, Editing, Approval & Printing (Jr.KG to 10th)</p>
        </div>
        <Button onClick={() => setIsBulkModalOpen(true)} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700">
          <RefreshCw className="w-4 h-4" /> Bulk Generate Class Report Cards
        </Button>
      </div>

      {/* Filter Bar */}
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
          <label className="block text-xs font-semibold text-slate-600 mb-1">Class Filter</label>
          <Select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>Class {c.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Division Filter</label>
          <Select value={selectedDivisionId} onChange={(e) => setSelectedDivisionId(e.target.value)}>
            <option value="">All Divisions</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>Division {d.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Status Filter</label>
          <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="FINALIZED">Finalized</option>
          </Select>
        </div>
      </div>

      {/* Report Cards Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Student Report Cards ({reportCards.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : reportCards.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-slate-500 text-sm">No report card records found matching your filters.</p>
              <Button onClick={() => setIsBulkModalOpen(true)} size="sm">
                <Sparkles className="w-4 h-4 mr-1" /> Bulk Generate Report Cards Now
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-medium text-xs uppercase">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Class & Division</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Academic Year</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportCards.map((rc) => (
                    <tr key={rc.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{rc.student?.name}</div>
                        <div className="text-xs text-slate-500">
                          Roll #{rc.student?.rollNo || '-'}, Adm #{rc.student?.admissionNo}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700">
                        Class {rc.class?.name} - Div {rc.division?.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          rc.status === 'FINALIZED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          rc.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {rc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {rc.academicYear?.name}
                        {rc.finalizedAt && (
                          <div className="text-[10px] text-emerald-600">
                            Finalized: {new Date(rc.finalizedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                          {/* View & Print Action */}
                          <button
                            onClick={() => handleOpenPrintPreview(rc, 'preview')}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="View & Print Report Card"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Edit Remarks Action */}
                          <button
                            onClick={() => handleOpenPrintPreview(rc, 'edit')}
                            className="p-1.5 text-red-800 hover:bg-red-50 rounded-lg"
                            title="Edit Report Card Remarks"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Download PDF Action */}
                          <button
                            onClick={() => handleDownloadPDF(rc.id, rc.student?.name)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Download PDF Progress Report Card"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Finalize Action */}
                          {rc.status !== 'FINALIZED' && (
                            <button
                              onClick={() => handleFinalize(rc.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Finalize & Lock Report Card"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Unlock Action */}
                          {rc.status === 'FINALIZED' && (
                            <button
                              onClick={() => handleUnlock(rc.id)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                              title="Unlock for Editing"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Bulk Generate Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Auto-Generate Class Report Cards"
      >
        <form onSubmit={handleBulkGenerateSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Automatically create/initialize report cards for all enrolled students in the selected class and division:
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
            <Select value={bulkYearId} onChange={(e) => setBulkYearId(e.target.value)}>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class</label>
              <Select value={bulkClassId} onChange={(e) => setBulkClassId(e.target.value)}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>Class {c.name}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Division (Optional)</label>
              <Select value={bulkDivisionId} onChange={(e) => setBulkDivisionId(e.target.value)}>
                <option value="">All Divisions</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>Division {d.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsBulkModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={generating} className="bg-purple-600 hover:bg-purple-700">
              {generating ? 'Generating...' : 'Bulk Generate Report Cards'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Main Report Card Modal: View, Edit & Print */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Report Card — ${activeReportCard?.student?.name || ''} (Class ${activeReportCard?.class?.name || ''}-${activeReportCard?.division?.name || ''})`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Tabs header */}
          <div className="flex justify-between items-center bg-slate-100 p-2 rounded-lg border border-slate-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setModalTab('preview')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  modalTab === 'preview'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Official Print Preview
              </button>
              <button
                onClick={() => setModalTab('edit')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  modalTab === 'edit'
                    ? 'bg-red-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Remarks (Choose 3 per Box)
              </button>
            </div>

            <div className="flex items-center gap-2">
              {modalTab === 'edit' && (
                <Button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex items-center gap-1.5 text-xs bg-red-900 hover:bg-red-950 text-white h-8"
                >
                  <Save className="w-3.5 h-3.5" /> {savingEdit ? 'Saving...' : 'Save & Update'}
                </Button>
              )}
              <Button
                onClick={() => printReportCard('admin-report-card-print-area')}
                className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white h-8"
              >
                <Printer className="w-3.5 h-3.5" /> Print Document
              </Button>
            </div>
          </div>

          {/* Tab 1: Official Print Preview */}
          {modalTab === 'preview' && (
            <div className="max-h-[75vh] overflow-y-auto bg-slate-200 p-4 rounded-lg flex justify-center">
              <div id="admin-report-card-print-area">
                {isSecondaryClass(activeReportCard?.class?.name) ? (
                  <SecondaryReportCardTemplate
                    reportCard={livePreviewObj}
                    student={activeReportCard?.student}
                    classNameDetails={activeReportCard?.class}
                    divisionDetails={activeReportCard?.division}
                    academicYearDetails={activeReportCard?.academicYear}
                    marksData={marksData}
                    attendanceData={attendanceData}
                  />
                ) : activeReportCard?.class?.reportCardTemplate === 'KG' || ['Jr.KG', 'Sr.KG'].includes(activeReportCard?.class?.name) ? (
                  <BilingualReportCardTemplate
                    reportCard={livePreviewObj}
                    student={activeReportCard?.student}
                    classNameDetails={activeReportCard?.class}
                    divisionDetails={activeReportCard?.division}
                    academicYearDetails={activeReportCard?.academicYear}
                    marksData={marksData}
                    attendanceData={attendanceData}
                  />
                ) : (
                  <PrimaryReportCardTemplate
                    reportCard={livePreviewObj}
                    student={activeReportCard?.student}
                    classNameDetails={activeReportCard?.class}
                    divisionDetails={activeReportCard?.division}
                    academicYearDetails={activeReportCard?.academicYear}
                    marksData={marksData}
                    attendanceData={attendanceData}
                  />
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Edit Section */}
          {modalTab === 'edit' && isSecondaryClass(activeReportCard?.class?.name) && (
            <div className="max-h-[75vh] overflow-y-auto p-1">
              <SecondaryReportCardEditor
                reportCard={activeReportCard}
                onSave={handleSaveSecondary}
                saving={savingEdit}
              />
            </div>
          )}

          {modalTab === 'edit' && !isSecondaryClass(activeReportCard?.class?.name) && (
            <div className="max-h-[75vh] overflow-y-auto space-y-6 pr-1">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900 flex justify-between items-center">
                <span>
                  Teachers can choose <strong>up to 3 remarks</strong> for each box using the button or edit/type custom remarks directly in the 3 lines.
                </span>
                <Button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  size="sm"
                  className="bg-red-900 hover:bg-red-950 text-white"
                >
                  <Save className="w-3.5 h-3.5 mr-1" /> {savingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>

              {/* Sections List A-E */}
              {[
                { key: 'A', title: 'A. Physical & Motor Development (शारीरिक आणि मोटर विकास)' },
                { key: 'B', title: 'B. Social Emotional Development / Personal Qualities (सामाजिक - भावनिक विकास)' },
                { key: 'C', title: 'C. Cognitive Development (संज्ञानात्मक विकास)' },
                { key: 'D', title: 'D. Language & Literacy Development (भाषा आणि साक्षरता विकास)' },
                { key: 'E', title: 'E. Creative & Aesthetic Development (सर्जनशील आणि कलात्मक विकास)' },
              ].map((sec) => (
                <div key={sec.key} className="p-4 border border-red-900/30 rounded-xl bg-slate-50/50 space-y-4">
                  <h3 className="font-bold text-red-950 text-sm border-b border-red-900/20 pb-1">{sec.title}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Progress Shown Box (3 Lines) */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-red-950">
                          Progress Shown (विशेष प्रगती)
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal(sec.key, 'progress')}
                          className="text-[11px] h-7 px-2 text-red-900 border-red-200 bg-red-50 hover:bg-red-100"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Choose 3 Remarks
                        </Button>
                      </div>
                      {[0, 1, 2].map((lineIdx) => (
                        <Input
                          key={lineIdx}
                          value={editSectionsData[sec.key]?.progress[lineIdx] || ''}
                          onChange={(e) => handleLineChange(sec.key, 'progress', lineIdx, e.target.value)}
                          placeholder={`Line ${lineIdx + 1}...`}
                          className="text-xs h-8"
                        />
                      ))}
                    </div>

                    {/* Challenges Faced Box (3 Lines) */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-800">
                          Challenges (पुढील वर्षाची आव्हाने)
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRemarksModal(sec.key, 'challenges')}
                          className="text-[11px] h-7 px-2 text-slate-700 border-slate-300 bg-white hover:bg-slate-100"
                        >
                          <ListChecks className="w-3 h-3 mr-1" /> Choose 3 Remarks
                        </Button>
                      </div>
                      {[0, 1, 2].map((lineIdx) => (
                        <Input
                          key={lineIdx}
                          value={editSectionsData[sec.key]?.challenges[lineIdx] || ''}
                          onChange={(e) => handleLineChange(sec.key, 'challenges', lineIdx, e.target.value)}
                          placeholder={`Line ${lineIdx + 1}...`}
                          className="text-xs h-8"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Assessment Section G */}
              <div className="p-4 border border-red-900/30 rounded-xl bg-white space-y-4">
                <h3 className="font-bold text-red-950 text-sm border-b border-red-900/20 pb-1">
                  G. Overall Assessment & Progress Details
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    1) All-round development shown in academic year? (सर्वांगीण विकास दिसून आला का?)
                  </label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center space-x-2 text-xs font-medium text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="editAllRound"
                        value="YES"
                        checked={editAssessmentData.allRoundDevelopment === 'YES'}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, allRoundDevelopment: e.target.value })}
                        className="w-4 h-4 text-red-900"
                      />
                      <span>Yes / होय</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs font-medium text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="editAllRound"
                        value="SATISFACTORY"
                        checked={editAssessmentData.allRoundDevelopment === 'SATISFACTORY'}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, allRoundDevelopment: e.target.value })}
                        className="w-4 h-4 text-red-900"
                      />
                      <span>Satisfactory (समाधानकारक)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs font-medium text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="editAllRound"
                        value="NOT_SATISFACTORY"
                        checked={editAssessmentData.allRoundDevelopment === 'NOT_SATISFACTORY'}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, allRoundDevelopment: e.target.value })}
                        className="w-4 h-4 text-red-900"
                      />
                      <span>Not Satisfactory (असमाधानकारक)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      2) Any One Strength Identified (ओळखलेली बलस्थाने)
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenRemarksModal('A', 'STRENGTHS')}
                      className="text-[11px] h-7 text-red-900 border-red-200 bg-red-50"
                    >
                      <ListChecks className="w-3 h-3 mr-1" /> Pick Strength Remark
                    </Button>
                  </div>
                  <Textarea
                    rows={2}
                    value={editAssessmentData.strengthIdentified}
                    onChange={(e) => setEditAssessmentData({ ...editAssessmentData, strengthIdentified: e.target.value })}
                    placeholder="Enter identified strength..."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      3) Additional Support Needed (अतिरिक्त मदतीची गरज असलेले क्षेत्र)
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenRemarksModal('A', 'SUPPORT')}
                      className="text-[11px] h-7 text-red-900 border-red-200 bg-red-50"
                    >
                      <ListChecks className="w-3 h-3 mr-1" /> Pick Support Remark
                    </Button>
                  </div>
                  <Textarea
                    rows={2}
                    value={editAssessmentData.additionalSupportNeeded}
                    onChange={(e) => setEditAssessmentData({ ...editAssessmentData, additionalSupportNeeded: e.target.value })}
                    placeholder="Enter support needed..."
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="bg-red-900 hover:bg-red-950 text-white flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> {savingEdit ? 'Saving...' : 'Save & Update Report Card'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Remarks Selection Modal (Choose up to 3 out of 10) */}
      <Modal
        isOpen={isRemarksModalOpen}
        onClose={() => setIsRemarksModalOpen(false)}
        title="Select Remarks (Choose up to 3 Remarks)"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-xs">
            <span className="text-amber-900 font-medium">
              Select <strong>up to 3 remarks</strong> from the 10 available bilingual options below:
            </span>
            <span className={`font-bold px-2 py-0.5 rounded ${
              selectedRemarkIds.length === 3 ? 'bg-emerald-600 text-white' : 'bg-amber-200 text-amber-900'
            }`}>
              Selected: {selectedRemarkIds.length} / 3
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {(REMARKS_BANK[activeRemarkCategory] || []).map((remark) => {
              const isChecked = selectedRemarkIds.includes(remark.id);
              const isDisabled = !isChecked && selectedRemarkIds.length >= 3;
              return (
                <div
                  key={remark.id}
                  onClick={() => !isDisabled && handleToggleRemark(remark.id)}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
                    isChecked
                      ? 'bg-red-50 border-red-800 shadow-sm cursor-pointer'
                      : isDisabled
                        ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => {}} // Handled by parent div onClick
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-900 focus:ring-red-800"
                  />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-slate-900">{remark.en}</p>
                    <p className="text-red-900 font-serif font-medium">{remark.mr}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-200">
            <span className="text-xs text-slate-500 font-semibold">
              {selectedRemarkIds.length} of 3 remarks chosen
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsRemarksModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleApplyRemarks}
                disabled={selectedRemarkIds.length === 0}
                className="bg-red-900 hover:bg-red-950 text-white"
              >
                Assign Selected Remarks
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
