import { useState } from 'react';
import { Image, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { classNames } from '../lib/utils';

const galleryCategories = [
  { value: 'all', label: 'All' },
  { value: 'rooms', label: 'Rooms & Suites' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'surroundings', label: 'Surroundings' },
];

const galleryItems = [
  { id: 1, category: 'rooms', title: 'Presidential Suite', subtitle: 'Floor 4 · Panoramic View', color: 'from-yellow-900/60 to-slate-900', emoji: '🏨' },
  { id: 2, category: 'rooms', title: 'Gojjam Deluxe Room', subtitle: 'Floor 2 · Mountain View', color: 'from-purple-900/60 to-slate-900', emoji: '🛏️' },
  { id: 3, category: 'restaurant', title: 'Main Restaurant', subtitle: 'Authentic Ethiopian Cuisine', color: 'from-amber-900/60 to-slate-900', emoji: '🍽️' },
  { id: 4, category: 'restaurant', title: 'Coffee Ceremony', subtitle: 'Traditional Jebena Service', color: 'from-brown-900/60 to-slate-900', emoji: '☕' },
  { id: 5, category: 'exterior', title: 'Hotel Entrance', subtitle: 'Addis Kedam Exit, Dangla', color: 'from-blue-900/60 to-slate-900', emoji: '🏛️' },
  { id: 6, category: 'surroundings', title: 'Blue Nile Gorge', subtitle: '2 Hours from Hotel', color: 'from-green-900/60 to-slate-900', emoji: '🏔️' },
  { id: 7, category: 'rooms', title: 'Addis Kedam Junior Suite', subtitle: 'Floor 3 · Highland View', color: 'from-amber-800/60 to-slate-900', emoji: '🛋️' },
  { id: 8, category: 'surroundings', title: 'Tis Abay Falls', subtitle: 'Blue Nile Falls · 3.5 Hours', color: 'from-teal-900/60 to-slate-900', emoji: '💧' },
  { id: 9, category: 'restaurant', title: 'Doro Wot & Injera', subtitle: 'Signature Ethiopian Dish', color: 'from-orange-900/60 to-slate-900', emoji: '🍛' },
  { id: 10, category: 'exterior', title: 'Swimming Pool', subtitle: 'Outdoor Pool & Lounge', color: 'from-cyan-900/60 to-slate-900', emoji: '🏊' },
  { id: 11, category: 'surroundings', title: 'Chara Forest', subtitle: '30 Minutes from Hotel', color: 'from-emerald-900/60 to-slate-900', emoji: '🌲' },
  { id: 12, category: 'rooms', title: 'Tana Standard Room', subtitle: 'Floor 1 · Garden View', color: 'from-blue-900/60 to-slate-900', emoji: '🌿' },
];

export default function Gallery() {
  const { ref, isVisible } = useScrollReveal();
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = activeCategory === 'all'
    ? galleryItems
    : galleryItems.filter((i) => i.category === activeCategory);

  const prev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + filtered.length) % filtered.length);
  };

  const next = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filtered.length);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-neutral-950">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-600/20 rounded-full px-4 py-1.5 mb-6">
          <Image className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Photo Gallery</span>
        </div>
        <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          Experience <span className="gradient-text-gold">Gashuna Hotel</span>
        </h1>
        <p className="text-white/50">
          A visual journey through our beautiful hotel, cuisine, and the stunning natural
          wonders of Dangla and the Awi Zone region.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Category Filter */}
        <div className="flex gap-2 justify-center overflow-x-auto scrollbar-hide pb-2 mb-10">
          {galleryCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={classNames(
                'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                activeCategory === cat.value
                  ? 'bg-amber-600 text-white'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          ref={ref as React.RefObject<HTMLElement>}
        >
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setLightboxIndex(idx)}
              className={classNames(
                'relative overflow-hidden rounded-2xl cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl',
                idx % 7 === 0 ? 'col-span-2 row-span-2' : '',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
              style={{ transitionDelay: `${idx * 50}ms`, minHeight: '200px' }}
            >
              <div className={classNames('w-full h-full min-h-[200px] bg-gradient-to-br flex items-center justify-center text-6xl', item.color)}>
                {item.emoji}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <p className="text-white font-semibold text-sm">{item.title}</p>
                <p className="text-white/60 text-xs">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={prev}
            className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="max-w-2xl w-full text-center">
            <div className={classNames(
              'w-full h-80 rounded-2xl flex items-center justify-center text-8xl mb-4 bg-gradient-to-br',
              filtered[lightboxIndex].color
            )}>
              {filtered[lightboxIndex].emoji}
            </div>
            <p className="text-white text-xl font-semibold">{filtered[lightboxIndex].title}</p>
            <p className="text-white/50 text-sm mt-1">{filtered[lightboxIndex].subtitle}</p>
            <p className="text-white/20 text-xs mt-2">{lightboxIndex + 1} / {filtered.length}</p>
          </div>
          <button
            onClick={next}
            className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
