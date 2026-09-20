import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Star, MapPin, Award, Coffee } from 'lucide-react';
import { HOTEL } from '../../config/constants';

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      radius: number; opacity: number; color: string;
    }> = [];

    const colors = ['#c9a96e', '#e8d5a3', '#a07840', '#ffffff'];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(animate);
    };

    animate();
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-neutral-950" />
      <div className="absolute inset-0 bg-hotel-pattern opacity-30" />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-950" />

      {/* Gold Lines Decoration */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-600/20 rounded-full px-4 py-2 mb-8 animate-fade-in">
          <MapPin className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs text-amber-400 font-medium">
            Dangla, Awi Zone, Amhara Region, Ethiopia
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 animate-fade-in-up"
          style={{ fontFamily: 'Playfair Display, serif', lineHeight: 1.1 }}
        >
          Welcome to{' '}
          <span className="gradient-text-gold block">Gashuna Hotel</span>
        </h1>

        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-3 animate-fade-in-up delay-100 font-amharic">
          ጋሹና ሆቴል
        </p>
        <p className="text-lg text-white/50 max-w-2xl mx-auto mb-12 animate-fade-in-up delay-200">
          Experience authentic Ethiopian hospitality in the heart of Dangla.
          Where luxury meets the warmth of Awi Zone tradition.
        </p>

        {/* Quick Booking */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-10 max-w-3xl mx-auto animate-fade-in-up delay-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-left">
              <label className="text-xs text-white/40 font-medium uppercase tracking-wider">Check-in</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-transparent text-white text-sm mt-1 focus:outline-none"
              />
            </div>
            <div className="text-left border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-4 pt-3 sm:pt-0">
              <label className="text-xs text-white/40 font-medium uppercase tracking-wider">Check-out</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
                className="w-full bg-transparent text-white text-sm mt-1 focus:outline-none"
              />
            </div>
            <Link
              to={`/booking?checkIn=${checkIn}&checkOut=${checkOut}`}
              className="btn-gold flex items-center justify-center rounded-xl text-base sm:mt-0"
            >
              Check Availability
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-8 mb-12 animate-fade-in-up delay-400">
          {[
            { icon: Star, label: '4.9/5 Rating', sub: 'Guest Satisfaction' },
            { icon: Award, label: '12 Room Types', sub: 'Luxury Accommodation' },
            { icon: Coffee, label: 'Ethiopian Cuisine', sub: 'Restaurant & Coffee' },
            { icon: MapPin, label: 'Prime Location', sub: 'Dangla City Center' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="p-2 bg-amber-600/10 rounded-lg">
                <Icon className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-white/40">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up delay-500">
          <Link to="/rooms" className="btn-gold px-8 py-4 text-base rounded-xl">
            Explore Rooms
          </Link>
          <Link to="/about" className="btn-outline-gold px-8 py-4 text-base rounded-xl">
            Discover Our Story
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <p className="text-xs text-white/30 uppercase tracking-widest">Scroll</p>
        <ChevronDown className="w-5 h-5 text-amber-600/50" />
      </div>
    </section>
  );
}
