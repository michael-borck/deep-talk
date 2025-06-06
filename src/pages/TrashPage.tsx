import React, { useState, useEffect } from 'react';
import { Trash, RefreshCw, AlertTriangle, Calendar, FolderOpen } from 'lucide-react';
import { Transcript, Project } from '../types';
import { formatDate, formatDuration } from '../utils/helpers';

type TrashItem = {
  type: 'transcript' | 'project';
  id: string;
  title: string;
  deleted_at: string;
  daysRemaining: number;
  data: Transcript | Project;
};

export const TrashPage: React.FC = () => {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTrashItems();
  }, []);

  const loadTrashItems = async () => {
    try {
      setLoading(true);
      
      // Load deleted transcripts
      const deletedTranscripts = await window.electronAPI.database.all(
        'SELECT * FROM transcripts WHERE is_deleted = 1 ORDER BY deleted_at DESC'
      );
      
      // Load deleted projects
      const deletedProjects = await window.electronAPI.database.all(
        'SELECT * FROM projects WHERE is_deleted = 1 ORDER BY deleted_at DESC'
      );
      
      const now = new Date();
      const items: TrashItem[] = [];
      
      // Process transcripts
      deletedTranscripts.forEach((transcript: any) => {
        const deletedAt = new Date(transcript.deleted_at);
        const daysElapsed = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, 30 - daysElapsed);
        
        if (daysRemaining > 0) {
          items.push({
            type: 'transcript',
            id: transcript.id,
            title: transcript.title,
            deleted_at: transcript.deleted_at,
            daysRemaining,
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
        }
      });
      
      // Process projects
      deletedProjects.forEach((project: any) => {
        const deletedAt = new Date(project.deleted_at);
        const daysElapsed = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, 30 - daysElapsed);
        
        if (daysRemaining > 0) {
          items.push({
            type: 'project',
            id: project.id,
            title: project.name,
            deleted_at: project.deleted_at,
            daysRemaining,
            data: {
              ...project,
              themes: project.themes ? JSON.parse(project.themes) : [],
              key_insights: project.key_insights ? JSON.parse(project.key_insights) : [],
              tags: project.tags ? JSON.parse(project.tags) : []
            }
          });
        }
      });
      
      // Sort by deleted_at (most recent first)
      items.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
      
      setTrashItems(items);
    } catch (error) {
      console.error('Error loading trash items:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreItem = async (item: TrashItem) => {
    try {
      const table = item.type === 'transcript' ? 'transcripts' : 'projects';
      await window.electronAPI.database.run(
        `UPDATE ${table} SET is_deleted = 0, deleted_at = NULL WHERE id = ?`,
        [item.id]
      );
      
      // If restoring a project, also restore related transcripts if they're in trash
      if (item.type === 'project') {
        const relatedTranscripts = await window.electronAPI.database.all(
          `SELECT DISTINCT t.id FROM transcripts t 
           JOIN project_transcripts pt ON t.id = pt.transcript_id 
           WHERE pt.project_id = ? AND t.is_deleted = 1`,
          [item.id]
        );
        
        for (const transcript of relatedTranscripts) {
          await window.electronAPI.database.run(
            'UPDATE transcripts SET is_deleted = 0, deleted_at = NULL WHERE id = ?',
            [transcript.id]
          );
        }
        
        if (relatedTranscripts.length > 0) {
          alert(`Restored project and ${relatedTranscripts.length} related transcript${relatedTranscripts.length !== 1 ? 's' : ''}`);
        }
      }
      
      await loadTrashItems();
      alert(`${item.type === 'transcript' ? 'Transcript' : 'Project'} restored successfully`);
    } catch (error) {
      console.error('Error restoring item:', error);
      alert('Failed to restore item. Please try again.');
    }
  };

  const restoreSelected = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      for (const itemId of selectedItems) {
        const item = trashItems.find(i => i.id === itemId);
        if (item) {
          await restoreItem(item);
        }
      }
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Error restoring selected items:', error);
    }
  };

  const emptyTrash = async () => {
    if (trashItems.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete all ${trashItems.length} items in the trash?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      // Permanently delete all items
      for (const item of trashItems) {
        const table = item.type === 'transcript' ? 'transcripts' : 'projects';
        await window.electronAPI.database.run(
          `DELETE FROM ${table} WHERE id = ?`,
          [item.id]
        );
      }
      
      await loadTrashItems();
      alert('Trash emptied successfully');
    } catch (error) {
      console.error('Error emptying trash:', error);
      alert('Failed to empty trash. Please try again.');
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
    setSelectedItems(new Set(trashItems.map(item => item.id)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const getDaysRemainingColor = (days: number) => {
    if (days <= 3) return 'text-red-600';
    if (days <= 7) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Trash</h1>
          <p className="text-gray-600 mt-1">Recover deleted items within 30 days</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadTrashItems}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          {trashItems.length > 0 && (
            <button
              onClick={emptyTrash}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50"
            >
              <Trash size={16} />
              <span>Empty Trash</span>
            </button>
          )}
        </div>
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
            <button
              onClick={restoreSelected}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Restore Selected
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading trash...</p>
          </div>
        ) : trashItems.length === 0 ? (
          <div className="p-12 text-center">
            <Trash className="mx-auto mb-4 text-gray-400" size={64} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Trash is empty</h2>
            <p className="text-gray-600">
              Deleted items will appear here and can be restored within 30 days
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {trashItems.length} deleted item{trashItems.length !== 1 ? 's' : ''}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Items are automatically deleted after 30 days
                  </p>
                </div>
                {trashItems.length > 0 && (
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
              {trashItems.map((item) => (
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
                        <span className={`text-xs px-2 py-1 rounded-full ${getDaysRemainingColor(item.daysRemaining)} bg-opacity-10`}>
                          {item.daysRemaining} day{item.daysRemaining !== 1 ? 's' : ''} remaining
                        </span>
                      </div>

                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {item.title}
                      </h3>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>Deleted: {formatDate(item.deleted_at)}</span>
                        </span>
                        {item.type === 'transcript' && (
                          <span>⏱️ {formatDuration((item.data as Transcript).duration)}</span>
                        )}
                        {item.type === 'project' && (
                          <span>📁 Project</span>
                        )}
                      </div>

                      {item.daysRemaining <= 7 && (
                        <div className="mt-2 flex items-center space-x-1 text-orange-600">
                          <AlertTriangle size={14} />
                          <span className="text-xs">
                            Will be permanently deleted in {item.daysRemaining} day{item.daysRemaining !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => restoreItem(item)}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                    >
                      Restore
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