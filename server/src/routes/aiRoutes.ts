import { Router } from 'express';
import aiChatRoutes from '../ai/routes/aiChatRoutes';
import aiVoiceRoutes from '../ai/routes/aiVoiceRoutes';
import aiPredictionRoutes from '../ai/routes/aiPredictionRoutes';

const router = Router();

router.use('/chat', aiChatRoutes);
router.use('/voice', aiVoiceRoutes);
router.use('/predictions', aiPredictionRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Gashuna Hotel AI services are running',
    services: {
      chat: {
        status: !!process.env.OPENAI_API_KEY ? 'active' : 'inactive',
        description: 'Text-based AI chat assistant in English and Amharic',
      },
      voice: {
        status: !!process.env.OPENAI_API_KEY ? 'active' : 'inactive',
        description: 'Voice transcription and text-to-speech using OpenAI Whisper',
      },
      prediction: {
        status: !!process.env.OPENAI_API_KEY ? 'active' : 'inactive',
        description: 'Occupancy and revenue prediction using historical data',
      },
      recommendation: {
        status: !!process.env.OPENAI_API_KEY ? 'active' : 'inactive',
        description: 'Personalized room and service recommendations',
      },
      sentiment: {
        status: !!process.env.OPENAI_API_KEY ? 'active' : 'inactive',
        description: 'Guest feedback sentiment analysis',
      },
    },
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    hotel: 'Gashuna Hotel — Dangla, Awi Zone, Amhara Region, Ethiopia',
  });
});

export default router;
