import api from './client';

export const homeworkApi = {
  getAll: (params?: any) => api.get('/homework', { params }),
  create: (data: any) => api.post('/homework', data),
  update: (id: string, data: any) => api.put(`/homework/${id}`, data),
  remove: (id: string) => api.delete(`/homework/${id}`),
  submit: (id: string, data: FormData) => api.post(`/homework/${id}/submit`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  reviewSubmission: (id: string, submissionId: string, data: any) => api.post(`/homework/${id}/submissions/${submissionId}/review`, data),
};
