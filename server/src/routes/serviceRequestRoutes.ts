import { Router } from 'express';
import {
  getServiceRequests,
  getServiceRequestStats,
  getServiceRequestById,
  createServiceRequest,
  confirmServiceRequest,
  assignServiceRequest,
  startServiceRequest,
  completeServiceRequest,
  cancelServiceRequest,
} from '../controllers/serviceRequestController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  getServiceRequests
);

router.get(
  '/stats',
  authorize('admin', 'manager'),
  getServiceRequestStats
);

router.get(
  '/:id',
  authorize('admin', 'manager', 'receptionist'),
  getServiceRequestById
);

router.post(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  createServiceRequest
);

router.patch(
  '/:id/confirm',
  authorize('admin', 'manager'),
  confirmServiceRequest
);

router.patch(
  '/:id/assign',
  authorize('admin', 'manager'),
  assignServiceRequest
);

router.patch(
  '/:id/start',
  authorize('admin', 'manager', 'receptionist'),
  startServiceRequest
);

router.patch(
  '/:id/complete',
  authorize('admin', 'manager', 'receptionist'),
  completeServiceRequest
);

router.patch(
  '/:id/cancel',
  authorize('admin', 'manager', 'receptionist'),
  cancelServiceRequest
);

export default router;
