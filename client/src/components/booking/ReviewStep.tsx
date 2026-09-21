import { ArrowLeft, ArrowRight, BedDouble, User, Calendar, CreditCard, Check } from 'lucide-react';
import { useBookingStore } from '../../store/bookingStore';
import { formatETB, formatDate, classNames } from '../../lib/utils';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { HOTEL } from '../../config/constants';

const paymentMethods = [
  { value: 'chapa', label: '💳 Chapa (Telebirr, CBE Birr, Card)' },
  { value: 'cash', label: '💵 Cash at Hotel' },
  { value: 'bank_transfer', label: '🏛️ Bank Transfer' },
];

export default function ReviewStep() {
  const {
    selectedRoom, checkIn, checkOut, nights, adults, children,
    guestDetails, specialRequests, paymentMethod, totalAmount,
    setPaymentMethod, nextStep, prevStep,
  } = useBookingStore();

  const subtotal = selectedRoom ? selectedRoom.price * nights : 0;
  const vat = subtotal * HOTEL.vatRate;
  const total = subtotal + vat;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          Review Your Booking
        </h2>
        <p className="text-sm text-white/40">Please review all details before proceeding to payment</p>
      </div>

      {/* Room Summary */}
      <div className="border border-white/10 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-3">
          <BedDouble className="w-4 h-4" />
          Room Details
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-white/40">Room</p>
            <p className="text-white font-medium">{selectedRoom?.name}</p>
          </div>
          <div>
            <p className="text-white/40">Type</p>
            <p className="text-white font-medium capitalize">{selectedRoom?.type?.replace(/_/g, ' ')}</p>
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
            <p className="text-white font-medium">{nights} night{nights !== 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-white/40">Guests</p>
            <p className="text-white font-medium">{adults} adult{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} child${children > 1 ? 'ren' : ''}` : ''}</p>
          </div>
        </div>
      </div>

      {/* Guest Summary */}
      <div className="border border-white/10 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-3">
          <User className="w-4 h-4" />
          Guest Information
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-white/40">Full Name</p>
            <p className="text-white font-medium">{guestDetails.fullName}</p>
          </div>
          <div>
            <p className="text-white/40">Phone</p>
            <p className="text-white font-medium">{guestDetails.phone}</p>
          </div>
          <div>
            <p className="text-white/40">Nationality</p>
            <p className="text-white font-medium">{guestDetails.nationality}</p>
          </div>
          <div>
            <p className="text-white/40">ID</p>
            <p className="text-white font-medium">{guestDetails.idType?.replace(/_/g, ' ')} — {guestDetails.idNumber}</p>
          </div>
          {specialRequests && (
            <div className="col-span-2">
              <p className="text-white/40">Special Requests</p>
              <p className="text-white font-medium">{specialRequests}</p>
            </div>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-5 space-y-2.5">
        <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-3">
          <CreditCard className="w-4 h-4" />
          Price Breakdown
        </div>
        <div className="flex justify-between text-sm text-white/60">
          <span>{formatETB(selectedRoom?.price || 0)} × {nights} night{nights > 1 ? 's' : ''}</span>
          <span>{formatETB(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-white/60">
          <span>VAT (15% — ERCA)</span>
          <span>{formatETB(vat)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
          <span>Total Amount</span>
          <span className="text-amber-400">{formatETB(total)}</span>
        </div>
      </div>

      {/* Payment Method */}
      <Select
        label="Payment Method"
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        options={paymentMethods}
      />

      <div className="flex gap-4 pt-2">
        <Button variant="ghost" onClick={prevStep} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button
          variant="gold"
          fullWidth
          onClick={nextStep}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
}
