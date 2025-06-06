import React, { useState, useEffect } from 'react';
import { Archive, FolderOpen, Clock, RefreshCw, Undo2, Calendar } from 'lucide-react';
import { Transcript, Project } from '../types';
import { formatDate, formatDuration } from '../utils/helpers';

type ArchiveItem = {
  type: 'transcript' | 'project';
  id: string;
  title: string;
  archived_at: string;
  data: Transcript | Project;
};

export const ArchivePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'transcripts'>('projects');
  const [archivedItems, setArchivedItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const tabs = [
    { id: 'projects' as const, label: 'Archived Projects', icon: FolderOpen },
    { id: 'transcripts' as const, label: 'Archived Transcripts', icon: Clock },
  ];

  useEffect(() => {
    loadArchivedItems();
  }, []);

  const loadArchivedItems = async () => {
    try {
      setLoading(true);
      
      // Load archived transcripts
      const archivedTranscripts = await window.electronAPI.database.all(
        'SELECT * FROM transcripts WHERE is_archived = 1 ORDER BY archived_at DESC'
      );
      
      // Load archived projects
      const archivedProjects = await window.electronAPI.database.all(
        'SELECT * FROM projects WHERE is_archived = 1 ORDER BY archived_at DESC'
      );
      
      const items: ArchiveItem[] = [];
      
      // Process transcripts
      archivedTranscripts.forEach((transcript: any) => {
        items.push({
          type: 'transcript',
          id: transcript.id,
          title: transcript.title,
          archived_at: transcript.archived_at,
          data: {
            ...transcript,
            action_items: transcript.action_items ? JSON.parse(transcript.action_items) : [],
            key_topics: transcript.key_topics ? JSON.parse(transcript.key_topics) : [],
            tags: transcript.tags ? JSON.parse(transcript.tags) : [],
            speakers: transcript.speakers ? JSON.parse(transcript.speakers) : [],
            emotions: transcript.emotions ? JSON.parse(transcript.emotions) : {},
            starred: !!transcript.starred
          }
        });
      });
      
      // Process projects
      archivedProjects.forEach((project: any) => {
        items.push({
          type: 'project',
          id: project.id,
          title: project.name,
          archived_at: project.archived_at,
          data: {
            ...project,
            themes: project.themes ? JSON.parse(project.themes) : [],
            key_insights: project.key_insights ? JSON.parse(project.key_insights) : [],
            tags: project.tags ? JSON.parse(project.tags) : []
          }
        });
      });
      
      // Sort by archived_at (most recent first)
      items.sort((a, b) => new Date(b.archived_at).getTime() - new Date(a.archived_at).getTime());
      
      setArchivedItems(items);
    } catch (error) {
      console.error('Error loading archived items:', error);
    } finally {
      setLoading(false);
    }
  };

  const unarchiveItem = async (item: ArchiveItem) => {
    try {
      const table = item.type === 'transcript' ? 'transcripts' : 'projects';
      await window.electronAPI.database.run(
        `UPDATE ${table} SET is_archived = 0, archived_at = NULL WHERE id = ?`,
        [item.id]
      );
      
      await loadArchivedItems();
      alert(`${item.type === 'transcript' ? 'Transcript' : 'Project'} unarchived successfully`);
    } catch (error) {
      console.error('Error unarchiving item:', error);
      alert('Failed to unarchive item. Please try again.');
    }
  };

  const unarchiveSelected = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      for (const itemId of selectedItems) {
        const item = archivedItems.find(i => i.id === itemId);
        if (item) {
          await unarchiveItem(item);
        }
      }
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Error unarchiving selected items:', error);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    const filteredItems = archivedItems.filter(item => item.type === activeTab.slice(0, -1) as 'transcript' | 'project');
    setSelectedItems(new Set(filteredItems.map(item => item.id)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const filteredItems = archivedItems.filter(item => item.type === activeTab.slice(0, -1) as 'transcript' | 'project');
  const selectedFilteredItems = filteredItems.filter(item => selectedItems.has(item.id));

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Archive</h1>
          <p className="text-gray-600 mt-1">Long-term storage for completed projects and old transcripts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadArchivedItems}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-6 mb-6 border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const count = archivedItems.filter(item => item.type === tab.id.slice(0, -1) as 'transcript' | 'project').length;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedItems(new Set());
              }}
              className={`
                pb-3 text-sm font-medium transition-colors relative flex items-center space-x-2
                ${activeTab === tab.id 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeTab === tab.id 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bulk Actions */}
      {selectedFilteredItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedFilteredItems.length} item{selectedFilteredItems.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            </div>
            <button
              onClick={unarchiveSelected}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Unarchive Selected
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading archived items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <Archive className="mx-auto mb-4 text-gray-400" size={64} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No archived {activeTab === 'projects' ? 'projects' : 'transcripts'}
            </h2>
            <p className="text-gray-600">
              Archive completed {activeTab === 'projects' ? 'projects' : 'transcripts'} to keep your workspace organized while preserving important work
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {filteredItems.length} archived {activeTab === 'projects' ? 'project' : 'transcript'}{filteredItems.length !== 1 ? 's' : ''}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Long-term storage for completed work
                  </p>
                </div>
                {filteredItems.length > 0 && (
                  <button
                    onClick={selectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select all
                  </button>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        {item.type === 'project' ? (
                          <FolderOpen size={20} className="text-blue-600" />
                        ) : (
                          <span className="text-gray-600">📝</span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.type === 'project' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.type}
                        </span>
                      </div>

                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {item.title}
                      </h3>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>Archived: {formatDate(item.archived_at)}</span>
                        </span>
                        {item.type === 'transcript' && (
                          <span>⏱️ {formatDuration((item.data as Transcript).duration)}</span>
                        )}
                        {item.type === 'project' && (
                          <span>📁 Project</span>
                        )}
                      </div>

                      {/* Additional metadata */}
                      {item.type === 'transcript' && (item.data as Transcript).summary && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {(item.data as Transcript).summary}
                        </p>
                      )}
                      {item.type === 'project' && (item.data as Project).description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {(item.data as Project).description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => unarchiveItem(item)}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                    >
                      <div className="flex items-center space-x-1">
                        <Undo2 size={14} />
                        <span>Unarchive</span>
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};