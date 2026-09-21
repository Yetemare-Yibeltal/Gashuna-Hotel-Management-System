import { useState } from 'react';
import { ConciergeBell, Clock, Users, ArrowRight, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { servicesAPI } from '../lib/api';
import { formatETB, classNames } from '../lib/utils';
import { PageSpinner } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { Link } from 'react-router-dom';

const categoryIcons: Record<string, string> = {
  transport: '🚗', tour: '🏔️', laundry: '👕', spa: '💆',
  conference: '🏛️', recreation: '🏊', business: '💼', other: '⭐',
};

const categories = [
  { value: '', label: 'All Services' },
  { value: 'transport', label: 'Transport' },
  { value: 'tour', label: 'Tours' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'spa', label: 'Spa & Wellness' },
  { value: 'conference', label: 'Conference' },
  { value: 'recreation', label: 'Recreation' },
  { value: 'business', label: 'Business' },
];

export default function Services() {
  const [activeCategory, setActiveCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['services', activeCategory],
    queryFn: () => servicesAPI.getAll({ category: activeCategory || undefined, available: true }),
    select: (d) => d.data,
  });

  const services = data?.services || [];

  return (
    <div className="min-h-screen pt-28 pb-20 bg-neutral-950">
      {/* Hero */}
      <div className="relative py-20 mb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/20 to-neutral-950" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-600/20 rounded-full px-4 py-1.5 mb-6">
            <ConciergeBell className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Hotel Services</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Premium <span className="gradient-text-gold">Hotel Services</span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto">
            From airport transfers to Blue Nile Gorge tours, we offer a full range
            of services to make your stay in Dangla unforgettable.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={classNames(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0',
                activeCategory === cat.value
                  ? 'bg-amber-600 text-white'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              {cat.value && <span>{categoryIcons[cat.value]}</span>}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <PageSpinner />
        ) : services.length === 0 ? (
          <EmptyState
            icon={<ConciergeBell className="w-12 h-12" />}
            title="No services found"
            description="Try a different category."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: any) => (
              <div key={service._id} className="glass-card p-6 hover:bg-white/[0.08] hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{service.icon || categoryIcons[service.category] || '⭐'}</div>
                  <span className={classNames(
                    'text-xs px-2 py-1 rounded-lg font-medium',
                    service.price === 0
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  )}>
                    {service.price === 0 ? 'Free' : formatETB(service.price)}
                    {service.price > 0 && service.unit && ` /${service.unit}`}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">
                  {service.name}
                </h3>
                {service.nameAmharic && (
                  <p className="text-xs text-white/30 font-amharic mb-2">{service.nameAmharic}</p>
                )}
                <p className="text-sm text-white/50 mb-4 leading-relaxed line-clamp-3">
                  {service.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-white/40 pt-4 border-t border-white/5">
                  {service.requiresBooking && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Booking required
                    </span>
                  )}
                  {service.maxCapacity && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> Up to {service.maxCapacity} guests
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center glass-card p-10">
          <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            Need a Custom Service?
          </h3>
          <p className="text-white/50 mb-6">
            Our concierge team is available 24/7 to arrange any special requests for your stay.
          </p>
          <Link to="/contact" className="btn-gold inline-flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Contact Concierge
          </Link>
        </div>
      </div>
    </div>
  );
}
