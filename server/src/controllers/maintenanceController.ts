import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import MaintenanceRequest from '../models/MaintenanceRequest';
import Room from '../models/Room';
import Notification from '../models/Notification';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { formatETB } from '../utils/formatCurrency';

const generateRequestNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `MNT-${year}-${random}`;
};

export const getMaintenanceRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      status,
      priority,
      category,
      assignedTo,
      roomId,
      page,
      limit,
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (roomId) filter.room = roomId;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      MaintenanceRequest.find(filter)
        .populate('room', 'name roomNumber type floor')
        .populate('reportedBy', 'name role')
        .populate('assignedTo', 'fullName phone department')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      MaintenanceRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      requests,
    });
  }
);

export const getMaintenanceStats = asyncHandler(
  async (req: Request, res: Response) => {
    const [
      totalRequests,
      openRequests,
      inProgressRequests,
      resolvedRequests,
      criticalRequests,
    ] = await Promise.all([
      MaintenanceRequest.countDocuments(),
      MaintenanceRequest.countDocuments({ status: 'open' }),
      MaintenanceRequest.countDocuments({ status: 'in_progress' }),
      MaintenanceRequest.countDocuments({ status: 'resolved' }),
      MaintenanceRequest.countDocuments({
        priority: 'critical',
        status: { $nin: ['resolved', 'closed', 'cancelled'] },
      }),
    ]);

    const categoryStats = await MaintenanceRequest.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalRepairCost: { $sum: '$repairCost' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalRepairCost = await MaintenanceRequest.aggregate([
      { $match: { status: { $in: ['resolved', 'closed'] } } },
      { $group: { _id: null, total: { $sum: '$repairCost' } } },
    ]);

    const repairCostTotal = totalRepairCost[0]?.total || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalRequests,
        openRequests,
        inProgressRequests,
        resolvedRequests,
        criticalRequests,
        totalRepairCost: repairCostTotal,
        formattedTotalRepairCost: formatETB(repairCostTotal),
        categoryBreakdown: categoryStats,
      },
    });
  }
);

export const getMaintenanceRequestById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('room', 'name roomNumber type floor')
      .populate('reportedBy', 'name role email')
      .populate('assignedTo', 'fullName phone department position');

    if (!request) {
      return next(
        new AppError(
          `No maintenance request found with ID: ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      request,
    });
  }
);

export const createMaintenanceRequest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      roomId,
      location,
      category,
      priority,
      title,
      description,
      requiresRoomClosure,
    } = req.body;

    if (!location || !category || !title || !description) {
      return next(
        new AppError(
          'Please provide location, category, title, and description.',
          400
        )
      );
    }

    const requestNumber = generateRequestNumber();

    const request = await MaintenanceRequest.create({
      requestNumber,
      room: roomId || undefined,
      location: location.trim(),
      category,
      priority: priority || 'normal',
      status: 'open',
      title: title.trim(),
      description: description.trim(),
      reportedBy: req.user?._id,
      requiresRoomClosure: requiresRoomClosure || false,
    });

    if (requiresRoomClosure && roomId) {
      await Room.findByIdAndUpdate(roomId, { status: 'maintenance' });
    }

    await request.populate('room', 'name roomNumber');
    await request.populate('reportedBy', 'name role');

    const { default: User } = await import('../models/User');
    const manager = await User.findOne({
      role: { $in: ['admin', 'manager'] },
    });

    if (manager) {
      const isUrgent =
        priority === 'critical' || priority === 'high';

      await Notification.createNotification({
        recipient: manager._id,
        type: isUrgent ? 'error' : 'warning',
        event: isUrgent ? 'MAINTENANCE_URGENT' : 'MAINTENANCE_OPEN',
        title: `${isUrgent ? '🚨 Urgent' : 'New'} Maintenance — ${requestNumber}`,
        message: `${title} at ${location}. Priority: ${priority}. ${requiresRoomClosure ? 'Room has been taken out of service.' : ''}`,
        link: `/admin/maintenance/${request._id}`,
      });
    }

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CREATE',
        resource: 'MaintenanceRequest',
        resourceId: request._id.toString(),
        description: `${req.user.name} reported maintenance issue: ${title} at ${location}. Priority: ${priority}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(201).json({
      success: true,
      message: `Maintenance request ${requestNumber} created successfully.`,
      request,
    });
  }
);

export const assignMaintenanceRequest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { staffId } = req.body;

    if (!staffId) {
      return next(
        new AppError('Please provide staff ID to assign.', 400)
      );
    }

    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return next(
        new AppError(
          `No maintenance request found with ID: ${req.params.id}`,
          404
        )
      );
    }

    request.assignedTo = staffId;
    request.assignedAt = new Date();
    request.status = 'assigned';
    await request.save();

    await request.populate('assignedTo', 'fullName phone');

    res.status(200).json({
      success: true,
      message: `Maintenance request ${request.requestNumber} assigned successfully.`,
      request,
    });
  }
);

