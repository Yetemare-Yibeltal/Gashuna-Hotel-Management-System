import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';

export const getHotelSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const settings = {
      hotel: {
        name: process.env.HOTEL_NAME || 'Gashuna Hotel',
        address:
          process.env.HOTEL_ADDRESS ||
          'Dangila Kebele 05, End of Addis Kedam Exit, Dangla, Awi Zone, Amhara Region, Ethiopia',
        phone: process.env.HOTEL_PHONE || '',
        email:
          process.env.HOTEL_EMAIL || 'gashunayene@gashuna.com',
        website:
          process.env.HOTEL_WEBSITE || 'https://gashuna.com',
        vatNumber: process.env.HOTEL_VAT_NUMBER || '',
      },
      payment: {
        currency: 'ETB',
        vatRate: parseFloat(process.env.VAT_RATE || '0.15'),
        vatRatePercent: 15,
        chapaEnabled: !!process.env.CHAPA_SECRET_KEY,
        telebirrEnabled: true,
        cbebirrEnabled: true,
        cashEnabled: true,
        bankTransferEnabled: true,
      },
      ai: {
        aiEnabled: !!process.env.OPENAI_API_KEY,
        voiceEnabled: !!process.env.OPENAI_API_KEY,
        predictionEnabled: !!process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      },
      system: {
        nodeEnv: process.env.NODE_ENV || 'development',
        maxFileSize: parseInt(
          process.env.MAX_FILE_SIZE || '5242880'
        ),
        maxFileSizeMB: 5,
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
    };

    res.status(200).json({
      success: true,
      settings,
    });
  }
);

export const getAllUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const { role, isActive, page, limit } = req.query;

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (isActive !== undefined)
      filter.isActive = isActive === 'true';

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -passwordResetToken -passwordResetExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      users,
    });
  }
);

export const getUserById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id).select(
      '-password -passwordResetToken -passwordResetExpires'
    );

    if (!user) {
      return next(
        new AppError(
          `No user found with ID: ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      user,
    });
  }
);

export const createUser = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      return next(
        new AppError(
          'Please provide name, email, password, and role.',
          400
        )
      );
    }

    const validRoles = ['admin', 'manager', 'receptionist'];
    if (!validRoles.includes(role)) {
      return next(
        new AppError(
          `Invalid role. Valid values: ${validRoles.join(', ')}.`,
          400
        )
      );
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return next(
        new AppError(
          `A user with email ${email} already exists.`,
          400
        )
      );
    }

    if (password.length < 6) {
      return next(
        new AppError(
          'Password must be at least 6 characters.',
          400
        )
      );
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      phone: phone?.trim(),
      isActive: true,
    });

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CREATE',
        resource: 'User',
        resourceId: user._id.toString(),
        description: `${req.user.name} created new user account: ${name} (${role}) — ${email}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(201).json({
      success: true,
      message: `User account created for ${name} as ${role}.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  }
);

export const updateUser = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { name, email, role, phone, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new AppError(
          `No user found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (
      req.params.id === req.user?._id.toString() &&
      isActive === false
    ) {
      return next(
        new AppError('You cannot deactivate your own account.', 400)
      );
    }

    if (email && email !== user.email) {
      const duplicate = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return next(
          new AppError(
            `Email ${email} is already in use by another account.`,
            400
          )
        );
      }
    }

    const previousData = user.toObject();

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role;
    if (phone) user.phone = phone.trim();
    if (isActive !== undefined) user.isActive = isActive;

    await user.save({ validateBeforeSave: false });

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'User',
        resourceId: user._id.toString(),
        description: `${req.user.name} updated user account: ${user.name} (${user.role})`,
        previousData,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `User account for ${user.name} updated successfully.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
      },
    });
  }
);

export const resetUserPassword = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return next(
        new AppError(
          'Please provide a new password of at least 6 characters.',
          400
        )
      );
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new AppError(
          `No user found with ID: ${req.params.id}`,
          404
        )
      );
    }

    user.password = newPassword;
    await user.save();

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'User',
        resourceId: user._id.toString(),
        description: `${req.user.name} reset password for user: ${user.name} (${user.role})`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Password reset successfully for ${user.name}.`,
    });
  }
);

export const deleteUser = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new AppError(
          `No user found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (req.params.id === req.user?._id.toString()) {
      return next(
        new AppError('You cannot delete your own account.', 400)
      );
    }

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'DELETE',
        resource: 'User',
        resourceId: user._id.toString(),
        description: `${req.user.name} deleted user account: ${user.name} (${user.role}) — ${user.email}`,
        previousData: user.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: `User account for ${user.name} deleted successfully.`,
    });
  }
);

export const toggleUserStatus = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new AppError(
          `No user found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (req.params.id === req.user?._id.toString()) {
      return next(
        new AppError(
          'You cannot deactivate your own account.',
          400
        )
      );
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'User',
        resourceId: user._id.toString(),
        description: `${req.user.name} ${user.isActive ? 'activated' : 'deactivated'} user account: ${user.name} (${user.role})`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `${user.name}'s account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  }
);
