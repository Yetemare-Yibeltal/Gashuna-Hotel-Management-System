import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '../lib/api';
import { useNotificationStore } from '../store/notificationStore';

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { notifications, unreadCount } = useNotificationStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll({ limit: 20 }),
    refetchInterval: 30000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => notificationsAPI.markRead(id),
    onSuccess: invalidate,
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: invalidate,
  });

  const { mutate: deleteNotification } = useMutation({
    mutationFn: (id: string) => notificationsAPI.delete(id),
    onSuccess: invalidate,
  });

  const { mutate: clearRead } = useMutation({
    mutationFn: () => notificationsAPI.clearRead(),
    onSuccess: invalidate,
  });

  return {
    notifications: (data?.data?.notifications || notifications) as any[],
    unreadCount: (data?.data?.unreadCount ?? unreadCount) as number,
    isLoading,
    refetch,
    markRead,
    markAllRead,
    deleteNotification,
    clearRead,
  };
};
