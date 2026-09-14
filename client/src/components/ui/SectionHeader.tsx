import { ReactNode } from 'react';
import { classNames } from '../../lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  align?: 'left' | 'center';
}

export default function SectionHeader({
  title,
  subtitle,
  actions,
  className,
  align = 'left',
}: SectionHeaderProps) {
  return (
    <div
      className={classNames(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6',
        align === 'center' && 'text-center sm:text-left',
        className
      )}
    >
      <div>
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {title}
        </h1>
        {subtitle && <p className="text-white/50 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
