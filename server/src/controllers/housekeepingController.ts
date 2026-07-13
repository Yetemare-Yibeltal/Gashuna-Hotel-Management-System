import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import HousekeepingTask from '../models/HousekeepingTask';
import Room from '../models/Room';
import Notification from '../models/Notification';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';

export const getHousekeepingTasks = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, priority, assignedTo, roomId, page, limit } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (roomId) filter.room = roomId;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      HousekeepingTask.find(filter)
        .populate('room', 'name roomNumber type floor')
        .populate('assignedTo', 'fullName phone department')
        .populate('assignedBy', 'name role')
        .populate('inspectedBy', 'name role')
        .populate('booking', 'bookingRef checkIn checkOut')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      HousekeepingTask.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      tasks,
    });
  }
);

export const getPendingTasks = asyncHandler(
  async (req: Request, res: Response) => {
    const tasks = await HousekeepingTask.find({
      status: { $in: ['pending', 'in_progress'] },
    })
      .populate('room', 'name roomNumber type floor')
      .populate('assignedTo', 'fullName phone')
      .sort({ priority: -1, createdAt: 1 });

    const summary = {
      pending: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      urgent: tasks.filter((t) => t.priority === 'urgent').length,
      high: tasks.filter((t) => t.priority === 'high').length,
      total: tasks.length,
    };

    res.status(200).json({
      success: true,
      summary,
      tasks,
    });
  }
);

export const getHousekeepingTaskById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const task = await HousekeepingTask.findById(req.params.id)
      .populate('room', 'name roomNumber type floor')
      .populate('assignedTo', 'fullName phone department')
      .populate('assignedBy', 'name role')
      .populate('inspectedBy', 'name role')
      .populate('booking', 'bookingRef checkIn checkOut');

    if (!task) {
      return next(
        new AppError(`No housekeeping task found with ID: ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      task,
    });
  }
);

export const createHousekeepingTask = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      roomId,
      bookingId,
      taskType,
      priority,
      assignedTo,
      checklist,
      estimatedDuration,
      notes,
    } = req.body;

    if (!roomId || !taskType) {
      return next(
        new AppError('Please provide room ID and task type.', 400)
      );
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return next(new AppError('Room not found.', 404));
    }

    const task = await HousekeepingTask.create({
      room: roomId,
      booking: bookingId || undefined,
      taskType,
      priority: priority || 'normal',
      status: 'pending',
      assignedTo: assignedTo || undefined,
      assignedBy: req.user?._id,
      checklist: checklist || undefined,
      estimatedDuration: estimatedDuration || 45,
      notes: notes || undefined,
    });

    await task.populate('room', 'name roomNumber type floor');
    await task.populate('assignedTo', 'fullName phone');

    res.status(201).json({
      success: true,
      message: `Housekeeping task created for Room ${room.roomNumber}.`,
      task,
    });
  }
);

export const assignHousekeepingTask = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { staffId } = req.body;

    if (!staffId) {
      return next(new AppError('Please provide staff ID to assign.', 400));
    }

    const task = await HousekeepingTask.findById(req.params.id);

    if (!task) {
      return next(
        new AppError(`No housekeeping task found with ID: ${req.params.id}`, 404)
      );
    }

    task.assignedTo = staffId;
    task.assignedBy = req.user?._id;
    await task.save();

    await task.populate('room', 'name roomNumber');
    await task.populate('assignedTo', 'fullName phone');

    res.status(200).json({
      success: true,
      message: 'Task assigned successfully.',
      task,
    });
  }
);

export const startHousekeepingTask = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const task = await HousekeepingTask.findById(req.params.id).populate(
      'room',
      'name roomNumber'
    );

    if (!task) {
      return next(
        new AppError(`No housekeeping task found with ID: ${req.params.id}`, 404)
      );
    }

    if (task.status !== 'pending') {
      return next(
        new AppError(`Task cannot be started — current status is '${task.status}'.`, 400)
      );
    }

    task.status = 'in_progress';
    task.startedAt = new Date();
    await task.save();

    const room = task.room as { roomNumber: string };

    res.status(200).json({
      success: true,
      message: `Housekeeping started for Room ${room.roomNumber}.`,
      task,
    });
  }
);

export const completeHousekeepingTask = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { checklist } = req.body;

    const task = await HousekeepingTask.findById(req.params.id).populate(
      'room',
      'name roomNumber _id'
    );

    if (!task) {
      return next(
        new AppError(`No housekeeping task found with ID: ${req.params.id}`, 404)
      );
    }

    if (task.status !== 'in_progress') {
      return next(
        new AppError(
          `Task cannot be completed — current status is '${task.status}'. Start the task first.`,
          400
        )
      );
    }

    task.status = 'done';
    task.completedAt = new Date();

    if (checklist) {
      task.checklist = checklist;
    } else {
      task.checklist = task.checklist.map((item) => ({
        ...item,
        isCompleted: true,
      }));
    }

    await task.save();

    const room = task.room as { _id: string; roomNumber: string };

    await Room.findByIdAndUpdate(room._id, { status: 'available' });

    const { default: User } = await import('../models/User');
    const manager = await User.findOne({ role: { $in: ['admin', 'manager'] } });

    if (manager) {
      await Notification.createNotification({
        recipient: manager._id,
        type: 'success',
        event: 'ROOM_AVAILABLE',
        title: `Room ${room.roomNumber} is now available`,
        message: `Housekeeping completed for Room ${room.roomNumber}. Room is now clean and available for check-in.`,
        link: '/admin/rooms',
        relatedRoom: task.room,
      });
    }

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'HousekeepingTask',
        resourceId: task._id.toString(),
        description: `${req.user.name} completed housekeeping for Room ${room.roomNumber}. Room is now available.`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Room ${room.roomNumber} cleaning completed. Room is now available.`,
      task,
    });
  }
);

