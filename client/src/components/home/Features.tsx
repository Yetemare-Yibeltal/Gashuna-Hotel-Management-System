import { useRef } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import {
  Wifi, Coffee, Car, Waves, Dumbbell, UtensilsCrossed,
  Shield, MapPin, Phone, CreditCard, Star, Globe,
} from 'lucide-react';
import { classNames } from '../../lib/utils';

const features = [
  { icon: Wifi, title: 'Free High-Speed WiFi', description: 'Stay connected throughout your stay with complimentary high-speed internet in all rooms and common areas.' },
  { icon: Coffee, title: 'Ethiopian Coffee Ceremony', description: 'Experience the traditional Ethiopian coffee ceremony with freshly roasted Yirgacheffe beans in a clay jebena.' },
  { icon: Car, title: 'Airport Transfer', description: 'Comfortable private transfers between Gashuna Hotel and Bahir Dar International Airport.' },
  { icon: Waves, title: 'Swimming Pool', description: 'Relax in our outdoor swimming pool with views of the beautiful Dangla highlands.' },
  { icon: UtensilsCrossed, title: 'Restaurant & Bar', description: 'Authentic Ethiopian cuisine and international dishes served daily from 6 AM to 10 PM.' },
  { icon: Shield, title: '24/7 Security', description: 'Round-the-clock security and front desk service to ensure your safety and comfort.' },
  { icon: MapPin, title: 'Tour Packages', description: 'Guided tours to Blue Nile Gorge, Lake Tana, Tis Abay Falls and Chara Forest.' },
  { icon: CreditCard, title: 'Chapa & Telebirr Payments', description: 'Convenient payment via Chapa, Telebirr, CBE Birr, cash and bank transfer.' },
  { icon: Star, title: 'Loyalty Program', description: 'Earn loyalty points with every stay. Redeem for discounts on future visits.' },
  { icon: Globe, title: 'Conference Hall', description: 'Fully equipped conference hall accommodating up to 120 guests for corporate events.' },
  { icon: Phone, title: '24/7 Room Service', description: 'Order food, request services or get assistance anytime from your room.' },
  { icon: Dumbbell, title: 'Fitness & Wellness', description: 'Stay active with our fitness facilities and traditional Ethiopian massage services.' },
];

export default function Features() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-24 bg-neutral-950 relative" ref={ref as React.RefObject<HTMLElement>}>
      <div className="absolute inset-0 bg-hotel-pattern opacity-20" />
      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Header */}
        <div className={classNames('text-center mb-16 transition-all duration-700', isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}>
          <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-600/20 rounded-full px-4 py-1.5 mb-4">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">
              Premium Amenities
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Everything You Need for a{' '}
            <span className="gradient-text-gold">Perfect Stay</span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Gashuna Hotel offers world-class amenities combined with authentic Ethiopian hospitality
            in the heart of Dangla, Awi Zone.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div
              key={feature.title}
              className={classNames(
                'glass-card p-6 hover:bg-white/[0.08] hover:-translate-y-1 transition-all duration-300 group',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
              style={{ transitionDelay: `${idx * 50}ms` }}
            >
              <div className="p-3 bg-amber-600/10 rounded-xl w-fit mb-4 group-hover:bg-amber-600/20 transition-colors">
                <feature.icon className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
