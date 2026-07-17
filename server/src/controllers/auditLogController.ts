import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';

export const getAuditLogs = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      userId,
      action,
      resource,
      resourceId,
      success,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const filter: Record<string, unknown> = {};

    if (userId) filter.user = userId;
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (resourceId) filter.resourceId = resourceId;
    if (success !== undefined) filter.success = success === 'true';

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      filter.createdAt = dateFilter;
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 30;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      logs,
    });
  }
);

export const getAuditLogStats = asyncHandler(
  async (req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [totalLogs, todayLogs, failedLogs] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({
        createdAt: { $gte: today, $lte: todayEnd },
      }),
      AuditLog.countDocuments({ success: false }),
    ]);

    const actionStats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const resourceStats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$resource',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const userActivityStats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
          userName: { $first: '$userName' },
          userRole: { $first: '$userRole' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const recentFailures = await AuditLog.find({ success: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        'userName userRole action resource description errorMessage createdAt'
      );

    res.status(200).json({
      success: true,
      stats: {
        totalLogs,
        todayLogs,
        failedLogs,
        successRate:
          totalLogs > 0
            ? Math.round(
                ((totalLogs - failedLogs) / totalLogs) * 100 * 10
              ) / 10
            : 100,
        actionBreakdown: actionStats,
        resourceBreakdown: resourceStats,
        mostActiveUsers: userActivityStats,
        recentFailures,
      },
    });
  }
);

export const getAuditLogById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const log = await AuditLog.findById(req.params.id).populate(
      'user',
      'name email role'
    );

    if (!log) {
      return next(
        new AppError(
          `No audit log found with ID: ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      log,
    });
  }
);

export const getUserAuditLogs = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page, limit } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find({ user: req.params.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments({ user: req.params.userId }),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      logs,
    });
  }
);

export const getResourceAuditLogs = asyncHandler(
  async (req: Request, res: Response) => {
    const { resource, resourceId, page, limit } = req.query;

    const filter: Record<string, unknown> = {};
    if (resource) filter.resource = resource;
    if (resourceId) filter.resourceId = resourceId;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      logs,
    });
  }
);

export const clearOldAuditLogs = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { daysOld } = req.body;

    if (!daysOld || Number(daysOld) < 30) {
      return next(
        new AppError(
          'Please provide daysOld value of at least 30 days.',
          400
        )
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(daysOld));

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    await AuditLog.logAction({
      user: req.user?._id,
      userName: req.user?.name || 'System',
      userRole: req.user?.role || 'admin',
      action: 'DELETE',
      resource: 'Report',
      description: `${req.user?.name} cleared ${result.deletedCount} audit logs older than ${daysOld} days.`,
      ipAddress: req.ip,
      success: true,
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} audit log(s) older than ${daysOld} days deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  }
);
