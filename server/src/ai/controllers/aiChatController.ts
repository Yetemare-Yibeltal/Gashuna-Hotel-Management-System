import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import AppError from '../../utils/AppError';
import AIConversation from '../models/AIConversation';
import AIFeedback from '../models/AIFeedback';
import {
  chatWithGuestAssistant,
  chatWithAdminAssistant,
  detectLanguage,
} from '../services/openaiService';
import {
  generateSessionId,
  getOrCreateConversation,
  buildConversationHistory,
  addMessageToConversation,
  sanitizeUserInput,
  isValidSessionId,
  detectIntentFromMessage,
  buildHotelContextForAdmin,
  truncateConversationHistory,
} from '../utils/aiHelpers';
import { AuthRequest } from '../../middleware/authMiddleware';

export const startChatSession = asyncHandler(
  async (req: Request, res: Response) => {
    const { guestId, language } = req.body;

    const sessionId = generateSessionId();

    const conversation = await getOrCreateConversation(
      sessionId,
      guestId,
      undefined,
      'web_chat'
    );

    res.status(201).json({
      success: true,
      message: 'Chat session started.',
      sessionId,
      conversationId: conversation._id,
      welcomeMessage:
        language === 'am'
          ? 'ሰላም! እንኳን ደህና መጡ ወደ ጋሹና ሆቴል። እንዴት ልርዳዎ እችላለሁ?'
          : 'Selam! Welcome to Gashuna Hotel. How can I assist you today?',
    });
  }
);

export const sendChatMessage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId, message, guestId } = req.body;

    if (!sessionId || !message) {
      return next(
        new AppError('Please provide session ID and message.', 400)
      );
    }

    if (!isValidSessionId(sessionId)) {
      return next(new AppError('Invalid session ID.', 400));
    }

    const sanitizedMessage = sanitizeUserInput(message);

    if (sanitizedMessage.length === 0) {
      return next(new AppError('Message cannot be empty.', 400));
    }

    const conversation = await getOrCreateConversation(
      sessionId,
      guestId,
      undefined,
      'web_chat'
    );

    const detectedLanguage = await detectLanguage(sanitizedMessage);

    const conversationHistory = buildConversationHistory(
      conversation.messages,
      10
    );

    conversationHistory.push({
      role: 'user',
      content: sanitizedMessage,
    });

    const intent = detectIntentFromMessage(sanitizedMessage);

    const aiResponse = await chatWithGuestAssistant(
      conversationHistory,
      detectedLanguage
    );

    await addMessageToConversation(
      sessionId,
      'user',
      sanitizedMessage,
      0
    );

    await addMessageToConversation(
      sessionId,
      'assistant',
      aiResponse.message,
      aiResponse.tokensUsed
    );

    await truncateConversationHistory(sessionId, 50);

    res.status(200).json({
      success: true,
      sessionId,
      message: aiResponse.message,
      intent,
      language: detectedLanguage,
      tokensUsed: aiResponse.tokensUsed,
    });
  }
);

export const sendAdminChatMessage = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return next(
        new AppError('Please provide session ID and message.', 400)
      );
    }

    const sanitizedMessage = sanitizeUserInput(message);

    const conversation = await getOrCreateConversation(
      sessionId,
      undefined,
      req.user?._id.toString(),
      'admin_chat'
    );

    const hotelContext = await buildHotelContextForAdmin();

    const conversationHistory = buildConversationHistory(
      conversation.messages,
      10
    );

    conversationHistory.push({
      role: 'user',
      content: sanitizedMessage,
    });

    const aiResponse = await chatWithAdminAssistant(
      conversationHistory,
      hotelContext
    );

    await addMessageToConversation(
      sessionId,
      'user',
      sanitizedMessage,
      0
    );

    await addMessageToConversation(
      sessionId,
      'assistant',
      aiResponse.message,
      aiResponse.tokensUsed
    );

    res.status(200).json({
      success: true,
      sessionId,
      message: aiResponse.message,
      tokensUsed: aiResponse.tokensUsed,
      hotelContext,
    });
  }
);

export const getChatHistory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;

    if (!isValidSessionId(sessionId)) {
      return next(new AppError('Invalid session ID.', 400));
    }

    const conversation = await AIConversation.findOne({ sessionId })
      .populate('guest', 'fullName phone email')
      .populate('user', 'name role');

    if (!conversation) {
      return next(
        new AppError(
          `No conversation found for session: ${sessionId}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      sessionId,
      conversation: {
        _id: conversation._id,
        channel: conversation.channel,
        language: conversation.language,
        messages: conversation.messages,
        totalTokensUsed: conversation.totalTokensUsed,
        isActive: conversation.isActive,
        guest: conversation.guest,
        user: conversation.user,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  }
);

export const endChatSession = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;

    if (!isValidSessionId(sessionId)) {
      return next(new AppError('Invalid session ID.', 400));
    }

    const conversation = await AIConversation.findOneAndUpdate(
      { sessionId },
      { isActive: false, endedAt: new Date() },
      { new: true }
    );

    if (!conversation) {
      return next(
        new AppError(
          `No conversation found for session: ${sessionId}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      message: 'Chat session ended.',
      sessionId,
      totalMessages: conversation.messages.length,
      totalTokensUsed: conversation.totalTokensUsed,
    });
  }
);

export const submitChatFeedback = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId, rating, helpful, comment, messageIndex } =
      req.body;

    if (!sessionId || rating === undefined || helpful === undefined) {
      return next(
        new AppError(
          'Please provide session ID, rating, and helpful flag.',
          400
        )
      );
    }

    if (rating < 1 || rating > 5) {
      return next(
        new AppError('Rating must be between 1 and 5.', 400)
      );
    }

    const conversation = await AIConversation.findOne({ sessionId });

    if (!conversation) {
      return next(
        new AppError(
          `No conversation found for session: ${sessionId}`,
          404
        )
      );
    }

    const feedback = await AIFeedback.create({
      conversation: conversation._id,
      sessionId,
      guest: conversation.guest,
      user: conversation.user,
      rating,
      helpful,
      comment: comment?.trim(),
      messageIndex,
      feedbackType: conversation.channel === 'voice' ? 'voice' : 'chat',
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback!',
      feedback,
    });
  }
);

export const getAllConversations = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { channel, page, limit } = req.query;

    const filter: Record<string, unknown> = {};
    if (channel) filter.channel = channel;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [conversations, total] = await Promise.all([
      AIConversation.find(filter)
        .populate('guest', 'fullName phone email vip')
        .populate('user', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AIConversation.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: conversations.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      conversations,
    });
  }
);

export const getAIChatStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const [
      totalConversations,
      activeConversations,
      totalFeedback,
    ] = await Promise.all([
      AIConversation.countDocuments(),
      AIConversation.countDocuments({ isActive: true }),
      AIFeedback.countDocuments(),
    ]);

    const avgRating = await AIFeedback.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);

    const channelStats = await AIConversation.aggregate([
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 },
          totalTokens: { $sum: '$totalTokensUsed' },
        },
      },
    ]);

    const languageStats = await AIConversation.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalTokensUsed = await AIConversation.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalTokensUsed' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalConversations,
        activeConversations,
        totalFeedback,
        averageRating:
          Math.round((avgRating[0]?.avg || 0) * 10) / 10,
        totalTokensUsed: totalTokensUsed[0]?.total || 0,
        channelBreakdown: channelStats,
        languageBreakdown: languageStats,
      },
    });
  }
);
