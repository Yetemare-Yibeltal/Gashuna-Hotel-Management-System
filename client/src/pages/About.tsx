import { Link } from 'react-router-dom';
import { MapPin, Heart, Award, Users, Star, ArrowRight, Coffee } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { classNames } from '../lib/utils';
import { HOTEL, LOCAL_ATTRACTIONS } from '../config/constants';

const values = [
  { icon: Heart, title: 'Authentic Hospitality', description: 'We embrace the Ethiopian tradition of "tera" — treating every guest as family, with warmth and genuine care.' },
  { icon: Award, title: 'Quality & Excellence', description: 'From our rooms to our restaurant, we maintain the highest standards of quality in everything we offer.' },
  { icon: Coffee, title: 'Ethiopian Culture', description: 'We celebrate Ethiopian culture through our cuisine, coffee ceremonies, and connections to local traditions.' },
  { icon: MapPin, title: 'Community First', description: 'We support the local community of Dangla by employing local staff and sourcing ingredients from local farmers.' },
];

const stats = [
  { value: '12+', label: 'Luxury Rooms & Suites' },
  { value: '16', label: 'Dedicated Staff Members' },
  { value: '100%', label: 'Ethiopian Owned' },
  { value: '24/7', label: 'Guest Support' },
];

export default function About() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div className="min-h-screen pt-28 pb-20 bg-neutral-950">
      {/* Hero */}
      <div className="relative py-20 mb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-neutral-950" />
        <div className="absolute inset-0 bg-hotel-pattern opacity-20" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
            Our <span className="gradient-text-gold">Story</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Gashuna Hotel was built with a simple mission: to bring genuine Ethiopian hospitality
            to the heart of Dangla, offering visitors from across Ethiopia and the world a place
            where they feel truly at home.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-6 text-center">
              <p className="text-3xl font-bold text-amber-400 mb-1">{stat.value}</p>
              <p className="text-sm text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Story */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20" ref={ref as React.RefObject<HTMLElement>}>
          <div className={classNames('transition-all duration-700', isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8')}>
            <h2 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Rooted in Dangla,<br />
              <span className="gradient-text-gold">Open to the World</span>
            </h2>
            <div className="space-y-4 text-white/60 leading-relaxed">
              <p>
                Located at Dangila Kebele 05, at the end of the historic Addis Kedam Exit in Dangla,
                Awi Zone, Gashuna Hotel stands as a beacon of Ethiopian hospitality in the Amhara Region.
              </p>
              <p>
                Our hotel is named in honor of the rich cultural heritage of the Awi Zone people.
                Every room is named after local landmarks — from the mighty Blue Nile (Abay) to the
                magnificent Tis Abay waterfalls — connecting our guests to the natural beauty that
                surrounds Dangla.
              </p>
              <p>
                We source our food from local farmers, employ staff from the surrounding communities,
                and offer tours that showcase the incredible natural wonders of the Awi Zone region,
                including the Blue Nile Gorge, Chara Forest, and Lake Tana.
              </p>
            </div>
          </div>

          <div className={classNames('grid grid-cols-2 gap-4 transition-all duration-700 delay-200', isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8')}>
            {[
              { emoji: '🏔️', title: 'Blue Nile Gorge', desc: 'Gateway hotel for gorge visitors' },
              { emoji: '🌊', title: 'Lake Tana Tours', desc: 'Ancient island monastery tours' },
              { emoji: '🌲', title: 'Chara Forest', desc: 'Endemic wildlife and highland forest' },
              { emoji: '☕', title: 'Coffee Culture', desc: 'Traditional ceremony experience' },
            ].map((item) => (
              <div key={item.title} className="glass-card p-5 text-center">
                <span className="text-4xl">{item.emoji}</span>
                <p className="text-sm font-semibold text-white mt-3 mb-1">{item.title}</p>
                <p className="text-xs text-white/40">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12" style={{ fontFamily: 'Playfair Display, serif' }}>
            Our <span className="gradient-text-gold">Core Values</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div key={value.title} className="glass-card p-6 hover:bg-white/[0.08] transition-all duration-200">
                <div className="p-3 bg-amber-600/10 rounded-xl w-fit mb-4">
                  <value.icon className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="glass-card p-8 mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="p-4 bg-amber-600/10 rounded-2xl">
              <MapPin className="w-8 h-8 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Find Us in Dangla</h3>
              <p className="text-white/50 text-sm leading-relaxed">{HOTEL.address}</p>
              <p className="text-white/30 text-xs mt-1 font-amharic">{HOTEL.addressAmharic}</p>
            </div>
            <div className="flex gap-3">

                href="https://maps.google.com/?q=Gashuna+Hotel+Dangla+Ethiopia"
                target="_blank"
                rel="noreferrer"
                className="btn-gold text-sm"
              >
                Get Directions
              </a>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Ready to Experience Gashuna?
          </h3>
          <p className="text-white/50 mb-6 max-w-md mx-auto">
            Book your stay today and discover authentic Ethiopian hospitality in the heart of Dangla.
          </p>
          <Link to="/booking" className="btn-gold inline-flex items-center gap-2 text-base px-8 py-4">
            Book Your Stay
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
