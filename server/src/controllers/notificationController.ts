import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';

export const getNotifications = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { isRead, event, page, limit } = req.query;

    const filter: Record<string, unknown> = {
      recipient: req.user?._id,
    };

    if (isRead === 'true') filter.isRead = true;
    if (isRead === 'false') filter.isRead = false;
    if (event) filter.event = event;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        recipient: req.user?._id,
        isRead: false,
      }),
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      notifications,
    });
  }
);

export const getUnreadCount = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user?._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  }
);

export const getNotificationById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user?._id,
    });

    if (!notification) {
      return next(
        new AppError(
          `No notification found with ID: ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      notification,
    });
  }
);

export const markNotificationRead = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user?._id,
    });

    if (!notification) {
      return next(
        new AppError(
          `No notification found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (notification.isRead) {
      return res.status(200).json({
        success: true,
        message: 'Notification already marked as read.',
        notification,
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification,
    });
  }
);

export const markAllNotificationsRead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await Notification.updateMany(
      {
        recipient: req.user?._id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notification(s) marked as read.`,
      modifiedCount: result.modifiedCount,
    });
  }
);

export const deleteNotification = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user?._id,
    });

    if (!notification) {
      return next(
        new AppError(
          `No notification found with ID: ${req.params.id}`,
          404
        )
      );
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.',
    });
  }
);

export const deleteAllReadNotifications = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await Notification.deleteMany({
      recipient: req.user?._id,
      isRead: true,
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} read notification(s) deleted.`,
      deletedCount: result.deletedCount,
    });
  }
);

export const createBroadcastNotification = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { title, message, type, event, link } = req.body;

    if (!title || !message) {
      return next(
        new AppError('Please provide title and message.', 400)
      );
    }

    const { default: User } = await import('../models/User');
    const allUsers = await User.find({ isActive: true }).select('_id');

    if (allUsers.length === 0) {
      return next(new AppError('No active users found.', 404));
    }

    const notifications = await Promise.all(
      allUsers.map((user) =>
        Notification.createNotification({
          recipient: user._id,
          type: type || 'info',
          event: event || 'GENERAL',
          title: title.trim(),
          message: message.trim(),
          link: link?.trim() || undefined,
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `Broadcast notification sent to ${notifications.length} user(s).`,
      count: notifications.length,
    });
  }
);
