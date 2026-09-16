import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, Mail, Globe, ChevronDown } from 'lucide-react';
import { HOTEL } from '../../config/constants';
import { classNames } from '../../lib/utils';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Rooms', path: '/rooms' },
  { label: 'Restaurant', path: '/restaurant' },
  { label: 'Services', path: '/services' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Top Bar */}
      <div className="hidden lg:block bg-slate-900/80 border-b border-white/5 py-2">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-white/50">
          <div className="flex items-center gap-6">
            <a href={`tel:${HOTEL.phone}`} className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
              <Phone className="w-3 h-3" />
              {HOTEL.phone || '+251 XXX XXX XXX'}
            </a>
            <a href={`mailto:${HOTEL.email}`} className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
              <Mail className="w-3 h-3" />
              {HOTEL.email}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href={HOTEL.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
              <Globe className="w-3 h-3" />
              {HOTEL.website}
            </a>
            <Link to="/admin/login" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
              Staff Login →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={classNames(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isScrolled
            ? 'bg-slate-950/95 backdrop-blur-xl shadow-2xl border-b border-white/5 top-0'
            : 'bg-transparent lg:top-8'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex flex-col">
              <span
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                <span className="gradient-text-gold">Gashuna</span>{' '}
                <span className="text-white/90">Hotel</span>
              </span>
              <span className="text-xs text-white/40 tracking-widest uppercase">
                Dangla, Ethiopia
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={classNames(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    pathname === link.path
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                to="/booking"
                className="btn-gold text-sm px-5 py-2.5"
              >
                Book Now
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-slate-950/98 backdrop-blur-xl border-t border-white/10">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={classNames(
                    'block px-4 py-3 text-sm font-medium rounded-lg transition-all',
                    pathname === link.path
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 pb-1 border-t border-white/10 space-y-2">
                <Link to="/booking" className="btn-gold w-full text-center text-sm py-3 block rounded-lg">
                  Book Now
                </Link>
                <Link to="/admin/login" className="btn-outline-gold w-full text-center text-sm py-3 block rounded-lg">
                  Staff Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
