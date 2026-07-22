export const AI_CONFIG = {
  MODEL: 'gpt-4o',
  MAX_TOKENS: 2000,
  TEMPERATURE_CHAT: 0.7,
  TEMPERATURE_STRUCTURED: 0.1,
  WHISPER_MODEL: 'whisper-1',
  TTS_MODEL: 'tts-1',
  TTS_VOICE: 'nova' as const,
  EMBEDDING_MODEL: 'text-embedding-3-small',
  MAX_CONVERSATION_HISTORY: 10,
  MAX_MESSAGES_PER_SESSION: 50,
  SESSION_ID_PREFIX: 'gsh-session-',
  AUDIO_MAX_SIZE_MB: 25,
  AUDIO_MAX_SIZE_BYTES: 25 * 1024 * 1024,
  MONTHLY_TOKEN_BUDGET: 100000,
  AVG_TOKENS_PER_MESSAGE: 500,
  SUPPORTED_AUDIO_TYPES: [
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/m4a',
  ],
  SUPPORTED_LANGUAGES: ['en', 'am', 'auto'] as const,
  HOTEL_CONTEXT: {
    name: 'Gashuna Hotel',
    location: 'Dangla, Awi Zone, Amhara Region, Ethiopia',
    email: 'gashunayene@gashuna.com',
    website: 'https://gashuna.com',
    currency: 'ETB',
    vatRate: 0.15,
  },
} as const;

export const RATE_LIMITS = {
  CHAT_PER_MINUTE: 20,
  VOICE_PER_MINUTE: 10,
  PREDICTION_PER_HOUR: 20,
  RECOMMENDATION_PER_MINUTE: 30,
  SENTIMENT_PER_MINUTE: 15,
} as const;

export const AI_COSTS_USD = {
  GPT4O_INPUT_PER_1K: 0.005,
  GPT4O_OUTPUT_PER_1K: 0.015,
  WHISPER_PER_MINUTE: 0.006,
  TTS_PER_1K_CHARS: 0.015,
  USD_TO_ETB_RATE: 125,
} as const;
