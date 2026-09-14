import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const iconColor = variant === 'danger' ? 'text-red-400' : variant === 'warning' ? 'text-amber-400' : 'text-blue-400';
  const iconBg = variant === 'danger' ? 'bg-red-500/10' : variant === 'warning' ? 'bg-amber-500/10' : 'bg-blue-500/10';
  const btnVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'gold' : 'gold';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6 flex flex-col items-center text-center gap-4">
        <div className={`p-3 rounded-full ${iconBg}`}>
          <AlertTriangle className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-white/60">{message}</p>
        </div>
        <div className="flex gap-3 w-full pt-2">
          <Button variant="ghost" fullWidth onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={btnVariant} fullWidth onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
