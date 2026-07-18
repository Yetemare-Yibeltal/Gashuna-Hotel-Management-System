import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const rateLimitHandler = (req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    message:
      'Too many AI requests. Please wait a moment before sending another message.',
  });
};

export const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: {
    success: false,
    message: 'Too many chat messages. Please slow down.',
  },
});

export const aiVoiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: {
    success: false,
    message: 'Too many voice requests. Please wait before sending another voice message.',
  },
});

export const aiPredictionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: {
    success: false,
    message: 'Too many prediction requests. Limit is 20 per hour.',
  },
});

export const aiRecommendationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: {
    success: false,
    message: 'Too many recommendation requests.',
  },
});

export const aiSentimentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: {
    success: false,
    message: 'Too many sentiment analysis requests.',
  },
});
