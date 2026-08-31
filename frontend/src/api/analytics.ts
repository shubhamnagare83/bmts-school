import api from './client';

export const analyticsApi = {
  getDashboard: (params?: { academicYearId?: string }) =>
    api.get('/analytics/dashboard', { params }),
  getAttendanceTrends: (params?: { academicYearId?: string; days?: number; classId?: string }) =>
    api.get('/analytics/attendance-trends', { params }),
  getGradeDistribution: (params?: { academicYearId?: string; classId?: string; examId?: string }) =>
    api.get('/analytics/grade-distribution', { params }),
  getAtRisk: (params?: { academicYearId?: string; limit?: number }) =>
    api.get('/analytics/at-risk', { params }),
  getToppers: (params?: { academicYearId?: string; examId?: string; classId?: string; limit?: number }) =>
    api.get('/analytics/toppers', { params }),
  getClassDistribution: (params?: { academicYearId?: string }) =>
    api.get('/analytics/class-distribution', { params }),
};
