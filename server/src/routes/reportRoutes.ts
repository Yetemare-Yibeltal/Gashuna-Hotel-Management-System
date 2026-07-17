import { Router } from 'express';
import {
  getReports,
  getReportById,
  generateRevenueReport,
  generateOccupancyReport,
  generateGuestReport,
  generatePayrollReport,
  generateInventoryReport,
  deleteReport,
} from '../controllers/reportController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get(
  '/',
  authorize('admin', 'manager'),
  getReports
);

router.get(
  '/:id',
  authorize('admin', 'manager'),
  getReportById
);

router.post(
  '/generate/revenue',
  authorize('admin', 'manager'),
  generateRevenueReport
);

router.post(
  '/generate/occupancy',
  authorize('admin', 'manager'),
  generateOccupancyReport
);

router.post(
  '/generate/guests',
  authorize('admin', 'manager'),
  generateGuestReport
);

router.post(
  '/generate/payroll',
  authorize('admin'),
  generatePayrollReport
);

router.post(
  '/generate/inventory',
  authorize('admin', 'manager'),
  generateInventoryReport
);

router.delete(
  '/:id',
  authorize('admin'),
  deleteReport
);

export default router;
