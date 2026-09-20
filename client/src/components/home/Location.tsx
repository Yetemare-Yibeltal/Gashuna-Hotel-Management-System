import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, Mail, Navigation, ArrowRight } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { classNames } from '../../lib/utils';
import { HOTEL, LOCAL_ATTRACTIONS } from '../../config/constants';

export default function Location() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-24 bg-neutral-950 relative" ref={ref as React.RefObject<HTMLElement>}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — Info */}
          <div className={classNames('transition-all duration-700', isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8')}>
            <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-600/20 rounded-full px-4 py-1.5 mb-6">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Location</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Find Us in the{' '}
              <span className="gradient-text-gold">Heart of Dangla</span>
            </h2>
            <p className="text-white/50 mb-8 leading-relaxed">
              Gashuna Hotel is conveniently located at the end of Addis Kedam Exit in Dangla
              city, Awi Zone, Amhara Region — easily accessible from all major roads.
            </p>

            {/* Contact Cards */}
            <div className="space-y-4 mb-8">
              {[
                {
                  icon: MapPin,
                  label: 'Address',
                  value: HOTEL.address,
                  action: 'Get Directions',
                  href: 'https://maps.google.com/?q=Gashuna+Hotel+Dangla+Ethiopia',
                },
                {
                  icon: Phone,
                  label: 'Phone',
                  value: HOTEL.phone || '+251 XXX XXX XXX',
                  action: 'Call Now',
                  href: `tel:${HOTEL.phone}`,
                },
                {
                  icon: Mail,
                  label: 'Email',
                  value: HOTEL.email,
                  action: 'Send Email',
                  href: `mailto:${HOTEL.email}`,
                },
                {
                  icon: Clock,
                  label: 'Reception',
                  value: '24 hours / 7 days a week',
                  action: null,
                  href: null,
                },
              ].map(({ icon: Icon, label, value, action, href }) => (
                <div key={label} className="glass-card p-4 flex items-start gap-4">
                  <div className="p-2.5 bg-amber-600/10 rounded-xl shrink-0">
                    <Icon className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/40 font-medium mb-0.5">{label}</p>
                    <p className="text-sm text-white">{value}</p>
                  </div>
                  {action && href && (

                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel="noreferrer"
                      className="text-xs text-amber-500 hover:text-amber-400 font-medium flex items-center gap-1 shrink-0"
                    >
                      {action}
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>

            <Link to="/contact" className="btn-gold inline-flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Contact Us
            </Link>
          </div>

          {/* Right — Map & Attractions */}
          <div className={classNames('transition-all duration-700 delay-200', isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8')}>
            {/* Map Placeholder */}
            <div className="glass-card overflow-hidden mb-6">
              <div className="h-64 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <p className="text-white/60 font-medium">Gashuna Hotel</p>
                  <p className="text-white/30 text-sm">Dangla, Awi Zone, Amhara Region</p>

                    href="https://maps.google.com/?q=Gashuna+Hotel+Dangla+Ethiopia"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Google Maps
                  </a>
                </div>
                <div className="absolute inset-0 bg-hotel-pattern opacity-20" />
              </div>
            </div>

            {/* Local Attractions */}
            <div>
              <p className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                Nearby Attractions
              </p>
              <div className="grid grid-cols-2 gap-3">
                {LOCAL_ATTRACTIONS.map((attraction) => (
                  <div key={attraction.name} className="glass-card p-4">
                    <p className="text-2xl mb-2">{attraction.icon}</p>
                    <p className="text-sm font-semibold text-white mb-0.5">{attraction.name}</p>
                    <p className="text-xs text-amber-500 mb-1">{attraction.distance}</p>
                    <p className="text-xs text-white/40 line-clamp-2">{attraction.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
