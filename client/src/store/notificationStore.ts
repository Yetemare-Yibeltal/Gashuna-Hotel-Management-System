import { create } from 'zustand';
import { notificationsAPI } from '../lib/api';

export interface Notification {
  _id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  event: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  link?: string;
  createdAt: string;
  timeAgo?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await notificationsAPI.getAll({ limit: 20 });
      set({
        notifications: res.data.notifications || [],
        unreadCount: res.data.unreadCount || 0,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      set({ unreadCount: res.data.unreadCount || 0 });
    } catch {
      // ignore
    }
  },

  markRead: async (id) => {
    try {
      await notificationsAPI.markRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // ignore
    }
  },

  markAllRead: async () => {
    try {
      await notificationsAPI.markAllRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      // ignore
    }
  },

  deleteNotification: async (id) => {
    try {
      await notificationsAPI.delete(id);
      set((state) => {
        const target = state.notifications.find((n) => n._id === id);
        return {
          notifications: state.notifications.filter((n) => n._id !== id),
          unreadCount:
            target && !target.isRead
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
        };
      });
    } catch {
      // ignore
    }
  },

  clearRead: async () => {
    try {
      await notificationsAPI.clearRead();
      set((state) => ({
        notifications: state.notifications.filter((n) => !n.isRead),
      }));
    } catch {
      // ignore
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
