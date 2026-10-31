import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'receptionist';
  avatar?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<AuthUser>) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authAPI.login(email, password);
          const { user, token } = res.data;
          localStorage.setItem('gashuna_token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          toast.success(`Welcome back, ${user.name}!`);
          return true;
        } catch (err: any) {
          set({ isLoading: false });
          toast.error(err.response?.data?.message || 'Login failed. Please try again.');
          return false;
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch {
          // ignore network errors on logout
        } finally {
          localStorage.removeItem('gashuna_token');
          set({ user: null, token: null, isAuthenticated: false });
          toast.success('Logged out successfully.');
          window.location.href = '/admin/login';
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('gashuna_token');
        if (!token) {
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }
        try {
          const res = await authAPI.getMe();
          set({ user: res.data.user, token, isAuthenticated: true });
        } catch {
          localStorage.removeItem('gashuna_token');
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      updateUser: (userData) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...userData } });
      },

      setToken: (token) => {
        localStorage.setItem('gashuna_token', token);
        set({ token });
      },
    }),
    {
      name: 'gashuna_auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
