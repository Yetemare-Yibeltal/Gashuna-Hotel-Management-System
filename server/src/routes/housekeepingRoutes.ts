import { Router } from 'express';
import {
  getHousekeepingTasks,
  getPendingTasks,
  getHousekeepingTaskById,
  createHousekeepingTask,
  assignHousekeepingTask,
  startHousekeepingTask,
  completeHousekeepingTask,
  inspectHousekeepingTask,
  updateChecklistItem,
} from '../controllers/housekeepingController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  getHousekeepingTasks
);

router.get(
  '/pending',
  authorize('admin', 'manager', 'receptionist'),
  getPendingTasks
);

router.get(
  '/:id',
  authorize('admin', 'manager', 'receptionist'),
  getHousekeepingTaskById
);

router.post(
  '/',
  authorize('admin', 'manager'),
  createHousekeepingTask
);

router.patch(
  '/:id/assign',
  authorize('admin', 'manager'),
  assignHousekeepingTask
);

router.patch(
  '/:id/start',
  authorize('admin', 'manager', 'receptionist'),
  startHousekeepingTask
);

router.patch(
  '/:id/complete',
  authorize('admin', 'manager', 'receptionist'),
  completeHousekeepingTask
);

router.patch(
  '/:id/inspect',
  authorize('admin', 'manager'),
  inspectHousekeepingTask
);

router.patch(
  '/:id/checklist',
  authorize('admin', 'manager', 'receptionist'),
  updateChecklistItem
);

export default router;
