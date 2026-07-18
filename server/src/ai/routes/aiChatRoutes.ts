import { Router } from 'express';
import {
  startChatSession,
  sendChatMessage,
  sendAdminChatMessage,
  getChatHistory,
  endChatSession,
  submitChatFeedback,
  getAllConversations,
  getAIChatStats,
} from '../controllers/aiChatController';
import { protect, authorize } from '../../middleware/authMiddleware';
import { aiChatLimiter } from '../middleware/aiRateLimiter';

const router = Router();

router.post('/session/start', aiChatLimiter, startChatSession);
router.post('/message', aiChatLimiter, sendChatMessage);
router.post('/feedback', submitChatFeedback);
router.get('/history/:sessionId', getChatHistory);
router.patch('/session/:sessionId/end', endChatSession);

router.post(
  '/admin/message',
  protect,
  authorize('admin', 'manager'),
  sendAdminChatMessage
);

router.get(
  '/admin/conversations',
  protect,
  authorize('admin', 'manager'),
  getAllConversations
);

router.get(
  '/admin/stats',
  protect,
  authorize('admin', 'manager'),
  getAIChatStats
);

export default router;
