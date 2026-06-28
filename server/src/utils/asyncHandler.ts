// server/src/utils/asyncHandler.ts
// ─────────────────────────────────────────────────────────────
// ASYNC HANDLER WRAPPER — Gashuna Hotel Management System
//
// Wraps async Express controller functions to automatically
// catch any errors and pass them to the global error handler.
//
// WITHOUT asyncHandler — every controller needs try/catch:
//   export const getRoom = async (req, res, next) => {
//     try {
//       const room = await Room.findById(req.params.id);
//       res.json(room);
//     } catch (error) {
//       next(error); // must remember to call next(error)
//     }
//   };
//
// WITH asyncHandler — clean and no try/catch needed:
//   export const getRoom = asyncHandler(async (req, res) => {
//     const room = await Room.findById(req.params.id);
//     res.json(room); // errors are caught automatically
//   });
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';

// ── Type Definition ───────────────────────────────────────────
// Defines what an async Express handler function looks like
type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

// ── asyncHandler Function ─────────────────────────────────────
// Takes an async function and returns a new function that
// automatically catches any errors and passes them to next()
// which triggers the global error handler in errorMiddleware.ts
const asyncHandler = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Execute the async function and catch any errors
    // If fn throws or rejects, the error goes to next()
    // which passes it to the global error handler
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
