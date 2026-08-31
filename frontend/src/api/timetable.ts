import api from './client';

export const timetableApi = {
  get: (params?: any) => api.get('/timetable', { params }),
  save: (data: any) => api.post('/timetable', data),
  update: (id: string, data: any) => api.put(`/timetable/${id}`, data),
  remove: (id: string) => api.delete(`/timetable/${id}`),
};
