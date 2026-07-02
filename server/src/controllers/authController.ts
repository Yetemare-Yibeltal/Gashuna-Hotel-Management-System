// server/src/controllers/authController.ts
// ─────────────────────────────────────────────────────────────
// AUTH CONTROLLER — Gashuna Hotel Management System
//
// Handles all authentication operations:
//   POST /api/auth/login          → login with email + password
//   POST /api/auth/logout         → logout and clear cookie
//   GET  /api/auth/me             → get current logged-in user
//   PUT  /api/auth/change-password → change own password
//   POST /api/auth/forgot-password → request password reset email
//   PUT  /api/auth/reset-password/:token → reset password with token
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import generateToken, { clearToken } from '../utils/generateToken';
import { sendPasswordResetEmail } from '../utils/sendEmail';
import { AuthRequest } from '../middleware/authMiddleware';

// ─────────────────────────────────────────────────────────────
// @desc    Login admin user with email and password
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────
export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // ── Step 1: Validate input ────────────────────────────────
    if (!email || !password) {
      return next(
        new AppError('Please provide both email and password.', 400)
      );
    }

    // ── Step 2: Find user by email ────────────────────────────
    // We must explicitly select password because it has
    // select: false in the schema
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select('+password');

    if (!user) {
      return next(
        new AppError(
          'Invalid email or password. Please try again.',
          401
        )
      );
    }

    // ── Step 3: Check if account is active ───────────────────
    if (!user.isActive) {
      return next(
        new AppError(
          'Your account has been deactivated. Please contact the hotel administrator.',
          401
        )
      );
    }

    // ── Step 4: Verify password ───────────────────────────────
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      // Log failed login attempt
      await AuditLog.logAction({
        user: user._id,
        userName: user.name,
        userRole: user.role,
        action: 'LOGIN',
        resource: 'User',
        resourceId: user._id.toString(),
        description: `Failed login attempt for ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: false,
        errorMessage: 'Invalid password provided',
      });

      return next(
        new AppError(
          'Invalid email or password. Please try again.',
          401
        )
      );
    }

    // ── Step 5: Generate JWT token and set cookie ─────────────
    const token = generateToken(res, user._id.toString(), user.role);

    // ── Step 6: Update last login timestamp ───────────────────
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // ── Step 7: Log successful login ──────────────────────────
    await AuditLog.logAction({
      user: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN',
      resource: 'User',
      resourceId: user._id.toString(),
      description: `${user.name} (${user.role}) logged into the admin dashboard`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });

    // ── Step 8: Send response ─────────────────────────────────
    // Remove password from response object
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      lastLogin: user.lastLogin,
    };

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: userResponse,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Logout current user
// @route   POST /api/auth/logout
// @access  Private
// ─────────────────────────────────────────────────────────────
export const logout = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // Log the logout action before clearing the token
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'LOGOUT',
        resource: 'User',
        resourceId: req.user._id.toString(),
        description: `${req.user.name} logged out of the admin dashboard`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    }

    // Clear the JWT cookie
    clearToken(res);

    res.status(200).json({
      success: true,
      message: 'You have been logged out successfully.',
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
// ─────────────────────────────────────────────────────────────
export const getMe = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // req.user is attached by the protect middleware
    // We fetch fresh data from database in case it changed
    const user = await User.findById(req.user?._id);

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Change own password (logged-in user)
// @route   PUT /api/auth/change-password
// @access  Private
// ─────────────────────────────────────────────────────────────
export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // ── Validate input ────────────────────────────────────────
    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(
        new AppError(
          'Please provide current password, new password, and confirm password.',
          400
        )
      );
    }

    if (newPassword !== confirmPassword) {
      return next(
        new AppError(
          'New password and confirm password do not match.',
          400
        )
      );
    }

    if (newPassword.length < 6) {
      return next(
        new AppError('New password must be at least 6 characters long.', 400)
      );
    }

    if (currentPassword === newPassword) {
      return next(
        new AppError(
          'New password must be different from your current password.',
          400
        )
      );
    }

    // ── Fetch user with password ──────────────────────────────
    const user = await User.findById(req.user?._id).select('+password');

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    // ── Verify current password ───────────────────────────────
    const isCurrentPasswordCorrect = await user.matchPassword(
      currentPassword
    );

    if (!isCurrentPasswordCorrect) {
      return next(
        new AppError('Your current password is incorrect.', 401)
      );
    }

    // ── Update password ───────────────────────────────────────
    // The pre-save hook in User model will hash the new password
    user.password = newPassword;
    await user.save();

    // ── Log the password change ───────────────────────────────
    await AuditLog.logAction({
      user: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE',
      resource: 'User',
      resourceId: user._id.toString(),
      description: `${user.name} changed their own password`,
      ipAddress: req.ip,
      success: true,
    });

    // ── Issue new token after password change ─────────────────
    const token = generateToken(res, user._id.toString(), user.role);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
      token,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
// ─────────────────────────────────────────────────────────────
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide your email address.', 400));
    }

    // ── Find user by email ────────────────────────────────────
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    // We always send a success response even if user not found
    // This prevents email enumeration attacks
    if (!user) {
      res.status(200).json({
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent.',
      });
      return;
    }

    // ── Generate reset token ──────────────────────────────────
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // ── Send reset email ──────────────────────────────────────
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);

      res.status(200).json({
        success: true,
        message:
          'Password reset link has been sent to your email address. The link expires in 10 minutes.',
      });
    } catch {
      // If email fails to send, clear the reset token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          'Failed to send password reset email. Please try again later.',
          500
        )
      );
    }
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Reset password using the token from the email link
// @route   PUT /api/auth/reset-password/:token
// @access  Public
// ─────────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { newPassword, confirmPassword } = req.body;
    const { token } = req.params;

    // ── Validate input ────────────────────────────────────────
    if (!newPassword || !confirmPassword) {
      return next(
        new AppError('Please provide new password and confirm password.', 400)
      );
    }

    if (newPassword !== confirmPassword) {
      return next(
        new AppError('Passwords do not match.', 400)
      );
    }

    if (newPassword.length < 6) {
      return next(
        new AppError('Password must be at least 6 characters.', 400)
      );
    }

    // ── Hash the token from the URL ───────────────────────────
    // The token in the URL is unhashed
    // The token in the database is hashed
    // We hash the URL token to compare with the DB token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // ── Find user with valid reset token ──────────────────────
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return next(
        new AppError(
          'Password reset token is invalid or has expired. Please request a new reset link.',
          400
        )
      );
    }

    // ── Set new password ──────────────────────────────────────
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // ── Log the password reset ────────────────────────────────
    await AuditLog.logAction({
      user: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE',
      resource: 'User',
      resourceId: user._id.toString(),
      description: `${user.name} reset their password using email reset link`,
      ipAddress: req.ip,
      success: true,
    });

    // ── Log user in with new password ─────────────────────────
    const jwtToken = generateToken(res, user._id.toString(), user.role);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You are now logged in.',
      token: jwtToken,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update own profile (name, phone, avatar)
// @route   PUT /api/auth/update-profile
// @access  Private
// ─────────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { name, phone, avatar } = req.body;

    // Prevent users from updating sensitive fields
    // through this endpoint
    const forbiddenFields = ['password', 'role', 'email', 'isActive'];
    const hasForbiddenField = forbiddenFields.some(
      (field) => field in req.body
    );

    if (hasForbiddenField) {
      return next(
        new AppError(
          'You cannot update password, role, email, or active status through this endpoint.',
          400
        )
      );
    }

    // Build update object with only allowed fields
    const updateData: { name?: string; phone?: string; avatar?: string } = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (avatar) updateData.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return next(new AppError('User not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
      },
    });
  }
);
