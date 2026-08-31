import api from './client';

export const holidaysApi = {
  getAll: (yearId: string) => api.get('/holidays', { params: { yearId } }),
  create: (data: any) => api.post('/holidays', data),
  update: (id: string, data: any) => api.put(`/holidays/${id}`, data),
  remove: (id: string) => api.delete(`/holidays/${id}`),
};
