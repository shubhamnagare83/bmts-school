import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../ui/Sidebar';
import Header from '../ui/Header';
import { LayoutDashboard, School, ClipboardCheck, Edit3, FileBarChart, BookMarked, Clock, Megaphone, User } from 'lucide-react';

const facultyNavigation = [
  { name: 'Dashboard', href: '/faculty', icon: LayoutDashboard },
  { name: 'My Classes', href: '/faculty/classes', icon: School },
  { name: 'Attendance', href: '/faculty/attendance', icon: ClipboardCheck },
  { name: 'Marks Entry', href: '/faculty/marks', icon: Edit3 },
  { name: 'Report Cards', href: '/faculty/report-cards', icon: FileBarChart },
  { name: 'Homework', href: '/faculty/homework', icon: BookMarked },
  { name: 'Timetable', href: '/faculty/timetable', icon: Clock },
  { name: 'Notices', href: '/faculty/notices', icon: Megaphone },
  { name: 'Profile Settings', href: '/faculty/profile', icon: User },
];

export default function FacultyLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar navigation={facultyNavigation} role="Faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
