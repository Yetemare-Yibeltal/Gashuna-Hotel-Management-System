import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, TrendingUp, RefreshCw, Users, BarChart3 } from 'lucide-react';
import { aiAPI } from '../../lib/api';
import SectionHeader from '../../components/ui/SectionHeader';
import AIPredictionCard from '../../components/ai/AIPredictionCard';
import SentimentBadge from '../../components/ai/SentimentBadge';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';
import { formatETB, classNames } from '../../lib/utils';

export default function PredictionPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: occupancyData, isLoading: occLoading, refetch: refetchOcc } = useQuery({
    queryKey: ['ai-occupancy', refreshKey],
    queryFn: () => aiAPI.getOccupancyPrediction(),
    select: (d) => d.data,
  });

  const { data: revenueData, isLoading: revLoading, refetch: refetchRev } = useQuery({
    queryKey: ['ai-revenue', refreshKey],
    queryFn: () => aiAPI.getRevenuePrediction(),
    select: (d) => d.data,
  });

  const { data: guestData, isLoading: guestLoading } = useQuery({
    queryKey: ['ai-guest-analytics'],
    queryFn: () => aiAPI.getGuestAnalytics(),
    select: (d) => d.data,
  });

  const { data: bookingTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['ai-booking-trends'],
    queryFn: () => aiAPI.getBookingTrends({ months: 6 }),
    select: (d) => d.data,
  });

  const analytics = guestData?.analytics;

  const handleRefreshAll = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="AI Predictions & Analytics"
        subtitle="Data-driven insights powered by GPT-4o for Gashuna Hotel"
        actions={
          <Button
            variant="gold"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={handleRefreshAll}
          >
            Refresh All
          </Button>
        }
      />

      {/* Prediction Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        <AIPredictionCard
          type="occupancy"
          data={occupancyData?.prediction}
          isLoading={occLoading}
          onRefresh={refetchOcc}
        />
        <AIPredictionCard
          type="revenue"
          data={revenueData?.prediction}
          isLoading={revLoading}
          onRefresh={refetchRev}
        />
      </div>

      {/* Guest Analytics */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-500/10 rounded-xl">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Guest Analytics</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Guests" value={analytics?.totalGuests || 0} icon={<Users className="w-5 h-5 text-blue-500" />} iconBg="bg-blue-500/10" loading={guestLoading} />
          <StatCard title="VIP Guests" value={analytics?.vipGuests || 0} icon={<Users className="w-5 h-5 text-amber-500" />} iconBg="bg-amber-500/10" loading={guestLoading} />
          <StatCard title="Repeat Guests" value={analytics?.repeatGuests || 0} icon={<Users className="w-5 h-5 text-emerald-500" />} iconBg="bg-emerald-500/10" loading={guestLoading} />
          <StatCard
            title="Repeat Rate"
            value={`${analytics?.repeatGuestRate || 0}%`}
            icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
            iconBg="bg-purple-500/10"
            loading={guestLoading}
          />
        </div>

        {/* Nationality Breakdown */}
        {analytics?.nationalityBreakdown?.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-white/60 mb-3">Top Nationalities</p>
            <div className="space-y-2">
              {analytics.nationalityBreakdown.slice(0, 5).map((item: any, idx: number) => (
                <div key={item._id || idx} className="flex items-center gap-3">
                  <span className="text-sm text-white/70 w-24 truncate">{item._id || 'Unknown'}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-600/60 rounded-full"
                      style={{ width: `${Math.min((item.count / (analytics.totalGuests || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/40 w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Trends */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Booking Trends — Last 6 Months</h3>
        </div>
        {trendsLoading ? (
          <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
        ) : (
          <div className="space-y-3">
            {(bookingTrends?.bookingTrends || []).map((month: any, idx: number) => {
              const max = Math.max(...(bookingTrends?.bookingTrends || []).map((m: any) => m.totalBookings));
              const pct = max > 0 ? (month.totalBookings / max) * 100 : 0;
              const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-white/40 w-10 shrink-0">
                    {monthNames[month._id?.month]} {month._id?.year}
                  </span>
                  <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-amber-600/40 rounded-lg flex items-center px-2 transition-all"
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 20 && (
                        <span className="text-xs text-amber-300 font-medium">{month.totalBookings}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-white/40 w-12 text-right shrink-0">
                    {formatETB(month.totalRevenue).replace('ETB ', 'ETB ')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
