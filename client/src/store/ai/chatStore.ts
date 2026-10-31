import { create } from 'zustand';
import { aiAPI } from '../../lib/api';
import toast from 'react-hot-toast';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: string;
}

interface ChatState {
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  language: 'en' | 'am';
  startSession: (guestId?: string) => Promise<void>;
  sendMessage: (message: string, guestId?: string) => Promise<void>;
  sendAdminMessage: (message: string) => Promise<void>;
  toggleChat: () => void;
  setLanguage: (lang: 'en' | 'am') => void;
  clearMessages: () => void;
  endSession: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessionId: null,
  messages: [],
  isLoading: false,
  isOpen: false,
  language: 'en',

  startSession: async (guestId) => {
    try {
      const res = await aiAPI.startChat({ guestId, language: get().language });
      set({
        sessionId: res.data.sessionId,
        messages: [
          {
            role: 'assistant',
            content: res.data.welcomeMessage,
            timestamp: new Date(),
          },
        ],
      });
    } catch {
      toast.error('Failed to start chat session.');
    }
  },

  sendMessage: async (message, guestId) => {
    if (!get().sessionId) await get().startSession(guestId);
    const sessionId = get().sessionId;
    if (!sessionId) return;

    set((state) => ({
      messages: [...state.messages, { role: 'user', content: message, timestamp: new Date() }],
      isLoading: true,
    }));

    try {
      const res = await aiAPI.sendMessage({ sessionId, message, guestId });
      set((state) => ({
        messages: [
          ...state.messages,
          {
            role: 'assistant',
            content: res.data.message,
            timestamp: new Date(),
            intent: res.data.intent,
          },
        ],
        isLoading: false,
      }));
    } catch {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            role: 'assistant',
            content: 'I apologize, I encountered an error. Please try again.',
            timestamp: new Date(),
          },
        ],
        isLoading: false,
      }));
    }
  },

  sendAdminMessage: async (message) => {
    let sessionId = get().sessionId;
    if (!sessionId) {
      try {
        const res = await aiAPI.startChat();
        sessionId = res.data.sessionId as string;
        set({ sessionId });
      } catch {
        toast.error('Failed to start admin chat session.');
        return;
      }
    }

    set((state) => ({
      messages: [...state.messages, { role: 'user', content: message, timestamp: new Date() }],
      isLoading: true,
    }));

    try {
      const res = await aiAPI.sendAdminMessage({ sessionId: sessionId!, message });
      set((state) => ({
        messages: [
          ...state.messages,
          { role: 'assistant', content: res.data.message, timestamp: new Date() },
        ],
        isLoading: false,
      }));
    } catch {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            role: 'assistant',
            content: 'Failed to get response. Please try again.',
            timestamp: new Date(),
          },
        ],
        isLoading: false,
      }));
    }
  },

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  setLanguage: (lang) => set({ language: lang }),
  clearMessages: () => set({ messages: [], sessionId: null }),

  endSession: async () => {
    const { sessionId } = get();
    if (sessionId) {
      try {
        await aiAPI.endChat(sessionId);
      } catch {
        // ignore
      }
    }
    set({ sessionId: null, messages: [] });
  },
}));
