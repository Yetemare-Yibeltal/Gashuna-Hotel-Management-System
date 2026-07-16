import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllReadNotifications,
  createBroadcastNotification,
} from '../controllers/notificationController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  getNotifications
);

router.get(
  '/unread-count',
  authorize('admin', 'manager', 'receptionist'),
  getUnreadCount
);

router.get(
  '/:id',
  authorize('admin', 'manager', 'receptionist'),
  getNotificationById
);

router.patch(
  '/:id/read',
  authorize('admin', 'manager', 'receptionist'),
  markNotificationRead
);

router.patch(
  '/read-all',
  authorize('admin', 'manager', 'receptionist'),
  markAllNotificationsRead
);

router.delete(
  '/clear-read',
  authorize('admin', 'manager', 'receptionist'),
  deleteAllReadNotifications
);

router.delete(
  '/:id',
  authorize('admin', 'manager', 'receptionist'),
  deleteNotification
);

router.post(
  '/broadcast',
  authorize('admin'),
  createBroadcastNotification
);

export default router;a
