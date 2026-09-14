import { classNames } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'gold' | 'gray' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variants = {
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  error: 'bg-red-500/15 text-red-400 border border-red-500/20',
  info: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  gold: 'bg-amber-600/15 text-amber-500 border border-amber-600/20',
  gray: 'bg-white/10 text-white/60 border border-white/10',
  purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
};

const dotColors = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
  info: 'bg-blue-400',
  gold: 'bg-amber-500',
  gray: 'bg-white/40',
  purple: 'bg-purple-400',
};

const sizes = {
  sm: 'text-xs px-2 py-0.5 rounded-md',
  md: 'text-xs px-2.5 py-1 rounded-lg',
};

export default function Badge({ children, variant = 'info', size = 'md', dot = false }: BadgeProps) {
  return (
    <span className={classNames('inline-flex items-center gap-1.5 font-medium', variants[variant], sizes[size])}>
      {dot && <span className={classNames('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
