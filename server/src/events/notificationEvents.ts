import { EventEmitter } from 'events';
import Notification from '../models/Notification';

export const notificationEmitter = new EventEmitter();

notificationEmitter.on(
  'notify:all-admins',
  async (data: {
    type: 'info' | 'success' | 'warning' | 'error';
    event: string;
    title: string;
    message: string;
    link?: string;
  }) => {
    try {
      const User = (await import('../models/User')).default;
      const adminUsers = await User.find({
        role: { $in: ['admin', 'manager'] },
        isActive: true,
      });

      for (const admin of adminUsers) {
        await Notification.createNotification({
          recipient: admin._id,
          type: data.type,
          event: data.event as never,
          title: data.title,
          message: data.message,
          link: data.link,
        });
      }
    } catch (error) {
      console.error('notificationEmitter notify:all-admins error:', error);
    }
  }
);

notificationEmitter.on(
  'notify:user',
  async (data: {
    userId: string;
    type: 'info' | 'success' | 'warning' | 'error';
    event: string;
    title: string;
    message: string;
    link?: string;
  }) => {
    try {
      await Notification.createNotification({
        recipient: data.userId as never,
        type: data.type,
        event: data.event as never,
        title: data.title,
        message: data.message,
        link: data.link,
      });
    } catch (error) {
      console.error('notificationEmitter notify:user error:', error);
    }
  }
);

export default notificationEmitter;
