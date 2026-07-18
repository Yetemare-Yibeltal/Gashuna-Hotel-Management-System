import { Router } from 'express';
import {
  startVoiceSession,
  processVoiceMessage,
  processVoiceFile,
  getVoiceHistory,
  textToSpeech,
  endVoiceSessionHandler,
  cleanupAudioFiles,
} from '../controllers/aiVoiceController';
import { protect, authorize } from '../../middleware/authMiddleware';
import { aiVoiceLimiter } from '../middleware/aiRateLimiter';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/m4a',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type.'));
    }
  },
});

const router = Router();

router.post('/session/start', startVoiceSession);

router.post(
  '/process',
  aiVoiceLimiter,
  processVoiceMessage
);

router.post(
  '/process/file',
  aiVoiceLimiter,
  upload.single('audio'),
  processVoiceFile
);

router.post(
  '/tts',
  aiVoiceLimiter,
  textToSpeech
);

router.get(
  '/history/:sessionId',
  getVoiceHistory
);

router.patch(
  '/session/:sessionId/end',
  endVoiceSessionHandler
);

router.delete(
  '/cleanup',
  protect,
  authorize('admin'),
  cleanupAudioFiles
);

export default router;
