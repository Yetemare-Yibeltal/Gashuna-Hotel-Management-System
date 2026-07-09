// server/src/routes/staffRoutes.ts
// ─────────────────────────────────────────────────────────────
// STAFF ROUTES — Gashuna Hotel Management System
//
// All routes prefixed with /api/staff (mounted in app.ts)
//
// Private routes (Admin, Manager):
//   GET    /api/staff                  → all staff with filters
//   GET    /api/staff/stats            → staff statistics
//   GET    /api/staff/:id              → single staff profile
//   POST   /api/staff                  → create new staff record
//   PUT    /api/staff/:id              → update staff details
//   PATCH  /api/staff/:id/status       → change staff status
//
// Private routes (Admin only):
//   PATCH  /api/staff/:id/salary       → update salary in ETB
//   DELETE /api/staff/:id              → delete staff record
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  getAllStaff,
  getStaffStats,
  getStaffById,
  createStaff,
  updateStaff,
  updateStaffStatus,
  updateStaffSalary,
  deleteStaff,
} from '../controllers/staffController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// ── All routes require authentication ─────────────────────────
router.use(protect);

// ── Admin + Manager Routes ────────────────────────────────────
router.get(
  '/',
  authorize('admin', 'manager'),
  getAllStaff
);

router.get(
  '/stats',
  authorize('admin', 'manager'),
  getStaffStats
);

router.get(
  '/:id',
  authorize('admin', 'manager'),
  getStaffById
);

router.post(
  '/',
  authorize('admin', 'manager'),
  createStaff
);

router.put(
  '/:id',
  authorize('admin', 'manager'),
  updateStaff
);

router.patch(
  '/:id/status',
  authorize('admin', 'manager'),
  updateStaffStatus
);

// ── Admin Only Routes ─────────────────────────────────────────
router.patch(
  '/:id/salary',
  authorize('admin'),
  updateStaffSalary
);

router.delete(
  '/:id',
  authorize('admin'),
  deleteStaff
);

export default router;
