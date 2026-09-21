import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BedDouble, Users, ArrowRight, SlidersHorizontal,
  Search, Star, Wifi, Coffee, Wind,
} from 'lucide-react';
import { useRooms } from '../hooks/useRooms';
import { formatETB, classNames } from '../lib/utils';
import { SkeletonCard } from '../components/ui/Skeleton';
import DateRangePicker from '../components/ui/DateRangePicker';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const roomTypes = [
  { value: '', label: 'All Types' },
  { value: 'standard', label: 'Standard Room' },
  { value: 'deluxe', label: 'Deluxe Room' },
  { value: 'junior_suite', label: 'Junior Suite' },
  { value: 'suite', label: 'Presidential Suite' },
];

const sortOptions = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'floor_asc', label: 'Floor: Low to High' },
];

const priceRanges = [
  { value: '', label: 'Any Price' },
  { value: '0-2000', label: 'Under ETB 2,000' },
  { value: '2000-4000', label: 'ETB 2,000 – 4,000' },
  { value: '4000-7000', label: 'ETB 4,000 – 7,000' },
  { value: '7000-99999', label: 'ETB 7,000+' },
];

const typeGradients: Record<string, string> = {
  standard: 'from-blue-900/60 to-slate-900/60',
  deluxe: 'from-purple-900/60 to-slate-900/60',
  junior_suite: 'from-amber-900/60 to-slate-900/60',
  suite: 'from-yellow-900/60 to-slate-900/60',
};

export default function Rooms() {
  const [searchParams] = useSearchParams();
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('price_asc');
  const [priceRange, setPriceRange] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const params: Record<string, unknown> = { status: 'available' };
  if (type) params.type = type;
  if (sort === 'price_asc') { params.sortField = 'price'; params.sortOrder = 'asc'; }
  if (sort === 'price_desc') { params.sortField = 'price'; params.sortOrder = 'desc'; }
  if (sort === 'floor_asc') { params.sortField = 'floor'; params.sortOrder = 'asc'; }
  if (priceRange) {
    const [min, max] = priceRange.split('-').map(Number);
    params.minPrice = min;
    params.maxPrice = max;
  }

  const { data, isLoading } = useRooms(params);
  const rooms = data?.rooms || [];

  return (
    <div className="min-h-screen pt-28 pb-20 bg-neutral-950">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-600/20 rounded-full px-4 py-1.5 mb-4">
            <BedDouble className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Accommodations</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Our <span className="gradient-text-gold">Rooms & Suites</span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto">
            Choose from our selection of carefully designed rooms, each offering a unique blend
            of comfort and authentic Ethiopian character.
          </p>
        </div>

        {/* Quick Date Search */}
        <div className="glass-card p-5 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={setCheckIn}
                onCheckOutChange={setCheckOut}
              />
            </div>
            <Button
              variant="gold"
              fullWidth
              leftIcon={<Search className="w-4 h-4" />}
            >
              Search Availability
            </Button>
          </div>
        </div>

        {/* Filters Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/40">
            {isLoading ? 'Loading...' : `${rooms.length} room${rooms.length !== 1 ? 's' : ''} available`}
          </p>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="glass-card p-5 mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Room Type"
              options={roomTypes}
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
            <Select
              label="Price Range"
              options={priceRanges}
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            />
            <Select
              label="Sort By"
              options={sortOptions}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Rooms Grid */}
      <div className="max-w-7xl mx-auto px-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : rooms.length === 0 ? (
          <EmptyState
            icon={<BedDouble className="w-12 h-12" />}
            title="No rooms found"
            description="Try adjusting your filters or dates to find available rooms."
            action={{ label: 'Clear Filters', onClick: () => { setType(''); setPriceRange(''); } }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room: any) => (
              <Link
                key={room._id}
                to={`/rooms/${room._id}`}
                className="group glass-card overflow-hidden hover:border-amber-500/30 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-600/10 transition-all duration-300"
              >
                {/* Image */}
                <div className={classNames('h-52 relative bg-gradient-to-br', typeGradients[room.type] || typeGradients.standard)}>
                  {room.images?.[0] ? (
                    <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BedDouble className="w-20 h-20 text-white/5" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <Badge variant={room.status === 'available' ? 'success' : 'warning'}>
                      {room.status === 'available' ? 'Available' : room.status}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-amber-600/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium capitalize">
                      {room.type?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <p className="text-white font-bold text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {room.name}
                    </p>
                    <p className="text-white/60 text-xs">Room {room.roomNumber} · Floor {room.floor}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <p className="text-sm text-white/50 mb-4 line-clamp-2 leading-relaxed">{room.description}</p>

                  {/* Specs */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-white/50">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      {room.capacity} guests
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-amber-500" />
                      {room.beds}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      {room.view || 'Great view'}
                    </span>
                  </div>

                  {/* Amenities */}
                  {room.amenities?.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {room.amenities.slice(0, 3).map((amenity: string) => (
                        <span key={amenity} className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-md">
                          {amenity}
                        </span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-md">
                          +{room.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <p className="text-xs text-white/30">Per night</p>
                      <p className="text-xl font-bold text-amber-400">{formatETB(room.price)}</p>
                      <p className="text-[10px] text-white/20">incl. 15% VAT</p>
                    </div>
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-medium group-hover:gap-3 transition-all">
                      Book Now
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
