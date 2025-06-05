import { create } from 'zustand';
import { type ToastProps } from '../components/Toast';

interface ToastState {
  toasts: ToastProps[];
}

interface ToastActions {
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState & ToastActions>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// Convenience functions for different toast types
export const toast = {
  success: (title: string, message?: string) => {
    useToastStore.getState().addToast({ type: 'success', title, message });
  },
  error: (title: string, message?: string) => {
    useToastStore.getState().addToast({ type: 'error', title, message });
  },
  warning: (title: string, message?: string) => {
    useToastStore.getState().addToast({ type: 'warning', title, message });
  },
  info: (title: string, message?: string) => {
    useToastStore.getState().addToast({ type: 'info', title, message });
  },
}; 