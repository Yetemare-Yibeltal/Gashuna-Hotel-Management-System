import { classNames } from '../../lib/utils';

interface DividerProps {
  label?: string;
  className?: string;
  variant?: 'default' | 'gold';
}

export default function Divider({ label, className, variant = 'default' }: DividerProps) {
  if (label) {
    return (
      <div className={classNames('flex items-center gap-4 my-6', className)}>
        <div className={classNames('flex-1 h-px', variant === 'gold' ? 'bg-amber-600/30' : 'bg-white/10')} />
        <span className="text-xs text-white/40 font-medium uppercase tracking-wider">{label}</span>
        <div className={classNames('flex-1 h-px', variant === 'gold' ? 'bg-amber-600/30' : 'bg-white/10')} />
      </div>
    );
  }
  return (
    <div
      className={classNames(
        'h-px my-6',
        variant === 'gold'
          ? 'bg-gradient-to-r from-transparent via-amber-600/40 to-transparent'
          : 'bg-white/10',
        className
      )}
    />
  );
}