export const startMaintenanceRequest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return next(
        new AppError(
          `No maintenance request found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (
      request.status !== 'assigned' &&
      request.status !== 'open'
    ) {
      return next(
        new AppError(
          `Request cannot be started — current status is '${request.status}'.`,
          400
        )
      );
    }

    request.status = 'in_progress';
    request.startedAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: `Maintenance request ${request.requestNumber} is now in progress.`,
      request,
    });
  }
);

export const resolveMaintenanceRequest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { resolutionNotes, repairCost, partsUsed } = req.body;

    if (!resolutionNotes) {
      return next(
        new AppError('Please provide resolution notes.', 400)
      );
    }

    const request = await MaintenanceRequest.findById(
      req.params.id
    ).populate('room', 'name roomNumber _id');

    if (!request) {
      return next(
        new AppError(
          `No maintenance request found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (request.status !== 'in_progress') {
      return next(
        new AppError(
          `Request cannot be resolved — current status is '${request.status}'.`,
          400
        )
      );
    }

    request.status = 'resolved';
    request.resolvedAt = new Date();
    request.resolutionNotes = resolutionNotes.trim();
    if (repairCost) request.repairCost = Number(repairCost);
    if (partsUsed) request.partsUsed = partsUsed.trim();
    await request.save();

    if (request.requiresRoomClosure && request.room) {
      const room = request.room as { _id: string };
      await Room.findByIdAndUpdate(room._id, { status: 'available' });
    }

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'MaintenanceRequest',
        resourceId: request._id.toString(),
        description: `${req.user.name} resolved maintenance request ${request.requestNumber}. Cost: ${repairCost ? formatETB(Number(repairCost)) : 'N/A'}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Maintenance request ${request.requestNumber} resolved successfully.${repairCost ? ` Repair cost: ${formatETB(Number(repairCost))}` : ''}`,
      request,
    });
  }
);

export const closeMaintenanceRequest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return next(
        new AppError(
          `No maintenance request found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (request.status !== 'resolved') {
      return next(
        new AppError(
          `Request must be resolved before closing. Current status: '${request.status}'.`,
          400
        )
      );
    }

    request.status = 'closed';
    request.closedAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: `Maintenance request ${request.requestNumber} closed.`,
      request,
    });
  }
);

export const cancelMaintenanceRequest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const request = await MaintenanceRequest.findById(
      req.params.id
    ).populate('room', 'name roomNumber _id');

    if (!request) {
      return next(
        new AppError(
          `No maintenance request found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (
      request.status === 'resolved' ||
      request.status === 'closed' ||
      request.status === 'cancelled'
    ) {
      return next(
        new AppError(
          `Cannot cancel a ${request.status} request.`,
          400
        )
      );
    }

    request.status = 'cancelled';
    await request.save();

    if (request.requiresRoomClosure && request.room) {
      const room = request.room as { _id: string };
      await Room.findByIdAndUpdate(room._id, { status: 'available' });
    }

    res.status(200).json({
      success: true,
      message: `Maintenance request ${request.requestNumber} cancelled.`,
      request,
    });
  }
);
