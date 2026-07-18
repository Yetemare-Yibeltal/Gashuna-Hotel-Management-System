import { Router } from 'express';
import {
  getOccupancyPrediction,
  getRevenuePrediction,
  getFullPredictionInsights,
  analyzeFeedbackSentiment,
  analyzeAllGuestFeedback,
  getBookingTrends,
  getRevenueTrends,
  getGuestAnalytics,
} from '../controllers/aiPredictionController';
import {
  getRoomRecommendations,
  getGuestProfileInsights,
  getGuestServiceRecommendations,
  getSimilarRooms,
  getPopularRooms,
  getUpsellOpportunities,
} from '../controllers/aiRecommendationController';
import { protect, authorize } from '../../middleware/authMiddleware';
import {
  aiPredictionLimiter,
  aiRecommendationLimiter,
  aiSentimentLimiter,
} from '../middleware/aiRateLimiter';

const router = Router();

router.use(protect);

router.get(
  '/occupancy',
  authorize('admin', 'manager'),
  aiPredictionLimiter,
  getOccupancyPrediction
);

router.get(
  '/revenue',
  authorize('admin', 'manager'),
  aiPredictionLimiter,
  getRevenuePrediction
);

router.get(
  '/insights',
  authorize('admin', 'manager'),
  aiPredictionLimiter,
  getFullPredictionInsights
);

router.post(
  '/sentiment',
  authorize('admin', 'manager'),
  aiSentimentLimiter,
  analyzeFeedbackSentiment
);

router.get(
  '/sentiment/all',
  authorize('admin', 'manager'),
  aiSentimentLimiter,
  analyzeAllGuestFeedback
);

router.get(
  '/trends/bookings',
  authorize('admin', 'manager'),
  getBookingTrends
);

router.get(
  '/trends/revenue',
  authorize('admin', 'manager'),
  getRevenueTrends
);

router.get(
  '/analytics/guests',
  authorize('admin', 'manager'),
  getGuestAnalytics
);

router.post(
  '/recommendations/rooms',
  authorize('admin', 'manager', 'receptionist'),
  aiRecommendationLimiter,
  getRoomRecommendations
);

router.get(
  '/recommendations/guest/:guestId',
  authorize('admin', 'manager', 'receptionist'),
  aiRecommendationLimiter,
  getGuestProfileInsights
);

router.get(
  '/recommendations/services/:guestId',
  authorize('admin', 'manager', 'receptionist'),
  aiRecommendationLimiter,
  getGuestServiceRecommendations
);

router.get(
  '/recommendations/similar/:roomId',
  aiRecommendationLimiter,
  getSimilarRooms
);

router.get(
  '/recommendations/popular',
  getPopularRooms
);

router.get(
  '/upsell/:guestId',
  authorize('admin', 'manager', 'receptionist'),
  getUpsellOpportunities
);

export default router;
