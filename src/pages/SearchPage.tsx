import React, { useState, useEffect, useContext } from 'react';
import { Search, Filter, Calendar, Clock, Palette, FolderOpen, CheckSquare, Square } from 'lucide-react';
import { TranscriptContext } from '../contexts/TranscriptContext';
import { useProjects } from '../contexts/ProjectContext';
import { Transcript, Project } from '../types';
import { formatDate, formatDuration } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

type SearchResult = {
  type: 'transcript' | 'project';
  id: string;
  title: string;
  description?: string;
  created_at: string;
  data: Transcript | Project;
};

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { transcripts, searchTranscripts } = useContext(TranscriptContext);
  const { projects, createProject, addTranscriptToProject } = useProjects();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Filter state
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    duration: { min: '', max: '' },
    sentiment: '',
    projectIds: [] as string[],
    speakers: [] as string[],
    hasKeywords: [] as string[]
  });

  useEffect(() => {
    performSearch();
  }, [searchQuery, filters, transcripts, projects]);

  const performSearch = async () => {
    setLoading(true);
    try {
      let searchResults: SearchResult[] = [];

      // Search transcripts
      if (searchQuery) {
        const foundTranscripts = await searchTranscripts(searchQuery);
        searchResults.push(...foundTranscripts.map(t => ({
          type: 'transcript' as const,
          id: t.id,
          title: t.title,
          description: t.summary,
          created_at: t.created_at,
          data: t
        })));
      } else {
        // If no search query, show all transcripts
        searchResults.push(...transcripts.map(t => ({
          type: 'transcript' as const,
          id: t.id,
          title: t.title,
          description: t.summary,
          created_at: t.created_at,
          data: t
        })));
      }

      // Search projects
      const projectResults = projects.filter(p => {
        if (searchQuery) {
          return p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return true;
      });

      searchResults.push(...projectResults.map(p => ({
        type: 'project' as const,
        id: p.id,
        title: p.name,
        description: p.description,
        created_at: p.created_at,
        data: p
      })));

      // Apply filters
      searchResults = applyFilters(searchResults);

      // Sort by relevance (projects first, then by date)
      searchResults.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'project' ? -1 : 1;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (results: SearchResult[]): SearchResult[] => {
    return results.filter(result => {
      // Date range filter
      if (filters.dateRange.start) {
        const itemDate = new Date(result.created_at);
        const startDate = new Date(filters.dateRange.start);
        if (itemDate < startDate) return false;
      }
      if (filters.dateRange.end) {
        const itemDate = new Date(result.created_at);
        const endDate = new Date(filters.dateRange.end);
        if (itemDate > endDate) return false;
      }

      // Transcript-specific filters
      if (result.type === 'transcript') {
        const transcript = result.data as Transcript;
        
        // Duration filter
        if (filters.duration.min && transcript.duration < parseInt(filters.duration.min)) {
          return false;
        }
        if (filters.duration.max && transcript.duration > parseInt(filters.duration.max)) {
          return false;
        }

        // Sentiment filter
        if (filters.sentiment && transcript.sentiment_overall !== filters.sentiment) {
          return false;
        }

        // Keywords filter
        if (filters.hasKeywords.length > 0) {
          const hasKeyword = filters.hasKeywords.some(keyword =>
            transcript.key_topics?.some(topic => 
              topic.toLowerCase().includes(keyword.toLowerCase())
            )
          );
          if (!hasKeyword) return false;
        }
      }

      return true;
    });
  };

  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    setSelectedItems(new Set(results.map(r => r.id)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const addSelectedToProject = async (projectId: string) => {
    const transcriptIds = Array.from(selectedItems).filter(id => {
      const result = results.find(r => r.id === id);
      return result?.type === 'transcript';
    });

    if (transcriptIds.length === 0) return;

    try {
      for (const transcriptId of transcriptIds) {
        await addTranscriptToProject(projectId, transcriptId);
      }
      
      // Clear selection after successful operation
      setSelectedItems(new Set());
      
      // Show success message
      alert(`Successfully added ${transcriptIds.length} transcript${transcriptIds.length !== 1 ? 's' : ''} to project`);
    } catch (error) {
      console.error('Error adding transcripts to project:', error);
      alert('Failed to add transcripts to project. Please try again.');
    }
  };

  const createProjectFromSelected = async () => {
    const transcriptIds = Array.from(selectedItems).filter(id => {
      const result = results.find(r => r.id === id);
      return result?.type === 'transcript';
    });
    
    if (transcriptIds.length === 0) return;

    const projectName = prompt(`Create a new project with ${transcriptIds.length} transcript${transcriptIds.length !== 1 ? 's' : ''}.\n\nEnter project name:`);
    if (!projectName) return;

    try {
      // Create new project
      const newProject = await createProject(projectName.trim());
      
      // Add all selected transcripts to the new project
      for (const transcriptId of transcriptIds) {
        await addTranscriptToProject(newProject.id, transcriptId);
      }
      
      // Clear selection after successful operation
      setSelectedItems(new Set());
      
      // Navigate to the new project
      navigate(`/project/${newProject.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Search & Filter</h1>
          <p className="text-gray-600 mt-1">Find transcripts and projects across your entire library</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transcripts and projects..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-3 border rounded-lg transition-colors ${
              showFilters 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={20} />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Date Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              {/* Duration Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock size={16} className="inline mr-1" />
                  Duration (seconds)
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min duration"
                    value={filters.duration.min}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      duration: { ...prev.duration, min: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max duration"
                    value={filters.duration.max}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      duration: { ...prev.duration, max: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              {/* Sentiment Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette size={16} className="inline mr-1" />
                  Sentiment
                </label>
                <select
                  value={filters.sentiment}
                  onChange={(e) => setFilters(prev => ({ ...prev, sentiment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">All sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({
                  dateRange: { start: '', end: '' },
                  duration: { min: '', max: '' },
                  sentiment: '',
                  projectIds: [],
                  speakers: [],
                  hasKeywords: []
                })}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <select
                className="px-3 py-1 border border-blue-300 rounded text-sm bg-white"
                onChange={(e) => {
                  if (e.target.value) {
                    addSelectedToProject(e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">Add to project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.icon} {project.name}
                  </option>
                ))}
              </select>
              <button
                onClick={createProjectFromSelected}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Results Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {loading ? 'Searching...' : `${results.length} results`}
              </h2>
              {!loading && results.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {results.filter(r => r.type === 'project').length} projects, {' '}
                  {results.filter(r => r.type === 'transcript').length} transcripts
                </p>
              )}
            </div>
            {results.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
              <p className="mt-2 text-gray-600">
                Try adjusting your search terms or filters
              </p>
            </div>
          ) : (
            results.map((result) => (
              <div key={result.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <button
                    onClick={() => toggleItemSelection(result.id)}
                    className="mt-1 text-gray-400 hover:text-gray-600"
                  >
                    {selectedItems.has(result.id) ? 
                      <CheckSquare size={20} className="text-blue-600" /> : 
                      <Square size={20} />
                    }
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      {result.type === 'project' ? (
                        <FolderOpen size={20} className="text-blue-600" />
                      ) : (
                        <span className="text-gray-600">📝</span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        result.type === 'project' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {result.type}
                      </span>
                    </div>

                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {result.title}
                    </h3>

                    {result.description && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {result.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 {formatDate(result.created_at)}</span>
                      {result.type === 'transcript' && (
                        <>
                          <span>⏱️ {formatDuration((result.data as Transcript).duration)}</span>
                          {(result.data as Transcript).sentiment_overall && (
                            <span className={`px-2 py-1 rounded text-xs ${
                              (result.data as Transcript).sentiment_overall === 'positive' ? 'bg-green-100 text-green-800' :
                              (result.data as Transcript).sentiment_overall === 'negative' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {(result.data as Transcript).sentiment_overall}
                            </span>
                          )}
                        </>
                      )}
                      {result.type === 'project' && (
                        <span>{(result.data as Project).transcript_count || 0} transcripts</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(result.type === 'project' ? `/project/${result.id}` : `/transcript/${result.id}`)}
                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};