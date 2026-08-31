import api from './client';

export const subjectsApi = {
  getByClass: (classId: string) => api.get(`/subjects`, { params: { classId } }),
  create: (data: any) => api.post('/subjects', data),
  update: (id: string, data: any) => api.put(`/subjects/${id}`, data),
  remove: (id: string) => api.delete(`/subjects/${id}`),
};
