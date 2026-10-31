import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';

export const useSocket = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    connectSocket(user._id);
    const socket = getSocket();

    socket.on('notification', (notification) => {
      addNotification(notification);
      if (notification.type === 'error' || notification.type === 'warning') {
        toast(notification.title, {
          icon: notification.type === 'error' ? '🚨' : '⚠️',
        });
      }
    });

    socket.on('booking:new', () => {
      fetchUnreadCount();
      toast('New booking received!', { icon: '📋' });
    });

    socket.on('room:status-update', (data) => {
      toast(`Room ${data.roomNumber} status: ${data.status}`, { icon: '🏨' });
    });

    socket.on('maintenance:critical', (data) => {
      toast.error(`Critical maintenance: ${data.title}`);
    });

    socket.on('payment:received', (data) => {
      toast.success(`Payment received: ETB ${data.amount?.toLocaleString()}`);
    });

    return () => {
      socket.off('notification');
      socket.off('booking:new');
      socket.off('room:status-update');
      socket.off('maintenance:critical');
      socket.off('payment:received');
      disconnectSocket();
    };
  }, [isAuthenticated, user, addNotification, fetchUnreadCount]);
};
