import { useState } from 'react';
import { ArrowLeft, CreditCard, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { useBookingStore } from '../../store/bookingStore';
import { formatETB } from '../../lib/utils';
import Button from '../ui/Button';
import { useCreateBooking } from '../../hooks/useBooking';
import { chapaAPI } from '../../lib/api';
import toast from 'react-hot-toast';
import { HOTEL } from '../../config/constants';

export default function ChapaPaymentStep() {
  const {
    selectedRoom, checkIn, checkOut, nights, adults, children,
    guestDetails, specialRequests, paymentMethod, totalAmount,
    setBookingRef, nextStep, prevStep,
  } = useBookingStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const { mutateAsync: createBooking } = useCreateBooking();

  const subtotal = selectedRoom ? selectedRoom.price * nights : 0;
  const vat = subtotal * HOTEL.vatRate;
  const total = subtotal + vat;

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Create the booking
      const bookingRes = await createBooking({
        roomId: selectedRoom._id,
        checkIn,
        checkOut,
        adults,
        children,
        guestFullName: guestDetails.fullName,
        guestPhone: guestDetails.phone,
        guestEmail: guestDetails.email,
        guestNationality: guestDetails.nationality,
        idType: guestDetails.idType,
        idNumber: guestDetails.idNumber,
        specialRequests,
        paymentMethod,
      });

      const bookingRef = bookingRes.data.booking?.bookingRef;
      setBookingRef(bookingRef);

      if (paymentMethod === 'chapa') {
        // 2. Initialize Chapa payment
        const chapaRes = await chapaAPI.initialize({
          bookingId: bookingRes.data.booking?._id,
          amount: total,
          currency: 'ETB',
          email: guestDetails.email || `${guestDetails.phone}@gashuna.com`,
          firstName: guestDetails.fullName.split(' ')[0],
          lastName: guestDetails.fullName.split(' ').slice(1).join(' ') || 'Guest',
          phone: guestDetails.phone,
          returnUrl: `${window.location.origin}/payment/success?bookingRef=${bookingRef}`,
          cancelUrl: `${window.location.origin}/payment/failed?bookingRef=${bookingRef}`,
          description: `Gashuna Hotel — ${selectedRoom.name} — ${nights} night${nights > 1 ? 's' : ''}`,
        });

        // 3. Redirect to Chapa checkout
        if (chapaRes.data.checkoutUrl) {
          window.location.href = chapaRes.data.checkoutUrl;
          return;
        }
      }

      // Cash or bank transfer — go to confirmation
      nextStep();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment initialization failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isCash = paymentMethod === 'cash' || paymentMethod === 'bank_transfer';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          {isCash ? 'Confirm Your Booking' : 'Secure Payment'}
        </h2>
        <p className="text-sm text-white/40">
          {isCash
            ? 'Your booking will be confirmed and you will pay on arrival.'
            : 'You will be redirected to Chapa secure payment gateway.'}
        </p>
      </div>

      {/* Amount Summary */}
      <div className="glass-card p-6 text-center space-y-2">
        <p className="text-white/40 text-sm">Total Amount Due</p>
        <p className="text-5xl font-bold text-amber-400">{formatETB(total)}</p>
        <p className="text-white/30 text-xs">Includes 15% VAT (ERCA)</p>
        <div className="pt-3 border-t border-white/10 mt-3">
          <p className="text-sm text-white/60">
            <span className="font-medium text-white">{selectedRoom?.name}</span>
            {' · '}{nights} night{nights > 1 ? 's' : ''}
            {' · '}{guestDetails.fullName}
          </p>
        </div>
      </div>

      {/* Payment Method Display */}
      <div className="border border-white/10 rounded-xl p-4 flex items-center gap-3">
        <CreditCard className="w-5 h-5 text-amber-500" />
        <div>
          <p className="text-sm font-medium text-white">
            {paymentMethod === 'chapa' && 'Chapa Payment Gateway'}
            {paymentMethod === 'cash' && 'Cash Payment at Hotel'}
            {paymentMethod === 'bank_transfer' && 'Bank Transfer'}
          </p>
          <p className="text-xs text-white/40">
            {paymentMethod === 'chapa' && 'Supports Telebirr, CBE Birr, Awash, Dashen, Card'}
            {paymentMethod === 'cash' && 'Pay in ETB at front desk upon arrival'}
            {paymentMethod === 'bank_transfer' && 'Transfer to Gashuna Hotel bank account'}
          </p>
        </div>
      </div>

      {/* Security Note */}
      <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
        <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-emerald-400">Secure & Safe</p>
          <p className="text-xs text-white/50 mt-0.5">
            Your payment and personal information are protected with bank-level encryption.
            Gashuna Hotel is registered with ERCA and all transactions are VAT compliant.
          </p>
        </div>
      </div>

      {isCash && (
        <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-white/50">
            By confirming, you agree to pay {formatETB(total)} in cash upon check-in at Gashuna Hotel.
            Your room will be held for 24 hours. Cancellations must be made at least 24 hours before check-in.
          </p>
        </div>
      )}

      <div className="flex gap-4 pt-2">
        <Button variant="ghost" onClick={prevStep} leftIcon={<ArrowLeft className="w-4 h-4" />} disabled={isProcessing}>
          Back
        </Button>
        <Button
          variant="gold"
          fullWidth
          size="lg"
          isLoading={isProcessing}
          onClick={handlePayment}
          leftIcon={<CreditCard className="w-4 h-4" />}
        >
          {isCash
            ? 'Confirm Booking'
            : `Pay ${formatETB(total)} via Chapa`
          }
        </Button>
      </div>
    </div>
  );
}
