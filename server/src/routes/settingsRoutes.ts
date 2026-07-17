import { Router } from 'express';
import {
  getHotelSettings,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  toggleUserStatus,
} from '../controllers/settingsController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get(
  '/',
  authorize('admin', 'manager'),
  getHotelSettings
);

router.get(
  '/users',
  authorize('admin'),
  getAllUsers
);

router.get(
  '/users/:id',
  authorize('admin'),
  getUserById
);

router.post(
  '/users',
  authorize('admin'),
  createUser
);

router.put(
  '/users/:id',
  authorize('admin'),
  updateUser
);

router.patch(
  '/users/:id/reset-password',
  authorize('admin'),
  resetUserPassword
);

router.patch(
  '/users/:id/toggle-status',
  authorize('admin'),
  toggleUserStatus
);

router.delete(
  '/users/:id',
  authorize('admin'),
  deleteUser
);

export default router;
