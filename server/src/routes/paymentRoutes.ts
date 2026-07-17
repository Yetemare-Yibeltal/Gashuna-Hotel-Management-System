import { Router } from 'express';
import {
  getPayments,
  getPaymentStats,
  getPaymentById,
  createManualPayment,
  refundPayment,
} from '../controllers/paymentController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get(
  '/',
  authorize('admin', 'manager'),
  getPayments
);

router.get(
  '/stats',
  authorize('admin', 'manager'),
  getPaymentStats
);

router.get(
  '/:id',
  authorize('admin', 'manager', 'receptionist'),
  getPaymentById
);

router.post(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  createManualPayment
);

router.patch(
  '/:id/refund',
  authorize('admin'),
  refundPayment
);

export default router;
