import api from './client';

export const noticesApi = {
  getAll: (params?: any) => api.get('/notices', { params }),
  create: (data: any) => api.post('/notices', data),
  update: (id: string, data: any) => api.put(`/notices/${id}`, data),
  remove: (id: string) => api.delete(`/notices/${id}`),
};
