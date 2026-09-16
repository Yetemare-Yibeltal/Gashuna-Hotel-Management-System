import { Link } from 'react-router-dom';
import { Phone, Mail, Globe, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { HOTEL } from '../../config/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-white/5">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex flex-col mb-6">
              <span className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                <span className="gradient-text-gold">Gashuna</span>{' '}
                <span className="text-white">Hotel</span>
              </span>
              <span className="text-xs text-white/30 tracking-widest uppercase mt-1">
                ጋሹና ሆቴል — Dangla, Ethiopia
              </span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              Experience authentic Ethiopian hospitality in the heart of Dangla, Awi Zone. Where luxury meets tradition.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Facebook, href: '#' },
                { icon: Instagram, href: '#' },
                { icon: Twitter, href: '#' },
                { icon: Youtube, href: '#' },
              ].map(({ icon: Icon, href }, i) => (

                  key={i}
                  href={href}
                  className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Our Rooms', path: '/rooms' },
                { label: 'Restaurant', path: '/restaurant' },
                { label: 'Hotel Services', path: '/services' },
                { label: 'Photo Gallery', path: '/gallery' },
                { label: 'About Us', path: '/about' },
                { label: 'Contact', path: '/contact' },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-white/50 hover:text-amber-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-amber-600 rounded-full group-hover:w-2 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Room Types */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              Accommodations
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Standard Rooms — From ETB 1,600', path: '/rooms?type=standard' },
                { label: 'Deluxe Rooms — From ETB 2,600', path: '/rooms?type=deluxe' },
                { label: 'Junior Suites — From ETB 4,000', path: '/rooms?type=junior_suite' },
                { label: 'Presidential Suite — From ETB 7,000', path: '/rooms?type=suite' },
              ].map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="text-sm text-white/50 hover:text-amber-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-amber-600 rounded-full group-hover:w-2 transition-all" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 p-4 bg-amber-600/10 border border-amber-600/20 rounded-xl">
              <p className="text-xs text-amber-400 font-medium mb-1">Book Direct & Save</p>
              <p className="text-xs text-white/50">Best rates guaranteed when you book directly through our website.</p>
              <Link to="/booking" className="btn-gold text-xs px-4 py-2 mt-3 inline-block rounded-lg">
                Book Now
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li>

                  href={`https://maps.google.com/?q=Gashuna+Hotel+Dangla+Ethiopia`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-3 group"
                >
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors leading-relaxed">
                    {HOTEL.address}
                  </span>
                </a>
              </li>
              <li>
                <a href={`tel:${HOTEL.phone}`} className="flex gap-3 group">
                  <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm text-white/50 group-hover:text-amber-400 transition-colors">
                    {HOTEL.phone || '+251 XXX XXX XXX'}
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${HOTEL.email}`} className="flex gap-3 group">
                  <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm text-white/50 group-hover:text-amber-400 transition-colors">
                    {HOTEL.email}
                  </span>
                </a>
              </li>
              <li>
                <a href={HOTEL.website} target="_blank" rel="noreferrer" className="flex gap-3 group">
                  <Globe className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm text-white/50 group-hover:text-amber-400 transition-colors">
                    {HOTEL.website}
                  </span>
                </a>
              </li>
            </ul>
            <div className="mt-6">
              <p className="text-xs text-white/30 mb-2">Reception Hours</p>
              <p className="text-sm text-white/60">24 hours / 7 days a week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            © {currentYear} Gashuna Hotel. All rights reserved. Dangla, Awi Zone, Amhara Region, Ethiopia.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span>VAT Registered — ERCA 15%</span>
            <span>•</span>
            <Link to="/admin/login" className="hover:text-amber-400 transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
