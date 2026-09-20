import { Mic, MicOff, Loader2 } from 'lucide-react';
import { classNames } from '../../lib/utils';

interface VoiceButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const sizes = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-9 h-9',
};

export default function VoiceButton({ isListening, isProcessing, onToggle, size = 'md', disabled }: VoiceButtonProps) {
  return (
    <div className="relative inline-flex items-center justify-center">
      {isListening && (
        <>
          <div className={classNames('absolute rounded-full bg-red-500/20 animate-ping', sizes[size])} />
          <div className={classNames('absolute rounded-full bg-red-500/10 animate-pulse scale-125', sizes[size])} />
        </>
      )}
      <button
        onClick={onToggle}
        disabled={isProcessing || disabled}
        className={classNames(
          'relative rounded-full flex items-center justify-center transition-all duration-300 shadow-xl',
          sizes[size],
          isListening
            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
            : isProcessing
            ? 'bg-amber-600/50 cursor-not-allowed'
            : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 hover:scale-105'
        )}
      >
        {isProcessing ? (
          <Loader2 className={classNames('text-white animate-spin', iconSizes[size])} />
        ) : isListening ? (
          <MicOff className={classNames('text-white', iconSizes[size])} />
        ) : (
          <Mic className={classNames('text-white', iconSizes[size])} />
        )}
      </button>
    </div>
  );
}
