import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import FacultyLayout from './components/layout/FacultyLayout';
import StudentLayout from './components/layout/StudentLayout';
import LoginPage from './pages/auth/LoginPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AcademicYearManagement from './pages/admin/AcademicYearManagement';
import ClassManagement from './pages/admin/ClassManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import FacultyManagement from './pages/admin/FacultyManagement';
import StudentManagement from './pages/admin/StudentManagement';
import AttendanceOverview from './pages/admin/AttendanceOverview';
import ExamManagement from './pages/admin/ExamManagement';
import MarksOverview from './pages/admin/MarksOverview';
import GradeRuleManagement from './pages/admin/GradeRuleManagement';
import ReportCardManagement from './pages/admin/ReportCardManagement';
import RemarkBankManagement from './pages/admin/RemarkBankManagement';
import HomeworkOverview from './pages/admin/HomeworkOverview';
import NoticeManagement from './pages/admin/NoticeManagement';
import TimetableManagement from './pages/admin/TimetableManagement';
import CalendarManagement from './pages/admin/CalendarManagement';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import AuditLogViewer from './pages/admin/AuditLogViewer';
import SettingsPage from './pages/admin/SettingsPage';
import PromotionManagement from './pages/admin/PromotionManagement';
import LeaderboardPage from './pages/admin/LeaderboardPage';

// Faculty pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AttendanceEntry from './pages/faculty/AttendanceEntry';
import MarksEntry from './pages/faculty/MarksEntry';
import ReportCardDrafting from './pages/faculty/ReportCardDrafting';
import MyClasses from './pages/faculty/MyClasses';
import HomeworkManagement from './pages/faculty/HomeworkManagement';
import FacultyTimetable from './pages/faculty/FacultyTimetable';
import FacultyNotices from './pages/faculty/FacultyNotices';

// Profile settings
import ProfileSettings from './pages/ProfileSettings';

// Public
import VerifyReportCard from './pages/public/VerifyReportCard';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify/:token" element={<VerifyReportCard />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="academic-years" element={<AcademicYearManagement />} />
          <Route path="classes" element={<ClassManagement />} />
          <Route path="subjects" element={<SubjectManagement />} />
          <Route path="faculty" element={<FacultyManagement />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="promotion" element={<PromotionManagement />} />
          <Route path="attendance" element={<AttendanceOverview />} />
          <Route path="exams" element={<ExamManagement />} />
          <Route path="marks" element={<MarksOverview />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="grade-rules" element={<GradeRuleManagement />} />
          <Route path="report-cards" element={<ReportCardManagement />} />
          <Route path="remark-bank" element={<RemarkBankManagement />} />
          <Route path="homework" element={<HomeworkOverview />} />
          <Route path="notices" element={<NoticeManagement />} />
          <Route path="timetable" element={<TimetableManagement />} />
          <Route path="calendar" element={<CalendarManagement />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="audit-logs" element={<AuditLogViewer />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfileSettings />} />
        </Route>
        
        {/* Faculty Routes */}
        <Route path="/faculty" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyLayout /></ProtectedRoute>}>
          <Route index element={<FacultyDashboard />} />
          <Route path="classes" element={<MyClasses />} />
          <Route path="attendance" element={<AttendanceEntry />} />
          <Route path="marks" element={<MarksEntry />} />
          <Route path="report-cards" element={<ReportCardDrafting />} />
          <Route path="homework" element={<HomeworkManagement />} />
          <Route path="timetable" element={<FacultyTimetable />} />
          <Route path="notices" element={<FacultyNotices />} />
          <Route path="profile" element={<ProfileSettings />} />
        </Route>
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </QueryClientProvider>
  );
}
