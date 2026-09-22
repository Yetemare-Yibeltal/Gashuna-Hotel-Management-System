import { useState } from 'react';
import { Bot, Mic, MessageSquare, Sparkles } from 'lucide-react';
import { useChatStore } from '../../store/ai/chatStore';
import SectionHeader from '../../components/ui/SectionHeader';
import ChatHistory from '../../components/chat/ChatHistory';
import ChatInput from '../../components/chat/ChatInput';
import VoiceAssistant from '../../components/ai/VoiceAssistant';
import Badge from '../../components/ui/Badge';
import { classNames } from '../../lib/utils';

export default function AIAssistantPage() {
  const { messages, isLoading, sendAdminMessage, clearMessages, startSession, sessionId } = useChatStore();
  const [activeMode, setActiveMode] = useState<'chat' | 'voice'>('chat');

  const handleSend = async (message: string) => {
    if (!sessionId) await startSession();
    await sendAdminMessage(message);
  };

  const suggestedQueries = [
    "What is today's occupancy rate?",
    "Which rooms need maintenance?",
    "Show me this month's revenue summary",
    "List today's check-ins and check-outs",
    "What are the pending maintenance requests?",
    "How many VIP guests are currently staying?",
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="AI Assistant"
        subtitle="Ask anything about hotel operations, bookings, or analytics"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="success" dot>Online</Badge>
            <button onClick={clearMessages} className="text-xs text-white/40 hover:text-white/60 transition-colors">
              Clear Chat
            </button>
          </div>
        }
      />

      {/* Mode Toggle */}
      <div className="flex gap-2">
        {[
          { mode: 'chat' as const, icon: MessageSquare, label: 'Text Chat' },
          { mode: 'voice' as const, icon: Mic, label: 'Voice Assistant' },
        ].map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setActiveMode(mode)}
            className={classNames(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
              activeMode === mode
                ? 'bg-amber-600 text-white'
                : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeMode === 'chat' ? (
        <div className="glass-card overflow-hidden flex flex-col" style={{ height: '600px' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
            <div className="p-2 bg-amber-600/10 rounded-xl">
              <Bot className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Gashuna Hotel Admin AI</p>
              <p className="text-xs text-white/40">Powered by GPT-4o · Context-aware hotel management assistant</p>
            </div>
            <div className="ml-auto">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-400">Active</span>
              </div>
            </div>
          </div>

          <ChatHistory messages={messages} isLoading={isLoading} />

          {/* Suggested Queries */}
          {messages.length === 0 && (
            <div className="px-4 py-3 border-t border-white/5 shrink-0">
              <p className="text-xs text-white/30 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((query) => (
                  <button
                    key={query}
                    onClick={() => handleSend(query)}
                    className="text-xs bg-white/5 hover:bg-amber-500/10 hover:text-amber-400 border border-white/5 hover:border-amber-500/20 text-white/50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
            placeholder="Ask about bookings, revenue, occupancy, or any hotel operations..."
            onVoiceClick={() => setActiveMode('voice')}
          />
        </div>
      ) : (
        <div className="glass-card p-8">
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="p-3 bg-amber-600/10 rounded-2xl">
              <Sparkles className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-white">Voice Assistant</h3>
            <p className="text-sm text-white/40 text-center max-w-sm">
              Speak naturally to manage your hotel. Available in English and Amharic.
            </p>
          </div>
          <VoiceAssistant />
        </div>
      )}
    </div>
  );
}
