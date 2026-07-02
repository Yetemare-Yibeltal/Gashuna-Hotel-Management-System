// server/src/routes/roomTypeRoutes.ts
// ─────────────────────────────────────────────────────────────
// ROOM TYPE ROUTES — Gashuna Hotel Management System
//
// All routes prefixed with /api/room-types (mounted in app.ts)
//
// Public routes (no auth required):
//   GET /api/room-types             → all room types
//   GET /api/room-types/:slug       → single room type by slug
//
// Private routes (Admin only):
//   POST   /api/room-types          → create room type
//   PUT    /api/room-types/:id      → update room type
//   DELETE /api/room-types/:id      → deactivate room type
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  getRoomTypes,
  getRoomType,
  createRoomType,
  updateRoomType,
  deleteRoomType,
} from '../controllers/roomTypeController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// ── Public Routes ─────────────────────────────────────────────
router.get('/', getRoomTypes);
router.get('/:slug', getRoomType);

// ── Admin Only Routes ─────────────────────────────────────────
router.post(
  '/',
  protect,
  authorize('admin'),
  createRoomType
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  updateRoomType
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteRoomType
);

export default router;
