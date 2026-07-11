// server/src/routes/attendanceRoutes.ts
// ─────────────────────────────────────────────────────────────
// ATTENDANCE ROUTES — Gashuna Hotel Management System
//
// All routes prefixed with /api/attendance (mounted in app.ts)
//
// Private routes (Admin, Manager, Receptionist):
//   GET   /api/attendance/today               → today's attendance
//   PATCH /api/attendance/:id/clockin         → clock in staff
//   PATCH /api/attendance/:id/clockout        → clock out staff
//
// Private routes (Admin, Manager):
//   GET   /api/attendance                     → all records
//   GET   /api/attendance/monthly             → monthly summary
//   GET   /api/attendance/staff/:staffId      → staff history
//   POST  /api/attendance                     → create record
//   PUT   /api/attendance/:id                 → update record
//   PATCH /api/attendance/:id/approve         → approve leave
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  getAttendance,
  getTodayAttendance,
  getStaffAttendance,
  getMonthlyAttendanceSummary,
  createAttendance,
  clockIn,
  clockOut,
  approveLeave,
  updateAttendance,
} from '../controllers/attendanceController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// ── All routes require authentication ─────────────────────────
router.use(protect);

// ── Admin + Manager + Receptionist Routes ─────────────────────
router.get(
  '/today',
  authorize('admin', 'manager', 'receptionist'),
  getTodayAttendance
);

router.patch(
  '/:id/clockin',
  authorize('admin', 'manager', 'receptionist'),
  clockIn
);

router.patch(
  '/:id/clockout',
  authorize('admin', 'manager', 'receptionist'),
  clockOut
);

// ── Admin + Manager Routes ────────────────────────────────────
router.get(
  '/',
  authorize('admin', 'manager'),
  getAttendance
);

router.get(
  '/monthly',
  authorize('admin', 'manager'),
  getMonthlyAttendanceSummary
);

router.get(
  '/staff/:staffId',
  authorize('admin', 'manager'),
  getStaffAttendance
);

router.post(
  '/',
  authorize('admin', 'manager'),
  createAttendance
);

router.put(
  '/:id',
  authorize('admin', 'manager'),
  updateAttendance
);

router.patch(
  '/:id/approve',
  authorize('admin', 'manager'),
  approveLeave
);

export default router;
