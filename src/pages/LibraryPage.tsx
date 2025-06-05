import React, { useState, useContext, useEffect } from 'react';
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

  // Reload transcripts when page is opened
  useEffect(() => {
    loadTranscripts();
  }, []);

  useEffect(() => {
    filterAndSortTranscripts();
  }, [transcripts, searchQuery, filterTag, sortBy]);

  const filterAndSortTranscripts = async () => {
    let filtered = transcripts;

    // Apply search
    if (searchQuery) {
      filtered = await searchTranscripts(searchQuery);
    }

    // Apply tag filter
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

    // Apply sorting
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
      <div className="flex items-center justify-between mb-6">
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search transcripts..."
        />
        
        <button className="text-gray-600 hover:text-gray-900">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
            />
          </svg>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center space-x-6 mb-6 border-b border-gray-200">
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
              pb-3 text-sm font-medium transition-colors relative
              ${filterTag === tab.id 
                ? 'text-primary-600' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.label}
            {filterTag === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
        ))}
      </div>

      {/* Transcripts grid */}
      {filteredTranscripts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No transcripts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTranscripts.map(transcript => (
            <TranscriptCard 
              key={transcript.id} 
              transcript={transcript}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredTranscripts.length > 20 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex space-x-2">
            <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
              Previous
            </button>
            <button className="px-3 py-2 text-sm bg-primary-600 text-white rounded">
              1
            </button>
            <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
              2
            </button>
            <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
              3
            </button>
            <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};