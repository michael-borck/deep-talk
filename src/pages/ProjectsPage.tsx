import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, MessageCircle, BarChart3, Archive } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { formatDistanceToNow } from '../utils/helpers';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, createProject, archiveProject, isLoading, error } = useProjects();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      try {
        await createProject(newProjectName.trim(), newProjectDescription.trim() || undefined);
        setShowNewProjectModal(false);
        setNewProjectName('');
        setNewProjectDescription('');
      } catch (err) {
        console.error('Failed to create project:', err);
      }
    }
  };

  const handleArchiveProject = async (projectId: string, projectName: string) => {
    const confirmed = window.confirm(`Are you sure you want to archive the project "${projectName}"?\n\nArchived projects can be restored from the Archive page.`);
    if (confirmed) {
      try {
        await archiveProject(projectId);
      } catch (err) {
        console.error('Failed to archive project:', err);
        alert('Failed to archive project. Please try again.');
      }
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-surface-400 text-sm">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 animate-fade-in">
        <h1 className="page-title">Projects</h1>
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-error text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 flex items-center justify-center">
            <FolderOpen size={28} className="text-surface-300" />
          </div>
          <h3 className="text-lg font-display text-surface-800 mb-2">No projects yet</h3>
          <p className="text-sm text-surface-400">Create your first project to organize related transcripts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <div
              key={project.id}
              className="card-interactive p-5 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
              onClick={() => navigate(`/project/${project.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <FolderOpen size={18} className="text-primary-500" />
                  </div>
                  <h3 className="text-base font-display text-surface-900 line-clamp-1">{project.name}</h3>
                </div>
              </div>

              <div className="text-xs text-surface-500 mb-3 space-y-0.5">
                <div>{project.transcript_count || 0} transcripts
                  {project.total_duration && project.total_duration > 0 && (
                    <> &middot; {formatDuration(project.total_duration)}</>
                  )}
                </div>
                <div>Updated {formatDistanceToNow(new Date(project.updated_at))} ago</div>
              </div>

              {project.themes && project.themes.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {project.themes.slice(0, 3).map((theme, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-primary-100 text-primary-700 text-[10px] rounded-lg font-medium"
                      >
                        {theme}
                      </span>
                    ))}
                    {project.themes.length > 3 && (
                      <span className="px-2 py-0.5 text-surface-400 text-[10px]">
                        +{project.themes.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-1.5 mt-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/project/${project.id}`);
                  }}
                  className="flex-1 px-2.5 py-1.5 text-xs font-medium bg-surface-50 hover:bg-surface-100 text-surface-600 rounded-lg transition-colors"
                >
                  Open
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.hash = `#/project/${project.id}/chat`;
                  }}
                  className="flex-1 px-2.5 py-1.5 text-xs font-medium bg-surface-50 hover:bg-surface-100 text-surface-600 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <MessageCircle size={11} /> Chat
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.hash = `#/project/${project.id}/analyze`;
                  }}
                  className="flex-1 px-2.5 py-1.5 text-xs font-medium bg-surface-50 hover:bg-surface-100 text-surface-600 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <BarChart3 size={11} /> Analyze
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArchiveProject(project.id, project.name);
                  }}
                  className="px-2.5 py-1.5 text-xs bg-accent-50 hover:bg-accent-100 text-accent-600 rounded-lg transition-colors"
                  title="Archive project"
                >
                  <Archive size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <h2 className="text-xl font-display text-surface-900 mb-5">Create New Project</h2>

            <div className="mb-4">
              <label className="label">
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="input"
                placeholder="e.g., Qualitative Research Study"
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="label">
                Description (optional)
              </label>
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="input-textarea"
                rows={3}
                placeholder="Brief description of the project..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNewProjectModal(false);
                  setNewProjectName('');
                  setNewProjectDescription('');
                }}
                className="btn-secondary border-0"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="btn-primary px-4 py-2"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
