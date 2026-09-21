import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BedDouble, Users, Star, MapPin, Wifi, Check,
  ChevronLeft, ChevronRight, ArrowLeft, Calendar,
} from 'lucide-react';
import { useRoom } from '../hooks/useRooms';
import { formatETB, classNames } from '../lib/utils';
import { PageSpinner } from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import DateRangePicker from '../components/ui/DateRangePicker';
import { calculateNights } from '../lib/utils';
import { HOTEL } from '../config/constants';

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useRoom(id!);
  const [activeImage, setActiveImage] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const room = data?.room;
  const nights = calculateNights(checkIn, checkOut);
  const subtotal = room ? room.price * nights : 0;
  const vat = subtotal * HOTEL.vatRate;
  const total = subtotal + vat;

  if (isLoading) return <PageSpinner label="Loading room details..." />;
  if (!room) return (
    <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
      <p className="text-white/40 mb-4">Room not found.</p>
      <Link to="/rooms" className="text-amber-400 hover:text-amber-300 flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Rooms
      </Link>
    </div>
  );

  const images = room.images?.length > 0 ? room.images : [null];

  const typeGradients: Record<string, string> = {
    standard: 'from-blue-900/80 to-slate-900/80',
    deluxe: 'from-purple-900/80 to-slate-900/80',
    junior_suite: 'from-amber-900/80 to-slate-900/80',
    suite: 'from-yellow-900/80 to-slate-900/80',
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-8">
          <Link to="/" className="hover:text-amber-400 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/rooms" className="hover:text-amber-400 transition-colors">Rooms</Link>
          <span>/</span>
          <span className="text-white/70">{room.name}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left — Images & Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="relative rounded-2xl overflow-hidden">
              <div className={classNames('h-80 md:h-[450px] relative bg-gradient-to-br', typeGradients[room.type] || typeGradients.standard)}>
                {images[activeImage] ? (
                  <img
                    src={images[activeImage]}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BedDouble className="w-24 h-24 text-white/5" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant={room.status === 'available' ? 'success' : 'warning'}>
                    {room.status === 'available' ? 'Available' : room.status}
                  </Badge>
                  <span className="bg-amber-600/80 text-white text-xs px-2.5 py-1 rounded-lg font-medium capitalize">
                    {room.type?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-3">
                  {images.map((img: string | null, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={classNames(
                        'w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0',
                        i === activeImage ? 'border-amber-500' : 'border-transparent opacity-60 hover:opacity-80'
                      )}
                    >
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={classNames('w-full h-full bg-gradient-to-br', typeGradients[room.type])} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Room Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {room.name}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      Floor {room.floor}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      {room.view}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-amber-500" />
                      {room.beds}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      {room.capacity} guests
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/30">Per night from</p>
                  <p className="text-3xl font-bold text-amber-400">{formatETB(room.price)}</p>
                  <p className="text-xs text-white/20">incl. 15% VAT</p>
                </div>
              </div>

              <p className="text-white/60 leading-relaxed mb-6">{room.description}</p>

              {/* Amenities */}
              {room.amenities?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Room Amenities
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {room.amenities.map((amenity: string) => (
                      <div key={amenity} className="flex items-center gap-2 text-sm text-white/60">
                        <Check className="w-4 h-4 text-amber-500 shrink-0" />
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — Booking Card */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-28 space-y-5">
              <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                Reserve This Room
              </h3>

              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={setCheckIn}
                onCheckOutChange={setCheckOut}
              />

              {/* Price Breakdown */}
              {nights > 0 && (
                <div className="bg-white/3 border border-white/5 rounded-xl p-4 space-y-2.5 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>{formatETB(room.price)} × {nights} night{nights > 1 ? 's' : ''}</span>
                    <span>{formatETB(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>VAT (15%)</span>
                    <span>{formatETB(vat)}</span>
                  </div>
                  <div className="flex justify-between text-white font-semibold pt-2 border-t border-white/10">
                    <span>Total</span>
                    <span className="text-amber-400">{formatETB(total)}</span>
                  </div>
                </div>
              )}

              <Button
                variant="gold"
                fullWidth
                size="lg"
                leftIcon={<Calendar className="w-4 h-4" />}
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set('roomId', room._id);
                  if (checkIn) params.set('checkIn', checkIn);
                  if (checkOut) params.set('checkOut', checkOut);
                  navigate(`/booking?${params.toString()}`);
                }}
              >
                {nights > 0 ? `Book for ${formatETB(total)}` : 'Book Now'}
              </Button>

              <Button
                variant="outline"
                fullWidth
                onClick={() => navigate('/contact')}
              >
                Ask a Question
              </Button>

              <div className="pt-3 border-t border-white/5 space-y-2">
                {[
                  'Free cancellation within 24 hours',
                  'No credit card required to reserve',
                  'Best rate guaranteed',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-white/40">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
