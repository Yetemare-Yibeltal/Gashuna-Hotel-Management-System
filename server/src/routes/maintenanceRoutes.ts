import { Router } from 'express';
import {
  getMaintenanceRequests,
  getMaintenanceStats,
  getMaintenanceRequestById,
  createMaintenanceRequest,
  assignMaintenanceRequest,
  startMaintenanceRequest,
  resolveMaintenanceRequest,
  closeMaintenanceRequest,
  cancelMaintenanceRequest,
} from '../controllers/maintenanceController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  getMaintenanceRequests
);

router.get(
  '/stats',
  authorize('admin', 'manager'),
  getMaintenanceStats
);

router.get(
  '/:id',
  authorize('admin', 'manager', 'receptionist'),
  getMaintenanceRequestById
);

router.post(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  createMaintenanceRequest
);

router.patch(
  '/:id/assign',
  authorize('admin', 'manager'),
  assignMaintenanceRequest
);

router.patch(
  '/:id/start',
  authorize('admin', 'manager', 'receptionist'),
  startMaintenanceRequest
);

router.patch(
  '/:id/resolve',
  authorize('admin', 'manager'),
  resolveMaintenanceRequest
);

router.patch(
  '/:id/close',
  authorize('admin', 'manager'),
  closeMaintenanceRequest
);

router.patch(
  '/:id/cancel',
  authorize('admin', 'manager'),
  cancelMaintenanceRequest
);

export default router;
