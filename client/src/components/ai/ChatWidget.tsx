import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Volume2, Globe } from 'lucide-react';
import { useChatStore } from '../../store/ai/chatStore';
import { classNames, timeAgo } from '../../lib/utils';
import { HOTEL } from '../../config/constants';

interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  guestId?: string;
}

export default function ChatWidget({ isOpen, onToggle, guestId }: ChatWidgetProps) {
  const { messages, isLoading, sendMessage, startSession, sessionId, language, setLanguage } = useChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !sessionId) {
      startSession(guestId);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    await sendMessage(msg, guestId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickReplies = [
    'What rooms are available?',
    'Book a room',
    'Restaurant menu',
    'Hotel services',
    'Check-in time',
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={onToggle}
        className={classNames(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300',
          isOpen
            ? 'bg-red-500 hover:bg-red-600 rotate-90'
            : 'bg-amber-600 hover:bg-amber-500 animate-pulse-gold'
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in"
          style={{ height: '520px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-amber-900/30 px-4 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-600/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{HOTEL.name} AI</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <p className="text-xs text-white/50">Online · Replies instantly</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all text-xs"
                >
                  <Globe className="w-3 h-3" />
                  {language === 'en' ? 'EN' : 'አማ'}
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-amber-500/30 mx-auto mb-3" />
                <p className="text-sm text-white/40">
                  {language === 'am'
                    ? 'ሰላም! እንዴት ልርዳዎ እችላለሁ?'
                    : 'Hello! How can I help you today?'}
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={classNames(
                  'flex gap-2.5',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div className={classNames(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                  msg.role === 'user'
                    ? 'bg-amber-600/20'
                    : 'bg-slate-700'
                )}>
                  {msg.role === 'user'
                    ? <User className="w-4 h-4 text-amber-500" />
                    : <Bot className="w-4 h-4 text-white/60" />
                  }
                </div>
                <div className={classNames(
                  'max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-amber-600 text-white rounded-tr-sm'
                    : 'bg-white/5 text-white/85 rounded-tl-sm'
                )}>
                  {msg.content}
                  <p className={classNames(
                    'text-[10px] mt-1 opacity-50',
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  )}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white/60" />
                </div>
                <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => sendMessage(reply, guestId)}
                  className="shrink-0 px-3 py-1.5 bg-white/5 hover:bg-amber-500/10 hover:text-amber-400 border border-white/10 hover:border-amber-500/30 rounded-full text-xs text-white/60 transition-all whitespace-nowrap"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === 'am' ? 'መልዕክት ይጻፉ...' : 'Type a message...'}
                disabled={isLoading}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all"
              >
                {isLoading
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Send className="w-4 h-4 text-white" />
                }
              </button>
            </div>
            <p className="text-center text-[10px] text-white/20 mt-2">
              Powered by Gashuna Hotel AI · gashuna.com
            </p>
          </div>
        </div>
      )}
    </>
  );
}
