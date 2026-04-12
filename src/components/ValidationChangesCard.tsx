import React, { useState } from 'react';
import { Wand2, ChevronDown, ChevronRight } from 'lucide-react';

interface ValidationChange {
  type: string;
  original: string;
  corrected: string;
  position: number;
}

interface ValidationChangesCardProps {
  changes: ValidationChange[];
  defaultOpen?: boolean;
}

export const ValidationChangesCard: React.FC<ValidationChangesCardProps> = ({
  changes,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!changes || changes.length === 0) return null;

  // Group by type for the badge summary
  const counts = changes.reduce<Record<string, number>>((acc, change) => {
    acc[change.type] = (acc[change.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="card-static p-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={16} className="text-surface-400" /> : <ChevronRight size={16} className="text-surface-400" />}
          <Wand2 size={16} className="text-accent-500" />
          <h3 className="section-title">AI Corrections</h3>
          <span className="badge badge-neutral text-[10px]">
            {changes.length} change{changes.length !== 1 ? 's' : ''}
          </span>
        </div>
        {!isOpen && (
          <div className="flex items-center gap-1.5">
            {Object.entries(counts).map(([type, count]) => (
              <span key={type} className="badge badge-neutral text-[10px] capitalize">
                {type}: {count}
              </span>
            ))}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-2">
          {changes.slice(0, 20).map((change, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2 rounded-lg bg-surface-50 text-sm"
            >
              <span className="badge badge-neutral text-[10px] capitalize flex-shrink-0 mt-0.5">
                {change.type}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-red-600 line-through">{change.original}</span>
                <span className="text-surface-400 mx-1.5">→</span>
                <span className="text-emerald-700 font-medium">{change.corrected}</span>
              </div>
            </div>
          ))}
          {changes.length > 20 && (
            <p className="text-xs text-surface-400 text-center pt-2">
              ... and {changes.length - 20} more changes
            </p>
          )}
        </div>
      )}
    </div>
  );
};
