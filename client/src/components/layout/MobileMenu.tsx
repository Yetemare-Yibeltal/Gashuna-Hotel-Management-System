import { Link, useLocation } from 'react-router-dom';
import { X, BedDouble, CalendarCheck, UtensilsCrossed, Phone, Info } from 'lucide-react';
import { classNames } from '../../lib/utils';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const links = [
  { icon: BedDouble, label: 'Rooms', path: '/rooms' },
  { icon: CalendarCheck, label: 'Book Now', path: '/booking' },
  { icon: UtensilsCrossed, label: 'Restaurant', path: '/restaurant' },
  { icon: Info, label: 'About', path: '/about' },
  { icon: Phone, label: 'Contact', path: '/contact' },
];

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { pathname } = useLocation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-72 bg-slate-950 border-l border-white/10 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <span className="text-lg font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Menu
          </span>
          <button onClick={onClose} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={onClose}
              className={classNames(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                pathname === link.path
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-6 border-t border-white/10">
          <Link
            to="/booking"
            onClick={onClose}
            className="btn-gold w-full text-center block py-3 rounded-xl text-sm"
          >
            Book Your Stay
          </Link>
        </div>
      </div>
    </div>
  );
}
