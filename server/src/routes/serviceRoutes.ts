import { Router } from 'express';
import {
  getServices,
  getServiceStats,
  getServiceById,
  createService,
  updateService,
  toggleServiceAvailability,
  deleteService,
} from '../controllers/serviceController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getServices);
router.get('/:id', getServiceById);

router.get(
  '/stats',
  protect,
  authorize('admin', 'manager'),
  getServiceStats
);

router.post(
  '/',
  protect,
  authorize('admin', 'manager'),
  createService
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'manager'),
  updateService
);

router.patch(
  '/:id/availability',
  protect,
  authorize('admin', 'manager'),
  toggleServiceAvailability
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteService
);

export default router;
