import apiClient from './client';

export interface DailyTeachingLog {
  id?: string;
  classId: string;
  divisionId: string;
  date: string;
  teacherId?: string;
  subjectId?: string;
  topicTaught: string;
  homeworkGiven?: string;
  remarks?: string;
  teacher?: {
    id: string;
    name: string;
    photo?: string;
  };
  subject?: {
    id: string;
    name: string;
  };
}

export const teachingLogsApi = {
  getAll: (params?: {
    classId?: string;
    divisionId?: string;
    teacherId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  }) => apiClient.get('/teaching-logs', { params }),

  getByDate: (params: { classId: string; divisionId: string; date: string }) =>
    apiClient.get('/teaching-logs/by-date', { params }),

  save: (data: DailyTeachingLog) => apiClient.post('/teaching-logs', data),

  delete: (id: string) => apiClient.delete(`/teaching-logs/${id}`),
};
