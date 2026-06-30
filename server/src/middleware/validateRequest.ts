// server/src/middleware/validateRequest.ts
// ─────────────────────────────────────────────────────────────
// REQUEST VALIDATION MIDDLEWARE — Gashuna Hotel Management System
//
// Validates incoming request data against Zod schemas before
// it reaches the controller. Catches bad data early with
// clear, helpful error messages.
//
// Usage in route files:
//   import { validateRequest } from '../middleware/validateRequest';
//   import { createBookingSchema } from '../schemas/bookingSchema';
//
//   router.post(
//     '/bookings',
//     validateRequest(createBookingSchema),
//     createBooking
//   );
//
// If validation fails, the request stops here and returns:
//   400 { success: false, message: "Validation failed", errors: [...] }
//
// If validation passes, req.body is replaced with the
// parsed and type-safe data, then next() is called
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import AppError from '../utils/AppError';

// ── Validation Error Detail Interface ─────────────────────────
interface ValidationErrorDetail {
  field: string;
  message: string;
}

// ── Format Zod Errors ─────────────────────────────────────────
// Converts Zod's error format into a clean, readable array
// Example output:
// [
//   { field: 'email', message: 'Invalid email address' },
//   { field: 'phone', message: 'Phone number is required' }
// ]
const formatZodErrors = (error: ZodError): ValidationErrorDetail[] => {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
};

// ── Validate Request Body ─────────────────────────────────────
// Validates req.body against the provided Zod schema
// This is the most commonly used validator — for POST/PUT/PATCH
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and validate the request body
      // If valid, this returns the parsed data with correct types
      const validatedData = schema.parse(req.body);

      // Replace req.body with the validated, type-safe data
      // This ensures controllers only work with clean data
      req.body = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error);

        // Build a readable summary message from all errors
        const message = errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(', ');

        res.status(400).json({
          success: false,
          message: `Validation failed: ${message}`,
          errors,
        });
        return;
      }

      // If it's not a Zod error, pass it to the global error handler
      next(error);
    }
  };
};

// ── Validate Query Parameters ─────────────────────────────────
// Validates req.query against the provided Zod schema
// Used for GET requests with filters
// Example: GET /api/rooms?type=deluxe&status=available
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedQuery = schema.parse(req.query);

      // Replace req.query with validated data
      // Cast to allow reassignment (Express query is read-only by type)
      (req as Request & { query: typeof validatedQuery }).query =
        validatedQuery;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error);
        const message = errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(', ');

        res.status(400).json({
          success: false,
          message: `Invalid query parameters: ${message}`,
          errors,
        });
        return;
      }

      next(error);
    }
  };
};

// ── Validate Route Parameters ─────────────────────────────────
// Validates req.params against the provided Zod schema
// Used to validate things like MongoDB ObjectId format in URLs
// Example: GET /api/rooms/:id
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error);
        const message = errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(', ');

        res.status(400).json({
          success: false,
          message: `Invalid URL parameters: ${message}`,
          errors,
        });
        return;
      }

      next(error);
    }
  };
};

// ── MongoDB ObjectId Validator ────────────────────────────────
// Simple middleware to check if :id param is a valid MongoDB ObjectId
// Used on routes like GET /api/rooms/:id before hitting the database
// This prevents MongoDB CastError from ever happening
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];

    // MongoDB ObjectId is exactly 24 hexadecimal characters
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    if (!isValidObjectId) {
      next(
        new AppError(
          `Invalid ID format: '${id}'. Please provide a valid ID.`,
          400
        )
      );
      return;
    }

    next();
  };
};
