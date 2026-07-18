import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import AppError from '../../utils/AppError';
import {
  processVoiceInput,
  getVoiceConversationHistory,
  endVoiceSession,
  cleanupOldAudioFiles,
} from '../services/voiceService';
import {
  generateSessionId,
  isValidSessionId,
} from '../utils/aiHelpers';
import { generateSpeech } from '../services/openaiService';
import { AuthRequest } from '../../middleware/authMiddleware';

export const startVoiceSession = asyncHandler(
  async (req: Request, res: Response) => {
    const { guestId, language } = req.body;

    const sessionId = generateSessionId();

    res.status(201).json({
      success: true,
      message: 'Voice session started.',
      sessionId,
      guestId: guestId || null,
      language: language || 'auto',
      instructions: {
        en: 'Send audio as base64 encoded string in the voice/process endpoint.',
        am: 'ድምጽዎን በbase64 format ወደ voice/process endpoint ይላኩ።',
      },
    });
  }
);

export const processVoiceMessage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId, audioData, mimeType, guestId, language, generateAudio } =
      req.body;

    if (!sessionId || !audioData) {
      return next(
        new AppError(
          'Please provide session ID and audio data.',
          400
        )
      );
    }

    if (!isValidSessionId(sessionId)) {
      return next(new AppError('Invalid session ID.', 400));
    }

    let audioBuffer: Buffer;

    try {
      audioBuffer = Buffer.from(audioData, 'base64');
    } catch {
      return next(
        new AppError(
          'Invalid audio data. Must be base64 encoded.',
          400
        )
      );
    }

    if (audioBuffer.length === 0) {
      return next(new AppError('Audio data cannot be empty.', 400));
    }

    if (audioBuffer.length > 25 * 1024 * 1024) {
      return next(
        new AppError(
          'Audio file too large. Maximum size is 25MB.',
          400
        )
      );
    }

    const result = await processVoiceInput(audioBuffer, {
      sessionId,
      guestId,
      generateAudio: generateAudio !== false,
      language: language || 'auto',
    });

    res.status(200).json({
      success: true,
      sessionId,
      transcribedText: result.transcribedText,
      responseText: result.responseText,
      audioAvailable: !!result.audioBuffer,
      language: result.language,
      tokensUsed: result.tokensUsed,
    });
  }
);

export const processVoiceFile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(
        new AppError(
          'Please upload an audio file.',
          400
        )
      );
    }

    const { sessionId, guestId, language, generateAudio } = req.body;

    if (!sessionId) {
      return next(new AppError('Please provide a session ID.', 400));
    }

    if (!isValidSessionId(sessionId)) {
      return next(new AppError('Invalid session ID.', 400));
    }

    const audioBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    const result = await processVoiceInput(audioBuffer, {
      sessionId,
      guestId,
      generateAudio: generateAudio !== 'false',
      language: language || 'auto',
    });

    res.status(200).json({
      success: true,
      sessionId,
      transcribedText: result.transcribedText,
      responseText: result.responseText,
      audioAvailable: !!result.audioBuffer,
      language: result.language,
      tokensUsed: result.tokensUsed,
      mimeType,
    });
  }
);

export const getVoiceHistory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;

    if (!isValidSessionId(sessionId)) {
      return next(new AppError('Invalid session ID.', 400));
    }

    const history = await getVoiceConversationHistory(sessionId);

    res.status(200).json({
      success: true,
      ...history,
    });
  }
);

export const textToSpeech = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { text, voice } = req.body;

    if (!text || text.trim().length === 0) {
      return next(new AppError('Please provide text to convert.', 400));
    }

    if (text.length > 4096) {
      return next(
        new AppError(
          'Text too long. Maximum is 4096 characters.',
          400
        )
      );
    }

    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'nova';

    const audioBuffer = await generateSpeech(text, selectedVoice);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Content-Disposition': 'inline; filename="speech.mp3"',
    });

    res.status(200).send(audioBuffer);
  }
);

export const endVoiceSessionHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;

    if (!isValidSessionId(sessionId)) {
      return next(new AppError('Invalid session ID.', 400));
    }

    await endVoiceSession(sessionId);

    res.status(200).json({
      success: true,
      message: 'Voice session ended successfully.',
      sessionId,
    });
  }
);

export const cleanupAudioFiles = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    cleanupOldAudioFiles();

    res.status(200).json({
      success: true,
      message: 'Old audio files cleaned up successfully.',
    });
  }
);
