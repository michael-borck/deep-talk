import React from 'react';
import { Gauge, CheckCircle2, AlertCircle } from 'lucide-react';
import { ConversationQuality, ConversationInsights } from '../services/conversationMetricsService';

interface ConversationQualityCardProps {
  quality: ConversationQuality;
  insights: ConversationInsights;
}

const ratingColor = {
  excellent: 'text-emerald-600',
  good: 'text-primary-600',
  fair: 'text-amber-600',
  low: 'text-red-500',
};

const ratingBg = {
  excellent: 'bg-emerald-500',
  good: 'bg-primary-500',
  fair: 'bg-amber-500',
  low: 'bg-red-400',
};

const scoreColor = (score: number): string => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-primary-700';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-500';
};

const scoreLabel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs review';
};

export const ConversationQualityCard: React.FC<ConversationQualityCardProps> = ({
  quality,
  insights,
}) => {
  const factors: Array<{ key: keyof typeof quality.factors; label: string; description: string }> = [
    { key: 'clarity', label: 'Clarity', description: 'Few filler words' },
    { key: 'depth', label: 'Depth', description: 'Substantive turn length' },
    { key: 'balance', label: 'Balance', description: 'Even speaker contribution' },
    { key: 'pace', label: 'Pace', description: 'Natural speaking rate' },
  ];

  return (
    <div className="card-static p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <Gauge size={18} className="text-accent-500" />
          Conversation Quality
        </h3>
        <div className="text-right">
          <div className={`text-3xl font-display font-bold ${scoreColor(quality.score)}`}>
            {quality.score}
            <span className="text-sm text-surface-400 font-sans font-normal">/100</span>
          </div>
          <div className={`text-xs font-medium ${scoreColor(quality.score)}`}>
            {scoreLabel(quality.score)}
          </div>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {factors.map(({ key, label, description }) => {
          const score = quality.factors[key];
          const rating = quality.ratings[key];
          const pct = (score / 25) * 100;
          return (
            <div key={key}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-medium text-surface-700">{label}</span>
                <span className={`text-xs font-medium ${ratingColor[rating]}`}>
                  {score}/25
                </span>
              </div>
              <div className="w-full bg-surface-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${ratingBg[rating]} transition-all duration-700 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-surface-400 mt-1">{description}</p>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      {(insights.strengths.length > 0 || insights.observations.length > 0) && (
        <div className="border-t border-surface-100 pt-4 space-y-3">
          {insights.strengths.length > 0 && (
            <div>
              <h4 className="label mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-emerald-500" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {insights.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-surface-600 flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {insights.observations.length > 0 && (
            <div>
              <h4 className="label mb-2 flex items-center gap-1.5">
                <AlertCircle size={11} className="text-amber-500" />
                Observations
              </h4>
              <ul className="space-y-1">
                {insights.observations.map((o, i) => (
                  <li key={i} className="text-xs text-surface-600 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
