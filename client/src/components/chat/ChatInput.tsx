import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Loader2, Mic } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  onVoiceClick?: () => void;
}

export default function ChatInput({ onSend, isLoading, placeholder = 'Type a message...', onVoiceClick }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t border-white/10">
      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-amber-500 transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none resize-none max-h-32"
        />
      </div>
      {onVoiceClick && (
        <button
          onClick={onVoiceClick}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
        >
          <Mic className="w-5 h-5" />
        </button>
      )}
      <button
        onClick={handleSend}
        disabled={!value.trim() || isLoading}
        className="p-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all"
      >
        {isLoading
          ? <Loader2 className="w-5 h-5 text-white animate-spin" />
          : <Send className="w-5 h-5 text-white" />
        }
      </button>
    </div>
  );
}
