import { Printer } from 'lucide-react';
import Button from './Button';

interface PrintButtonProps {
  label?: string;
  className?: string;
}

export default function PrintButton({ label = 'Print', className }: PrintButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      leftIcon={<Printer className="w-4 h-4" />}
      onClick={() => window.print()}
      className={className}
    >
      {label}
    </Button>
  );
}
