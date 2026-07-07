import { Router } from 'express';
import {
  initializePayment,
  verifyPayment,
  chapaWebhook,
  getChapaPayments,
  requestRefund,
} from '../controllers/chapaController';
import { protect, authorize } from '../middleware/authMiddleware';
import { bookingLimiter } from '../middleware/rateLimiter';

const router = Router();

// ── Public Routes ─────────────────────────────────────────────
// Apply booking rate limiter to prevent payment spam
router.post('/initialize', bookingLimiter, initializePayment);

// Verify payment — called when guest returns from Chapa
router.get('/verify/:tx_ref', verifyPayment);

// Webhook — called by Chapa servers automatically
// Must be raw body for signature verification
router.post('/webhook', chapaWebhook);

// ── Private Routes (Admin, Manager) ──────────────────────────
router.get(
  '/payments',
  protect,
  authorize('admin', 'manager'),
  getChapaPayments
);

// ── Private Routes (Admin only) ───────────────────────────────
router.post(
  '/refund/:id',
  protect,
  authorize('admin'),
  requestRefund
);

export default router;
