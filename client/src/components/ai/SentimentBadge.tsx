import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { classNames } from '../../lib/utils';

interface SentimentBadgeProps {
  sentiment: 'positive' | 'neutral' | 'negative';
  score?: number;
  size?: 'sm' | 'md';
  showScore?: boolean;
}

export default function SentimentBadge({ sentiment, score, size = 'md', showScore = false }: SentimentBadgeProps) {
  const config = {
    positive: {
      icon: ThumbsUp,
      label: 'Positive',
      class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    neutral: {
      icon: Minus,
      label: 'Neutral',
      class: 'bg-white/10 text-white/50 border-white/10',
    },
    negative: {
      icon: ThumbsDown,
      label: 'Negative',
      class: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
  };

  const { icon: Icon, label, class: cls } = config[sentiment];

  return (
    <span className={classNames(
      'inline-flex items-center gap-1.5 border rounded-lg font-medium',
      cls,
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
    )}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {label}
      {showScore && score !== undefined && (
        <span className="opacity-60">({score > 0 ? '+' : ''}{score.toFixed(2)})</span>
      )}
    </span>
  );
}
