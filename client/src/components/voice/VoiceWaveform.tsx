import { classNames } from '../../lib/utils';

interface VoiceWaveformProps {
  isActive: boolean;
  bars?: number;
  color?: 'gold' | 'red' | 'white';
}

const colors = {
  gold: 'bg-amber-500',
  red: 'bg-red-400',
  white: 'bg-white/60',
};

export default function VoiceWaveform({ isActive, bars = 20, color = 'gold' }: VoiceWaveformProps) {
  return (
    <div className="flex items-center justify-center gap-0.5 h-12">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={classNames(
            'w-1 rounded-full transition-all',
            colors[color],
            isActive ? 'animate-pulse' : 'opacity-20'
          )}
          style={{
            height: isActive
              ? `${20 + Math.random() * 60}%`
              : '20%',
            animationDelay: `${(i * 50) % 500}ms`,
            animationDuration: isActive ? `${0.4 + Math.random() * 0.6}s` : '1s',
          }}
        />
      ))}
    </div>
  );
}
