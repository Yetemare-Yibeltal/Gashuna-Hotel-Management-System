// server/src/routes/checkInRoutes.ts
// ─────────────────────────────────────────────────────────────
// CHECK-IN ROUTES — Gashuna Hotel Management System
//
// All routes prefixed with /api/checkins (mounted in app.ts)
//
// Private routes (Admin, Manager, Receptionist):
//   GET   /api/checkins                        → all check-in records
//   GET   /api/checkins/active                 → currently checked-in guests
//   GET   /api/checkins/:id                    → single check-in record
//   GET   /api/checkins/booking/:bookingId     → get by booking ID
//   POST  /api/checkins                        → check in a guest
//   PATCH /api/checkins/:id/checkout           → check out a guest
//   PATCH /api/checkins/:id/deposit            → update deposit details
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  getCheckIns,
  getActiveCheckIns,
  getCheckInById,
  getCheckInByBooking,
  checkInGuest,
  checkOutGuest,
  updateDeposit,
} from '../controllers/checkInController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// ── All routes require authentication ─────────────────────────
router.use(protect);

// ── Admin + Manager + Receptionist Routes ─────────────────────
router.get(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  getCheckIns
);

router.get(
  '/active',
  authorize('admin', 'manager', 'receptionist'),
  getActiveCheckIns
);

router.get(
  '/booking/:bookingId',
  authorize('admin', 'manager', 'receptionist'),
  getCheckInByBooking
);

router.get(
  '/:id',
  authorize('admin', 'manager', 'receptionist'),
  getCheckInById
);

router.post(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  checkInGuest
);

router.patch(
  '/:id/checkout',
  authorize('admin', 'manager', 'receptionist'),
  checkOutGuest
);

router.patch(
  '/:id/deposit',
  authorize('admin', 'manager', 'receptionist'),
  updateDeposit
);

export default router;
