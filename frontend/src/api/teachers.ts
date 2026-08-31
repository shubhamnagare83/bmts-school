import api from './client';

export const teachersApi = {
  getAll: (params?: any) => api.get('/teachers', { params }),
  getById: (id: string) => api.get(`/teachers/${id}`),
  create: (data: any) => api.post('/teachers', data),
  update: (id: string, data: any) => api.put(`/teachers/${id}`, data),
  remove: (id: string) => api.delete(`/teachers/${id}`),
  toggleFinalize: (id: string) => api.put(`/teachers/${id}/toggle-finalize`),
  resetPassword: (id: string, data?: any) => api.post(`/teachers/${id}/reset-password`, data),
  getAssignments: (id: string) => api.get(`/teachers/${id}/assignments`),
  getMyAssignments: () => api.get('/teachers/me/assignments'),
  assignMySubject: (data: any) => api.post('/teachers/me/assignments', data),
  createAssignment: (id: string, data: any) => api.post(`/teachers/${id}/assignments`, data),
  removeAssignment: (assignmentId: string) => api.delete(`/teachers/assignments/${assignmentId}`),
};
