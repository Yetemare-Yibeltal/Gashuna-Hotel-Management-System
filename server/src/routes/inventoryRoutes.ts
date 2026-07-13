// server/src/routes/inventoryRoutes.ts
// ─────────────────────────────────────────────────────────────
// INVENTORY ROUTES — Gashuna Hotel Management System
//
// All routes prefixed with /api/inventory (mounted in app.ts)
//
// Private routes (Admin, Manager):
//   GET    /api/inventory                  → all items with filters
//   GET    /api/inventory/low-stock        → low stock alerts
//   GET    /api/inventory/stats            → inventory statistics
//   GET    /api/inventory/:id              → single item detail
//   POST   /api/inventory                  → create new item
//   PUT    /api/inventory/:id              → update item details
//   PATCH  /api/inventory/:id/stock        → update stock quantity
//
// Private routes (Admin only):
//   DELETE /api/inventory/:id              → deactivate item
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  getInventoryItems,
  getLowStockAlerts,
  getInventoryStats,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  updateStock,
  deleteInventoryItem,
} from '../controllers/inventoryController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// ── All routes require authentication ─────────────────────────
router.use(protect);

// ── Admin + Manager Routes ────────────────────────────────────
router.get(
  '/',
  authorize('admin', 'manager'),
  getInventoryItems
);

router.get(
  '/low-stock',
  authorize('admin', 'manager'),
  getLowStockAlerts
);

router.get(
  '/stats',
  authorize('admin', 'manager'),
  getInventoryStats
);

router.get(
  '/:id',
  authorize('admin', 'manager'),
  getInventoryItemById
);

router.post(
  '/',
  authorize('admin', 'manager'),
  createInventoryItem
);

router.put(
  '/:id',
  authorize('admin', 'manager'),
  updateInventoryItem
);

router.patch(
  '/:id/stock',
  authorize('admin', 'manager'),
  updateStock
);

// ── Admin Only Routes ─────────────────────────────────────────
router.delete(
  '/:id',
  authorize('admin'),
  deleteInventoryItem
);

export default router;
