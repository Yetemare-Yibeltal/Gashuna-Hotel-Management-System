import { ReactNode } from 'react';
import { Package } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 bg-white/5 rounded-2xl mb-4 text-white/30">
        {icon || <Package className="w-10 h-10" />}
      </div>
      <h3 className="text-lg font-semibold text-white/70 mb-2">{title}</h3>
      {description && <p className="text-sm text-white/40 max-w-sm mb-6">{description}</p>}
      {action && (
        <Button variant="gold" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
