import api from './client';

export const academicYearsApi = {
  getAll: () => api.get('/academic-years'),
  getById: (id: string) => api.get(`/academic-years/${id}`),
  create: (data: any) => api.post('/academic-years', data),
  update: (id: string, data: any) => api.put(`/academic-years/${id}`, data),
  activate: (id: string) => api.patch(`/academic-years/${id}/activate`),
  remove: (id: string) => api.delete(`/academic-years/${id}`),
};
