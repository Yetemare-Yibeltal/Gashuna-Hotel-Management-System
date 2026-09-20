import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { classNames } from '../../lib/utils';

const testimonials = [
  {
    name: 'Abebe Girma',
    nationality: 'Ethiopia',
    role: 'Business Traveler',
    rating: 5,
    review: 'Gashuna Hotel exceeded all my expectations. The rooms are immaculate, the staff incredibly welcoming, and the Ethiopian breakfast was the best I have had anywhere in the Amhara Region. I will definitely be returning on my next trip to Dangla.',
    flag: '🇪🇹',
  },
  {
    name: 'Sarah Mitchell',
    nationality: 'United Kingdom',
    role: 'Tourist',
    rating: 5,
    review: 'We stayed here during our Blue Nile Gorge tour and it was absolutely wonderful. The hotel arranged transport, the room was spacious and comfortable, and the traditional coffee ceremony was a truly unforgettable experience. Highly recommended!',
    flag: '🇬🇧',
  },
  {
    name: 'Tigist Bekele',
    nationality: 'Ethiopia',
    role: 'Conference Guest',
    rating: 5,
    review: 'We held our regional conference at Gashuna Hotel and everything was perfectly organized. The conference hall is excellent, the catering was outstanding, and the staff handled every detail professionally. A world-class hotel in Dangla.',
    flag: '🇪🇹',
  },
  {
    name: 'Jean-Pierre Dubois',
    nationality: 'France',
    role: 'Leisure Traveler',
    rating: 5,
    review: 'Magnifique! The Presidential Suite has breathtaking views of the Gojjam mountains. The injera with doro wot was incredible — I was surprised by the quality of Ethiopian cuisine here. The staff speak English very well too.',
    flag: '🇫🇷',
  },
  {
    name: 'Dr. Yohannes Tadesse',
    nationality: 'Ethiopia',
    role: 'Regular Guest',
    rating: 5,
    review: 'I stay at Gashuna Hotel every month for work and it feels like home. The loyalty program is generous, the rooms are always spotless, and the reception team remembers my preferences. Best hotel in the Awi Zone without question.',
    flag: '🇪🇹',
  },
];

export default function Testimonials() {
  const { ref, isVisible } = useScrollReveal();
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((c) => (c + 1) % testimonials.length);

  const visible = [
    testimonials[(current) % testimonials.length],
    testimonials[(current + 1) % testimonials.length],
    testimonials[(current + 2) % testimonials.length],
  ];

  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden" ref={ref as React.RefObject<HTMLElement>}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent" />
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className={classNames('text-center mb-16 transition-all duration-700', isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}>
          <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-600/20 rounded-full px-4 py-1.5 mb-4">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Guest Reviews</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            What Our <span className="gradient-text-gold">Guests Say</span>
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Thousands of guests have experienced genuine Ethiopian hospitality at Gashuna Hotel.
            Here are some of their stories.
          </p>
        </div>

        {/* Testimonials */}
        <div className={classNames('grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 transition-all duration-700 delay-200', isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}>
          {visible.map((t, idx) => (
            <div
              key={`${t.name}-${idx}`}
              className={classNames(
                'glass-card p-6 flex flex-col gap-4 transition-all duration-500',
                idx === 1 && 'md:scale-105 border-amber-500/20'
              )}
            >
              <Quote className="w-8 h-8 text-amber-600/30" />
              <p className="text-sm text-white/70 leading-relaxed flex-1 italic">
                &ldquo;{t.review}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-600/10 flex items-center justify-center text-xl">
                  {t.flag}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/40">{t.role} · {t.nationality}</p>
                </div>
                <div className="ml-auto flex">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={prev}
            className="p-3 rounded-full bg-white/5 hover:bg-amber-500/10 text-white/50 hover:text-amber-400 transition-all border border-white/10 hover:border-amber-500/30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={classNames(
                  'rounded-full transition-all',
                  i === current ? 'w-6 h-2 bg-amber-500' : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                )}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="p-3 rounded-full bg-white/5 hover:bg-amber-500/10 text-white/50 hover:text-amber-400 transition-all border border-white/10 hover:border-amber-500/30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
