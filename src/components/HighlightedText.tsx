import React from 'react';

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
}

/**
 * Renders text with all case-insensitive matches of `query` highlighted.
 * Used for in-transcript search.
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({ text, query, className }) => {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, idx) =>
        regex.test(part) ? (
          <mark key={idx} className="bg-accent-200 text-surface-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        )
      )}
    </span>
  );
};

/**
 * Counts the number of case-insensitive matches of `query` in `text`.
 */
export const countMatches = (text: string, query: string): number => {
  if (!query.trim() || !text) return 0;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  return (text.match(regex) || []).length;
};
