import api from './client';

export const reportCardsApi = {
  getAll: (params?: any) => api.get('/report-cards', { params }),
  getById: (id: string) => api.get(`/report-cards/${id}`),
  create: (data: any) => api.post('/report-cards', data),
  updateSections: (id: string, data: any) => api.put(`/report-cards/${id}/sections`, data),
  updateAssessment: (id: string, data: any) => api.put(`/report-cards/${id}/assessment`, data),
  submitForReview: (id: string) => api.post(`/report-cards/${id}/submit`),
  sendBack: (id: string, data: any) => api.post(`/report-cards/${id}/send-back`, data),
  finalize: (id: string) => api.post(`/report-cards/${id}/finalize`),
  unlock: (id: string) => api.post(`/report-cards/${id}/unlock`),
  downloadPdf: (id: string) => api.get(`/report-cards/${id}/pdf`, { responseType: 'blob' }),
  bulkGenerate: (data: any) => api.post('/report-cards/bulk-generate', data),
  getVersions: (id: string) => api.get(`/report-cards/${id}/versions`),
  verify: (token: string) => api.get(`/report-cards/verify/${token}`),
};
