import { useEffect } from 'react';
import { X } from 'lucide-react';
import { classNames } from '../../lib/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'w-80',
  md: 'w-96',
  lg: 'w-[480px]',
};

export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
}: DrawerProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      <div
        className={classNames(
          'fixed top-0 bottom-0 z-50 bg-neutral-900 border-white/10 shadow-2xl transition-transform duration-300 flex flex-col',
          sizes[size],
          position === 'right'
            ? 'right-0 border-l translate-x-full'
            : 'left-0 border-r -translate-x-full',
          isOpen && 'translate-x-0'
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
            <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </>
  );
}
