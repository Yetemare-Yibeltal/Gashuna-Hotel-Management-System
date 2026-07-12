// server/src/routes/payrollRoutes.ts
// ─────────────────────────────────────────────────────────────
// PAYROLL ROUTES — Gashuna Hotel Management System
//
// All routes prefixed with /api/payroll (mounted in app.ts)
//
// Private routes (Admin, Manager):
//   GET  /api/payroll                    → all payroll records
//   GET  /api/payroll/stats              → payroll statistics
//   GET  /api/payroll/staff/:staffId     → staff payroll history
//   GET  /api/payroll/:id                → single payroll record
//   POST /api/payroll                    → create single payroll
//
// Private routes (Admin only):
//   POST   /api/payroll/generate         → generate monthly payroll
//   PUT    /api/payroll/:id              → update payroll record
//   PATCH  /api/payroll/:id/approve      → approve payroll
//   PATCH  /api/payroll/:id/pay          → mark payroll as paid
//   DELETE /api/payroll/:id              → delete draft payroll
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  getPayrollRecords,
  getPayrollStats,
  getStaffPayroll,
  getPayrollById,
  generateMonthlyPayroll,
  createPayroll,
  updatePayroll,
  approvePayroll,
  markPayrollPaid,
  deletePayroll,
} from '../controllers/payrollController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// ── All routes require authentication ─────────────────────────
router.use(protect);

// ── Admin Only Routes ─────────────────────────────────────────
router.post(
  '/generate',
  authorize('admin'),
  generateMonthlyPayroll
);

router.put(
  '/:id',
  authorize('admin'),
  updatePayroll
);

router.patch(
  '/:id/approve',
  authorize('admin'),
  approvePayroll
);

router.patch(
  '/:id/pay',
  authorize('admin'),
  markPayrollPaid
);

router.delete(
  '/:id',
  authorize('admin'),
  deletePayroll
);

// ── Admin + Manager Routes ────────────────────────────────────
router.get(
  '/',
  authorize('admin', 'manager'),
  getPayrollRecords
);

router.get(
  '/stats',
  authorize('admin', 'manager'),
  getPayrollStats
);

router.get(
  '/staff/:staffId',
  authorize('admin', 'manager'),
  getStaffPayroll
);

router.get(
  '/:id',
  authorize('admin', 'manager'),
  getPayrollById
);

router.post(
  '/',
  authorize('admin', 'manager'),
  createPayroll
);

export default router;
