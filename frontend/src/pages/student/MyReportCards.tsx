import React, { useEffect, useState } from 'react';
import { studentsApi } from '@/api/students';
import { reportCardsApi } from '@/api/reportCards';
import { academicYearsApi } from '@/api/academicYears';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FileBarChart, Printer, QrCode, CheckCircle2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BilingualReportCardTemplate } from '@/components/reportcard/BilingualReportCardTemplate';
import { PrimaryReportCardTemplate } from '@/components/reportcard/PrimaryReportCardTemplate';
import { SecondaryReportCardTemplate } from '@/components/reportcard/SecondaryReportCardTemplate';
import { printReportCard } from '@/utils/printReportCard';

export default function MyReportCards() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [studentProfile, setStudentProfile] = useState<any | null>(null);
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Print Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeReportCard, setActiveReportCard] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      studentsApi.getMe(),
      academicYearsApi.getAll(),
    ]).then(([studRes, yearRes]) => {
      if (studRes.data.success && studRes.data.data) {
        setStudentProfile(studRes.data.data);
      }
      if (yearRes.data.success && yearRes.data.data.length > 0) {
        setAcademicYears(yearRes.data.data);
        const active = yearRes.data.data.find((y: any) => y.isActive) || yearRes.data.data[0];
        setSelectedYearId(active.id);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (studentProfile && selectedYearId) {
      fetchReportCards();
    }
  }, [studentProfile, selectedYearId]);

  const fetchReportCards = () => {
    setLoading(true);
    reportCardsApi.getAll({ academicYearId: selectedYearId })
      .then((res) => {
        if (res.data.success) {
          setReportCards(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleOpenPrintPreview = (rc: any) => {
    setActiveReportCard(rc);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bharat Ratna Mother Teresa English School</h1>
          <p className="text-slate-500 text-sm">My Official Progress Report Cards — View & Print</p>
        </div>
        <div className="w-48">
          <Select value={selectedYearId} onChange={(e) => setSelectedYearId(e.target.value)}>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-indigo-600" /> Issued Progress Report Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : reportCards.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <p className="text-slate-500 text-sm">No report card record loaded yet for this academic year.</p>
              <Button onClick={fetchReportCards} className="flex items-center gap-1.5 mx-auto">
                <Sparkles className="w-4 h-4" /> Load / Generate My Report Card
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reportCards.map((rc) => (
                <div key={rc.id} className="p-5 border border-slate-200 rounded-xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-indigo-200 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-lg">
                        Class {rc.class?.name} — Division {rc.division?.name}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        rc.status === 'FINALIZED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {rc.status === 'FINALIZED' ? 'Official / Finalized' : 'Generated'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Academic Year: {rc.academicYear?.name || '2025-2026'}</p>
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Digital Verification Ready
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {rc.qrToken && (
                      <a
                        href={`/verify/${rc.qrToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                      >
                        <QrCode className="w-4 h-4 text-indigo-600" /> Verify QR Token
                      </a>
                    )}

                    <Button
                      onClick={() => handleOpenPrintPreview(rc)}
                      className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Printer className="w-4 h-4" /> View & Print Report Card
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Official Report Card — Bharat Ratna Mother Teresa English School"
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-100 p-2.5 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-600 font-medium">
              Official 2-Page Print Document with empty Section H for parent handwritten feedback.
            </span>
            <Button onClick={() => printReportCard('student-report-card-print-area')} className="flex items-center gap-1.5 text-xs">
              <Printer className="w-4 h-4" /> Print Report Card
            </Button>
          </div>

          <div className="max-h-[75vh] overflow-y-auto bg-slate-200 p-4 rounded-lg flex justify-center">
            <div id="student-report-card-print-area">
              {/^(8|8th|9|9th|10|10th|VIII|IX|X)$/i.test((activeReportCard?.class?.name || '').trim()) ? (
                <SecondaryReportCardTemplate
                  reportCard={activeReportCard}
                  student={studentProfile}
                  classNameDetails={activeReportCard?.class}
                  divisionDetails={activeReportCard?.division}
                  academicYearDetails={activeReportCard?.academicYear}
                />
              ) : activeReportCard?.class?.reportCardTemplate === 'KG' || ['Jr.KG', 'Sr.KG'].includes(activeReportCard?.class?.name) ? (
                <BilingualReportCardTemplate
                  reportCard={activeReportCard}
                  student={studentProfile}
                  classNameDetails={activeReportCard?.class}
                  divisionDetails={activeReportCard?.division}
                  academicYearDetails={activeReportCard?.academicYear}
                />
              ) : (
                <PrimaryReportCardTemplate
                  reportCard={activeReportCard}
                  student={studentProfile}
                  classNameDetails={activeReportCard?.class}
                  divisionDetails={activeReportCard?.division}
                  academicYearDetails={activeReportCard?.academicYear}
                />
              )}
            </div>
          </div>

        </div>
      </Modal>

    </div>
  );
}
