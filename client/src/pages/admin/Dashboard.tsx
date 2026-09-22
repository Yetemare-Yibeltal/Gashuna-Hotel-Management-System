import { useQuery } from '@tanstack/react-query';
import {
  BedDouble, Users, Calendar, DollarSign,
  TrendingUp, AlertTriangle, CheckCircle,
  Clock, ArrowRight, Wrench, UtensilsCrossed,
} from 'lucide-react';
import { dashboardAPI } from '../../lib/api';
import { formatETB, formatDate, timeAgo, classNames } from '../../lib/utils';
import StatCard from '../../components/ui/StatCard';
import SectionHeader from '../../components/ui/SectionHeader';
import { SkeletonStatCard } from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardAPI.getStats(),
    select: (d) => d.data,
    refetchInterval: 60000,
  });

  const stats = data?.stats;
  const recentBookings = data?.recentBookings || [];
  const alerts = data?.alerts || [];
  const roomStatusBreakdown = data?.roomStatusBreakdown || {};
  const todayRevenue = stats?.todayRevenue || 0;
  const monthRevenue = stats?.monthRevenue || 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            {greeting}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {formatDate(new Date())} · Gashuna Hotel Dashboard
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/reservations" className="btn-gold text-sm px-4 py-2">
            New Booking
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard
              title="Today's Revenue"
              value={formatETB(todayRevenue)}
              icon={<DollarSign className="w-5 h-5 text-amber-500" />}
              iconBg="bg-amber-500/10"
              trend={stats?.revenueTrend}
              trendLabel="vs yesterday"
              valueColor="text-amber-400"
            />
            <StatCard
              title="Monthly Revenue"
              value={formatETB(monthRevenue)}
              icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
              iconBg="bg-emerald-500/10"
              subtitle={`${stats?.monthBookings || 0} bookings`}
            />
            <StatCard
              title="Occupancy Rate"
              value={`${stats?.occupancyRate || 0}%`}
              icon={<BedDouble className="w-5 h-5 text-blue-500" />}
              iconBg="bg-blue-500/10"
              subtitle={`${stats?.occupiedRooms || 0} of ${stats?.totalRooms || 0} rooms`}
            />
            <StatCard
              title="Today's Check-ins"
              value={stats?.todayCheckIns || 0}
              icon={<Calendar className="w-5 h-5 text-purple-500" />}
              iconBg="bg-purple-500/10"
              subtitle={`${stats?.todayCheckOuts || 0} check-outs`}
            />
          </>
        )}
      </div>

      {/* Room Status Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { key: 'available', label: 'Available', color: 'emerald', icon: CheckCircle },
          { key: 'occupied', label: 'Occupied', color: 'red', icon: BedDouble },
          { key: 'cleaning', label: 'Cleaning', color: 'amber', icon: Clock },
          { key: 'maintenance', label: 'Maintenance', color: 'blue', icon: Wrench },
          { key: 'reserved', label: 'Reserved', color: 'purple', icon: Calendar },
        ].map(({ key, label, color, icon: Icon }) => (
          <div key={key} className="glass-card p-4 text-center">
            <Icon className={`w-5 h-5 text-${color}-400 mx-auto mb-2`} />
            <p className={`text-2xl font-bold text-${color}-400`}>
              {isLoading ? '—' : roomStatusBreakdown[key] || 0}
            </p>
            <p className="text-xs text-white/40 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              Recent Bookings
            </h3>
            <Link to="/admin/reservations" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
              ))
            ) : recentBookings.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">No recent bookings</p>
            ) : (
              recentBookings.slice(0, 5).map((booking: any) => (
                <div key={booking._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-amber-600/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {booking.guest?.fullName || 'Unknown Guest'}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      {booking.room?.name} · {booking.nights} night{booking.nights > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={
                      booking.status === 'confirmed' ? 'info' :
                      booking.status === 'checked_in' ? 'success' :
                      booking.status === 'pending' ? 'warning' :
                      booking.status === 'cancelled' ? 'error' : 'gray'
                    }>
                      {booking.status?.replace(/_/g, ' ')}
                    </Badge>
                    <p className="text-xs text-white/30 mt-1">{timeAgo(booking.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              Alerts & Actions Required
            </h3>
            <Badge variant="error">{alerts.length} alerts</Badge>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
              ))
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-white/30 text-sm">All clear! No alerts.</p>
              </div>
            ) : (
              alerts.slice(0, 6).map((alert: any, idx: number) => (
                <div key={idx} className={classNames(
                  'flex items-start gap-3 p-3 rounded-xl border',
                  alert.severity === 'high' ? 'bg-red-500/5 border-red-500/20' :
                  alert.severity === 'medium' ? 'bg-amber-500/5 border-amber-500/20' :
                  'bg-blue-500/5 border-blue-500/10'
                )}>
                  <AlertTriangle className={classNames(
                    'w-4 h-4 shrink-0 mt-0.5',
                    alert.severity === 'high' ? 'text-red-400' :
                    alert.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{alert.title}</p>
                    <p className="text-xs text-white/40 mt-0.5">{alert.message}</p>
                  </div>
                  {alert.link && (
                    <Link to={alert.link} className="text-xs text-amber-400 hover:text-amber-300 shrink-0">
                      View
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-base font-semibold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Calendar, label: 'New Booking', path: '/admin/reservations', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: BedDouble, label: 'Room Status', path: '/admin/rooms', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: UtensilsCrossed, label: 'Food Orders', path: '/admin/food-orders', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { icon: Wrench, label: 'Maintenance', path: '/admin/maintenance', color: 'text-red-400', bg: 'bg-red-500/10' },
          ].map(({ icon: Icon, label, path, color, bg }) => (
            <Link
              key={path}
              to={path}
              className="glass-card p-5 flex flex-col items-center gap-3 text-center hover:bg-white/[0.08] hover:-translate-y-1 transition-all duration-200"
            >
              <div className={classNames('p-3 rounded-xl', bg)}>
                <Icon className={classNames('w-5 h-5', color)} />
              </div>
              <span className="text-sm font-medium text-white/70">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
