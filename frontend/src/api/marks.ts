import api from './client';

export const marksApi = {
  get: (params: { examId: string; subjectId?: string; classId?: string; divisionId?: string }) =>
    api.get('/marks', { params }),
  save: (data: { records: any[] }) => api.post('/marks', data),
  getByStudent: (studentId: string, params?: { academicYearId?: string; examId?: string }) =>
    api.get(`/marks/student/${studentId}`, { params }),
  getReport: (params: { classId: string; divisionId: string; academicYearId: string; examId: string }) =>
    api.get('/marks/report', { params }),
  getLeaderboard: (params?: {
    academicYearId?: string; classId?: string; divisionId?: string; examId?: string; limit?: number;
  }) => api.get('/marks/leaderboard', { params }),
};
