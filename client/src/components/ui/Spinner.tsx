import { classNames } from '../../lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'gold' | 'white' | 'teal';
  label?: string;
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4',
};

const colors = {
  gold: 'border-amber-600/20 border-t-amber-500',
  white: 'border-white/20 border-t-white',
  teal: 'border-teal-600/20 border-t-teal-500',
};

export default function Spinner({ size = 'md', color = 'gold', label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={classNames('rounded-full animate-spin', sizes[size], colors[color])}
        style={{ borderWidth: size === 'lg' ? '3px' : size === 'xl' ? '4px' : '2px' }}
      />
      {label && <p className="text-white/50 text-sm">{label}</p>}
    </div>
  );
}

export function PageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" label={label} />
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-amber-600/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-white/50 text-sm font-medium">Loading Gashuna Hotel...</p>
      </div>
    </div>
  );
}
