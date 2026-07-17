import { Router } from 'express';
import {
  getDashboardStats,
  getQuickStats,
} from '../controllers/dashboardController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  getDashboardStats
);

router.get(
  '/quick-stats',
  authorize('admin', 'manager', 'receptionist'),
  getQuickStats
);

export default router;
