// server/src/utils/AppError.ts
// ─────────────────────────────────────────────────────────────
// CUSTOM ERROR CLASS — Gashuna Hotel Management System
//
// All errors thrown in controllers, services, and middleware
// use this class. It extends the built-in JavaScript Error
// class and adds an HTTP status code and operational flag.
//
// Usage examples:
//
//   // Room not found
//   throw new AppError('Room not found', 404);
//
//   // Not authorized
//   throw new AppError('You are not authorized to do this', 401);
//
//   // Bad request
//   throw new AppError('Check-out date must be after check-in date', 400);
//
//   // Duplicate booking
//   throw new AppError('This room is already booked for these dates', 409);
//
// The error handler in errorMiddleware.ts reads the statusCode
// and message from this class to build the JSON error response.
// ─────────────────────────────────────────────────────────────

class AppError extends Error {
  // HTTP status code — 400, 401, 403, 404, 409, 500 etc.
  public readonly statusCode: number;

  // HTTP status string — 'fail' for 4xx, 'error' for 5xx
  public readonly status: string;

  // isOperational = true means this is an expected error
  // that we created intentionally (like "Room not found")
  // isOperational = false means this is an unexpected bug
  // that we did not anticipate (like a database crash)
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    // Call the parent Error constructor with the message
    // This sets this.message and captures the stack trace
    super(message);

    this.statusCode = statusCode;

    // 4xx errors are 'fail', 5xx errors are 'error'
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // All errors we throw manually are operational
    // (expected errors we handle intentionally)
    this.isOperational = true;

    // Capture the stack trace for debugging
    // Excludes the AppError constructor itself from the trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
