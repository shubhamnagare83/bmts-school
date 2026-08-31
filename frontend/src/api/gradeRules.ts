import api from './client';

export const gradeRulesApi = {
  getAll: () => api.get('/grade-rules'),
  getById: (id: string) => api.get(`/grade-rules/${id}`),
  create: (data: any) => api.post('/grade-rules', data),
  update: (id: string, data: any) => api.put(`/grade-rules/${id}`, data),
  remove: (id: string) => api.delete(`/grade-rules/${id}`),
};
