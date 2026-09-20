import { Link } from 'react-router-dom';
import { BedDouble, Users, ArrowRight, Star } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { classNames, formatETB } from '../../lib/utils';
import { useRooms } from '../../hooks/useRooms';
import { SkeletonCard } from '../ui/Skeleton';

export default function RoomsPreview() {
  const { ref, isVisible } = useScrollReveal();
  const { data, isLoading } = useRooms({ limit: 4, status: 'available' });

  const rooms = data?.rooms || [];

  const roomTypeColors: Record<string, string> = {
    standard: 'from-blue-900/40 to-slate-900/40',
    deluxe: 'from-purple-900/40 to-slate-900/40',
    junior_suite: 'from-amber-900/40 to-slate-900/40',
    suite: 'from-yellow-900/40 to-slate-900/40',
  };

  return (
    <section className="py-24 bg-slate-950 relative" ref={ref as React.RefObject<HTMLElement>}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className={classNames('flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6 transition-all duration-700', isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}>
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-600/20 rounded-full px-4 py-1.5 mb-4">
              <BedDouble className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Accommodations</span>
            </div>
            <h2 className="text-4xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              Our <span className="gradient-text-gold">Rooms & Suites</span>
            </h2>
            <p className="text-white/50 mt-2 max-w-lg">
              From cozy standard rooms to our magnificent Presidential Suite, each space is designed
              for your ultimate comfort and relaxation.
            </p>
          </div>
          <Link
            to="/rooms"
            className="btn-outline-gold flex items-center gap-2 whitespace-nowrap"
          >
            View All Rooms
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : rooms.length > 0
            ? rooms.map((room: any, idx: number) => (
                <Link
                  key={room._id}
                  to={`/rooms/${room._id}`}
                  className={classNames(
                    'group relative overflow-hidden rounded-2xl border border-white/10 hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-600/10',
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  )}
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  {/* Room Image Placeholder */}
                  <div className={classNames('h-48 bg-gradient-to-br relative', roomTypeColors[room.type] || roomTypeColors.standard)}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BedDouble className="w-16 h-16 text-white/10" />
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="bg-amber-600/80 text-white text-xs font-medium px-2 py-1 rounded-lg capitalize">
                        {room.type?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-emerald-500/80 text-white text-xs px-2 py-0.5 rounded-md">
                        Available
                      </span>
                    </div>
                  </div>

                  {/* Room Info */}
                  <div className="p-5 bg-slate-900/80">
                    <h3 className="text-base font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors">
                      {room.name}
                    </h3>
                    <p className="text-xs text-white/40 mb-4 line-clamp-2">{room.description}</p>
                    <div className="flex items-center gap-3 mb-4 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {room.capacity} guests
                      </span>
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3 h-3" />
                        {room.beds}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500" />
                        Floor {room.floor}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/30">Per night</p>
                        <p className="text-lg font-bold text-amber-400">{formatETB(room.price)}</p>
                      </div>
                      <div className="p-2 bg-amber-600/10 rounded-lg group-hover:bg-amber-600/20 transition-colors">
                        <ArrowRight className="w-4 h-4 text-amber-500" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            : // Fallback static rooms if no data
              [
                { type: 'standard', name: 'Tana Standard Room', price: 1600, capacity: 2, floor: 1 },
                { type: 'deluxe', name: 'Gojjam Deluxe Room', price: 2600, capacity: 2, floor: 2 },
                { type: 'junior_suite', name: 'Addis Kedam Suite', price: 4000, capacity: 3, floor: 3 },
                { type: 'suite', name: 'Presidential Suite', price: 7500, capacity: 4, floor: 4 },
              ].map((room, idx) => (
                <Link
                  key={room.type}
                  to="/rooms"
                  className={classNames(
                    'group relative overflow-hidden rounded-2xl border border-white/10 hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-2',
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  )}
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  <div className={classNames('h-48 bg-gradient-to-br relative', roomTypeColors[room.type])}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BedDouble className="w-16 h-16 text-white/10" />
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="bg-amber-600/80 text-white text-xs font-medium px-2 py-1 rounded-lg capitalize">
                        {room.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 bg-slate-900/80">
                    <h3 className="text-base font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors">
                      {room.name}
                    </h3>
                    <div className="flex items-center gap-3 mb-4 text-xs text-white/50">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{room.capacity} guests</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />Floor {room.floor}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/30">Per night from</p>
                        <p className="text-lg font-bold text-amber-400">{formatETB(room.price)}</p>
                      </div>
                      <div className="p-2 bg-amber-600/10 rounded-lg group-hover:bg-amber-600/20 transition-colors">
                        <ArrowRight className="w-4 h-4 text-amber-500" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
          }
        </div>
      </div>
    </section>
  );
}
