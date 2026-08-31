import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import {
  Users, GraduationCap, School, Calendar, AlertTriangle,
  ClipboardCheck, FileText, TrendingUp, CheckCircle, Eye,
} from 'lucide-react';
import { analyticsApi } from '@/api/analytics';
import { academicYearsApi } from '@/api/academicYears';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const GRADE_COLORS = ['#16a34a', '#2563eb', '#9333ea', '#d97706', '#dc2626', '#f97316', '#64748b'];

interface DashboardData {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalDivisions: number;
  presentToday: number;
  absentToday: number;
  leaveToday: number;
  pendingMarks: number;
  completedReportCards: number;
  totalReportCards: number;
  atRiskStudents: number;
  avgAttendance: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  color?: string;
  trend?: { value: number; positive: boolean };
}

function StatCard({ title, value, icon: Icon, sub, color = 'indigo', trend }: StatCardProps) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    slate: 'bg-slate-50 text-slate-600',
  };
  const iconColor = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm">
      <div className={`rounded-lg p-2.5 ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.positive ? '▲' : '▼'} {trend.value}% from last month
          </p>
        )}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [toppers, setToppers] = useState<any[]>([]);
  const [classDistribution, setClassDistribution] = useState<any[]>([]);
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    academicYearsApi.getAll().then((res) => {
      if (res.data.success) {
        const ay = res.data.data.find((y: any) => y.isActive) || res.data.data[0];
        if (ay) setActiveYear({ id: ay.id, name: ay.name });
      }
    });
  }, []);

  useEffect(() => {
    if (!activeYear) return;
    const ayId = activeYear.id;

    setLoading(true);
    Promise.all([
      analyticsApi.getDashboard({ academicYearId: ayId }),
      analyticsApi.getAttendanceTrends({ academicYearId: ayId, days: 30 }),
      analyticsApi.getGradeDistribution({ academicYearId: ayId }),
      analyticsApi.getToppers({ academicYearId: ayId, limit: 10 }),
      analyticsApi.getClassDistribution({ academicYearId: ayId }),
      analyticsApi.getAtRisk({ academicYearId: ayId, limit: 10 }),
    ])
      .then(([dashRes, trendsRes, gradeRes, toppersRes, classRes, atRiskRes]) => {
        if (dashRes.data.success) setData(dashRes.data.data);
        if (trendsRes.data.success) setTrends(trendsRes.data.data);
        if (gradeRes.data.success) setGradeDistribution(gradeRes.data.data);
        if (toppersRes.data.success) setToppers(toppersRes.data.data);
        if (classRes.data.success) setClassDistribution(classRes.data.data);
        if (atRiskRes.data.success) setAtRisk(atRiskRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const todayTotal = (data?.presentToday || 0) + (data?.absentToday || 0) + (data?.leaveToday || 0);
  const rcProgress = data?.totalReportCards
    ? Math.round((data.completedReportCards / data.totalReportCards) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeYear ? `Academic Year: ${activeYear.name}` : 'School management overview'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Live Data
        </div>
      </div>

      {/* Row 1 — Core Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={data?.totalStudents ?? '—'}
          icon={GraduationCap}
          color="indigo"
        />
        <StatCard
          title="Total Teachers"
          value={data?.totalTeachers ?? '—'}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Classes"
          value={data?.totalClasses ?? '—'}
          icon={School}
          sub={`${data?.totalDivisions ?? 0} divisions`}
          color="purple"
        />
        <StatCard
          title="Avg Attendance"
          value={data ? `${data.avgAttendance}%` : '—'}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Row 2 — Today + Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Present Today"
          value={data?.presentToday ?? '—'}
          icon={CheckCircle}
          sub={todayTotal > 0 ? `${Math.round(((data?.presentToday || 0) / todayTotal) * 100)}% of marked` : 'Not marked yet'}
          color="green"
        />
        <StatCard
          title="Absent Today"
          value={data?.absentToday ?? '—'}
          icon={ClipboardCheck}
          sub={`${data?.leaveToday ?? 0} on leave`}
          color="red"
        />
        <StatCard
          title="At-Risk Students"
          value={data?.atRiskStudents ?? '—'}
          icon={AlertTriangle}
          sub="Low attendance or marks"
          color="amber"
        />
        <StatCard
          title="Report Cards"
          value={data ? `${data.completedReportCards}/${data.totalReportCards}` : '—'}
          icon={FileText}
          sub={`${rcProgress}% finalized`}
          color="slate"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700">
              Attendance Trend — Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trends} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: any, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="present" stroke="#16a34a" strokeWidth={2} dot={false} name="Present" />
                  <Line type="monotone" dataKey="absent" stroke="#dc2626" strokeWidth={2} dot={false} name="Absent" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-slate-400 text-sm">
                No attendance data for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class-wise Student Count */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700">
              Students per Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={classDistribution} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="class" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-slate-400 text-sm">
                No enrollment data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row — Grade Distribution + Toppers + At-Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {gradeDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      dataKey="count"
                      nameKey="grade"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ grade, percent }) => `${grade} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {gradeDistribution.map((_, i) => (
                        <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [v, 'Students']} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-44 flex items-center justify-center text-slate-400 text-sm">
                No marks data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 10 Students */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700">Top 10 Performers</CardTitle>
              <span className="text-xs text-slate-400">by overall %</span>
            </div>
          </CardHeader>
          <CardContent>
            {toppers.length > 0 ? (
              <div className="overflow-auto max-h-64">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-1 px-2 text-slate-500">#</th>
                      <th className="text-left py-1 px-2 text-slate-500">Student</th>
                      <th className="text-left py-1 px-2 text-slate-500">Class</th>
                      <th className="text-right py-1 px-2 text-slate-500">Total</th>
                      <th className="text-right py-1 px-2 text-slate-500">%</th>
                      <th className="text-center py-1 px-2 text-slate-500">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toppers.map((s, i) => (
                      <tr key={s.studentId} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-1 px-2 font-bold text-indigo-600">{i + 1}</td>
                        <td className="py-1 px-2 font-medium text-slate-800">{s.name}</td>
                        <td className="py-1 px-2 text-slate-500">{s.class}-{s.division}</td>
                        <td className="py-1 px-2 text-right text-slate-600">{s.totalMarks}/{s.maxMarks}</td>
                        <td className="py-1 px-2 text-right font-semibold text-slate-800">{s.percentage}%</td>
                        <td className="py-1 px-2 text-center">
                          <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-medium">
                            {s.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-slate-400 text-sm">
                No marks data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Students */}
      {atRisk.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold text-slate-700">
                Students Needing Attention ({atRisk.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-1 px-2 text-slate-500">Name</th>
                    <th className="text-left py-1 px-2 text-slate-500">Adm. No</th>
                    <th className="text-left py-1 px-2 text-slate-500">Class</th>
                    <th className="text-right py-1 px-2 text-slate-500">Attendance %</th>
                    <th className="text-right py-1 px-2 text-slate-500">Marks %</th>
                    <th className="text-left py-1 px-2 text-slate-500">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {atRisk.map((s) => (
                    <tr key={s.studentId} className="border-b border-slate-50 hover:bg-amber-50">
                      <td className="py-1.5 px-2 font-medium text-slate-800">{s.name}</td>
                      <td className="py-1.5 px-2 text-slate-500">{s.admissionNo}</td>
                      <td className="py-1.5 px-2 text-slate-500">{s.class}-{s.division}</td>
                      <td className={`py-1.5 px-2 text-right font-semibold ${s.attendancePct < 75 ? 'text-red-600' : 'text-slate-700'}`}>
                        {s.attendancePct.toFixed(1)}%
                      </td>
                      <td className={`py-1.5 px-2 text-right font-semibold ${s.marksPct < 40 ? 'text-red-600' : 'text-slate-700'}`}>
                        {s.marksPct.toFixed(1)}%
                      </td>
                      <td className="py-1.5 px-2">
                        {s.reasons.map((r: string, i: number) => (
                          <span key={i} className="inline-block bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded mr-1">
                            {r}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminDashboard;
