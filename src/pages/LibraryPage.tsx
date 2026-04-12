import React, { useState, useContext, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { TranscriptContext } from '../contexts/TranscriptContext';
import { TranscriptCard } from '../components/TranscriptCard';
import { SearchBar } from '../components/SearchBar';
import { Transcript } from '../types';

export const LibraryPage: React.FC = () => {
  const { transcripts, searchTranscripts, loadTranscripts } = useContext(TranscriptContext);
  const [filteredTranscripts, setFilteredTranscripts] = useState<Transcript[]>(transcripts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [sortBy] = useState<'date' | 'title' | 'duration'>('date');

  useEffect(() => {
    loadTranscripts();
  }, []);

  useEffect(() => {
    filterAndSortTranscripts();
  }, [transcripts, searchQuery, filterTag, sortBy]);

  const filterAndSortTranscripts = async () => {
    let filtered = transcripts;

    if (searchQuery) {
      filtered = await searchTranscripts(searchQuery);
    }

    if (filterTag !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(t => {
        const date = new Date(t.created_at);
        switch (filterTag) {
          case 'today':
            return date >= today;
          case 'week':
            return date >= thisWeek;
          case 'month':
            return date >= thisMonth;
          case 'favorites':
            return t.starred;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'duration':
          return b.duration - a.duration;
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredTranscripts(filtered);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header with search */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search transcripts..."
        />

        <button className="text-surface-400 hover:text-surface-700 p-2 rounded-lg hover:bg-surface-100 transition-colors">
          <Filter size={18} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-surface-200">
        {[
          { id: 'all', label: 'All' },
          { id: 'today', label: 'Today' },
          { id: 'week', label: 'This Week' },
          { id: 'month', label: 'This Month' },
          { id: 'favorites', label: 'Favorites' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterTag(tab.id)}
            className={`
              pb-3 px-4 text-sm font-medium transition-colors relative
              ${filterTag === tab.id
                ? 'text-primary-800'
                : 'text-surface-400 hover:text-surface-700'
              }
            `}
          >
            {tab.label}
            {filterTag === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-800 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Transcripts grid */}
      {filteredTranscripts.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <p className="text-surface-400 text-sm">No transcripts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTranscripts.map((transcript, i) => (
            <div key={transcript.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}>
              <TranscriptCard transcript={transcript} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredTranscripts.length > 20 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex gap-1">
            <button className="px-3 py-2 text-sm text-surface-500 hover:text-surface-800 rounded-lg hover:bg-surface-100 transition-colors">
              Previous
            </button>
            <button className="btn-primary px-3 py-2">
              1
            </button>
            <button className="px-3 py-2 text-sm text-surface-500 hover:text-surface-800 rounded-lg hover:bg-surface-100 transition-colors">
              2
            </button>
            <button className="px-3 py-2 text-sm text-surface-500 hover:text-surface-800 rounded-lg hover:bg-surface-100 transition-colors">
              3
            </button>
            <button className="px-3 py-2 text-sm text-surface-500 hover:text-surface-800 rounded-lg hover:bg-surface-100 transition-colors">
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};
