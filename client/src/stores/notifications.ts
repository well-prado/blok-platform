import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NotificationData } from '../lib/websocket';

interface NotificationsState {
  notifications: NotificationData[];
  unreadCount: number;
  isVisible: boolean;
}

interface NotificationsActions {
  addNotification: (notification: NotificationData) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
  toggleVisibility: () => void;
  setVisibility: (visible: boolean) => void;
}

type NotificationsStore = NotificationsState & NotificationsActions;

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      isVisible: false,

      // Actions
      addNotification: (notification: NotificationData) =>
        set((state) => {
          // Prevent duplicate notifications
          const exists = state.notifications.some(n => n.id === notification.id);
          if (exists) return state;

          const newNotifications = [notification, ...state.notifications];
          
          // Keep only the last 50 notifications
          const trimmedNotifications = newNotifications.slice(0, 50);
          
          const unreadCount = trimmedNotifications.filter(n => !n.read).length;

          return {
            notifications: trimmedNotifications,
            unreadCount,
          };
        }),

      markAsRead: (notificationId: string) =>
        set((state) => {
          const updatedNotifications = state.notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          );
          
          const unreadCount = updatedNotifications.filter(n => !n.read).length;

          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        }),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map(notification => ({
            ...notification,
            read: true,
          })),
          unreadCount: 0,
        })),

      removeNotification: (notificationId: string) =>
        set((state) => {
          const filteredNotifications = state.notifications.filter(
            n => n.id !== notificationId
          );
          
          const unreadCount = filteredNotifications.filter(n => !n.read).length;

          return {
            notifications: filteredNotifications,
            unreadCount,
          };
        }),

      clearAll: () =>
        set({
          notifications: [],
          unreadCount: 0,
        }),

      toggleVisibility: () =>
        set((state) => ({
          isVisible: !state.isVisible,
        })),

      setVisibility: (visible: boolean) =>
        set({
          isVisible: visible,
        }),
    }),
    {
      name: 'notifications-storage',
      // Only persist notifications, not visibility state
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);

// Helper functions
export const getNotificationIcon = (type: NotificationData['type']) => {
  switch (type) {
    case 'comment':
      return '💬';
    case 'rating':
      return '⭐';
    case 'follow':
      return '👥';
    case 'favorite':
      return '❤️';
    case 'workflow_update':
      return '🔄';
    case 'system':
      return '🔔';
    default:
      return '📩';
  }
};

export const getNotificationColor = (type: NotificationData['type']) => {
  switch (type) {
    case 'comment':
      return 'bg-blue-50 border-blue-200';
    case 'rating':
      return 'bg-yellow-50 border-yellow-200';
    case 'follow':
      return 'bg-green-50 border-green-200';
    case 'favorite':
      return 'bg-red-50 border-red-200';
    case 'workflow_update':
      return 'bg-purple-50 border-purple-200';
    case 'system':
      return 'bg-gray-50 border-gray-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
}; 