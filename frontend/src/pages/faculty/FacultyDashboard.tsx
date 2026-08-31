import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { teachersApi } from '@/api/teachers';
import { noticesApi } from '@/api/notices';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { School, ClipboardCheck, Edit3, FileBarChart, Megaphone, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function FacultyDashboard() {
  const user = useAuthStore((state) => state.user);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      teachersApi.getMyAssignments().catch(() => ({ data: { data: [] } })),
      noticesApi.getAll().catch(() => ({ data: { data: [] } })),
    ]).then(([assignRes, noticesRes]) => {
      if (assignRes.data?.data) setAssignments(assignRes.data.data);
      if (noticesRes.data?.data) setNotices(noticesRes.data.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const uniqueClassesCount = new Set(assignments.map(a => `${a.classId}-${a.divisionId}`)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Faculty Dashboard</h1>
        <p className="text-slate-500 text-sm">Welcome back, {user?.name || user?.username}! Here is your daily teaching overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Assigned Classes"
          value={uniqueClassesCount}
          icon={School}
          description="Class divisions assigned to you"
        />
        <StatsCard
          title="Total Subjects Taught"
          value={assignments.length}
          icon={Edit3}
          description="Subject allocations"
        />
        <StatsCard
          title="Attendance"
          value="Mark Daily"
          icon={ClipboardCheck}
          description="Ready for today"
        />
        <StatsCard
          title="Report Cards"
          value="Drafts Pending"
          icon={FileBarChart}
          description="Student evaluations"
        />
      </div>

      {/* Quick Actions & Recent Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/faculty/attendance"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-sm font-medium text-slate-800 group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <span>Mark Attendance</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </Link>

            <Link
              to="/faculty/marks"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-sm font-medium text-slate-800 group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Edit3 className="w-5 h-5" />
                </div>
                <span>Enter Exam Marks</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </Link>

            <Link
              to="/faculty/report-cards"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-sm font-medium text-slate-800 group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <FileBarChart className="w-5 h-5" />
                </div>
                <span>Draft Report Cards</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </Link>
          </CardContent>
        </Card>

        {/* Assigned Classes Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">My Teaching Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-slate-500 text-sm py-6 text-center">No teacher assignments linked yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {assignments.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        Class {item.class?.name} - Div {item.division?.name}
                      </p>
                      <p className="text-xs text-slate-500">Subject: {item.subject?.name}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-medium rounded-full">
                      {item.academicYear?.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* School Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-600" /> School Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notices.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No recent announcements.</p>
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
  );
}
