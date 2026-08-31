import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../ui/Sidebar';
import Header from '../ui/Header';
import { LayoutDashboard, ClipboardCheck, Award, FileBarChart, BookMarked, Clock, Megaphone } from 'lucide-react';

const studentNavigation = [
  { name: 'Dashboard', href: '/student', icon: LayoutDashboard },
  { name: 'My Attendance', href: '/student/attendance', icon: ClipboardCheck },
  { name: 'Marks & Grades', href: '/student/marks', icon: Award },
  { name: 'Report Cards', href: '/student/report-cards', icon: FileBarChart },
  { name: 'Homework', href: '/student/homework', icon: BookMarked },
  { name: 'Timetable', href: '/student/timetable', icon: Clock },
  { name: 'Notices', href: '/student/notices', icon: Megaphone },
];

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar navigation={studentNavigation} role="Student" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
