import api from './client';

export const examsApi = {
  getAll: (params?: any) => api.get('/exams', { params }),
  getById: (id: string) => api.get(`/exams/${id}`),
  create: (data: any) => api.post('/exams', data),
  update: (id: string, data: any) => api.put(`/exams/${id}`, data),
  remove: (id: string) => api.delete(`/exams/${id}`),
};
