import api from './client';

export const studentsApi = {
  getMe: () => api.get('/students/me'),
  getAll: (params?: any) => api.get('/students', { params }),
  getById: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  remove: (id: string) => api.delete(`/students/${id}`),
  enroll: (id: string, data: any) => api.post(`/students/${id}/enroll`, data),
  bulkPromote: (data: any) => api.post('/students/promote', data),
};
