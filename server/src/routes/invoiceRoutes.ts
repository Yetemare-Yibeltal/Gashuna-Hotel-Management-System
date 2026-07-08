// server/src/routes/invoiceRoutes.ts
// ─────────────────────────────────────────────────────────────
// INVOICE ROUTES — Gashuna Hotel Management System
//
// All routes prefixed with /api/invoices (mounted in app.ts)
//
// Private routes (Admin, Manager, Receptionist):
//   GET    /api/invoices                        → all invoices
//   GET    /api/invoices/booking/:bookingId     → invoice by booking
//   GET    /api/invoices/:id                    → single invoice
//   POST   /api/invoices                        → create invoice
//   POST   /api/invoices/:id/items              → add line item
//   POST   /api/invoices/:id/email              → email invoice
//   PATCH  /api/invoices/:id/issue              → issue invoice
//   PATCH  /api/invoices/:id/pay                → mark as paid
//   DELETE /api/invoices/:id/items/:itemIndex   → remove line item
//
// Private routes (Admin, Manager only):
//   GET    /api/invoices/stats                  → invoice statistics
//   PATCH  /api/invoices/:id/cancel             → cancel invoice
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  getInvoices,
  getInvoiceStats,
  getInvoiceById,
  getInvoiceByBooking,
  createInvoice,
  addInvoiceItem,
  removeInvoiceItem,
  issueInvoice,
  markInvoicePaid,
  cancelInvoice,
  emailInvoice,
} from '../controllers/invoiceController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// ── All routes require authentication ─────────────────────────
router.use(protect);

// ── Admin + Manager Routes ────────────────────────────────────
router.get(
  '/stats',
  authorize('admin', 'manager'),
  getInvoiceStats
);

router.patch(
  '/:id/cancel',
  authorize('admin', 'manager'),
  cancelInvoice
);

// ── Admin + Manager + Receptionist Routes ─────────────────────
router.get(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  getInvoices
);

router.get(
  '/booking/:bookingId',
  authorize('admin', 'manager', 'receptionist'),
  getInvoiceByBooking
);

router.get(
  '/:id',
  authorize('admin', 'manager', 'receptionist'),
  getInvoiceById
);

router.post(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  createInvoice
);

router.post(
  '/:id/items',
  authorize('admin', 'manager', 'receptionist'),
  addInvoiceItem
);

router.delete(
  '/:id/items/:itemIndex',
  authorize('admin', 'manager'),
  removeInvoiceItem
);

router.patch(
  '/:id/issue',
  authorize('admin', 'manager', 'receptionist'),
  issueInvoice
);

router.patch(
  '/:id/pay',
  authorize('admin', 'manager', 'receptionist'),
  markInvoicePaid
);

router.post(
  '/:id/email',
  authorize('admin', 'manager', 'receptionist'),
  emailInvoice
);

export default router;