export const inspectHousekeepingTask = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { passed, inspectionNotes, issueDescription } = req.body;

    const task = await HousekeepingTask.findById(req.params.id).populate(
      'room',
      'name roomNumber _id'
    );

    if (!task) {
      return next(
        new AppError(`No housekeeping task found with ID: ${req.params.id}`, 404)
      );
    }

    if (task.status !== 'done') {
      return next(
        new AppError(
          `Task cannot be inspected — current status is '${task.status}'. Task must be completed first.`,
          400
        )
      );
    }

    task.inspectedAt = new Date();
    task.inspectedBy = req.user?._id;
    task.inspectionNotes = inspectionNotes || '';

    if (passed) {
      task.status = 'inspected';
    } else {
      task.status = 'issue_found';
      task.issueDescription = issueDescription || 'Issue found during inspection';
      const room = task.room as { _id: string };
      await Room.findByIdAndUpdate(room._id, { status: 'cleaning' });
    }

    await task.save();

    const room = task.room as { roomNumber: string };

    res.status(200).json({
      success: true,
      message: passed
        ? `Room ${room.roomNumber} inspection passed.`
        : `Room ${room.roomNumber} inspection failed — sent back for re-cleaning.`,
      task,
    });
  }
);

export const updateChecklistItem = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { itemIndex, isCompleted } = req.body;

    const task = await HousekeepingTask.findById(req.params.id);

    if (!task) {
      return next(
        new AppError(`No housekeeping task found with ID: ${req.params.id}`, 404)
      );
    }

    if (itemIndex < 0 || itemIndex >= task.checklist.length) {
      return next(
        new AppError(`Invalid checklist item index: ${itemIndex}.`, 400)
      );
    }

    task.checklist[itemIndex].isCompleted = isCompleted;
    await task.save();

    res.status(200).json({
      success: true,
      message: `Checklist item "${task.checklist[itemIndex].task}" marked as ${isCompleted ? 'completed' : 'incomplete'}.`,
      completionPercentage: task.toObject(),
      task,
    });
  }
);
