import api from './client';

export const divisionsApi = {
  getByClass: (classId: string) => api.get(`/divisions`, { params: { classId } }),
  create: (data: any) => api.post('/divisions', data),
  update: (id: string, data: any) => api.put(`/divisions/${id}`, data),
  remove: (id: string) => api.delete(`/divisions/${id}`),
};
