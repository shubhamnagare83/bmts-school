import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { studentsApi } from '@/api/students';
import { noticesApi } from '@/api/notices';
import { homeworkApi } from '@/api/homework';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { User, ClipboardCheck, BookMarked, Award, Megaphone, Calendar } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function StudentDashboard() {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<any | null>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      studentsApi.getMe().catch(() => ({ data: { data: null } })),
      noticesApi.getAll().catch(() => ({ data: { data: [] } })),
      homeworkApi.getAll().catch(() => ({ data: { data: [] } })),
    ]).then(([profileRes, noticesRes, hwRes]) => {
      if (profileRes.data?.data) setProfile(profileRes.data.data);
      if (noticesRes.data?.data) setNotices(noticesRes.data.data.slice(0, 4));
      if (hwRes.data?.data) setHomeworkList(hwRes.data.data.slice(0, 4));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const enrollment = profile?.enrollments?.[0];

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl text-white">
              {profile?.name ? profile.name.charAt(0) : 'S'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile?.name || user?.username}</h1>
              <p className="text-indigo-200 text-sm">
                Admission #{profile?.admissionNo} • Roll #{profile?.rollNo || enrollment?.rollNo || 'N/A'}
              </p>
            </div>
          </div>
          {enrollment && (
            <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm text-right text-xs">
              <p className="font-semibold text-white">Class {enrollment.class?.name} - Div {enrollment.division?.name}</p>
              <p className="text-indigo-200">{enrollment.academicYear?.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Attendance Rate"
          value="95%"
          icon={ClipboardCheck}
          description="Current academic year"
        />
        <StatsCard
          title="Pending Homework"
          value={homeworkList.length}
          icon={BookMarked}
          description="Assigned tasks"
        />
        <StatsCard
          title="Exams Attended"
          value="Passed"
          icon={Award}
          description="Good performance"
        />
        <StatsCard
          title="Announcements"
          value={notices.length}
          icon={Megaphone}
          description="Recent school notices"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Homework */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-indigo-600" /> Recent Homework Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {homeworkList.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No active homework assigned.</p>
            ) : (
              <div className="space-y-3">
                {homeworkList.map((hw) => (
                  <div key={hw.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{hw.title}</p>
                      <p className="text-xs text-slate-500">{hw.subject?.name} • Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 font-medium">Pending</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Notices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-600" /> Notice Board
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notices.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No recent announcements.</p>
            ) : (
              <div className="space-y-3">
                {notices.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-800 text-sm">{n.title}</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(n.publishedAt || n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
