import { Link } from 'react-router-dom';
import { CheckCircle, Download, Home, Calendar, Phone, Mail } from 'lucide-react';
import { useBookingStore } from '../../store/bookingStore';
import { formatETB, formatDate } from '../../lib/utils';
import Button from '../ui/Button';
import { HOTEL } from '../../config/constants';
import { useEffect } from 'react';

export default function ConfirmationStep() {
  const {
    bookingRef, selectedRoom, checkIn, checkOut, nights,
    guestDetails, totalAmount, resetBooking,
  } = useBookingStore();

  useEffect(() => {
    return () => {
      // Don't reset here — let user see the confirmation
    };
  }, []);

  const subtotal = selectedRoom ? selectedRoom.price * nights : 0;
  const vat = subtotal * HOTEL.vatRate;
  const total = subtotal + vat;

  return (
    <div className="space-y-8 text-center">
      {/* Success Icon */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Booking Confirmed!
          </h2>
          <p className="text-white/50">
            Your reservation at Gashuna Hotel has been successfully confirmed.
          </p>
        </div>
      </div>

      {/* Booking Reference */}
      <div className="glass-card p-6 space-y-1">
        <p className="text-xs text-white/40 uppercase tracking-wider">Booking Reference</p>
        <p className="text-3xl font-bold text-amber-400">{bookingRef}</p>
        <p className="text-xs text-white/30">Please keep this reference number for your records</p>
      </div>

      {/* Booking Summary */}
      <div className="border border-white/10 rounded-xl p-5 text-left space-y-3">
        <h3 className="text-base font-semibold text-white mb-4">Booking Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-white/40">Guest Name</p>
            <p className="text-white font-medium">{guestDetails.fullName}</p>
          </div>
          <div>
            <p className="text-white/40">Room</p>
            <p className="text-white font-medium">{selectedRoom?.name}</p>
          </div>
          <div>
            <p className="text-white/40">Check-in</p>
            <p className="text-white font-medium">{formatDate(checkIn)}</p>
          </div>
          <div>
            <p className="text-white/40">Check-out</p>
            <p className="text-white font-medium">{formatDate(checkOut)}</p>
          </div>
          <div>
            <p className="text-white/40">Duration</p>
            <p className="text-white font-medium">{nights} night{nights > 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-white/40">Total Amount</p>
            <p className="text-amber-400 font-bold">{formatETB(total)}</p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-amber-600/5 border border-amber-600/20 rounded-xl p-5">
        <p className="text-sm font-medium text-amber-400 mb-3">Need Help?</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-white/60">
          <a href={`tel:${HOTEL.phone}`} className="flex items-center gap-2 hover:text-amber-400 transition-colors justify-center">
            <Phone className="w-4 h-4 text-amber-500" />
            {HOTEL.phone || '+251 XXX XXX XXX'}
          </a>
          <a href={`mailto:${HOTEL.email}`} className="flex items-center gap-2 hover:text-amber-400 transition-colors justify-center">
            <Mail className="w-4 h-4 text-amber-500" />
            {HOTEL.email}
          </a>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="gold"
          leftIcon={<Home className="w-4 h-4" />}
          onClick={() => { resetBooking(); }}
        >
          <Link to="/">Return Home</Link>
        </Button>
        <Button
          variant="outline"
          leftIcon={<Calendar className="w-4 h-4" />}
        >
          <Link to="/rooms">Browse More Rooms</Link>
        </Button>
      </div>

      <p className="text-xs text-white/20">
        A confirmation email has been sent to {guestDetails.email || guestDetails.phone}.
        Check-in time is from 2:00 PM. Check-out is by 12:00 PM.
      </p>
    </div>
  );
}
