import { ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  children: ReactNode;
  title?: string;
}

export default function FilterBar({ children, title }: FilterBarProps) {
  return (
    <div className="glass-card p-4">
      {title && (
        <div className="flex items-center gap-2 mb-3 text-white/60 text-sm font-medium">
          <SlidersHorizontal className="w-4 h-4" />
          {title}
        </div>
      )}
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}
