import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, FolderMinus } from 'lucide-react';
import { Transcript, Project } from '../types';
import { useProjects } from '../contexts/ProjectContext';
import { formatDate } from '../utils/helpers';

interface EnhancedDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Transcript | Project | null;
  itemType: 'transcript' | 'project';
  onDelete: (action: DeleteAction, projectIds?: string[]) => void;
  currentProjectId?: string; // If opened from within a project
}

export type DeleteAction = 'remove-from-selected' | 'remove-from-all' | 'move-to-trash' | 'delete-permanently';

interface ProjectRelation {
  id: string;
  name: string;
  icon?: string;
  selected: boolean;
}

export const EnhancedDeleteModal: React.FC<EnhancedDeleteModalProps> = ({
  isOpen,
  onClose,
  item,
  itemType,
  onDelete,
  currentProjectId
}) => {
  const { projects } = useProjects();
  const [projectRelations, setProjectRelations] = useState<ProjectRelation[]>([]);
  const [selectedAction, setSelectedAction] = useState<DeleteAction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && item && itemType === 'transcript') {
      loadProjectRelations();
    }
  }, [isOpen, item, itemType]);

  const loadProjectRelations = async () => {
    if (!item || itemType !== 'transcript') return;
    
    try {
      setLoading(true);
      
      // Get project IDs that this transcript belongs to
      const relations = await window.electronAPI.database.all(
        `SELECT project_id FROM project_transcripts WHERE transcript_id = ?`,
        [item.id]
      );
      
      // Find the corresponding project objects and set selection
      const relatedProjects = projects
        .filter(project => relations.some((rel: any) => rel.project_id === project.id))
        .map(project => ({
          id: project.id,
          name: project.name,
          icon: project.icon,
          selected: currentProjectId ? project.id === currentProjectId : true // Pre-select based on context
        }));
      
      setProjectRelations(relatedProjects);
      
      // Set default action based on context
      if (currentProjectId && relatedProjects.length > 1) {
        setSelectedAction('remove-from-selected');
      } else if (relatedProjects.length === 0) {
        setSelectedAction('move-to-trash');
      } else {
        setSelectedAction('remove-from-all');
      }
    } catch (error) {
      console.error('Error loading project relations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProjectSelection = (projectId: string) => {
    setProjectRelations(prev => 
      prev.map(rel => 
        rel.id === projectId ? { ...rel, selected: !rel.selected } : rel
      )
    );
  };

  const handleConfirm = () => {
    if (!selectedAction) return;
    
    const selectedProjectIds = projectRelations
      .filter(rel => rel.selected)
      .map(rel => rel.id);
    
    onDelete(selectedAction, selectedProjectIds);
  };

  const getActionDescription = () => {
    switch (selectedAction) {
      case 'remove-from-selected':
        const selectedCount = projectRelations.filter(rel => rel.selected).length;
        return `Remove from ${selectedCount} selected project${selectedCount !== 1 ? 's' : ''}. The ${itemType} will remain in other projects and your library.`;
      case 'remove-from-all':
        return `Remove from all projects. The ${itemType} will remain in your library but won't be part of any projects.`;
      case 'move-to-trash':
        return `Move to trash. The ${itemType} will be removed from all projects and can be restored within 30 days.`;
      case 'delete-permanently':
        return `Delete permanently. The ${itemType} will be immediately deleted and cannot be recovered.`;
      default:
        return '';
    }
  };

  const getActionButtonText = () => {
    switch (selectedAction) {
      case 'remove-from-selected':
        return 'Remove from Selected';
      case 'remove-from-all':
        return 'Remove from All Projects';
      case 'move-to-trash':
        return 'Move to Trash';
      case 'delete-permanently':
        return 'Delete Permanently';
      default:
        return 'Confirm';
    }
  };

  const isConfirmDisabled = () => {
    if (selectedAction === 'remove-from-selected') {
      return projectRelations.filter(rel => rel.selected).length === 0;
    }
    return false;
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="text-orange-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              Delete {itemType === 'transcript' ? 'Transcript' : 'Project'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Item Info */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">
              {itemType === 'transcript' ? '📝' : '📁'} {itemType === 'transcript' ? (item as Transcript).title : (item as Project).name}
            </h3>
            <p className="text-sm text-gray-500">
              Created: {formatDate(item.created_at)}
            </p>
          </div>

          {/* Project Relations (for transcripts only) */}
          {itemType === 'transcript' && (
            <div className="mb-6">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading project relations...</p>
                </div>
              ) : projectRelations.length > 0 ? (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">
                    This transcript is part of these projects:
                  </h4>
                  <div className="space-y-2 mb-4">
                    {projectRelations.map((relation) => (
                      <label 
                        key={relation.id}
                        className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={relation.selected}
                          onChange={() => toggleProjectSelection(relation.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          disabled={selectedAction !== 'remove-from-selected'}
                        />
                        <div className="flex items-center space-x-2">
                          <span>{relation.icon || '📁'}</span>
                          <span className="text-sm text-gray-700">{relation.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">This transcript is not part of any projects.</p>
                </div>
              )}
            </div>
          )}

          {/* Action Selection */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-3">What would you like to do?</h4>
            <div className="space-y-3">
              {/* Remove from Selected Projects (only for transcripts with multiple projects) */}
              {itemType === 'transcript' && projectRelations.length > 1 && (
                <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="deleteAction"
                    value="remove-from-selected"
                    checked={selectedAction === 'remove-from-selected'}
                    onChange={(e) => setSelectedAction(e.target.value as DeleteAction)}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <FolderMinus size={16} className="text-orange-500" />
                      <span className="font-medium text-gray-900">Remove from Selected Projects</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Removes only from checked projects above
                    </p>
                  </div>
                </label>
              )}

              {/* Remove from All Projects (only for transcripts in projects) */}
              {itemType === 'transcript' && projectRelations.length > 0 && (
                <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="deleteAction"
                    value="remove-from-all"
                    checked={selectedAction === 'remove-from-all'}
                    onChange={(e) => setSelectedAction(e.target.value as DeleteAction)}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <FolderMinus size={16} className="text-orange-500" />
                      <span className="font-medium text-gray-900">Remove from All Projects</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Keeps transcript but removes all project associations
                    </p>
                  </div>
                </label>
              )}

              {/* Move to Trash */}
              <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="deleteAction"
                  value="move-to-trash"
                  checked={selectedAction === 'move-to-trash'}
                  onChange={(e) => setSelectedAction(e.target.value as DeleteAction)}
                  className="mt-1 w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <Trash2 size={16} className="text-orange-500" />
                    <span className="font-medium text-gray-900">Move to Trash</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Can be restored within 30 days
                  </p>
                </div>
              </label>

              {/* Delete Permanently */}
              <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="deleteAction"
                  value="delete-permanently"
                  checked={selectedAction === 'delete-permanently'}
                  onChange={(e) => setSelectedAction(e.target.value as DeleteAction)}
                  className="mt-1 w-4 h-4 text-red-600"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <Trash2 size={16} className="text-red-500" />
                    <span className="font-medium text-gray-900">Delete Permanently</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Immediate deletion - cannot be recovered
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Description */}
          {selectedAction && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {getActionDescription()}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedAction || isConfirmDisabled()}
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
              selectedAction === 'delete-permanently'
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                : selectedAction === 'move-to-trash'
                ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
            } disabled:cursor-not-allowed`}
          >
            {getActionButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};