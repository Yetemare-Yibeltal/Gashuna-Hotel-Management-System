import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="text-8xl font-bold text-amber-600/20 mb-6 select-none" style={{ fontFamily: 'Playfair Display, serif' }}>
          404
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            Page Not Found
          </h1>
          <p className="text-white/50">
            The page you are looking for might have been removed, had its name changed,
            or is temporarily unavailable.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-gold flex items-center gap-2 justify-center">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link to="/rooms" className="btn-outline-gold flex items-center gap-2 justify-center">
            <Search className="w-4 h-4" />
            Browse Rooms
          </Link>
        </div>
        <p className="text-white/20 text-xs mt-8">
          Gashuna Hotel · Dangla, Awi Zone, Amhara Region, Ethiopia
        </p>
      </div>
    </div>
  );
}
