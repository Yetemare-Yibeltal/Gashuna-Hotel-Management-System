import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import Service from '../models/Service';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { formatETB } from '../utils/formatCurrency';

export const getServices = asyncHandler(
  async (req: Request, res: Response) => {
    const { category, available, search, sortBy, order } = req.query;

    const filter: Record<string, unknown> = {};

    if (category) filter.category = category;

    if (available === 'false') {
      filter.available = false;
    } else if (available === 'all') {
      // no filter
    } else {
      filter.available = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameAmharic: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sortField = (sortBy as string) || 'category';
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: Record<string, number> = {
      [sortField]: sortOrder,
      name: 1,
    };

    const services = await Service.find(filter).sort(sortObj);

    const categories = [
      'transport',
      'tour',
      'laundry',
      'spa',
      'conference',
      'recreation',
      'business',
      'other',
    ];

    const groupedByCategory: Record<string, typeof services> = {};
    categories.forEach((cat) => {
      groupedByCategory[cat] = services.filter(
        (s) => s.category === cat
      );
    });

    res.status(200).json({
      success: true,
      count: services.length,
      services,
      groupedByCategory,
    });
  }
);

export const getServiceStats = asyncHandler(
  async (req: Request, res: Response) => {
    const [totalServices, availableServices, freeServices] =
      await Promise.all([
        Service.countDocuments(),
        Service.countDocuments({ available: true }),
        Service.countDocuments({ price: 0, available: true }),
      ]);

    const categoryStats = await Service.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalServices,
        availableServices,
        freeServices,
        paidServices: availableServices - freeServices,
        categoryBreakdown: categoryStats,
      },
    });
  }
);

export const getServiceById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return next(
        new AppError(
          `No service found with ID: ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      service,
    });
  }
);

export const createService = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      name,
      nameAmharic,
      category,
      description,
      price,
      unit,
      requiresBooking,
      maxCapacity,
      icon,
    } = req.body;

    if (!name || !category || !description || price === undefined || !unit) {
      return next(
        new AppError(
          'Please provide name, category, description, price, and unit.',
          400
        )
      );
    }

    const validCategories = [
      'transport',
      'tour',
      'laundry',
      'spa',
      'conference',
      'recreation',
      'business',
      'other',
    ];

    if (!validCategories.includes(category)) {
      return next(
        new AppError(
          `Invalid category. Valid values: ${validCategories.join(', ')}.`,
          400
        )
      );
    }

    const service = await Service.create({
      name: name.trim(),
      nameAmharic: nameAmharic?.trim() || '',
      category,
      description: description.trim(),
      price: Number(price),
      unit: unit.trim(),
      available: true,
      requiresBooking: requiresBooking || false,
      maxCapacity: maxCapacity || undefined,
      icon: icon || '',
    });

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CREATE',
        resource: 'Service',
        resourceId: service._id.toString(),
        description: `${req.user.name} created new service: ${name} — ${formatETB(Number(price))} ${unit}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(201).json({
      success: true,
      message: `Service "${name}" created successfully.`,
      service,
    });
  }
);

export const updateService = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return next(
        new AppError(
          `No service found with ID: ${req.params.id}`,
          404
        )
      );
    }

    const previousData = service.toObject();

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (req.user && updatedService) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Service',
        resourceId: service._id.toString(),
        description: `${req.user.name} updated service: ${service.name}`,
        previousData,
        newData: updatedService.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Service "${service.name}" updated successfully.`,
      service: updatedService,
    });
  }
);

export const toggleServiceAvailability = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return next(
        new AppError(
          `No service found with ID: ${req.params.id}`,
          404
        )
      );
    }

    service.available = !service.available;
    await service.save();

    res.status(200).json({
      success: true,
      message: `"${service.name}" is now ${service.available ? 'available' : 'unavailable'}.`,
      service,
    });
  }
);

export const deleteService = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return next(
        new AppError(
          `No service found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'DELETE',
        resource: 'Service',
        resourceId: service._id.toString(),
        description: `${req.user.name} deleted service: ${service.name}`,
        previousData: service.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    await service.deleteOne();

    res.status(200).json({
      success: true,
      message: `Service "${service.name}" deleted successfully.`,
    });
  }
);
