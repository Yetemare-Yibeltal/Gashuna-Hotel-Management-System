import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, Phone, RefreshCw } from 'lucide-react';
import { HOTEL } from '../config/constants';

export default function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const bookingRef = searchParams.get('bookingRef');

  return (
    <div className="min-h-screen pt-28 pb-20 bg-neutral-950 flex items-center justify-center">
      <div className="max-w-lg w-full mx-auto px-6 text-center">
        <div className="glass-card p-10 space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Payment Failed
            </h1>
            <p className="text-white/50">
              We were unable to process your payment. Your booking has not been confirmed.
              Please try again or use a different payment method.
            </p>
          </div>
          {bookingRef && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Booking Reference</p>
              <p className="text-lg font-bold text-white/70">{bookingRef}</p>
              <p className="text-xs text-white/30 mt-1">Keep this reference if you wish to retry payment</p>
            </div>
          )}
          <div className="text-sm text-white/50 space-y-2 text-left">
            <p>❌ Your card was not charged.</p>
            <p>🔄 Please try again with a different payment method.</p>
            <p>💵 You can also pay by cash or bank transfer at check-in.</p>
            <p>📞 Contact us for assistance with payment.</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/booking" className="btn-gold w-full text-center py-3 rounded-xl flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Link>
            <a href={`tel:${HOTEL.phone}`} className="btn-outline-gold w-full text-center py-3 rounded-xl flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" />
              Call for Assistance
            </a>
            <Link to="/" className="text-white/40 hover:text-white/60 text-sm flex items-center justify-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
