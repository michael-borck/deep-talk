import React from 'react';
import { PieChart, Scale } from 'lucide-react';
import { TalkTimeResult } from '../services/conversationMetricsService';

interface TalkTimeCardProps {
  talkTime: TalkTimeResult;
}

// Stable colour palette matched to TimestampedTranscript speaker badges
const SPEAKER_BAR_COLORS = [
  'bg-primary-500',
  'bg-accent-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-400',
  'bg-violet-500',
];

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

export const TalkTimeCard: React.FC<TalkTimeCardProps> = ({ talkTime }) => {
  if (!talkTime || talkTime.speakers.length === 0) return null;

  return (
    <div className="card-static p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <PieChart size={18} className="text-accent-500" />
          Talk-Time Distribution
        </h3>
        <div className={`badge ${talkTime.isBalanced ? 'badge-success' : 'badge-warning'}`}>
          <Scale size={11} />
          {talkTime.isBalanced ? 'Balanced' : 'Unbalanced'}
        </div>
      </div>

      {/* Stacked horizontal bar showing all speakers proportionally */}
      <div className="mb-5">
        <div className="flex w-full h-3 rounded-full overflow-hidden bg-surface-100">
          {talkTime.speakers.map((speaker, idx) => (
            <div
              key={speaker.speaker}
              className={`${SPEAKER_BAR_COLORS[idx % SPEAKER_BAR_COLORS.length]} transition-all duration-700 ease-out`}
              style={{ width: `${speaker.percentage}%` }}
              title={`${speaker.speaker}: ${speaker.percentage.toFixed(1)}%`}
            />
          ))}
        </div>
      </div>

      {/* Per-speaker breakdown */}
      <div className="space-y-3">
        {talkTime.speakers.map((speaker, idx) => {
          const colorClass = SPEAKER_BAR_COLORS[idx % SPEAKER_BAR_COLORS.length];
          return (
            <div key={speaker.speaker}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                  <span className="text-sm font-medium text-surface-800">{speaker.speaker}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-surface-500">
                  <span className="tabular-nums">{speaker.wordCount.toLocaleString()} words</span>
                  {speaker.durationSeconds && speaker.durationSeconds > 0 && (
                    <span className="tabular-nums">{formatDuration(speaker.durationSeconds)}</span>
                  )}
                  <span className={`font-semibold tabular-nums w-12 text-right ${idx === 0 ? 'text-surface-800' : 'text-surface-500'}`}>
                    {speaker.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${colorClass} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.max(speaker.percentage, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {!talkTime.isBalanced && talkTime.dominantSpeaker && (
        <p className="text-xs text-surface-500 mt-4 pt-4 border-t border-surface-100">
          <span className="font-medium text-surface-700">{talkTime.dominantSpeaker}</span> dominates
          this conversation. Consider whether the imbalance reflects roles (interviewer/interviewee,
          teacher/student) or could indicate one-sided dynamics.
        </p>
      )}
    </div>
  );
};
