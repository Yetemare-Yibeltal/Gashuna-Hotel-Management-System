import { Bot, User } from 'lucide-react';
import { classNames } from '../../lib/utils';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export default function ChatBubble({ role, content, timestamp, isLoading }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={classNames('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={classNames(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        isUser ? 'bg-amber-600/20' : 'bg-slate-700'
      )}>
        {isUser
          ? <User className="w-4 h-4 text-amber-500" />
          : <Bot className="w-4 h-4 text-white/60" />
        }
      </div>
      <div className={classNames(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-amber-600 text-white rounded-tr-sm'
          : 'bg-white/5 border border-white/5 text-white/85 rounded-tl-sm'
      )}>
        {isLoading ? (
          <div className="flex gap-1 py-1">
            <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{content}</p>
            <p className={classNames(
              'text-[10px] mt-1.5 opacity-50',
              isUser ? 'text-right' : 'text-left'
            )}>
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
