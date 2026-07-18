import OpenAI from 'openai';
import {
  HOTEL_ASSISTANT_SYSTEM_PROMPT,
  ADMIN_ASSISTANT_SYSTEM_PROMPT,
} from '../prompts/hotelAssistantPrompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || '2000');

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  tokensUsed: number;
  model: string;
}

export interface StructuredResponse<T> {
  data: T;
  tokensUsed: number;
}

export const chatWithGuestAssistant = async (
  messages: ChatMessage[],
  language: 'en' | 'am' | 'mixed' = 'en'
): Promise<ChatResponse> => {
  const systemPrompt =
    language === 'am'
      ? `${HOTEL_ASSISTANT_SYSTEM_PROMPT}\n\nIMPORTANT: The guest is communicating in Amharic. Respond fully in Amharic (Geez script).`
      : HOTEL_ASSISTANT_SYSTEM_PROMPT;

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
  });

  const message =
    response.choices[0]?.message?.content ||
    'I apologize, I could not generate a response. Please try again.';

  return {
    message,
    tokensUsed: response.usage?.total_tokens || 0,
    model: response.model,
  };
};

export const chatWithAdminAssistant = async (
  messages: ChatMessage[],
  hotelContext?: string
): Promise<ChatResponse> => {
  const systemPrompt = hotelContext
    ? `${ADMIN_ASSISTANT_SYSTEM_PROMPT}\n\nCURRENT HOTEL CONTEXT:\n${hotelContext}`
    : ADMIN_ASSISTANT_SYSTEM_PROMPT;

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.3,
  });

  const message =
    response.choices[0]?.message?.content ||
    'Unable to generate response.';

  return {
    message,
    tokensUsed: response.usage?.total_tokens || 0,
    model: response.model,
  };
};

export const generateStructuredResponse = async <T>(
  prompt: string,
  systemPrompt?: string
): Promise<StructuredResponse<T>> => {
  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: 'system',
        content:
          systemPrompt ||
          'You are a data analysis AI. Return only valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '{}';

  let data: T;
  try {
    data = JSON.parse(content) as T;
  } catch {
    data = {} as T;
  }

  return {
    data,
    tokensUsed: response.usage?.total_tokens || 0,
  };
};

export const transcribeAudio = async (
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm'
): Promise<string> => {
  const file = new File([audioBuffer], 'audio.webm', {
    type: mimeType,
  });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
  });

  return transcription.text;
};

export const transcribeAudioAmharic = async (
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm'
): Promise<string> => {
  const file = new File([audioBuffer], 'audio.webm', {
    type: mimeType,
  });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
  });

  return transcription.text;
};

export const generateSpeech = async (
  text: string,
  voice:
    | 'alloy'
    | 'echo'
    | 'fable'
    | 'onyx'
    | 'nova'
    | 'shimmer' = 'nova'
): Promise<Buffer> => {
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice,
    input: text,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  return buffer;
};

export const translateText = async (
  text: string,
  targetLanguage: 'en' | 'am'
): Promise<string> => {
  const languageNames = {
    en: 'English',
    am: 'Amharic',
  };

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [
      {
        role: 'system',
        content: `You are a professional translator specializing in English and Amharic translations for Gashuna Hotel in Ethiopia. Translate the text to ${languageNames[targetLanguage]}. Return only the translated text, nothing else.`,
      },
      { role: 'user', content: text },
    ],
    temperature: 0.1,
  });

  return (
    response.choices[0]?.message?.content || text
  );
};

export const detectLanguage = async (
  text: string
): Promise<'en' | 'am' | 'mixed'> => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 10,
    messages: [
      {
        role: 'system',
        content:
          'Detect the language of the text. Return only one word: "en" for English, "am" for Amharic, or "mixed" for both.',
      },
      { role: 'user', content: text },
    ],
    temperature: 0,
  });

  const result = response.choices[0]?.message?.content
    ?.trim()
    .toLowerCase();

  if (result === 'am') return 'am';
  if (result === 'mixed') return 'mixed';
  return 'en';
};

export const generateEmbedding = async (
  text: string
): Promise<number[]> => {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0]?.embedding || [];
};

export default openai;
