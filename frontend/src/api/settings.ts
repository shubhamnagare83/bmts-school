import api from './client';

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
  uploadLogo: (data: FormData) => api.post('/settings/logo', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};
