import api from './client';

export const attendanceApi = {
  get: (params?: any) => api.get('/attendance', { params }),
  save: (data: any[]) => api.post('/attendance', data),
  getStudentAttendance: (studentId: string, academicYearId: string) => api.get(`/attendance/student/${studentId}`, { params: { academicYearId } }),
  getReport: (params?: any) => api.get('/attendance/report', { params }),
};
