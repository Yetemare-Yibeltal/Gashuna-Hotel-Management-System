import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { classNames } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: number;
  trendLabel?: string;
  iconBg?: string;
  valueColor?: string;
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  iconBg = 'bg-amber-500/10',
  valueColor = 'text-white',
  loading = false,
}: StatCardProps) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;
  const trendNeutral = trend !== undefined && trend === 0;

  if (loading) {
    return (
      <div className="glass-card p-6 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-10 bg-white/10 rounded-xl animate-pulse" />
        </div>
        <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 hover:bg-white/[0.07] transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-white/60">{title}</p>
        {icon && (
          <div className={classNames('p-2.5 rounded-xl', iconBg)}>
            {icon}
          </div>
        )}
      </div>
      <p className={classNames('text-2xl font-bold mb-1', valueColor)}>{value}</p>
      {(subtitle || trend !== undefined) && (
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span
              className={classNames(
                'flex items-center gap-1 text-xs font-medium',
                trendPositive && 'text-emerald-400',
                trendNegative && 'text-red-400',
                trendNeutral && 'text-white/40'
              )}
            >
              {trendPositive && <TrendingUp className="w-3 h-3" />}
              {trendNegative && <TrendingDown className="w-3 h-3" />}
              {trendNeutral && <Minus className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
          {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
          {trendLabel && <p className="text-xs text-white/40">{trendLabel}</p>}
        </div>
      )}
    </div>
  );
}
