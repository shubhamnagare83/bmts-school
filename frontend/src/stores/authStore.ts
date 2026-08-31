import { create } from 'zustand';

export type Role = 'ADMIN' | 'FACULTY' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  name?: string;
  profileId?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  login: (user, token) => set({ user, accessToken: token, isAuthenticated: true }),
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
  setAccessToken: (token) => set({ accessToken: token }),
}));
