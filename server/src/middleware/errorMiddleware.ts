// server/src/middleware/errorMiddleware.ts
// ─────────────────────────────────────────────────────────────
// ERROR HANDLING MIDDLEWARE — Gashuna Hotel Management System
//
// Two middleware functions:
//
// 1. notFound — catches requests to undefined routes
//    Returns: 404 { success: false, message: 'Route not found' }
//
// 2. errorHandler — global error handler for all errors
//    Handles: AppError, MongoDB errors, JWT errors, and more
//    Returns: clean JSON error response with status code
//
// How errors flow through the application:
//
//   Controller throws error
//         ↓
//   asyncHandler catches it
//         ↓
//   next(error) is called
//         ↓
//   errorHandler middleware runs
//         ↓
//   Clean JSON response sent to client
//
// Error response format:
// {
//   success: false,
//   message: "Error message here",
//   stack: "..." (only in development)
// }
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';

// ── Error Response Interface ──────────────────────────────────
interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  stack?: string;
  errors?: unknown[];
}

// ── Not Found Middleware ──────────────────────────────────────
// Catches any request to a route that does not exist
// Must be placed AFTER all route definitions in app.ts
// Creates a 404 AppError and passes it to errorHandler
export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
};

// ── Handle MongoDB Cast Error ─────────────────────────────────
// Happens when an invalid MongoDB ObjectId is provided
// Example: /api/rooms/invalid-id instead of /api/rooms/507f1f77bcf86cd799439011
const handleCastErrorDB = (err: {
  path: string;
  value: string;
}): AppError => {
  const message = `Invalid ${err.path}: ${err.value}. Please provide a valid ID.`;
  return new AppError(message, 400);
};

// ── Handle MongoDB Duplicate Key Error ────────────────────────
// Happens when trying to insert a document with a duplicate
// unique field value
// Example: creating a user with an email that already exists
const handleDuplicateFieldsDB = (err: {
  keyValue: Record<string, string>;
}): AppError => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate value for field '${field}': '${value}'. Please use a different value.`;
  return new AppError(message, 400);
};

// ── Handle MongoDB Validation Error ──────────────────────────
// Happens when a Mongoose schema validation fails
// Example: required field is missing or value is wrong type
const handleValidationErrorDB = (err: {
  errors: Record<string, { message: string }>;
}): AppError => {
  // Collect all validation error messages into one string
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation failed: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// ── Handle JWT Invalid Token Error ───────────────────────────
// Happens when the JWT token has been tampered with
// or is not a valid token format
const handleJWTError = (): AppError => {
  return new AppError(
    'Invalid authentication token. Please log in again.',
    401
  );
};

// ── Handle JWT Expired Token Error ───────────────────────────
// Happens when the JWT token has expired (after 7 days)
// The user needs to log in again to get a new token
const handleJWTExpiredError = (): AppError => {
  return new AppError(
    'Your session has expired. Please log in again.',
    401
  );
};

// ── Send Error in Development ─────────────────────────────────
// In development we send full error details including stack trace
// This helps developers debug issues quickly
const sendErrorDev = (err: AppError, res: Response): void => {
  res.status(err.statusCode || 500).json({
    success: false,
    statusCode: err.statusCode,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

// ── Send Error in Production ──────────────────────────────────
// In production we only send safe error messages to the client
// We never expose stack traces or internal error details
const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational errors are expected errors we created with AppError
  // These are safe to send to the client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    } as ErrorResponse);
  } else {
    // Programming errors or unknown errors
    // Log the error for developers but send generic message to client
    console.error('❌ UNEXPECTED ERROR:', err);

    res.status(500).json({
      success: false,
      message:
        'Something went wrong on our end. Please try again later.',
    } as ErrorResponse);
  }
};

// ── Global Error Handler ──────────────────────────────────────
// This is the main error handler middleware
// It must have 4 parameters (err, req, res, next) for Express
// to recognize it as an error handling middleware
// Must be the LAST middleware registered in app.ts
export const errorHandler = (
  err: AppError & {
    name?: string;
    code?: number;
    keyValue?: Record<string, string>;
    errors?: Record<string, { message: string }>;
    path?: string;
    value?: string;
  },
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Set default values if not already set by AppError
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // In development send full error details
    sendErrorDev(err, res);
  } else {
    // In production handle specific error types
    let error = { ...err };
    error.message = err.message;

    // MongoDB invalid ObjectId
    if (err.name === 'CastError') {
      error = handleCastErrorDB(
        error as { path: string; value: string }
      ) as typeof error;
    }

    // MongoDB duplicate key
    if (err.code === 11000) {
      error = handleDuplicateFieldsDB(
        error as { keyValue: Record<string, string> }
      ) as typeof error;
    }

    // MongoDB validation error
    if (err.name === 'ValidationError') {
      error = handleValidationErrorDB(
        error as { errors: Record<string, { message: string }> }
      ) as typeof error;
    }

    // JWT invalid token
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError() as typeof error;
    }

    // JWT expired token
    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError() as typeof error;
    }

    sendErrorProd(error as AppError, res);
  }
};
