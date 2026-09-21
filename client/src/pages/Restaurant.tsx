import { useState } from 'react';
import { UtensilsCrossed, Clock, Leaf, Flame, Star, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { menuAPI } from '../lib/api';
import { formatETB, classNames } from '../lib/utils';
import { PageSpinner } from '../components/ui/Spinner';
import SearchBar from '../components/ui/SearchBar';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const categories = [
  { value: '', label: 'All Items', icon: '🍽️' },
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'mains', label: 'Main Courses', icon: '🍛' },
  { value: 'appetizers', label: 'Appetizers', icon: '🥗' },
  { value: 'desserts', label: 'Desserts', icon: '🍰' },
  { value: 'drinks', label: 'Drinks', icon: '☕' },
];

export default function Restaurant() {
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['menu', activeCategory, search],
    queryFn: () => menuAPI.getAll({
      category: activeCategory || undefined,
      search: search || undefined,
      available: true,
    }),
    select: (d) => d.data,
  });

  const items = (data?.menuItems || []).filter((item: any) => !vegOnly || item.isVeg);

  return (
    <div className="min-h-screen pt-28 pb-20 bg-neutral-950">
      {/* Hero */}
      <div className="relative py-20 mb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-neutral-950" />
        <div className="absolute inset-0 bg-hotel-pattern opacity-20" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-600/20 rounded-full px-4 py-1.5 mb-6">
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Restaurant & Bar</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Authentic <span className="gradient-text-gold">Ethiopian Cuisine</span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto mb-6">
            Experience the rich flavors of the Amhara Region with our traditional injera,
            wots, tibs, and an authentic Ethiopian coffee ceremony.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-white/50">
            <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Open 6:00 AM – 10:00 PM</span>
            <span className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Room Service Available</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Filters */}
        <div className="space-y-4 mb-10">
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
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
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <SearchBar placeholder="Search menu items..." onSearch={setSearch} />
            </div>
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={classNames(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border',
                vegOnly
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
              )}
            >
              <Leaf className="w-4 h-4" />
              Veg Only
            </button>
          </div>
        </div>

        {/* Menu Grid */}
        {isLoading ? (
          <PageSpinner />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed className="w-12 h-12" />}
            title="No menu items found"
            description="Try a different category or search term."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item: any) => (
              <div key={item._id} className="glass-card p-5 hover:bg-white/[0.08] transition-all duration-200 group">
                <div className="flex items-start gap-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-amber-600/10 flex items-center justify-center text-3xl shrink-0">
                      {item.category === 'drinks' ? '☕' :
                       item.category === 'breakfast' ? '🌅' :
                       item.category === 'desserts' ? '🍰' :
                       item.category === 'appetizers' ? '🥗' : '🍽️'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors">
                          {item.name}
                        </p>
                        {item.nameAmharic && (
                          <p className="text-xs text-white/30 font-amharic">{item.nameAmharic}</p>
                        )}
                      </div>
                      <p className="text-base font-bold text-amber-400 shrink-0">{formatETB(item.price)}</p>
                    </div>
                    <p className="text-xs text-white/50 mb-3 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.isVeg && (
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-md">
                          <Leaf className="w-2.5 h-2.5" /> Vegetarian
                        </span>
                      )}
                      {item.isSpicy && (
                        <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-md">
                          <Flame className="w-2.5 h-2.5" /> Spicy
                        </span>
                      )}
                      {item.popular && (
                        <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-md">
                          <Star className="w-2.5 h-2.5" /> Popular
                        </span>
                      )}
                      <span className="text-[10px] bg-white/5 text-white/30 px-1.5 py-0.5 rounded-md capitalize">
                        {item.preparationTime} min
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
