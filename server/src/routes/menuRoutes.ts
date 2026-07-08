// server/src/routes/menuRoutes.ts
// ─────────────────────────────────────────────────────────────
// MENU ROUTES — Gashuna Hotel Management System
//
// All routes prefixed with /api/menu (mounted in app.ts)
//
// Public routes (no auth required):
//   GET /api/menu                       → all menu items with filters
//   GET /api/menu/:id                   → single menu item
//
// Private routes (Admin, Manager):
//   GET    /api/menu/stats              → menu statistics
//   POST   /api/menu                    → create menu item
//   PUT    /api/menu/:id                → update menu item
//   PATCH  /api/menu/:id/availability   → toggle availability
//   PATCH  /api/menu/:id/popular        → toggle popular flag
//
// Private routes (Admin only):
//   DELETE /api/menu/:id                → delete menu item
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  getMenuItems,
  getMenuStats,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  togglePopular,
  deleteMenuItem,
} from '../controllers/menuController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// ── Public Routes ─────────────────────────────────────────────
router.get('/', getMenuItems);
router.get('/:id', getMenuItemById);

// ── Admin + Manager Routes ────────────────────────────────────
router.get(
  '/stats',
  protect,
  authorize('admin', 'manager'),
  getMenuStats
);

router.post(
  '/',
  protect,
  authorize('admin', 'manager'),
  createMenuItem
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'manager'),
  updateMenuItem
);

router.patch(
  '/:id/availability',
  protect,
  authorize('admin', 'manager'),
  toggleAvailability
);

router.patch(
  '/:id/popular',
  protect,
  authorize('admin', 'manager'),
  togglePopular
);

// ── Admin Only Routes ─────────────────────────────────────────
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteMenuItem
);

export default router;
