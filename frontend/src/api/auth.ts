import api from './client';

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};
