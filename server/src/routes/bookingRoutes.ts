// server/src/routes/bookingRoutes.ts
// ─────────────────────────────────────────────────────────────
// BOOKING ROUTES — Gashuna Hotel Management System
//
// All routes prefixed with /api/bookings (mounted in app.ts)
//
// Public routes:
//   POST /api/bookings                    → create new booking
//
// Private routes (Admin, Manager, Receptionist):
//   GET   /api/bookings                   → all bookings with filters
//   GET   /api/bookings/stats             → booking statistics
//   GET   /api/bookings/:id               → single booking detail
//   PATCH /api/bookings/:id/confirm       → confirm a booking
//   PATCH /api/bookings/:id/cancel        → cancel a booking
//   PATCH /api/bookings/:id/checkin       → check guest in
//   PATCH /api/bookings/:id/checkout      → check guest out
//   PATCH /api/bookings/:id/payment       → update payment status
//
// Private routes (Admin only):
//   DELETE /api/bookings/:id              → delete pending booking
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  getBookings,
  getBookingStats,
  getBookingById,
  createBooking,
  confirmBooking,
  cancelBooking,
  checkInGuest,
  checkOutGuest,
  updatePaymentStatus,
  deleteBooking,
} from '../controllers/bookingController';
import { protect, authorize } from '../middleware/authMiddleware';
import { bookingLimiter } from '../middleware/rateLimiter';

const router = Router();

// ── Public Routes ─────────────────────────────────────────────
// Apply booking rate limiter to prevent spam bookings
router.post('/', bookingLimiter, createBooking);

// ── Private Routes (Admin, Manager, Receptionist) ─────────────
router.get(
  '/',
  protect,
  authorize('admin', 'manager', 'receptionist'),
  getBookings
);

router.get(
  '/stats',
  protect,
  authorize('admin', 'manager'),
  getBookingStats
);

router.get(
  '/:id',
  protect,
  authorize('admin', 'manager', 'receptionist'),
  getBookingById
);

router.patch(
  '/:id/confirm',
  protect,
  authorize('admin', 'manager', 'receptionist'),
  confirmBooking
);

router.patch(
  '/:id/cancel',
  protect,
  authorize('admin', 'manager', 'receptionist'),
  cancelBooking
);

router.patch(
  '/:id/checkin',
  protect,
  authorize('admin', 'manager', 'receptionist'),
  checkInGuest
);

router.patch(
  '/:id/checkout',
  protect,
  authorize('admin', 'manager', 'receptionist'),
  checkOutGuest
);

router.patch(
  '/:id/payment',
  protect,
  authorize('admin', 'manager', 'receptionist'),
  updatePaymentStatus
);

// ── Admin Only Routes ─────────────────────────────────────────
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteBooking
);

export default router;
