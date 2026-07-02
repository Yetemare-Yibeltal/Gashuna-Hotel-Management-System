// server/src/routes/guestRoutes.ts
// ─────────────────────────────────────────────────────────────
// GUEST ROUTES — Gashuna Hotel Management System
//
// All routes prefixed with /api/guests (mounted in app.ts)
//
// Private routes (Admin, Manager, Receptionist):
//   GET    /api/guests                  → all guests with search
//   GET    /api/guests/stats            → guest statistics
//   GET    /api/guests/:id              → single guest + history
//   GET    /api/guests/:id/bookings     → guest booking history
//   POST   /api/guests                  → create new guest
//   PUT    /api/guests/:id              → update guest details
//   PATCH  /api/guests/:id/loyalty      → add loyalty points
//
// Private routes (Admin, Manager only):
//   PATCH  /api/guests/:id/vip          → toggle VIP status
//
// Private routes (Admin only):
//   DELETE /api/guests/:id              → delete guest record
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  getGuests,
  getGuestById,
  getGuestBookings,
  getGuestStats,
  createGuest,
  updateGuest,
  addLoyaltyPoints,
  toggleVIPStatus,
  deleteGuest,
} from '../controllers/guestController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// ── All routes require authentication ─────────────────────────
router.use(protect);

// ── Admin + Manager + Receptionist Routes ─────────────────────
router.get(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  getGuests
);

router.get(
  '/stats',
  authorize('admin', 'manager'),
  getGuestStats
);

router.get(
  '/:id',
  authorize('admin', 'manager', 'receptionist'),
  getGuestById
);

router.get(
  '/:id/bookings',
  authorize('admin', 'manager', 'receptionist'),
  getGuestBookings
);

router.post(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  createGuest
);

router.put(
  '/:id',
  authorize('admin', 'manager', 'receptionist'),
  updateGuest
);

router.patch(
  '/:id/loyalty',
  authorize('admin', 'manager', 'receptionist'),
  addLoyaltyPoints
);

// ── Admin + Manager Routes ────────────────────────────────────
router.patch(
  '/:id/vip',
  authorize('admin', 'manager'),
  toggleVIPStatus
);

// ── Admin Only Routes ─────────────────────────────────────────
router.delete(
  '/:id',
  authorize('admin'),
  deleteGuest
);

export default router;
