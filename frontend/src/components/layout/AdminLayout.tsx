import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/ui/Sidebar';
import { Header } from '@/components/ui/Header';
import { 
  LayoutDashboard, Users, Calendar, Settings, Shield, BookOpen, GraduationCap, 
  ClipboardCheck, FileSpreadsheet, Award, Sliders, FileText, BookMarked, Megaphone, 
  Clock, BarChart2, Trophy, ArrowUpCircle, User
} from 'lucide-react';

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Calendar, label: 'Academic Years', href: '/admin/academic-years' },
  { icon: BookOpen, label: 'Classes', href: '/admin/classes' },
  { icon: BookOpen, label: 'Subjects', href: '/admin/subjects' },
  { icon: Users, label: 'Faculty Management', href: '/admin/faculty' },
  { icon: GraduationCap, label: 'Student Management', href: '/admin/students' },
  { icon: ArrowUpCircle, label: 'Promotion', href: '/admin/promotion' },
  { icon: ClipboardCheck, label: 'Attendance', href: '/admin/attendance' },
  { icon: FileSpreadsheet, label: 'Exams', href: '/admin/exams' },
  { icon: Award, label: 'Marks', href: '/admin/marks' },
  { icon: Trophy, label: 'Leaderboard', href: '/admin/leaderboard' },
  { icon: Sliders, label: 'Grade Rules', href: '/admin/grade-rules' },
  { icon: FileText, label: 'Report Cards', href: '/admin/report-cards' },
  { icon: BookMarked, label: 'Remark Bank', href: '/admin/remark-bank' },
  { icon: BookMarked, label: 'Homework', href: '/admin/homework' },
  { icon: Megaphone, label: 'Notices', href: '/admin/notices' },
  { icon: Clock, label: 'Timetable', href: '/admin/timetable' },
  { icon: Calendar, label: 'Calendar / Holidays', href: '/admin/calendar' },
  { icon: BarChart2, label: 'Analytics', href: '/admin/analytics' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
  { icon: User, label: 'Profile Settings', href: '/admin/profile' },
];

export function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar items={adminNavItems} role="Admin" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
