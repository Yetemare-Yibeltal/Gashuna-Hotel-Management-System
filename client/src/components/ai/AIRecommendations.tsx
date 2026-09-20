import { Star, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatETB } from '../../lib/utils';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

interface RoomRecommendation {
  topRecommendation: {
    roomId: string;
    roomName: string;
    reason: string;
  };
  alternatives: Array<{
    roomId: string;
    roomName: string;
    reason: string;
  }>;
  personalizedMessage: string;
  upsellOpportunity: string;
}

interface AIRecommendationsProps {
  data?: RoomRecommendation;
  isLoading?: boolean;
  guestName?: string;
}

export default function AIRecommendations({ data, isLoading, guestName }: AIRecommendationsProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="glass-card p-6 flex justify-center py-12">
        <Spinner size="md" label="Generating personalized recommendations..." />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-500/10 rounded-xl">
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">AI Room Recommendations</h3>
          {guestName && <p className="text-xs text-white/40">Personalized for {guestName}</p>}
        </div>
      </div>

      {/* Personalized Message */}
      <div className="bg-amber-600/10 border border-amber-600/20 rounded-xl p-4">
        <p className="text-sm text-white/80 italic">&ldquo;{data.personalizedMessage}&rdquo;</p>
      </div>

      {/* Top Recommendation */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <p className="text-xs text-amber-500 font-semibold uppercase tracking-wider">
            Top Pick
          </p>
        </div>
        <div className="bg-white/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-semibold text-white">{data.topRecommendation.roomName}</p>
            <Button
              variant="gold"
              size="sm"
              rightIcon={<ArrowRight className="w-3 h-3" />}
              onClick={() => navigate(`/rooms/${data.topRecommendation.roomId}`)}
            >
              View
            </Button>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">{data.topRecommendation.reason}</p>
        </div>
      </div>

      {/* Alternatives */}
      {data.alternatives.length > 0 && (
        <div>
          <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-3">
            Alternative Options
          </p>
          <div className="space-y-2">
            {data.alternatives.map((alt) => (
              <div
                key={alt.roomId}
                className="flex items-center justify-between bg-white/3 border border-white/5 rounded-xl p-3 gap-3 hover:bg-white/5 transition-all cursor-pointer"
                onClick={() => navigate(`/rooms/${alt.roomId}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{alt.roomName}</p>
                  <p className="text-xs text-white/40 truncate">{alt.reason}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/30 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upsell */}
      {data.upsellOpportunity && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-emerald-400 font-medium mb-1">💡 Suggestion</p>
          <p className="text-xs text-white/60">{data.upsellOpportunity}</p>
        </div>
      )}
    </div>
  );
}
