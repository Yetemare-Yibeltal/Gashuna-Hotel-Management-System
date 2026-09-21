import { useState } from 'react';
import { BedDouble, Users, Check, ArrowRight } from 'lucide-react';
import { useBookingStore } from '../../store/bookingStore';
import { useAvailableRooms } from '../../hooks/useRooms';
import { formatETB, classNames } from '../../lib/utils';
import DateRangePicker from '../ui/DateRangePicker';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { SkeletonCard } from '../ui/Skeleton';
import { calculateNights } from '../../lib/utils';

export default function RoomSelectStep() {
  const {
    checkIn, checkOut, adults, children, selectedRoomId,
    setDates, setGuests, setSelectedRoom, setTotalAmount, nextStep,
  } = useBookingStore();

  const [localCheckIn, setLocalCheckIn] = useState(checkIn);
  const [localCheckOut, setLocalCheckOut] = useState(checkOut);
  const [localAdults, setLocalAdults] = useState(adults);
  const [localChildren, setLocalChildren] = useState(children);
  const [searched, setSearched] = useState(false);

  const { data, isLoading } = useAvailableRooms({
    checkIn: localCheckIn,
    checkOut: localCheckOut,
    capacity: localAdults + localChildren,
  });

  const rooms = searched ? (data?.rooms || []) : [];

  const handleSearch = () => {
    if (!localCheckIn || !localCheckOut) return;
    setDates(localCheckIn, localCheckOut, calculateNights(localCheckIn, localCheckOut));
    setGuests(localAdults, localChildren);
    setSearched(true);
  };

  const handleSelectRoom = (room: any) => {
    const nights = calculateNights(localCheckIn, localCheckOut);
    const subtotal = room.price * nights;
    const total = subtotal * 1.15;
    setSelectedRoom(room);
    setTotalAmount(total);
    nextStep();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          Select Your Room
        </h2>
        <p className="text-sm text-white/40">Choose your dates and find available rooms</p>
      </div>

      {/* Search Form */}
      <div className="space-y-4">
        <DateRangePicker
          checkIn={localCheckIn}
          checkOut={localCheckOut}
          onCheckInChange={setLocalCheckIn}
          onCheckOutChange={setLocalCheckOut}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Adults"
            value={String(localAdults)}
            onChange={(e) => setLocalAdults(Number(e.target.value))}
            options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: `${n} Adult${n > 1 ? 's' : ''}` }))}
          />
          <Select
            label="Children"
            value={String(localChildren)}
            onChange={(e) => setLocalChildren(Number(e.target.value))}
            options={[0, 1, 2, 3].map((n) => ({ value: String(n), label: n === 0 ? 'No Children' : `${n} Child${n > 1 ? 'ren' : ''}` }))}
          />
        </div>
        <Button
          variant="gold"
          fullWidth
          onClick={handleSearch}
          disabled={!localCheckIn || !localCheckOut}
        >
          Search Available Rooms
        </Button>
      </div>

      {/* Results */}
      {searched && (
        <div>
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
            {isLoading ? 'Searching...' : `${rooms.length} Room${rooms.length !== 1 ? 's' : ''} Available`}
          </h3>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {rooms.map((room: any) => (
                <div
                  key={room._id}
                  onClick={() => handleSelectRoom(room)}
                  className={classNames(
                    'border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-amber-500/50 hover:bg-amber-500/5',
                    selectedRoomId === room._id
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-white/10 bg-white/3'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-xl bg-amber-600/10 flex items-center justify-center shrink-0">
                        <BedDouble className="w-8 h-8 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-white mb-1">{room.name}</h4>
                        <p className="text-xs text-white/40 mb-2">Room {room.roomNumber} · Floor {room.floor} · {room.view}</p>
                        <div className="flex items-center gap-3 text-xs text-white/50">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{room.capacity} guests</span>
                          <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{room.beds}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-amber-400">{formatETB(room.price)}</p>
                      <p className="text-xs text-white/30">per night</p>
                      {selectedRoomId === room._id && (
                        <div className="mt-2 flex items-center justify-end gap-1 text-amber-400 text-xs">
                          <Check className="w-3 h-3" />
                          Selected
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
