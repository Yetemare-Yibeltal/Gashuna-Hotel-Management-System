import { TrendingUp, TrendingDown, Minus, Brain, RefreshCw } from 'lucide-react';
import { classNames, formatETB } from '../../lib/utils';
import Spinner from '../ui/Spinner';

interface PredictionData {
  prediction: number;
  unit: string;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  reasoning: string;
  weeklyBreakdown: Array<{ week: number; predicted: number }>;
  factors: string[];
  risks: string[];
}

interface AIPredictionCardProps {
  type: 'occupancy' | 'revenue';
  data?: PredictionData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function AIPredictionCard({ type, data, isLoading, onRefresh }: AIPredictionCardProps) {
  const isOccupancy = type === 'occupancy';

  const trendIcon = data?.trend === 'increasing'
    ? <TrendingUp className="w-5 h-5 text-emerald-400" />
    : data?.trend === 'decreasing'
    ? <TrendingDown className="w-5 h-5 text-red-400" />
    : <Minus className="w-5 h-5 text-white/40" />;

  const trendColor = data?.trend === 'increasing'
    ? 'text-emerald-400'
    : data?.trend === 'decreasing'
    ? 'text-red-400'
    : 'text-white/40';

  const confidenceColor = (data?.confidence || 0) >= 0.7
    ? 'bg-emerald-500'
    : (data?.confidence || 0) >= 0.5
    ? 'bg-amber-500'
    : 'bg-red-500';

  return (
    <div className="glass-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl">
            <Brain className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              {isOccupancy ? 'Occupancy Prediction' : 'Revenue Prediction'}
            </h3>
            <p className="text-xs text-white/40">Next 30 days forecast</p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
          >
            <RefreshCw className={classNames('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="md" label="Generating AI prediction..." />
        </div>
      ) : data ? (
        <>
          {/* Main Prediction */}
          <div className="flex items-end gap-4">
            <div>
              <p className="text-4xl font-bold text-white">
                {isOccupancy
                  ? `${data.prediction}%`
                  : formatETB(data.prediction)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {trendIcon}
                <span className={classNames('text-sm font-medium capitalize', trendColor)}>
                  {data.trend}
                </span>
              </div>
            </div>
            {/* Confidence */}
            <div className="flex-1 pb-1">
              <div className="flex justify-between text-xs text-white/40 mb-1.5">
                <span>AI Confidence</span>
                <span>{Math.round(data.confidence * 100)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={classNames('h-full rounded-full transition-all', confidenceColor)}
                  style={{ width: `${data.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Weekly Breakdown */}
          <div>
            <p className="text-xs text-white/40 mb-3 font-medium uppercase tracking-wider">
              Weekly Breakdown
            </p>
            <div className="grid grid-cols-4 gap-2">
              {data.weeklyBreakdown.map((week) => {
                const maxVal = Math.max(...data.weeklyBreakdown.map((w) => w.predicted));
                const heightPct = maxVal > 0 ? (week.predicted / maxVal) * 100 : 0;
                return (
                  <div key={week.week} className="flex flex-col items-center gap-1.5">
                    <div className="w-full h-16 bg-white/5 rounded-lg relative overflow-hidden">
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-amber-600/40 rounded-lg transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/40">W{week.week}</p>
                    <p className="text-xs text-white font-medium">
                      {isOccupancy
                        ? `${week.predicted}%`
                        : `${(week.predicted / 1000).toFixed(0)}K`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reasoning */}
          <div className="bg-white/3 border border-white/5 rounded-xl p-4">
            <p className="text-xs text-amber-500 font-medium mb-1.5">AI Analysis</p>
            <p className="text-xs text-white/60 leading-relaxed">{data.reasoning}</p>
          </div>

          {/* Factors & Risks */}
          <div className="grid grid-cols-2 gap-4">
            {data.factors.length > 0 && (
              <div>
                <p className="text-xs text-emerald-400 font-medium mb-2">Key Factors</p>
                <ul className="space-y-1">
                  {data.factors.slice(0, 3).map((f, i) => (
                    <li key={i} className="text-xs text-white/50 flex items-start gap-1.5">
                      <span className="text-emerald-400 mt-0.5">↑</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.risks.length > 0 && (
              <div>
                <p className="text-xs text-red-400 font-medium mb-2">Risk Factors</p>
                <ul className="space-y-1">
                  {data.risks.slice(0, 3).map((r, i) => (
                    <li key={i} className="text-xs text-white/50 flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">↓</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-white/30 text-sm">
          No prediction data available. Click refresh to generate.
        </div>
      )}
    </div>
  );
}
