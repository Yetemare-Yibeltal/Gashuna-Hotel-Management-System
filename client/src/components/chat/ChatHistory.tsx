import { useRef, useEffect } from 'react';
import ChatBubble from './ChatBubble';
import { Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatHistoryProps {
  messages: Message[];
  isLoading?: boolean;
}

export default function ChatHistory({ messages, isLoading }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
          <div className="p-4 bg-amber-500/10 rounded-2xl">
            <Bot className="w-10 h-10 text-amber-500" />
          </div>
          <div>
            <p className="text-white font-medium">Gashuna Hotel AI Assistant</p>
            <p className="text-sm text-white/40 mt-1">
              Ask me anything about rooms, bookings, restaurant, or local attractions.
            </p>
          </div>
        </div>
      )}
      {messages.map((msg, idx) => (
        <ChatBubble
          key={idx}
          role={msg.role}
          content={msg.content}
          timestamp={msg.timestamp}
        />
      ))}
      {isLoading && (
        <ChatBubble
          role="assistant"
          content=""
          timestamp={new Date()}
          isLoading
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
