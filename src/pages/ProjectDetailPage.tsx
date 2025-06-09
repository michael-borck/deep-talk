import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectContext';
import { Transcript } from '../types';
import { formatDistanceToNow, formatDuration } from '../utils/helpers';
import { AddExistingModal } from '../components/AddExistingModal';
import { ProjectInsightsDashboard } from '../components/ProjectInsightsDashboard';
import { ProjectCrossTranscriptSearch } from '../components/ProjectCrossTranscriptSearch';

type TabType = 'overview' | 'transcripts' | 'analysis' | 'search' | 'chat';

export const ProjectDetailPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, loadProject, getProjectTranscripts, updateProject, deleteProject, addTranscriptToProject, removeTranscriptFromProject, analyzeProject } = useProjects();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [projectTranscripts, setProjectTranscripts] = useState<Transcript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTranscriptModal, setShowAddTranscriptModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      await loadProject(projectId);
      const transcripts = await getProjectTranscripts(projectId);
      setProjectTranscripts(transcripts);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTranscripts = async (transcriptIds: string[]) => {
    try {
      for (const transcriptId of transcriptIds) {
        await addTranscriptToProject(projectId!, transcriptId);
      }
      await loadProjectData();
      setShowAddTranscriptModal(false);
    } catch (err) {
      console.error('Failed to add transcripts:', err);
    }
  };

  const handleRemoveTranscript = async (transcriptId: string) => {
    if (confirm('Are you sure you want to remove this transcript from the project?')) {
      try {
        await removeTranscriptFromProject(projectId!, transcriptId);
        await loadProjectData();
      } catch (err) {
        console.error('Failed to remove transcript:', err);
      }
    }
  };

  const handleAnalyze = async () => {
    try {
      await analyzeProject(projectId!);
      await loadProjectData();
    } catch (err) {
      console.error('Failed to analyze project:', err);
    }
  };

  const handleEdit = () => {
    if (currentProject) {
      setEditName(currentProject.name);
      setEditDescription(currentProject.description || '');
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateProject(projectId!, {
        name: editName.trim(),
        description: editDescription.trim() || undefined
      });
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update project:', err);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(projectId!);
        navigate('/projects');
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  if (isLoading || !currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading project...</div>
      </div>
    );
  }

  // Get transcript IDs already in project (for exclusion)
  const existingTranscriptIds = projectTranscripts.map(t => t.id);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentProject.icon || '📁'}</span>
              <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
            </div>
          </div>
          <button
            onClick={handleEdit}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Edit project"
          >
            ⚙️
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-6 mt-6">
          {(['overview', 'transcripts', 'analysis', 'search', 'chat'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Project Stats */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">📊 Project Overview</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{currentProject.transcript_count || 0}</div>
                  <div className="text-sm text-gray-500">Transcripts</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {currentProject.total_duration ? formatDuration(currentProject.total_duration) : '0m'}
                  </div>
                  <div className="text-sm text-gray-500">Total Duration</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">{currentProject.themes?.length || 0}</div>
                  <div className="text-sm text-gray-500">Key Themes</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-600">
                    {currentProject.date_range 
                      ? `${new Date(currentProject.date_range.start).toLocaleDateString()} - ${new Date(currentProject.date_range.end).toLocaleDateString()}`
                      : 'No data'
                    }
                  </div>
                  <div className="text-sm text-gray-500">Date Range</div>
                </div>
              </div>

              {currentProject.description && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{currentProject.description}</p>
                </div>
              )}

              {currentProject.themes && currentProject.themes.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Key Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProject.themes.map((theme, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Key Insights */}
            {currentProject.key_insights && currentProject.key_insights.length > 0 && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">💡 Key Insights</h2>
                <ul className="space-y-2">
                  {currentProject.key_insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary */}
            {currentProject.summary && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">📝 Summary</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{currentProject.summary}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transcripts' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Transcripts ({projectTranscripts.length})</h2>
              <button
                onClick={() => setShowAddTranscriptModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Existing
              </button>
            </div>

            {projectTranscripts.length === 0 ? (
              <div className="bg-white rounded-lg border p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transcripts yet</h3>
                <p className="text-gray-500">Add existing transcripts to this project</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projectTranscripts.map(transcript => (
                  <div key={transcript.id} className="bg-white rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{transcript.title}</h3>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(transcript.created_at).toLocaleDateString()} • {formatDuration(transcript.duration)}
                          {transcript.starred && ' • ⭐'}
                        </div>
                        {transcript.summary && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{transcript.summary}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => navigate(`/transcript/${transcript.id}`)}
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleRemoveTranscript(transcript.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <ProjectInsightsDashboard 
            project={currentProject} 
            onAnalyze={handleAnalyze}
          />
        )}

        {activeTab === 'search' && (
          <ProjectCrossTranscriptSearch 
            projectId={projectId!}
            transcripts={projectTranscripts}
          />
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">💬 Project Chat</h2>
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Project-wide chat coming soon</h3>
              <p className="text-gray-500">Ask questions across all transcripts in this project</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Existing Modal */}
      <AddExistingModal
        isOpen={showAddTranscriptModal}
        onClose={() => setShowAddTranscriptModal(false)}
        onAdd={handleAddTranscripts}
        excludeTranscriptIds={existingTranscriptIds}
      />

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Project</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex gap-3 justify-between">
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete Project
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};