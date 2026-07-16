import { Router } from 'express';
import {
  getFoodOrders,
  getActiveOrders,
  getFoodOrderStats,
  getFoodOrderById,
  createFoodOrder,
  updateOrderStatus,
  markOrderPaid,
} from '../controllers/foodOrderController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  getFoodOrders
);

router.get(
  '/active',
  authorize('admin', 'manager', 'receptionist'),
  getActiveOrders
);

router.get(
  '/stats',
  authorize('admin', 'manager'),
  getFoodOrderStats
);

router.get(
  '/:id',
  authorize('admin', 'manager', 'receptionist'),
  getFoodOrderById
);

router.post(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  createFoodOrder
);

router.patch(
  '/:id/status',
  authorize('admin', 'manager', 'receptionist'),
  updateOrderStatus
);

router.patch(
  '/:id/pay',
  authorize('admin', 'manager', 'receptionist'),
  markOrderPaid
);

export default router;
