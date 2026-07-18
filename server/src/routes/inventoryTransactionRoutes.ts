import { Router } from 'express';
import {
  getInventoryTransactions,
  getTransactionStats,
  getTransactionById,
  getItemTransactionHistory,
  createTransaction,
} from '../controllers/inventoryTransactionController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get(
  '/',
  authorize('admin', 'manager'),
  getInventoryTransactions
);

router.get(
  '/stats',
  authorize('admin', 'manager'),
  getTransactionStats
);

router.get(
  '/item/:itemId',
  authorize('admin', 'manager'),
  getItemTransactionHistory
);

router.get(
  '/:id',
  authorize('admin', 'manager'),
  getTransactionById
);

router.post(
  '/',
  authorize('admin', 'manager'),
  createTransaction
);

export default router;
