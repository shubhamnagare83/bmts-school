import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { 
  Sparkles, Save, User, Award, Calendar, CheckSquare, 
  BookOpen, Star, FileText, CheckCircle2 
} from 'lucide-react';
import { REMARKS_BANK, RemarkItem, COMPETENCY_DOMAINS } from '@/utils/remarks';
import toast from 'react-hot-toast';

export interface SecondaryReportCardEditorProps {
  reportCard: any;
  onSave: (payload: {
    studentData: any;
    sections: any[];
  }) => Promise<void>;
  saving: boolean;
}

export const SecondaryReportCardEditor: React.FC<SecondaryReportCardEditorProps> = ({
  reportCard,
  onSave,
  saving,
}) => {
  const rawClassName = (reportCard?.class?.name || '10th').trim();
  const is10th = /^(10|10th|X)$/i.test(rawClassName);
  const is9th = /^(9|9th|IX)$/i.test(rawClassName);
  const is8th = !is10th && !is9th;

  // Active Tab inside Editor
  const [activeTab, setActiveTab] = useState<'profile' | 'marks' | 'attendance' | 'descriptive' | 'competency' | 'general'>('descriptive');

  // Student Profile State
  const [studentData, setStudentData] = useState({
    name: reportCard?.student?.name || '',
    rollNo: reportCard?.student?.rollNo || '',
    admissionNo: reportCard?.student?.admissionNo || '',
    uidNo: reportCard?.student?.admissionNo || '',
    regNo: reportCard?.student?.admissionNo || '',
    idNo: reportCard?.student?.admissionNo || '',
    fatherName: reportCard?.student?.fatherName || '',
    fatherOccupation: reportCard?.student?.fatherOccupation || '',
    motherName: reportCard?.student?.motherName || '',
    motherOccupation: reportCard?.student?.motherOccupation || '',
    motherTongue: reportCard?.student?.motherTongue || 'Marathi',
    dob: reportCard?.student?.dob ? new Date(reportCard.student.dob).toISOString().split('T')[0] : '',
    parentContact: reportCard?.student?.parentContact || '',
    weight: reportCard?.student?.weight || '38 kg',
    height: reportCard?.student?.height || "4'11\"",
    address: reportCard?.student?.address || 'Gangapur, Chha. Sambhajinagar',
    photo: reportCard?.student?.photo || '',
  });

  // Extract saved section data
  const existingDesc = reportCard?.sections?.find((s: any) => s.sectionKey === 'SECONDARY_DESCRIPTIVE')?.additionalData || {};
  const existingComp = reportCard?.sections?.find((s: any) => s.sectionKey === 'SECONDARY_COMPETENCY')?.additionalData || {};
  const existingAtt = reportCard?.sections?.find((s: any) => s.sectionKey === 'SECONDARY_ATTENDANCE')?.additionalData || {};
  const existingMarks = reportCard?.sections?.find((s: any) => s.sectionKey === 'SECONDARY_MARKS')?.additionalData || {};
  const existingGen = reportCard?.sections?.find((s: any) => s.sectionKey === 'SECONDARY_GENERAL')?.additionalData || {};

  // Descriptive Assessment State
  const [descData, setDescData] = useState({
    test1_prog1: existingDesc.test1_prog1 || '1. Strong conceptual clarity & analytical thinking in core topics.',
    test1_prog2: existingDesc.test1_prog2 || '2. Consistent effort in completing practical & oral assignments.',
    test1_imp1: existingDesc.test1_imp1 || '1. Needs regular practice in mathematical calculations and formulae.',
    test1_imp2: existingDesc.test1_imp2 || '2. Focus on exam time management and neat handwriting.',
    test2_prog1: existingDesc.test2_prog1 || '1. Active participation in classroom discussions and science experiments.',
    test2_prog2: existingDesc.test2_prog2 || '2. Shows noticeable improvement in writing speed and exam presentation.',
    test2_imp1: existingDesc.test2_imp1 || '1. Regular revision of diagrams, scientific definitions, and theorem proofs.',
    test2_imp2: existingDesc.test2_imp2 || '2. Daily reading habit recommended for English & regional vocabulary.',
  });

  // Remarks Bank Picker Modal State
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [remarksModalTarget, setRemarksModalTarget] = useState<{
    test: 'test1' | 'test2';
    type: 'prog' | 'imp';
  }>({ test: 'test1', type: 'prog' });
  const [selectedRemarkTexts, setSelectedRemarkTexts] = useState<string[]>([]);

  // Competency Ratings State (30 items x 2 terms = 60 values, 1-5)
  const [compData, setCompData] = useState<{ [key: string]: string }>(() => {
    const initial: { [key: string]: string } = {};
    COMPETENCY_DOMAINS.forEach(dom => {
      dom.items.forEach(it => {
        const k1 = `dom_${dom.id}_it_${it.id}_t1`;
        const k2 = `dom_${dom.id}_it_${it.id}_t2`;
        initial[k1] = existingComp[k1] || '4';
        initial[k2] = existingComp[k2] || '5';
      });
    });
    return initial;
  });

  // Monthly Attendance State
  const months = ['June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.', 'Jan.', 'Feb.', 'Mar.'];
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: { wDays: string; pDays: string } }>(() => {
    const initial: any = {};
    const defaultDays = [
      { m: 'June', w: '22', p: '21' },
      { m: 'July', w: '24', p: '23' },
      { m: 'Aug.', w: '23', p: '22' },
      { m: 'Sept.', w: '22', p: '20' },
      { m: 'Oct.', w: '20', p: '19' },
      { m: 'Nov.', w: '21', p: '20' },
      { m: 'Dec.', w: '23', p: '22' },
      { m: 'Jan.', w: '22', p: '21' },
      { m: 'Feb.', w: '21', p: '20' },
      { m: 'Mar.', w: '22', p: '20' },
    ];
    months.forEach((m, idx) => {
      initial[m] = {
        wDays: existingAtt[m]?.wDays ?? defaultDays[idx].w,
        pDays: existingAtt[m]?.pDays ?? defaultDays[idx].p,
      };
    });
    return initial;
  });

  // Marks State
  const [marksState, setMarksState] = useState<{ [key: string]: string }>(() => {
    const initial: any = { ...existingMarks };
    return initial;
  });

  // General State (Signs, Reopen Dates, Overall grade)
  const [genData, setGenData] = useState({
    scholasticAchievement: existingGen.scholasticAchievement || 'A - 1',
    coScholasticPoint: existingGen.coScholasticPoint || '4.6',
    reopenTerm2: existingGen.reopenTerm2 || '03/11/2026',
    reopenNewYear: existingGen.reopenNewYear || '15/06/2027',
    ctSign1: existingGen.ctSign1 || 'Verified',
    ctSign2: existingGen.ctSign2 || 'Verified',
    ctSign3: existingGen.ctSign3 || 'Verified',
    ctSign4: existingGen.ctSign4 || 'Verified',
    hmSign1: existingGen.hmSign1 || 'Signed',
    hmSign2: existingGen.hmSign2 || 'Signed',
    hmSign3: existingGen.hmSign3 || 'Signed',
    hmSign4: existingGen.hmSign4 || 'Signed',
  });

  // Subjects configuration
  const std10Subjects = [
    { id: 'eng', name: 'I Language ENGLISH' },
    { id: 'hin', name: 'II Language HINDI' },
    { id: 'mar', name: 'III Language MARATHI' },
    { id: 'math', name: 'MATHS I & II' },
    { id: 'sci', name: 'SCIENCE & TECHNOLOGY' },
    { id: 'soc', name: 'SOCIAL SCIENCE' },
  ];
  const std10GradeSubjects = [
    { id: 'g_hpe', name: 'Health & Physical Education' },
    { id: 'g_art', name: 'Self Development & Art Appriciation' },
    { id: 'g_ws', name: 'Water Security' },
  ];

  const std9Subjects = [
    { id: 'eng', name: 'I Language ENGLISH' },
    { id: 'hin', name: 'II Language HINDI' },
    { id: 'mar', name: 'III Language MARATHI' },
    { id: 'math', name: 'MATHS I & II' },
    { id: 'sci', name: 'SCIENCE & TECHNOLOGY' },
    { id: 'soc', name: 'SOCIAL SCIENCE' },
  ];
  const std9GradeSubjects = [
    { id: 'g_hpe', name: 'Health & Phy. Education' },
    { id: 'g_art', name: 'Self Dev. & Art Appr.' },
    { id: 'g_ws', name: 'Water Security' },
  ];

  const std8Subjects = [
    { id: 'eng', name: 'I Language ENGLISH' },
    { id: 'hin', name: 'II Language HINDI' },
    { id: 'mar', name: 'III Language MARATHI' },
    { id: 'math', name: 'MATHS' },
    { id: 'sci', name: 'G.SCIENCE' },
    { id: 'soc', name: 'SOCIAL SCIENCE' },
  ];
  const std8GradeSubjects = [
    { id: 'g_hpe', name: 'Health & Phy. Education' },
    { id: 'g_gk', name: 'G.K./LBV' },
    { id: 'g_comp', name: 'Computer' },
    { id: 'g_art', name: 'Art' },
  ];

  // Open Remarks Bank Modal
  const handleOpenRemarksModal = (test: 'test1' | 'test2', type: 'prog' | 'imp') => {
    setRemarksModalTarget({ test, type });
    setSelectedRemarkTexts([]);
    setIsRemarksModalOpen(true);
  };

  // Toggle Remark Selection (Max 2 remarks)
  const handleToggleRemark = (text: string) => {
    if (selectedRemarkTexts.includes(text)) {
      setSelectedRemarkTexts(selectedRemarkTexts.filter(t => t !== text));
    } else {
      if (selectedRemarkTexts.length >= 2) {
        toast.error('You can select a maximum of 2 remarks for the 2 lines.');
        return;
      }
      setSelectedRemarkTexts([...selectedRemarkTexts, text]);
    }
  };

  // Apply Selected Remarks to Target Test Lines
  const handleApplyRemarks = () => {
    const { test, type } = remarksModalTarget;
    const r1 = selectedRemarkTexts[0] ? `1. ${selectedRemarkTexts[0]}` : '';
    const r2 = selectedRemarkTexts[1] ? `2. ${selectedRemarkTexts[1]}` : '';

    if (test === 'test1' && type === 'prog') {
      setDescData(prev => ({ ...prev, test1_prog1: r1 || prev.test1_prog1, test1_prog2: r2 || prev.test1_prog2 }));
    } else if (test === 'test1' && type === 'imp') {
      setDescData(prev => ({ ...prev, test1_imp1: r1 || prev.test1_imp1, test1_imp2: r2 || prev.test1_imp2 }));
    } else if (test === 'test2' && type === 'prog') {
      setDescData(prev => ({ ...prev, test2_prog1: r1 || prev.test2_prog1, test2_prog2: r2 || prev.test2_prog2 }));
    } else if (test === 'test2' && type === 'imp') {
      setDescData(prev => ({ ...prev, test2_imp1: r1 || prev.test2_imp1, test2_imp2: r2 || prev.test2_imp2 }));
    }

    setIsRemarksModalOpen(false);
    toast.success('Selected remarks assigned to the lines!');
  };

  // Quick rating fill for competency
  const handleQuickFillCompetency = (val: string) => {
    const updated: any = {};
    COMPETENCY_DOMAINS.forEach(dom => {
      dom.items.forEach(it => {
        updated[`dom_${dom.id}_it_${it.id}_t1`] = val;
        updated[`dom_${dom.id}_it_${it.id}_t2`] = val;
      });
    });
    setCompData(updated);
    toast.success(`Set all competency ratings to ${val}`);
  };

  // Handle Photo Upload (file to base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Photo size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setStudentData(prev => ({ ...prev, photo: reader.result as string }));
        toast.success('Student photo uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Save
  const handleSaveAll = async () => {
    const sectionsPayload = [
      {
        sectionKey: 'SECONDARY_DESCRIPTIVE',
        sectionTitle: 'Descriptive Assessment',
        additionalData: descData,
      },
      {
        sectionKey: 'SECONDARY_COMPETENCY',
        sectionTitle: 'Competency Progress Card',
        additionalData: compData,
      },
      {
        sectionKey: 'SECONDARY_ATTENDANCE',
        sectionTitle: 'Monthly Attendance Chart',
        additionalData: attendanceData,
      },
      {
        sectionKey: 'SECONDARY_MARKS',
        sectionTitle: 'Academic Progress Marks',
        additionalData: marksState,
      },
      {
        sectionKey: 'SECONDARY_GENERAL',
        sectionTitle: 'Signatures & Reopening Dates',
        additionalData: genData,
      },
    ];

    await onSave({
      studentData,
      sections: sectionsPayload,
    });
  };

  const remarksBankToDisplay = remarksModalTarget.type === 'prog'
    ? (REMARKS_BANK.SECONDARY_SPECIAL_PROGRESS || [])
    : (REMARKS_BANK.SECONDARY_IMPROVEMENT_NEEDED || []);

  return (
    <div className="space-y-4">
      {/* Top Action & Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'descriptive' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('descriptive')}
            className="flex items-center gap-1 text-xs"
          >
            <BookOpen className="w-3.5 h-3.5" /> Descriptive Assessment (Remarks)
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeTab === 'competency' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('competency')}
            className="flex items-center gap-1 text-xs"
          >
            <Star className="w-3.5 h-3.5" /> Competency Ratings (1-5)
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeTab === 'profile' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-1 text-xs"
          >
            <User className="w-3.5 h-3.5" /> Student Profile & Photo
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeTab === 'marks' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('marks')}
            className="flex items-center gap-1 text-xs"
          >
            <Award className="w-3.5 h-3.5" /> Academic Marks
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeTab === 'attendance' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('attendance')}
            className="flex items-center gap-1 text-xs"
          >
            <Calendar className="w-3.5 h-3.5" /> Monthly Attendance
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeTab === 'general' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('general')}
            className="flex items-center gap-1 text-xs"
          >
            <CheckSquare className="w-3.5 h-3.5" /> Reopening & Signs
          </Button>
        </div>

        <Button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DESCRIPTIVE ASSESSMENT WITH REMARKS BANK (8 CURATED REMARKS)      */}
      {/* ========================================================================= */}
      {activeTab === 'descriptive' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center justify-between">
            <div>
              <span className="font-bold">Descriptive Assessment Section:</span> There are 8 curated remarks for Special Progress Made and 8 for Improvement Needed. You can click the "Pick from Remarks Bank" button to choose any 2 remarks, or edit each line manually.
            </div>
          </div>

          {/* Test 1 Box */}
          <Card>
            <CardHeader className="py-2.5 bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-800">
                  {is10th ? 'Second Test Descriptive Assessment' : 'First Test Descriptive Assessment'}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenRemarksModal('test1', 'prog')}
                    className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Pick 2 Special Progress Remarks
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenRemarksModal('test1', 'imp')}
                    className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Pick 2 Improvement Remarks
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Special Progress Made (2 Lines)</label>
                <Input
                  value={descData.test1_prog1}
                  onChange={(e) => setDescData({ ...descData, test1_prog1: e.target.value })}
                  placeholder="Line 1"
                  className="text-xs"
                />
                <Input
                  value={descData.test1_prog2}
                  onChange={(e) => setDescData({ ...descData, test1_prog2: e.target.value })}
                  placeholder="Line 2"
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Improvement Needed (2 Lines)</label>
                <Input
                  value={descData.test1_imp1}
                  onChange={(e) => setDescData({ ...descData, test1_imp1: e.target.value })}
                  placeholder="Line 1"
                  className="text-xs"
                />
                <Input
                  value={descData.test1_imp2}
                  onChange={(e) => setDescData({ ...descData, test1_imp2: e.target.value })}
                  placeholder="Line 2"
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Test 2 Box */}
          <Card>
            <CardHeader className="py-2.5 bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-800">
                  {is10th ? 'Prelim Exam Descriptive Assessment' : 'Second Test Descriptive Assessment'}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenRemarksModal('test2', 'prog')}
                    className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Pick 2 Special Progress Remarks
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenRemarksModal('test2', 'imp')}
                    className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Pick 2 Improvement Remarks
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Special Progress Made (2 Lines)</label>
                <Input
                  value={descData.test2_prog1}
                  onChange={(e) => setDescData({ ...descData, test2_prog1: e.target.value })}
                  placeholder="Line 1"
                  className="text-xs"
                />
                <Input
                  value={descData.test2_prog2}
                  onChange={(e) => setDescData({ ...descData, test2_prog2: e.target.value })}
                  placeholder="Line 2"
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Improvement Needed (2 Lines)</label>
                <Input
                  value={descData.test2_imp1}
                  onChange={(e) => setDescData({ ...descData, test2_imp1: e.target.value })}
                  placeholder="Line 1"
                  className="text-xs"
                />
                <Input
                  value={descData.test2_imp2}
                  onChange={(e) => setDescData({ ...descData, test2_imp2: e.target.value })}
                  placeholder="Line 2"
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMPETENCY RATINGS (1 TO 5 ACROSS 6 DOMAINS)                      */}
      {/* ========================================================================= */}
      {activeTab === 'competency' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-900 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold">Competency Rating Scale:</span> 5 = Excellent, 4 = Good, 3 = Satisfactory, 2 = Improving, 1 = Needs Support.
              <br />Enter or select numbers (1-5) for each sub-criterion under I TERM and II TERM.
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => handleQuickFillCompetency('5')} className="text-xs">
                Set All 5
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleQuickFillCompetency('4')} className="text-xs">
                Set All 4
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleQuickFillCompetency('3')} className="text-xs">
                Set All 3
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {COMPETENCY_DOMAINS.map(dom => (
              <Card key={dom.id} className="border border-slate-300">
                <CardHeader className="py-2 px-3 bg-[#005580] text-white">
                  <CardTitle className="text-xs font-bold text-white">
                    {dom.titleEn} ({dom.titleMr})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                  <div className="grid grid-cols-12 text-[10px] font-bold text-slate-700 border-b pb-1 px-1">
                    <div className="col-span-8">Criteria / निकष</div>
                    <div className="col-span-2 text-center text-pink-700">I TERM</div>
                    <div className="col-span-2 text-center text-teal-700">II TERM</div>
                  </div>

                  {dom.items.map(it => {
                    const k1 = `dom_${dom.id}_it_${it.id}_t1`;
                    const k2 = `dom_${dom.id}_it_${it.id}_t2`;
                    return (
                      <div key={it.id} className="grid grid-cols-12 items-center gap-1 text-xs border-b border-slate-100 pb-1.5 last:border-b-0">
                        <div className="col-span-8 leading-tight">
                          <span className="font-semibold text-slate-900">{it.id}. {it.titleEn}</span>
                          <span className="block text-[10px] text-slate-500">{it.titleMr}</span>
                        </div>
                        <div className="col-span-2">
                          <Select
                            value={compData[k1] || '4'}
                            onChange={(e) => setCompData({ ...compData, [k1]: e.target.value })}
                            className="text-xs p-1 text-center font-bold"
                          >
                            <option value="5">5</option>
                            <option value="4">4</option>
                            <option value="3">3</option>
                            <option value="2">2</option>
                            <option value="1">1</option>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Select
                            value={compData[k2] || '5'}
                            onChange={(e) => setCompData({ ...compData, [k2]: e.target.value })}
                            className="text-xs p-1 text-center font-bold"
                          >
                            <option value="5">5</option>
                            <option value="4">4</option>
                            <option value="3">3</option>
                            <option value="2">2</option>
                            <option value="1">1</option>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STUDENT PROFILE & PHOTO                                           */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader className="py-3 bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" /> Student Profile & Passport Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Photo Section */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-50 rounded-lg border">
              <div className="w-24 h-28 border-2 border-dashed border-indigo-400 rounded bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {studentData.photo ? (
                  <img src={studentData.photo} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-slate-400 text-center font-semibold">No Photo</span>
                )}
              </div>
              <div className="space-y-1.5 text-xs flex-1">
                <label className="block font-bold text-slate-700">Upload / Update Student Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-[11px] text-slate-500">Supported formats: JPG, PNG, WEBP. Max 2MB.</p>
                {studentData.photo && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setStudentData({ ...studentData, photo: '' })}
                    className="text-xs text-red-600 hover:bg-red-50"
                  >
                    Remove Photo
                  </Button>
                )}
              </div>
            </div>

            {/* Profile Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Full Name</label>
                <Input
                  value={studentData.name}
                  onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                  placeholder="e.g. ADITI SHARMA"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Roll No.</label>
                <Input
                  value={studentData.rollNo}
                  onChange={(e) => setStudentData({ ...studentData, rollNo: e.target.value })}
                  placeholder="e.g. 14"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">UID No. / Admission No.</label>
                <Input
                  value={studentData.admissionNo}
                  onChange={(e) => setStudentData({ ...studentData, admissionNo: e.target.value, uidNo: e.target.value })}
                  placeholder="e.g. UID2026-089"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Father’s Name</label>
                <Input
                  value={studentData.fatherName}
                  onChange={(e) => setStudentData({ ...studentData, fatherName: e.target.value })}
                  placeholder="Father's Name"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Father's Occupation</label>
                <Input
                  value={studentData.fatherOccupation}
                  onChange={(e) => setStudentData({ ...studentData, fatherOccupation: e.target.value })}
                  placeholder="Occupation"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mother’s Name</label>
                <Input
                  value={studentData.motherName}
                  onChange={(e) => setStudentData({ ...studentData, motherName: e.target.value })}
                  placeholder="Mother's Name"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mother's Occupation</label>
                <Input
                  value={studentData.motherOccupation}
                  onChange={(e) => setStudentData({ ...studentData, motherOccupation: e.target.value })}
                  placeholder="Occupation"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mother Tongue</label>
                <Input
                  value={studentData.motherTongue}
                  onChange={(e) => setStudentData({ ...studentData, motherTongue: e.target.value })}
                  placeholder="e.g. Marathi / Hindi"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                <Input
                  type="date"
                  value={studentData.dob}
                  onChange={(e) => setStudentData({ ...studentData, dob: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile / Parent Contact</label>
                <Input
                  value={studentData.parentContact}
                  onChange={(e) => setStudentData({ ...studentData, parentContact: e.target.value })}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Weight</label>
                <Input
                  value={studentData.weight}
                  onChange={(e) => setStudentData({ ...studentData, weight: e.target.value })}
                  placeholder="e.g. 38 kg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Height</label>
                <Input
                  value={studentData.height}
                  onChange={(e) => setStudentData({ ...studentData, height: e.target.value })}
                  placeholder="e.g. 4'11&quot;"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                <Input
                  value={studentData.address}
                  onChange={(e) => setStudentData({ ...studentData, address: e.target.value })}
                  placeholder="Full Residential Address"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ACADEMIC MARKS                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'marks' && (
        <Card>
          <CardHeader className="py-3 bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" /> Academic Marks & Exam Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <p className="text-xs text-slate-600">
              Directly edit written, practical/oral marks and grade subjects. Totals and percentages calculate automatically on the progress report card.
            </p>

            {is10th ? (
              /* Std 10th Marks Inputs */
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-xs text-center">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b">
                      <th className="p-2 text-left">Subject</th>
                      <th colSpan={2} className="p-1 border-x">First Test (80/20)</th>
                      <th colSpan={2} className="p-1 border-x">Second Test (80/20)</th>
                      <th colSpan={2} className="p-1">First Prelim (80/20)</th>
                    </tr>
                    <tr className="bg-slate-50 text-[11px] font-semibold border-b">
                      <th className="p-1 text-left"></th>
                      <th className="p-1 border-l w-16">Written</th>
                      <th className="p-1 border-r w-16">Oral/Pra</th>
                      <th className="p-1 border-l w-16">Written</th>
                      <th className="p-1 border-r w-16">Oral/Pra</th>
                      <th className="p-1 border-l w-16">Written</th>
                      <th className="p-1 w-16">Oral/Pra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {std10Subjects.map(s => (
                      <tr key={s.id} className="border-b">
                        <td className="p-2 text-left font-semibold">{s.name}</td>
                        <td className="p-1 border-l">
                          <Input
                            type="number"
                            value={marksState[`${s.id}_t1_w`] || ''}
                            onChange={(e) => setMarksState({ ...marksState, [`${s.id}_t1_w`]: e.target.value })}
                            placeholder="W (80)"
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td className="p-1 border-r">
                          <Input
                            type="number"
                            value={marksState[`${s.id}_t1_o`] || ''}
                            onChange={(e) => setMarksState({ ...marksState, [`${s.id}_t1_o`]: e.target.value })}
                            placeholder="O (20)"
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td className="p-1 border-l">
                          <Input
                            type="number"
                            value={marksState[`${s.id}_t2_w`] || ''}
                            onChange={(e) => setMarksState({ ...marksState, [`${s.id}_t2_w`]: e.target.value })}
                            placeholder="W (80)"
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td className="p-1 border-r">
                          <Input
                            type="number"
                            value={marksState[`${s.id}_t2_o`] || ''}
                            onChange={(e) => setMarksState({ ...marksState, [`${s.id}_t2_o`]: e.target.value })}
                            placeholder="O (20)"
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td className="p-1 border-l">
                          <Input
                            type="number"
                            value={marksState[`${s.id}_p1_w`] || ''}
                            onChange={(e) => setMarksState({ ...marksState, [`${s.id}_p1_w`]: e.target.value })}
                            placeholder="W (80)"
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td className="p-1">
                          <Input
                            type="number"
                            value={marksState[`${s.id}_p1_o`] || ''}
                            onChange={(e) => setMarksState({ ...marksState, [`${s.id}_p1_o`]: e.target.value })}
                            placeholder="O (20)"
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                      </tr>
                    ))}

                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={7} className="p-1 text-left uppercase text-xs">Grade Subjects</td>
                    </tr>

                    {std10GradeSubjects.map(g => (
                      <tr key={g.id} className="border-b">
                        <td className="p-2 text-left">{g.name}</td>
                        <td colSpan={2} className="p-1 border-x">
                          <Input
                            value={marksState[`${g.id}_t1`] || 'A'}
                            onChange={(e) => setMarksState({ ...marksState, [`${g.id}_t1`]: e.target.value })}
                            placeholder="Grade"
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td colSpan={2} className="p-1 border-x">
                          <Input
                            value={marksState[`${g.id}_t2`] || 'A'}
                            onChange={(e) => setMarksState({ ...marksState, [`${g.id}_t2`]: e.target.value })}
                            placeholder="Grade"
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td colSpan={2} className="p-1">
                          <Input
                            value={marksState[`${g.id}_p1`] || 'A'}
                            onChange={(e) => setMarksState({ ...marksState, [`${g.id}_p1`]: e.target.value })}
                            placeholder="Grade"
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Std 8th & 9th Marks Inputs */
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-xs text-center">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b">
                      <th className="p-2 text-left">Subject</th>
                      <th colSpan={2} className="p-1 border-x">First UT A1 (40/10)</th>
                      <th colSpan={2} className="p-1 border-x">First Term A2 (80/20)</th>
                      <th colSpan={2} className="p-1 border-x">Second UT B1 (40/10)</th>
                      <th colSpan={2} className="p-1">Second Term B2 (80/20)</th>
                    </tr>
                    <tr className="bg-slate-50 text-[11px] font-semibold border-b">
                      <th className="p-1 text-left"></th>
                      <th className="p-1 border-l w-14">W (40)</th>
                      <th className="p-1 border-r w-14">O (10)</th>
                      <th className="p-1 border-l w-14">W (80)</th>
                      <th className="p-1 border-r w-14">O (20)</th>
                      <th className="p-1 border-l w-14">W (40)</th>
                      <th className="p-1 border-r w-14">O (10)</th>
                      <th className="p-1 border-l w-14">W (80)</th>
                      <th className="p-1 w-14">O (20)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(is8th ? std8Subjects : std9Subjects).map(s => (
                      <tr key={s.id} className="border-b">
                        <td className="p-2 text-left font-semibold">{s.name}</td>
                        <td className="p-1 border-l">
                          <Input
                            type="number"
                            value={marksState[`${s.id}_t1_w`] || ''}
                            onChange={(e) => setMarksState({ ...marksState, [`${s.id}_t1_w`]: e.target.value })}
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td className="p-1 border-r">
                          <Input
                            type="number"
                            value={marksState[`${s.id}_t1_o`] || ''}
                            onChange={(e) => setMarksState({ ...marksState, [`${s.id}_t1_o`]: e.target.value })}
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td className="p-1 border-l">
                          <Input
                            type="number"
                            value={marksState[`${s.id}_a2_w`] || ''}
                            onChange={(e) => setMarksState({ ...marksState, [`${s.id}_a2_w`]: e.target.value })}
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td className="p-1 border-r">
                          <Input
                            type="number"
                            value={marksState[`${s.id}_a2_o`] || ''}
                            onChange={(e) => setMarksState({ ...marksState, [`${s.id}_a2_o`]: e.target.value })}
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td className="p-1 border-l">
                          <Input
                            type="number"
                            value={marksState[`${s.id}_t2_w`] || ''}
                            onChange={(e) => setMarksState({ ...marksState, [`${s.id}_t2_w`]: e.target.value })}
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td className="p-1 border-r">
                          <Input
                            type="number"
                            value={marksState[`${s.id}_t2_o`] || ''}
                            onChange={(e) => setMarksState({ ...marksState, [`${s.id}_t2_o`]: e.target.value })}
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td className="p-1 border-l">
                          <Input
                            type="number"
                            value={marksState[`${s.id}_b2_w`] || ''}
                            onChange={(e) => setMarksState({ ...marksState, [`${s.id}_b2_w`]: e.target.value })}
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td className="p-1">
                          <Input
                            type="number"
                            value={marksState[`${s.id}_b2_o`] || ''}
                            onChange={(e) => setMarksState({ ...marksState, [`${s.id}_b2_o`]: e.target.value })}
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                      </tr>
                    ))}

                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={9} className="p-1 text-left uppercase text-xs">Grade Subjects</td>
                    </tr>

                    {(is8th ? std8GradeSubjects : std9GradeSubjects).map(g => (
                      <tr key={g.id} className="border-b">
                        <td className="p-2 text-left">{g.name}</td>
                        <td colSpan={2} className="p-1 border-x">
                          <Input
                            value={marksState[`${g.id}_t1`] || 'A'}
                            onChange={(e) => setMarksState({ ...marksState, [`${g.id}_t1`]: e.target.value })}
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td colSpan={2} className="p-1 border-x">
                          <Input
                            value={marksState[`${g.id}_a2`] || 'A'}
                            onChange={(e) => setMarksState({ ...marksState, [`${g.id}_a2`]: e.target.value })}
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td colSpan={2} className="p-1 border-x">
                          <Input
                            value={marksState[`${g.id}_t2`] || 'A'}
                            onChange={(e) => setMarksState({ ...marksState, [`${g.id}_t2`]: e.target.value })}
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                        <td colSpan={2} className="p-1">
                          <Input
                            value={marksState[`${g.id}_b2`] || 'A'}
                            onChange={(e) => setMarksState({ ...marksState, [`${g.id}_b2`]: e.target.value })}
                            className="text-xs p-1 text-center h-8"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MONTHLY ATTENDANCE (JUNE TO MARCH)                                */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (() => {
        const t1WDays = months.slice(0, 5).reduce((acc, m) => acc + (Number(attendanceData[m]?.wDays) || 0), 0);
        const t1PDays = months.slice(0, 5).reduce((acc, m) => acc + (Number(attendanceData[m]?.pDays) || 0), 0);
        const t2WDays = months.slice(5).reduce((acc, m) => acc + (Number(attendanceData[m]?.wDays) || 0), 0);
        const t2PDays = months.slice(5).reduce((acc, m) => acc + (Number(attendanceData[m]?.pDays) || 0), 0);
        const totalW = t1WDays + t2WDays;
        const totalP = t1PDays + t2PDays;
        const pct = totalW > 0 ? ((totalP / totalW) * 100).toFixed(1) + '%' : '0.0%';

        const applyPreset = (mode: 'standard' | 'full' | 'high') => {
          const standardDays: Record<string, { w: string; p: string }> = {
            'June': { w: '22', p: mode === 'full' ? '22' : mode === 'high' ? '21' : '21' },
            'July': { w: '24', p: mode === 'full' ? '24' : mode === 'high' ? '23' : '23' },
            'Aug.': { w: '23', p: mode === 'full' ? '23' : mode === 'high' ? '22' : '22' },
            'Sept.': { w: '22', p: mode === 'full' ? '22' : mode === 'high' ? '21' : '20' },
            'Oct.': { w: '20', p: mode === 'full' ? '20' : mode === 'high' ? '19' : '19' },
            'Nov.': { w: '21', p: mode === 'full' ? '21' : mode === 'high' ? '20' : '20' },
            'Dec.': { w: '23', p: mode === 'full' ? '23' : mode === 'high' ? '22' : '22' },
            'Jan.': { w: '22', p: mode === 'full' ? '22' : mode === 'high' ? '21' : '21' },
            'Feb.': { w: '21', p: mode === 'full' ? '21' : mode === 'high' ? '20' : '20' },
            'Mar.': { w: '22', p: mode === 'full' ? '22' : mode === 'high' ? '21' : '20' },
          };
          const updated: any = {};
          months.forEach(m => {
            updated[m] = { wDays: standardDays[m].w, pDays: standardDays[m].p };
          });
          setAttendanceData(updated);
          toast.success(`Applied ${mode.toUpperCase()} attendance preset!`);
        };

        return (
          <Card>
            <CardHeader className="py-3 bg-slate-50 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" /> Monthly Attendance Chart (June – March)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" type="button" onClick={() => applyPreset('standard')} className="text-xs h-7">
                  ⚡ Standard (94.5%)
                </Button>
                <Button size="sm" variant="outline" type="button" onClick={() => applyPreset('full')} className="text-xs h-7 text-emerald-700">
                  ⚡ 100% Full
                </Button>
                <Button size="sm" variant="outline" type="button" onClick={() => applyPreset('high')} className="text-xs h-7 text-blue-700">
                  ⚡ 96% High
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs">
                <div className="text-center">
                  <span className="text-slate-500 block text-[11px]">Term 1 (Jun-Oct)</span>
                  <span className="font-bold text-slate-800">{t1PDays} / {t1WDays} Days</span>
                </div>
                <div className="text-center">
                  <span className="text-slate-500 block text-[11px]">Term 2 (Nov-Mar)</span>
                  <span className="font-bold text-slate-800">{t2PDays} / {t2WDays} Days</span>
                </div>
                <div className="text-center">
                  <span className="text-slate-500 block text-[11px]">Total Working Days</span>
                  <span className="font-bold text-indigo-700 text-sm">{totalW} Days</span>
                </div>
                <div className="text-center">
                  <span className="text-slate-500 block text-[11px]">Total Present Days</span>
                  <span className="font-bold text-emerald-700 text-sm">{totalP} Days</span>
                </div>
                <div className="text-center">
                  <span className="text-slate-500 block text-[11px]">Attendance Percentage</span>
                  <span className="font-extrabold text-blue-700 text-sm">{pct}</span>
                </div>
              </div>

              {/* Monthly Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {months.map((m, idx) => (
                  <div key={m} className={`border rounded-lg p-2.5 space-y-2 text-xs transition-all shadow-sm ${idx < 5 ? 'bg-amber-50/30 border-amber-200' : 'bg-blue-50/30 border-blue-200'}`}>
                    <div className="font-bold text-slate-800 text-center border-b pb-1 flex items-center justify-between">
                      <span>{m}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{idx < 5 ? 'Term 1' : 'Term 2'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] text-slate-600 font-medium">Working Days:</span>
                      <Input
                        type="number"
                        value={attendanceData[m]?.wDays || ''}
                        onChange={(e) => setAttendanceData({
                          ...attendanceData,
                          [m]: { ...attendanceData[m], wDays: e.target.value }
                        })}
                        className="w-16 h-8 text-xs text-center font-semibold bg-white"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] text-slate-600 font-medium">Present Days:</span>
                      <Input
                        type="number"
                        value={attendanceData[m]?.pDays || ''}
                        onChange={(e) => setAttendanceData({
                          ...attendanceData,
                          [m]: { ...attendanceData[m], pDays: e.target.value }
                        })}
                        className="w-16 h-8 text-xs text-center font-semibold bg-white text-emerald-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}


      {/* ========================================================================= */}
      {/* TAB 6: GENERAL & SIGNATURES                                              */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader className="py-3 bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" /> School Reopening Dates & Annual Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Annual Scholastic Performance Grade</label>
              <Input
                value={genData.scholasticAchievement}
                onChange={(e) => setGenData({ ...genData, scholasticAchievement: e.target.value })}
                placeholder="e.g. A - 1"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Co-Scholastic Performance Point</label>
              <Input
                value={genData.coScholasticPoint}
                onChange={(e) => setGenData({ ...genData, coScholasticPoint: e.target.value })}
                placeholder="e.g. 4.6"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">School Reopening Date (Second Term)</label>
              <Input
                value={genData.reopenTerm2}
                onChange={(e) => setGenData({ ...genData, reopenTerm2: e.target.value })}
                placeholder="e.g. 03/11/2026"
              />
            </div>

            {!is10th && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">School Reopening Date (New Academic Year)</label>
                <Input
                  value={genData.reopenNewYear}
                  onChange={(e) => setGenData({ ...genData, reopenNewYear: e.target.value })}
                  placeholder="e.g. 15/06/2027"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* REMARKS BANK PICKER MODAL (6-8 REMARKS, CHOOSE ANY 2)                     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRemarksModalOpen}
        onClose={() => setIsRemarksModalOpen(false)}
        title={`Select Remarks for ${remarksModalTarget.type === 'prog' ? 'Special Progress Made' : 'Improvement Needed'} (Choose 2)`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Click on any <span className="font-bold text-indigo-700">2 remarks</span> below to auto-assign them to the report card lines:
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {remarksBankToDisplay.map((r, idx) => {
              const fullText = `${r.en} (${r.mr})`;
              const isSelected = selectedRemarkTexts.includes(fullText);
              return (
                <div
                  key={r.id || idx}
                  onClick={() => handleToggleRemark(fullText)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-medium ring-1 ring-indigo-500 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isSelected ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1 leading-snug">
                    <p className="font-semibold text-slate-900">{r.en}</p>
                    <p className="text-slate-500 text-[11px]">{r.mr}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs text-slate-500">
              Selected: <strong className="text-indigo-600">{selectedRemarkTexts.length}</strong> / 2 remarks
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsRemarksModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleApplyRemarks}
                disabled={selectedRemarkTexts.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Apply Remarks
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
