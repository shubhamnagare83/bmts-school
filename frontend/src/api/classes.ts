import api from './client';

export const classesApi = {
  getAll: () => api.get('/classes'),
  getById: (id: string) => api.get(`/classes/${id}`),
  create: (data: any) => api.post('/classes', data),
  update: (id: string, data: any) => api.put(`/classes/${id}`, data),
  remove: (id: string) => api.delete(`/classes/${id}`),
};
