import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Hotel, Lock, Mail, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { HOTEL } from '../../config/constants';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    const success = await login(data.email, data.password);
    if (success) navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-neutral-950 to-amber-950/20" />
      <div className="absolute inset-0 bg-hotel-pattern opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600/10 border border-amber-600/20 rounded-2xl mb-5">
            <Hotel className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            <span className="gradient-text-gold">Gashuna</span> Hotel
          </h1>
          <p className="text-white/40 text-sm">Admin Management System</p>
          <p className="text-white/20 text-xs mt-1">Dangla, Awi Zone, Amhara Region, Ethiopia</p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-white">Staff Sign In</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="your@gashuna.com"
              required
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                required
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div className="pt-2">
              <Button
                variant="gold"
                fullWidth
                size="lg"
                type="submit"
                isLoading={isLoading}
              >
                Sign In to Dashboard
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-xs text-white/30 text-center">
              For account access, contact your hotel administrator.
            </p>
            <p className="text-xs text-white/20 text-center mt-1">
              {HOTEL.email}
            </p>
          </div>
        </div>

        {/* Default Credentials Hint - remove in production */}
        <div className="mt-4 glass-card p-4 border-amber-600/20">
          <p className="text-xs text-amber-500/60 text-center font-medium mb-2">
            Default Admin Credentials
          </p>
          <div className="space-y-1 text-center">
            <p className="text-xs text-white/30">Email: admin@gashuna.com</p>
            <p className="text-xs text-white/30">Password: Gashuna@2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
