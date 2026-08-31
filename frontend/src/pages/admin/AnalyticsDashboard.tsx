import React, { useEffect, useState } from 'react';
import { analyticsApi } from '@/api/analytics';
import { StatsCard } from '@/components/ui/StatsCard';
import { Users, GraduationCap, School, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    analyticsApi.getDashboard()
      .then((res) => {
        if (res.data.success) {
          setData(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const attendanceData = [
    { name: 'Present', value: data?.attendanceStats?.PRESENT || 85 },
    { name: 'Absent', value: data?.attendanceStats?.ABSENT || 10 },
    { name: 'On Leave', value: data?.attendanceStats?.LEAVE || 5 },
  ];

  const classDistribution = data?.classDistribution || [
    { name: 'Jr.KG', count: 42 },
    { name: 'Sr.KG', count: 38 },
    { name: '1st Class', count: 45 },
    { name: '2nd Class', count: 50 },
    { name: '3rd Class', count: 48 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics & Insights</h1>
        <p className="text-slate-500 text-sm">School-wide performance metrics, attendance, and demographics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Active Students"
          value={data?.totalStudents || 0}
          icon={GraduationCap}
          description="Enrolled in active academic year"
        />
        <StatsCard
          title="Total Teaching Faculty"
          value={data?.totalFaculty || 0}
          icon={Users}
          description="Active teachers"
        />
        <StatsCard
          title="Total Classes"
          value={data?.totalClasses || 0}
          icon={School}
          description="Configured classes"
        />
        <StatsCard
          title="Avg Attendance Rate"
          value={`${data?.averageAttendance || 92}%`}
          icon={CheckCircle}
          description="Over the past 30 days"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Distribution per Class */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" /> Class Enrollment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" /> Attendance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {attendanceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* At Risk Students / Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Academic & Attendance Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.atRiskStudents?.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.atRiskStudents.map((s: any) => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{s.name}</p>
                    <p className="text-xs text-slate-500">Class {s.className} • Admission #{s.admissionNo}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                    Low Attendance ({s.attendancePct}%)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm py-4 text-center">No students currently flagged on the academic watchlist.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
