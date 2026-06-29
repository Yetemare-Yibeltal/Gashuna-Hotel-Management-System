// server/src/middleware/authMiddleware.ts
// ─────────────────────────────────────────────────────────────
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// Gashuna Hotel Management System
//
// Two middleware functions:
//
// 1. protect — verifies JWT token and attaches user to request
//    Used on any route that requires login
//    Example: router.get('/bookings', protect, getBookings)
//
// 2. authorize — checks if user has required role
//    Used on routes restricted to specific roles
//    Example: router.delete('/rooms/:id', protect, authorize('admin'), deleteRoom)
//
// User roles in Gashuna Hotel system:
//   admin        — full access to everything
//   manager      — access to most things except system settings
//   receptionist — access to bookings, check-in/out, guests
//
// How it works:
//   1. Client sends request with cookie containing JWT token
//   2. protect middleware reads the cookie
//   3. Verifies the token with JWT_SECRET
//   4. Finds the user in the database
//   5. Attaches user to req.user
//   6. authorize checks req.user.role against allowed roles
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import User from '../models/User';

// ── Extended Request Interface ────────────────────────────────
// Extends Express Request to include the authenticated user
// This allows controllers to access req.user after protect runs
export interface AuthRequest extends Request {
  user?: {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'receptionist';
    isActive: boolean;
  };
}

// ── JWT Payload Interface ─────────────────────────────────────
interface JWTPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

// ── Protect Middleware ────────────────────────────────────────
// Verifies the JWT token and attaches the user to the request
// Must be used before authorize on any protected route
export const protect = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // ── Step 1: Get Token ─────────────────────────────────────
    // First check the httpOnly cookie (preferred — more secure)
    if (req.cookies && req.cookies.gashuna_token) {
      token = req.cookies.gashuna_token;
    }
    // Fallback: check Authorization header for API clients
    // Format: Authorization: Bearer <token>
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token found in cookie or header, deny access
    if (!token) {
      return next(
        new AppError(
          'You are not logged in. Please log in to access this resource.',
          401
        )
      );
    }

    // ── Step 2: Verify Token ──────────────────────────────────
    // jwt.verify throws an error if:
    // - Token has been tampered with (JsonWebTokenError)
    // - Token has expired (TokenExpiredError)
    // These errors are caught by the global error handler
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(new AppError('JWT secret is not configured.', 500));
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // ── Step 3: Check User Still Exists ──────────────────────
    // The user might have been deleted after the token was issued
    const currentUser = await User.findById(decoded.id).select(
      '-password'
    );

    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token no longer exists.',
          401
        )
      );
    }

    // ── Step 4: Check User is Still Active ───────────────────
    // Admin might have deactivated the account after login
    if (!currentUser.isActive) {
      return next(
        new AppError(
          'Your account has been deactivated. Please contact the administrator.',
          401
        )
      );
    }

    // ── Step 5: Attach User to Request ───────────────────────
    // All subsequent middleware and controllers can access
    // the authenticated user via req.user
    req.user = {
      _id: currentUser._id.toString(),
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role as 'admin' | 'manager' | 'receptionist',
      isActive: currentUser.isActive,
    };

    // Move to the next middleware or controller
    next();
  }
);

// ── Authorize Middleware ──────────────────────────────────────
// Checks if the authenticated user has one of the allowed roles
// Must be used AFTER protect middleware
//
// Usage:
//   router.delete('/rooms/:id', protect, authorize('admin'), deleteRoom)
//   router.post('/staff', protect, authorize('admin', 'manager'), createStaff)
//   router.get('/bookings', protect, authorize('admin', 'manager', 'receptionist'), getBookings)
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Check if protect middleware ran and attached the user
    if (!req.user) {
      next(
        new AppError(
          'Authentication required. Please log in first.',
          401
        )
      );
      return;
    }

    // Check if the user role is in the list of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          `Access denied. Your role '${req.user.role}' is not authorized to perform this action. Required roles: ${allowedRoles.join(', ')}.`,
          403
        )
      );
      return;
    }

    // User has the required role — allow access
    next();
  };
};

// ── Role Constants ────────────────────────────────────────────
// Predefined role combinations used across route files
// Import these in route files for cleaner code
//
// Usage in routes:
//   import { ROLES } from '../middleware/authMiddleware';
//   router.get('/', protect, authorize(...ROLES.ALL), getAll);
//   router.delete('/:id', protect, authorize(...ROLES.ADMIN_ONLY), deleteOne);
export const ROLES = {
  // Only the admin can access
  ADMIN_ONLY: ['admin'] as const,

  // Admin and manager can access
  ADMIN_MANAGER: ['admin', 'manager'] as const,

  // All logged in staff can access
  ALL: ['admin', 'manager', 'receptionist'] as const,
};
