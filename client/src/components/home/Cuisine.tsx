import { Link } from 'react-router-dom';
import { UtensilsCrossed, Clock, ArrowRight, Flame, Leaf } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { classNames, formatETB } from '../../lib/utils';

const dishes = [
  { name: 'Doro Wot', nameAm: 'ዶሮ ወጥ', price: 180, description: 'Slow-cooked chicken in rich berbere sauce on injera', tags: ['spicy', 'popular'], emoji: '🍗' },
  { name: 'Kitfo', nameAm: 'ክትፎ', price: 200, description: 'Ethiopian steak tartare with mitmita and spiced butter', tags: ['spicy', 'traditional'], emoji: '🥩' },
  { name: 'Shiro Wot', nameAm: 'ሽሮ ወጥ', price: 120, description: 'Rich chickpea flour stew with Ethiopian spices', tags: ['vegetarian', 'fasting'], emoji: '🫘' },
  { name: 'Tibs', nameAm: 'ጥብስ', price: 160, description: 'Sautéed beef or lamb with onions and rosemary', tags: ['popular'], emoji: '🍖' },
  { name: 'Ethiopian Coffee Ceremony', nameAm: 'የቡና ሥርዓት', price: 80, description: 'Traditional 3-round coffee ceremony with incense', tags: ['ceremony', 'popular'], emoji: '☕' },
  { name: 'Tej — Honey Wine', nameAm: 'ጠጅ', price: 70, description: 'Traditional Ethiopian honey wine in berele glass', tags: ['traditional', 'drink'], emoji: '🍯' },
];

export default function Cuisine() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-24 bg-neutral-950 relative" ref={ref as React.RefObject<HTMLElement>}>
      <div className="absolute inset-0 bg-hotel-pattern opacity-10" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Content */}
          <div className={classNames('transition-all duration-700', isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8')}>
            <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-600/20 rounded-full px-4 py-1.5 mb-6">
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Restaurant</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Authentic{' '}
              <span className="gradient-text-gold">Ethiopian Cuisine</span>
            </h2>
            <p className="text-white/50 leading-relaxed mb-6">
              Our restaurant serves traditional Ethiopian dishes prepared with authentic recipes
              and locally sourced ingredients. From injera to doro wot, experience the true
              flavors of the Amhara Region.
            </p>
            <div className="flex items-center gap-6 mb-8 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Open 6:00 AM – 10:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-500" />
                <span>Fasting options daily</span>
              </div>
            </div>
            <div className="flex gap-4">
              <Link to="/restaurant" className="btn-gold flex items-center gap-2">
                View Full Menu
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/booking" className="btn-outline-gold">
                Book a Table
              </Link>
            </div>
          </div>

          {/* Right — Menu Cards */}
          <div className={classNames('grid grid-cols-2 gap-4 transition-all duration-700 delay-200', isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8')}>
            {dishes.map((dish, idx) => (
              <div
                key={dish.name}
                className={classNames(
                  'glass-card p-4 hover:bg-white/[0.08] transition-all duration-300 group',
                  idx === 0 && 'col-span-2'
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{dish.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                          {dish.name}
                        </p>
                        <p className="text-xs text-white/30 font-amharic">{dish.nameAm}</p>
                      </div>
                      <p className="text-sm font-bold text-amber-400 shrink-0">{formatETB(dish.price)}</p>
                    </div>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{dish.description}</p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {dish.tags.map((tag) => (
                        <span
                          key={tag}
                          className={classNames(
                            'text-[10px] px-1.5 py-0.5 rounded-md font-medium',
                            tag === 'spicy' ? 'bg-red-500/15 text-red-400' :
                            tag === 'vegetarian' || tag === 'fasting' ? 'bg-emerald-500/15 text-emerald-400' :
                            tag === 'popular' ? 'bg-amber-500/15 text-amber-400' :
                            'bg-white/10 text-white/40'
                          )}
                        >
                          {tag === 'spicy' ? '🌶️ ' : tag === 'vegetarian' ? '🌱 ' : ''}{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
