import { create } from 'zustand';
import { aiAPI } from '../../lib/api';
import toast from 'react-hot-toast';

interface VoiceState {
  sessionId: string | null;
  isListening: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  transcribedText: string;
  responseText: string;
  language: 'en' | 'am' | 'auto';
  error: string | null;
  startSession: (guestId?: string) => Promise<void>;
  processAudio: (audioBlob: Blob, guestId?: string) => Promise<void>;
  textToSpeech: (text: string) => Promise<void>;
  setListening: (listening: boolean) => void;
  setLanguage: (lang: 'en' | 'am' | 'auto') => void;
  endSession: () => Promise<void>;
  reset: () => void;
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export const useVoiceStore = create<VoiceState>((set, get) => ({
  sessionId: null,
  isListening: false,
  isProcessing: false,
  isPlaying: false,
  transcribedText: '',
  responseText: '',
  language: 'auto',
  error: null,

  startSession: async (guestId) => {
    try {
      const res = await aiAPI.startVoice({ guestId, language: get().language });
      set({ sessionId: res.data.sessionId, error: null });
    } catch {
      set({ error: 'Failed to start voice session.' });
      toast.error('Failed to start voice session.');
    }
  },

  processAudio: async (audioBlob, guestId) => {
    if (!get().sessionId) await get().startSession(guestId);
    const sessionId = get().sessionId;
    if (!sessionId) return;

    set({ isProcessing: true, error: null });
    try {
      const audioData = await blobToBase64(audioBlob);
      const res = await aiAPI.processVoice({
        sessionId,
        audioData,
        language: get().language,
      });
      set({
        transcribedText: res.data.transcribedText,
        responseText: res.data.responseText,
        isProcessing: false,
      });
      if (res.data.audioAvailable) {
        await get().textToSpeech(res.data.responseText);
      }
    } catch {
      set({ isProcessing: false, error: 'Failed to process audio.' });
      toast.error('Failed to process voice input.');
    }
  },

  textToSpeech: async (text) => {
    set({ isPlaying: true });
    try {
      const res = await aiAPI.textToSpeech(text);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'audio/mpeg' }));
      const audio = new Audio(url);
      audio.onended = () => {
        set({ isPlaying: false });
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      set({ isPlaying: false });
    }
  },

  setListening: (listening) => set({ isListening: listening }),
  setLanguage: (lang) => set({ language: lang }),

  endSession: async () => {
    const { sessionId } = get();
    if (sessionId) {
      try {
        await aiAPI.endVoice(sessionId);
      } catch {
        // ignore
      }
    }
    set({ sessionId: null, transcribedText: '', responseText: '' });
  },

  reset: () =>
    set({
      isListening: false,
      isProcessing: false,
      isPlaying: false,
      transcribedText: '',
      responseText: '',
      error: null,
    }),
}));
