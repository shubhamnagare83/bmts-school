import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportCardsApi } from '@/api/reportCards';
import { CheckCircle2, XCircle, ShieldCheck, School, Calendar, User, FileText, ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function VerifyReportCard() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [reportCard, setReportCard] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      reportCardsApi.verify(token)
        .then((res) => {
          if (res.data.success) {
            setReportCard(res.data.data);
          } else {
            setError(res.data.error || 'Verification failed');
          }
        })
        .catch((err) => {
          setError(err.response?.data?.error || 'Invalid or expired verification token');
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
            <div>
              <h1 className="text-xl font-bold">Report Card Verification</h1>
              <p className="text-xs text-slate-400">Official Authenticity Portal</p>
            </div>
          </div>
          <Link to="/login" className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-slate-300 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to Portal
          </Link>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <LoadingSpinner size="lg" />
              <p className="text-slate-500 text-sm">Verifying document digital signature...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center space-y-4">
              <div className="inline-flex p-3 bg-red-50 text-red-500 rounded-full">
                <XCircle className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Verification Failed</h2>
              <p className="text-slate-600 text-sm max-w-md mx-auto">{error}</p>
              <p className="text-xs text-slate-400">Token ID: {token}</p>
            </div>
          ) : reportCard ? (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  <div>
                    <h3 className="font-semibold text-emerald-900 text-sm">Genuine & Verified Document</h3>
                    <p className="text-xs text-emerald-700">Issued by Mother Teresa Foundation School</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-full uppercase">
                  {reportCard.status}
                </span>
              </div>

              {/* Student Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center text-slate-500 text-xs mb-1">
                    <User className="w-3.5 h-3.5 mr-1" /> Student Name
                  </div>
                  <div className="font-semibold text-slate-800">{reportCard.student?.name}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center text-slate-500 text-xs mb-1">
                    <School className="w-3.5 h-3.5 mr-1" /> Class & Division
                  </div>
                  <div className="font-semibold text-slate-800">
                    Class {reportCard.class?.name} - {reportCard.division?.name}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center text-slate-500 text-xs mb-1">
                    <FileText className="w-3.5 h-3.5 mr-1" /> Admission No
                  </div>
                  <div className="font-semibold text-slate-800">{reportCard.student?.admissionNo}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center text-slate-500 text-xs mb-1">
                    <Calendar className="w-3.5 h-3.5 mr-1" /> Academic Year
                  </div>
                  <div className="font-semibold text-slate-800">{reportCard.academicYear?.name}</div>
                </div>
              </div>

              {/* Finalized date */}
              <div className="text-center pt-2 text-xs text-slate-400 border-t border-slate-100">
                Finalized Date: {reportCard.finalizedAt ? new Date(reportCard.finalizedAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
