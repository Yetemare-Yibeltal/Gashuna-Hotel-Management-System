import { Router } from 'express';
import {
  getAuditLogs,
  getAuditLogStats,
  getAuditLogById,
  getUserAuditLogs,
  getResourceAuditLogs,
  clearOldAuditLogs,
} from '../controllers/auditLogController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get(
  '/',
  authorize('admin'),
  getAuditLogs
);

router.get(
  '/stats',
  authorize('admin'),
  getAuditLogStats
);

router.get(
  '/resource',
  authorize('admin'),
  getResourceAuditLogs
);

router.get(
  '/user/:userId',
  authorize('admin'),
  getUserAuditLogs
);

router.get(
  '/:id',
  authorize('admin'),
  getAuditLogById
);

router.delete(
  '/clear',
  authorize('admin'),
  clearOldAuditLogs
);

export default router;
