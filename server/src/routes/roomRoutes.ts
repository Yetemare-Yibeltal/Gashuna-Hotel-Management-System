// server/src/routes/roomRoutes.ts
// ─────────────────────────────────────────────────────────────
// ROOM ROUTES — Gashuna Hotel Management System
//
// All routes prefixed with /api/rooms (set in app.ts)
//
// Public routes:
//   GET /api/rooms                  → all rooms with filters
//   GET /api/rooms/available        → available rooms for dates
//   GET /api/rooms/:id              → single room detail
//
// Private routes (Admin, Manager):
//   POST   /api/rooms               → create room
//   PUT    /api/rooms/:id           → update room
//   DELETE /api/rooms/:id           → delete room
//
// Private routes (Admin, Manager, Receptionist):
//   PATCH  /api/rooms/:id/status    → update status only
//   GET    /api/rooms/stats         → room statistics
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  getRooms,
  getRoomById,
  getAvailableRooms,
  getRoomStats,
  createRoom,
  updateRoom,
  updateRoomStatus,
  deleteRoom,
} from '../controllers/roomController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// ── Public Routes ─────────────────────────────────────────────
router.get('/', getRooms);
router.get('/available', getAvailableRooms);
router.get('/stats', protect, authorize('admin', 'manager'), getRoomStats);
router.get('/:id', getRoomById);

// ── Admin + Manager Routes ────────────────────────────────────
router.post(
  '/',
  protect,
  authorize('admin', 'manager'),
  createRoom
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'manager'),
  updateRoom
);

// ── Admin + Manager + Receptionist Routes ─────────────────────
router.patch(
  '/:id/status',
  protect,
  authorize('admin', 'manager', 'receptionist'),
  updateRoomStatus
);

// ── Admin Only Routes ─────────────────────────────────────────
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteRoom
);

export default router;
