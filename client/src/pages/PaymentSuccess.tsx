import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, Home, Phone } from 'lucide-react';
import { chapaAPI } from '../lib/api';
import { HOTEL } from '../config/constants';
import Spinner from '../components/ui/Spinner';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get('trx_ref') || searchParams.get('tx_ref');
  const bookingRef = searchParams.get('bookingRef');
  const [verifying, setVerifying] = useState(!!txRef);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (txRef) {
      chapaAPI.verify(txRef)
        .then(() => setVerified(true))
        .catch(() => setVerified(false))
        .finally(() => setVerifying(false));
    }
  }, [txRef]);

  if (verifying) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <Spinner size="lg" label="Verifying your payment..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-neutral-950 flex items-center justify-center">
      <div className="max-w-lg w-full mx-auto px-6 text-center">
        <div className="glass-card p-10 space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Payment Successful!
            </h1>
            <p className="text-white/50">
              Your payment has been confirmed and your booking at Gashuna Hotel is now secured.
            </p>
          </div>
          {bookingRef && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Booking Reference</p>
              <p className="text-2xl font-bold text-amber-400">{bookingRef}</p>
            </div>
          )}
          <div className="text-sm text-white/50 space-y-2">
            <p>✅ A confirmation has been sent to your contact details.</p>
            <p>🏨 Check-in from 2:00 PM on your arrival date.</p>
            <p>📞 Contact us if you have any questions.</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/" className="btn-gold w-full text-center py-3 rounded-xl flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              Return to Home
            </Link>
            <a href={`tel:${HOTEL.phone}`} className="btn-outline-gold w-full text-center py-3 rounded-xl flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" />
              Call Hotel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
