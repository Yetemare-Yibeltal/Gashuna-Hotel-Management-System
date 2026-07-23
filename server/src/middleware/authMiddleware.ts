import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import User, { IUser } from '../models/User';
import { Types } from 'mongoose';

export interface AuthRequest extends Request {
  user?: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'receptionist';
    isActive: boolean;
  };
}

interface JwtPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export const ROLES = {
  ADMIN: 'admin' as const,
  MANAGER: 'manager' as const,
  RECEPTIONIST: 'receptionist' as const,
};

export const protect = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError(
          'You are not logged in. Please log in to access this resource.',
          401
        )
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(
        new AppError('JWT secret is not configured.', 500)
      );
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch {
      return next(
        new AppError(
          'Invalid or expired token. Please log in again.',
          401
        )
      );
    }

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token no longer exists.',
          401
        )
      );
    }

    if (!currentUser.isActive) {
      return next(
        new AppError(
          'Your account has been deactivated. Please contact the administrator.',
          401
        )
      );
    }

    req.user = {
      _id: currentUser._id as Types.ObjectId,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      isActive: currentUser.isActive,
    };

    next();
  }
);

export const authorize = (
  ...roles: ('admin' | 'manager' | 'receptionist')[]
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError('You are not logged in.', 401)
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
          403
        )
      );
    }

    next();
  };
};
