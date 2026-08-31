import api from './client';

export const certificatesApi = {
  getAll: (params?: any) => api.get('/certificates', { params }),
  create: (data: any) => api.post('/certificates', data),
  downloadPdf: (id: string) => api.get(`/certificates/${id}/pdf`, { responseType: 'blob' }),
};
