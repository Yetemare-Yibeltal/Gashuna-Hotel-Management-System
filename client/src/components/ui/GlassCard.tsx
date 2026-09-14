import { ReactNode } from 'react';
import { classNames } from '../../lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function GlassCard({
  children,
  className,
  onClick,
  hover = false,
  padding = 'md',
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={classNames(
        'bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl',
        hover && 'hover:bg-white/[0.08] hover:-translate-y-1 transition-all duration-300 cursor-pointer',
        onClick && 'cursor-pointer',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
