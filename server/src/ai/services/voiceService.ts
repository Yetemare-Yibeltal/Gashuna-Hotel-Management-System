import path from 'path';
import fs from 'fs';
import {
  transcribeAudio,
  transcribeAudioAmharic,
  generateSpeech,
  detectLanguage,
  chatWithGuestAssistant,
} from './openaiService';
import AIConversation from '../models/AIConversation';
import { ChatMessage } from './openaiService';

export interface VoiceResponse {
  transcribedText: string;
  responseText: string;
  audioBuffer?: Buffer;
  language: 'en' | 'am' | 'mixed';
  tokensUsed: number;
  sessionId: string;
}

export interface VoiceSessionOptions {
  sessionId: string;
  guestId?: string;
  generateAudio?: boolean;
  language?: 'en' | 'am' | 'auto';
}

const AUDIO_UPLOAD_PATH = path.join(
  process.cwd(),
  'src/uploads/voice'
);

const ensureVoiceDirectory = (): void => {
  if (!fs.existsSync(AUDIO_UPLOAD_PATH)) {
    fs.mkdirSync(AUDIO_UPLOAD_PATH, { recursive: true });
  }
};

const saveAudioFile = (
  buffer: Buffer,
  filename: string
): string => {
  ensureVoiceDirectory();
  const filePath = path.join(AUDIO_UPLOAD_PATH, filename);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/voice/${filename}`;
};

export const processVoiceInput = async (
  audioBuffer: Buffer,
  options: VoiceSessionOptions
): Promise<VoiceResponse> => {
  const {
    sessionId,
    guestId,
    generateAudio = true,
    language = 'auto',
  } = options;

  let transcribedText: string;
  let detectedLanguage: 'en' | 'am' | 'mixed' = 'en';

  if (language === 'am') {
    transcribedText = await transcribeAudioAmharic(audioBuffer);
    detectedLanguage = 'am';
  } else if (language === 'en') {
    transcribedText = await transcribeAudio(audioBuffer);
    detectedLanguage = 'en';
  } else {
    transcribedText = await transcribeAudioAmharic(audioBuffer);
    detectedLanguage = await detectLanguage(transcribedText);
  }

  let conversation = await AIConversation.findOne({ sessionId });

  if (!conversation) {
    conversation = await AIConversation.create({
      sessionId,
      guest: guestId || undefined,
      channel: 'voice',
      language: detectedLanguage,
      messages: [],
      totalTokensUsed: 0,
      isActive: true,
    });
  }

  const conversationMessages: ChatMessage[] = conversation.messages
    .filter((m) => m.role !== 'system')
    .slice(-10)
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  conversationMessages.push({
    role: 'user',
    content: transcribedText,
  });

  const aiResponse = await chatWithGuestAssistant(
    conversationMessages,
    detectedLanguage
  );

  conversation.messages.push({
    role: 'user',
    content: transcribedText,
    timestamp: new Date(),
  });

  conversation.messages.push({
    role: 'assistant',
    content: aiResponse.message,
    timestamp: new Date(),
    tokensUsed: aiResponse.tokensUsed,
  });

  conversation.totalTokensUsed += aiResponse.tokensUsed;
  conversation.language = detectedLanguage;
  await conversation.save();

  let audioBuffer2: Buffer | undefined;
  let audioUrl: string | undefined;

  if (generateAudio) {
    try {
      const voice = detectedLanguage === 'am' ? 'nova' : 'nova';
      audioBuffer2 = await generateSpeech(aiResponse.message, voice);

      const audioFilename = `voice-response-${sessionId}-${Date.now()}.mp3`;
      audioUrl = saveAudioFile(audioBuffer2, audioFilename);

      const lastMessage =
        conversation.messages[conversation.messages.length - 1];
      lastMessage.audioUrl = audioUrl;
      await conversation.save();
    } catch {
      console.error('Failed to generate speech audio');
    }
  }

  return {
    transcribedText,
    responseText: aiResponse.message,
    audioBuffer: audioBuffer2,
    language: detectedLanguage,
    tokensUsed: aiResponse.tokensUsed,
    sessionId,
  };
};

export const getVoiceConversationHistory = async (
  sessionId: string
): Promise<{
  sessionId: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: Date;
    audioUrl?: string;
  }>;
  language: string;
  totalTokensUsed: number;
}> => {
  const conversation = await AIConversation.findOne({ sessionId });

  if (!conversation) {
    return {
      sessionId,
      messages: [],
      language: 'en',
      totalTokensUsed: 0,
    };
  }

  return {
    sessionId,
    messages: conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      audioUrl: m.audioUrl,
    })),
    language: conversation.language,
    totalTokensUsed: conversation.totalTokensUsed,
  };
};

export const endVoiceSession = async (
  sessionId: string
): Promise<void> => {
  await AIConversation.findOneAndUpdate(
    { sessionId },
    {
      isActive: false,
      endedAt: new Date(),
    }
  );
};

export const cleanupOldAudioFiles = (): void => {
  ensureVoiceDirectory();

  const files = fs.readdirSync(AUDIO_UPLOAD_PATH);
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  files.forEach((file) => {
    const filePath = path.join(AUDIO_UPLOAD_PATH, file);
    const stats = fs.statSync(filePath);

    if (stats.mtimeMs < oneDayAgo) {
      fs.unlinkSync(filePath);
    }
  });
};
