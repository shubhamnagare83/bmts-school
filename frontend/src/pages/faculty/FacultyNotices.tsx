import React, { useEffect, useState } from 'react';
import { noticesApi } from '@/api/notices';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Megaphone, Calendar } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function FacultyNotices() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    noticesApi.getAll()
      .then((res) => {
        if (res.data.success) setNotices(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Announcements & Notices</h1>
        <p className="text-slate-500 text-sm">School-wide and faculty notices board</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-600" /> Active Notices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : notices.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-sm">No announcements available.</p>
          ) : (
            <div className="space-y-4">
              {notices.map((notice) => (
                <div key={notice.id} className="p-4 border border-slate-200 rounded-lg bg-white space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      notice.scope === 'SCHOOL' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {notice.scope === 'SCHOOL' ? 'Entire School' : `Class ${notice.targetClass?.name}`}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(notice.publishedAt || notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{notice.title}</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{notice.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
