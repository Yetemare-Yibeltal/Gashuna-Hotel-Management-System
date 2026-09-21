import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, BedDouble, User, FileText, CreditCard, CheckCircle } from 'lucide-react';
import { useBookingStore } from '../store/bookingStore';
import { classNames } from '../lib/utils';
import RoomSelectStep from '../components/booking/RoomSelectStep';
import GuestDetailsStep from '../components/booking/GuestDetailsStep';
import ReviewStep from '../components/booking/ReviewStep';
import ChapaPaymentStep from '../components/booking/ChapaPaymentStep';
import ConfirmationStep from '../components/booking/ConfirmationStep';

const steps = [
  { num: 1, label: 'Select Room', icon: BedDouble },
  { num: 2, label: 'Guest Details', icon: User },
  { num: 3, label: 'Review', icon: FileText },
  { num: 4, label: 'Payment', icon: CreditCard },
  { num: 5, label: 'Confirmation', icon: CheckCircle },
];

export default function Booking() {
  const [searchParams] = useSearchParams();
  const { step, setDates, setSelectedRoom, selectedRoom } = useBookingStore();

  useEffect(() => {
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const roomId = searchParams.get('roomId');
    if (checkIn && checkOut) {
      const nights = Math.max(1, Math.ceil(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
      ));
      setDates(checkIn, checkOut, nights);
    }
  }, []);

  return (
    <div className="min-h-screen pt-28 pb-20 bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Book Your <span className="gradient-text-gold">Stay</span>
          </h1>
          <p className="text-white/40">Complete the steps below to reserve your room at Gashuna Hotel</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-12 overflow-x-auto pb-2">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div className={classNames(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2',
                  step > s.num
                    ? 'bg-amber-600 border-amber-600 text-white'
                    : step === s.num
                    ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                    : 'border-white/10 text-white/20 bg-white/5'
                )}>
                  {step > s.num
                    ? <Check className="w-5 h-5" />
                    : <s.icon className="w-4 h-4" />
                  }
                </div>
                <span className={classNames(
                  'text-xs font-medium whitespace-nowrap',
                  step === s.num ? 'text-amber-400' : step > s.num ? 'text-white/60' : 'text-white/20'
                )}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={classNames(
                  'w-12 sm:w-20 h-px mx-2 mb-5 transition-all duration-300',
                  step > s.num ? 'bg-amber-600' : 'bg-white/10'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-card p-6 md:p-8">
          {step === 1 && <RoomSelectStep />}
          {step === 2 && <GuestDetailsStep />}
          {step === 3 && <ReviewStep />}
          {step === 4 && <ChapaPaymentStep />}
          {step === 5 && <ConfirmationStep />}
        </div>
      </div>
    </div>
  );
}
