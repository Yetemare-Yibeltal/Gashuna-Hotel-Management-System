// server/src/middleware/rateLimiter.ts
// ─────────────────────────────────────────────────────────────
// RATE LIMITING MIDDLEWARE — Gashuna Hotel Management System
//
// Protects the API from abuse by limiting how many requests
// a single IP address can make within a time window.
//
// Three different rate limiters for different purposes:
//
// 1. apiLimiter — general protection for all /api routes
//    100 requests per 15 minutes
//
// 2. authLimiter — strict protection for login endpoint
//    5 attempts per 15 minutes
//    Prevents brute-force password guessing attacks
//
// 3. bookingLimiter — protection for public booking creation
//    10 bookings per hour per IP
//    Prevents spam bookings from bots
//
// Usage in app.ts:
//   app.use('/api', apiLimiter);
//
// Usage in route files:
//   router.post('/login', authLimiter, loginUser);
//   router.post('/bookings', bookingLimiter, createBooking);
// ─────────────────────────────────────────────────────────────

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// ── Custom Rate Limit Handler ─────────────────────────────────
// Called when a client exceeds the rate limit
// Returns a clean, helpful JSON error message
const rateLimitHandler = (req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    message:
      'Too many requests from this IP address. Please try again later.',
  });
};

// ── General API Rate Limiter ──────────────────────────────────
// Applied to all /api routes as a general safety net
// Allows 100 requests per 15 minutes per IP address
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

// ── Authentication Rate Limiter ───────────────────────────────
// Stricter limit specifically for the login endpoint
// Only 5 login attempts allowed per 15 minutes per IP
// This is critical for preventing brute-force password attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: {
    success: false,
    message:
      'Too many login attempts. Please wait 15 minutes before trying again.',
  },
  // Skip counting successful logins toward the limit
  // Only failed login attempts count
  skipSuccessfulRequests: true,
});

// ── Booking Creation Rate Limiter ─────────────────────────────
// Limits how many bookings can be created from a single IP
// Prevents bots from spamming fake bookings
// 10 bookings per hour per IP is generous for real guests
// but blocks automated spam attempts
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: {
    success: false,
    message:
      'Too many booking attempts. Please contact the hotel directly if you need to make multiple bookings.',
  },
});

// ── Password Reset Rate Limiter ───────────────────────────────
// Limits password reset requests to prevent email spam abuse
// 3 reset requests per hour per IP
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: {
    success: false,
    message:
      'Too many password reset requests. Please try again in an hour.',
  },
});

// ── Contact Form Rate Limiter ─────────────────────────────────
// Limits contact form submissions to prevent spam
// 5 messages per hour per IP
export const contactFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: {
    success: false,
    message: 'Too many messages sent. Please try again later.',
  },
});
