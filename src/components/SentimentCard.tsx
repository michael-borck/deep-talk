import React from 'react';
import { Smile, Frown, Meh, Heart } from 'lucide-react';

interface SentimentCardProps {
  sentiment?: string;
  score?: number;
  emotions?: Record<string, number>;
  variant?: 'compact' | 'full';
}

const sentimentConfig = {
  positive: { Icon: Smile, label: 'Positive', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  negative: { Icon: Frown, label: 'Negative', cls: 'bg-red-50 text-red-700 border-red-200' },
  neutral:  { Icon: Meh,   label: 'Neutral',  cls: 'bg-surface-100 text-surface-700 border-surface-200' },
};

export const SentimentCard: React.FC<SentimentCardProps> = ({
  sentiment,
  score,
  emotions,
  variant = 'full',
}) => {
  if (!sentiment && !emotions) return null;

  const config = sentiment ? sentimentConfig[sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral : null;
  const SentimentIcon = config?.Icon;

  const topEmotions = emotions
    ? Object.entries(emotions)
        .filter(([_, value]) => value > 0.1)
        .sort(([, a], [, b]) => b - a)
        .slice(0, variant === 'compact' ? 3 : 6)
    : [];

  if (variant === 'compact') {
    return (
      <div className="card-static p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title flex items-center gap-2">
            <Heart size={16} className="text-accent-500" />
            Tone & Feeling
          </h3>
        </div>
        <div className="flex items-center gap-3 mb-4">
          {config && SentimentIcon && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.cls}`}>
              <SentimentIcon size={13} />
              {config.label}
            </div>
          )}
          {score !== undefined && (
            <span className="text-xs text-surface-500">
              Score: {score > 0 ? '+' : ''}{score.toFixed(2)}
            </span>
          )}
        </div>
        {topEmotions.length > 0 && (
          <div className="space-y-1.5">
            {topEmotions.map(([emotion, value]) => (
              <EmotionBar key={emotion} emotion={emotion} value={value} compact />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card-static p-6">
      <h3 className="section-title flex items-center gap-2 mb-5">
        <Heart size={18} className="text-accent-500" />
        Sentiment & Emotional Tone
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sentiment && config && SentimentIcon && (
          <div>
            <h4 className="label mb-2">Overall Sentiment</h4>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${config.cls}`}>
                <SentimentIcon size={15} />
                {config.label}
              </div>
              {score !== undefined && (
                <span className="text-sm text-surface-500">
                  ({score > 0 ? '+' : ''}{score.toFixed(2)})
                </span>
              )}
            </div>
            {score !== undefined && (
              <div className="mt-3">
                <SentimentScoreBar score={score} />
              </div>
            )}
          </div>
        )}

        {topEmotions.length > 0 && (
          <div>
            <h4 className="label mb-2">Emotional Tone</h4>
            <div className="space-y-2">
              {topEmotions.map(([emotion, value]) => (
                <EmotionBar key={emotion} emotion={emotion} value={value} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EmotionBar: React.FC<{ emotion: string; value: number; compact?: boolean }> = ({
  emotion,
  value,
  compact,
}) => {
  const pct = Math.round(value * 100);
  const barColor =
    value > 0.6 ? 'bg-accent-500' :
    value > 0.3 ? 'bg-accent-400' :
    'bg-accent-300';

  return (
    <div className="flex items-center gap-2">
      <span className={`text-${compact ? 'xs' : 'sm'} text-surface-600 capitalize ${compact ? 'w-16' : 'w-20'} flex-shrink-0`}>
        {emotion}
      </span>
      <div className="flex-1 bg-surface-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-surface-400 w-8 text-right tabular-nums">{pct}%</span>
    </div>
  );
};

const SentimentScoreBar: React.FC<{ score: number }> = ({ score }) => {
  // -1 to +1 -> 0% to 100%
  const pct = ((score + 1) / 2) * 100;
  return (
    <div className="relative w-full h-1.5 bg-gradient-to-r from-red-200 via-surface-200 to-emerald-200 rounded-full">
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-surface-800 rounded-full border-2 border-white shadow-sm"
        style={{ left: `calc(${pct}% - 6px)` }}
      />
      <div className="flex justify-between text-[10px] text-surface-400 mt-2">
        <span>Negative</span>
        <span>Neutral</span>
        <span>Positive</span>
      </div>
    </div>
  );
};
