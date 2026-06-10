import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  token: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  loadUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,

  loadUser: () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) set({ user: JSON.parse(stored) });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const user = data.data;
      localStorage.setItem('token', user.token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, loading: false });
    } catch (err: any) {
      set({ loading: false });
      throw new Error(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  },

  register: async (formData) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', formData);
      const user = data.data;
      localStorage.setItem('token', user.token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, loading: false });
    } catch (err: any) {
      set({ loading: false });
      throw new Error(err.response?.data?.message || 'Đăng ký thất bại');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null });
  },
}));
