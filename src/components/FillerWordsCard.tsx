import React from 'react';
import { MessageSquareWarning } from 'lucide-react';
import { FillerWordResult } from '../services/conversationMetricsService';

interface FillerWordsCardProps {
  fillerWords: FillerWordResult;
  totalWords: number;
}

const ratingBand = (pct: number): { label: string; color: string; bg: string } => {
  if (pct <= 2) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-500' };
  if (pct <= 5) return { label: 'Good', color: 'text-primary-600', bg: 'bg-primary-500' };
  if (pct <= 10) return { label: 'Noticeable', color: 'text-amber-600', bg: 'bg-amber-500' };
  return { label: 'High', color: 'text-red-500', bg: 'bg-red-400' };
};

export const FillerWordsCard: React.FC<FillerWordsCardProps> = ({ fillerWords, totalWords }) => {
  if (totalWords === 0) return null;

  const band = ratingBand(fillerWords.percentage);
  const pctRounded = fillerWords.percentage.toFixed(1);
  // Bar visualises filler density on a 0–15% range (above 15% is just "very high")
  const barPct = Math.min((fillerWords.percentage / 15) * 100, 100);

  return (
    <div className="card-static p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title flex items-center gap-2">
          <MessageSquareWarning size={18} className="text-accent-500" />
          Filler Words
        </h3>
        <div className="text-right">
          <div className={`text-2xl font-display font-bold ${band.color}`}>
            {pctRounded}%
          </div>
          <div className={`text-xs font-medium ${band.color}`}>{band.label}</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline justify-between text-xs text-surface-500 mb-1">
          <span>{fillerWords.count} fillers in {totalWords.toLocaleString()} words</span>
          <span className="text-surface-400">15%+ scale</span>
        </div>
        <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full ${band.bg} transition-all duration-700 ease-out`}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>

      {fillerWords.topFillers.length > 0 ? (
        <div>
          <h4 className="label mb-2">Most common</h4>
          <div className="flex flex-wrap gap-1.5">
            {fillerWords.topFillers.map(({ word, count }) => (
              <span
                key={word}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-100 text-surface-700 text-xs"
              >
                <span className="font-medium">{word}</span>
                <span className="text-surface-400 tabular-nums">{count}</span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-surface-400">No filler words detected</p>
      )}
    </div>
  );
};
