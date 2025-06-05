import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type User, authApi } from '../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: User) => void;
  verifyToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);
          if (response.success) {
            const { user, token } = response;
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            localStorage.setItem('auth_token', token);
          } else {
            set({
              error: response.message || 'Login failed',
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          if (response.success) {
            const { user, token } = response;
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            localStorage.setItem('auth_token', token);
          } else {
            set({
              error: response.message || 'Registration failed',
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user) => {
        set({ user });
      },

      verifyToken: async () => {
        const token = get().token || localStorage.getItem('auth_token');
        if (!token) {
          set({ isAuthenticated: false });
          return false;
        }

        try {
          const response = await authApi.verifyToken(token);
          if (response.success) {
            set({ isAuthenticated: true });
            return true;
          } else {
            set({ isAuthenticated: false, token: null, user: null });
            localStorage.removeItem('auth_token');
            return false;
          }
                 } catch {
           set({ isAuthenticated: false, token: null, user: null });
           localStorage.removeItem('auth_token');
           return false;
         }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 