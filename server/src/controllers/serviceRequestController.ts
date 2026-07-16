import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import ServiceRequest from '../models/ServiceRequest';
import Service from '../models/Service';
import Notification from '../models/Notification';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { formatETB } from '../utils/formatCurrency';

export const getServiceRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      status,
      guestId,
      bookingId,
      assignedTo,
      page,
      limit,
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (guestId) filter.guest = guestId;
    if (bookingId) filter.booking = bookingId;
    if (assignedTo) filter.assignedTo = assignedTo;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      ServiceRequest.find(filter)
        .populate('guest', 'fullName phone email vip')
        .populate('booking', 'bookingRef checkIn checkOut')
        .populate('service', 'name nameAmharic category price unit')
        .populate('assignedTo', 'fullName phone department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ServiceRequest.countDocuments(filter),
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

export const getServiceRequestStats = asyncHandler(
  async (req: Request, res: Response) => {
    const [
      totalRequests,
      pendingRequests,
      inProgressRequests,
      completedRequests,
    ] = await Promise.all([
      ServiceRequest.countDocuments(),
      ServiceRequest.countDocuments({ status: 'pending' }),
      ServiceRequest.countDocuments({ status: 'in_progress' }),
      ServiceRequest.countDocuments({ status: 'completed' }),
    ]);

    const revenueStats = await ServiceRequest.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;

    const popularServices = await ServiceRequest.aggregate([
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'serviceInfo',
        },
      },
      { $unwind: '$serviceInfo' },
      {
        $project: {
          serviceName: '$serviceInfo.name',
          category: '$serviceInfo.category',
          count: 1,
          totalRevenue: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalRequests,
        pendingRequests,
        inProgressRequests,
        completedRequests,
        totalRevenue,
        formattedTotalRevenue: formatETB(totalRevenue),
        popularServices,
      },
    });
  }
);

export const getServiceRequestById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('guest', 'fullName phone email vip loyaltyPoints')
      .populate('booking', 'bookingRef checkIn checkOut room')
      .populate('service')
      .populate('assignedTo', 'fullName phone department position');

    if (!request) {
      return next(
        new AppError(
          `No service request found with ID: ${req.params.id}`,
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

export const createServiceRequest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      guestId,
      bookingId,
      serviceId,
      quantity,
      requestedFor,
      guestNotes,
    } = req.body;

    if (!guestId || !serviceId) {
      return next(
        new AppError('Please provide guest ID and service ID.', 400)
      );
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return next(new AppError('Service not found.', 404));
    }

    if (!service.available) {
      return next(
        new AppError(
          `Service "${service.name}" is currently not available.`,
          400
        )
      );
    }

    const requestQuantity = quantity || 1;

    if (
      service.maxCapacity &&
      requestQuantity > service.maxCapacity
    ) {
      return next(
        new AppError(
          `Maximum capacity for "${service.name}" is ${service.maxCapacity} ${service.unit}.`,
          400
        )
      );
    }

    const totalPrice = service.price * requestQuantity;

    const request = await ServiceRequest.create({
      guest: guestId,
      booking: bookingId || undefined,
      service: serviceId,
      quantity: requestQuantity,
      totalPrice,
      status: 'pending',
      requestedFor: requestedFor ? new Date(requestedFor) : undefined,
      guestNotes: guestNotes?.trim() || undefined,
      isCharged: false,
    });

    await request.populate('guest', 'fullName phone vip');
    await request.populate('service', 'name category price unit');

    const { default: User } = await import('../models/User');
    const manager = await User.findOne({
      role: { $in: ['admin', 'manager'] },
    });

    if (manager) {
      const guest = request.guest as { fullName: string; vip: boolean };
      await Notification.createNotification({
        recipient: manager._id,
        type: 'info',
        event: 'GENERAL',
        title: `New Service Request — ${service.name}`,
        message: `${guest.fullName} requested ${service.name} x${requestQuantity}. Total: ${formatETB(totalPrice)}.${guest.vip ? ' ⭐ VIP Guest' : ''}`,
        link: `/admin/services`,
        relatedGuest: request.guest,
        relatedBooking: request.booking,
      });
    }

    res.status(201).json({
      success: true,
      message: `Service request for "${service.name}" created successfully. Total: ${formatETB(totalPrice)}`,
      request,
    });
  }
);

export const confirmServiceRequest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const request = await ServiceRequest.findById(
      req.params.id
    ).populate('service', 'name');

    if (!request) {
      return next(
        new AppError(
          `No service request found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (request.status !== 'pending') {
      return next(
        new AppError(
          `Request cannot be confirmed — current status is '${request.status}'.`,
          400
        )
      );
    }

    request.status = 'confirmed';
    if (req.body.scheduledAt) {
      request.scheduledAt = new Date(req.body.scheduledAt);
    }
    await request.save();

    const service = request.service as { name: string };

    res.status(200).json({
      success: true,
      message: `Service request for "${service.name}" confirmed.`,
      request,
    });
  }
);

export const assignServiceRequest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { staffId } = req.body;

    if (!staffId) {
      return next(
        new AppError('Please provide staff ID to assign.', 400)
      );
    }

    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return next(
        new AppError(
          `No service request found with ID: ${req.params.id}`,
          404
        )
      );
    }

    request.assignedTo = staffId;
    request.status = 'assigned';
    await request.save();

    await request.populate('assignedTo', 'fullName phone');

    res.status(200).json({
      success: true,
      message: 'Service request assigned successfully.',
      request,
    });
  }
);

export const startServiceRequest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return next(
        new AppError(
          `No service request found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (
      request.status !== 'confirmed' &&
      request.status !== 'assigned'
    ) {
      return next(
        new AppError(
          `Request cannot be started — current status is '${request.status}'.`,
          400
        )
      );
    }

    request.status = 'in_progress';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Service request is now in progress.',
      request,
    });
  }
);

export const completeServiceRequest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { notes } = req.body;

    const request = await ServiceRequest.findById(
      req.params.id
    ).populate('service', 'name price');

    if (!request) {
      return next(
        new AppError(
          `No service request found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (request.status !== 'in_progress') {
      return next(
        new AppError(
          `Request cannot be completed — current status is '${request.status}'.`,
          400
        )
      );
    }

    request.status = 'completed';
    request.completedAt = new Date();
    if (notes) request.notes = notes.trim();
    await request.save();

    const service = request.service as { name: string };

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'ServiceRequest',
        resourceId: request._id.toString(),
        description: `${req.user.name} completed service request for "${service.name}". Total: ${formatETB(request.totalPrice)}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Service "${service.name}" completed successfully. Total: ${formatETB(request.totalPrice)}`,
      request,
    });
  }
);

export const cancelServiceRequest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { cancellationReason } = req.body;

    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return next(
        new AppError(
          `No service request found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (
      request.status === 'completed' ||
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
    request.cancellationReason =
      cancellationReason?.trim() || 'Cancelled by staff';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Service request cancelled successfully.',
      request,
    });
  }
);
