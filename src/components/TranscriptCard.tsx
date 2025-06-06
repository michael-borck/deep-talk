import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transcript, Project } from '../types';
import { TranscriptContext } from '../contexts/TranscriptContext';
import { useProjects } from '../contexts/ProjectContext';
import { formatDate, formatDuration, formatFileSize } from '../utils/helpers';
import { EnhancedDeleteModal, DeleteAction } from './EnhancedDeleteModal';
import { TranscriptChatModal } from './TranscriptChatModal';

interface TranscriptCardProps {
  transcript: Transcript;
}

export const TranscriptCard: React.FC<TranscriptCardProps> = ({ transcript }) => {
  const navigate = useNavigate();
  const { updateTranscript } = useContext(TranscriptContext);
  const { projects, removeTranscriptFromProject } = useProjects();
  const [transcriptProjects, setTranscriptProjects] = useState<Project[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    const loadTranscriptProjects = async () => {
      try {
        // Get project IDs that this transcript belongs to
        const projectRelations = await window.electronAPI.database.all(
          `SELECT project_id FROM project_transcripts WHERE transcript_id = ?`,
          [transcript.id]
        );
        
        // Find the corresponding project objects
        const relatedProjects = projects.filter(project => 
          projectRelations.some(relation => relation.project_id === project.id)
        );
        
        setTranscriptProjects(relatedProjects);
      } catch (error) {
        console.error('Error loading transcript projects:', error);
      }
    };

    if (transcript.id && projects.length > 0) {
      loadTranscriptProjects();
    }
  }, [transcript.id, projects]);

  const handleToggleStar = async () => {
    await updateTranscript(transcript.id, { starred: !transcript.starred });
  };

  const handleView = () => {
    navigate(`/transcript/${transcript.id}`);
  };

  const handleChat = () => {
    setShowChatModal(true);
  };

  const handleArchive = async () => {
    try {
      const now = new Date().toISOString();
      await window.electronAPI.database.run(
        'UPDATE transcripts SET is_archived = 1, archived_at = ? WHERE id = ?',
        [now, transcript.id]
      );
      
      // Trigger a reload of transcripts
      window.location.reload(); // Simple approach for now
    } catch (error) {
      console.error('Error archiving transcript:', error);
      alert('Failed to archive transcript. Please try again.');
    }
  };

  const handleExport = () => {
    const content = `# ${transcript.title}

**Date:** ${formatDate(transcript.created_at)}
**Duration:** ${formatDuration(transcript.duration)}
**File:** ${transcript.file_path?.split('/').pop() || transcript.filename}

## Transcript

${transcript.full_text || 'No transcript available.'}

${transcript.summary ? `## Summary

${transcript.summary}` : ''}

${transcript.key_topics && transcript.key_topics.length > 0 ? `## Key Topics

${transcript.key_topics.map(topic => `- ${topic}`).join('\n')}` : ''}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transcript.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleEnhancedDelete = async (action: DeleteAction, projectIds?: string[]) => {
    try {
      switch (action) {
        case 'remove-from-selected':
          if (projectIds) {
            for (const projectId of projectIds) {
              await removeTranscriptFromProject(projectId, transcript.id);
            }
          }
          break;
        case 'remove-from-all':
          // Remove from all projects but keep the transcript
          for (const project of transcriptProjects) {
            await removeTranscriptFromProject(project.id, transcript.id);
          }
          break;
        case 'move-to-trash':
          // Move to trash (soft delete)
          await moveTranscriptToTrash(transcript.id);
          break;
      }
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error performing delete action:', error);
      alert('Failed to perform the action. Please try again.');
    }
  };

  const moveTranscriptToTrash = async (transcriptId: string) => {
    try {
      const now = new Date().toISOString();
      await window.electronAPI.database.run(
        'UPDATE transcripts SET is_deleted = 1, deleted_at = ? WHERE id = ?',
        [now, transcriptId]
      );
      
      // Trigger a reload of transcripts
      window.location.reload(); // Simple approach for now
    } catch (error) {
      console.error('Error moving transcript to trash:', error);
      throw error;
    }
  };

  const getStatusIcon = () => {
    switch (transcript.status) {
      case 'processing':
        return <span className="text-blue-500">📝</span>;
      case 'error':
        return <span className="text-red-500">⚠️</span>;
      default:
        return <span>📝</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            {getStatusIcon()}
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {transcript.title}
            </h3>
            <button
              onClick={handleToggleStar}
              className={`${transcript.starred ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors`}
            >
              {transcript.starred ? '⭐' : '☆'}
            </button>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
            <span>📅 {formatDate(transcript.created_at)}</span>
            {transcript.duration > 0 && <span>⏱️ {formatDuration(transcript.duration)}</span>}
            <span>📁 {formatFileSize(transcript.file_size)}</span>
          </div>
          
          {transcript.summary && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              Summary: {transcript.summary}
            </p>
          )}
          
          {transcript.key_topics && transcript.key_topics.length > 0 && (
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-sm text-gray-500">Topics:</span>
              <div className="flex flex-wrap gap-2">
                {transcript.key_topics.slice(0, 3).map((topic, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {topic}
                  </span>
                ))}
                {transcript.key_topics.length > 3 && (
                  <span className="text-xs text-gray-500">+{transcript.key_topics.length - 3} more</span>
                )}
              </div>
            </div>
          )}
          
          {transcriptProjects.length > 0 && (
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-sm text-gray-500">Projects:</span>
              <div className="flex flex-wrap gap-2">
                {transcriptProjects.slice(0, 2).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors flex items-center space-x-1"
                  >
                    <span>{project.icon}</span>
                    <span>{project.name}</span>
                  </button>
                ))}
                {transcriptProjects.length > 2 && (
                  <span className="text-xs text-gray-500">+{transcriptProjects.length - 2} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={handleView}
          className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
        >
          <span>👁️</span>
          <span>View</span>
        </button>
        
        <button
          onClick={handleChat}
          disabled={transcript.is_archived}
          className={`flex items-center space-x-1 text-sm ${
            transcript.is_archived
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-primary-600 hover:text-primary-700'
          }`}
          title={transcript.is_archived ? 'Chat disabled for archived transcripts' : 'Chat with this transcript'}
        >
          <span>💬</span>
          <span>Chat</span>
        </button>
        
        <button
          onClick={handleExport}
          className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
        >
          <span>📤</span>
          <span>Export</span>
        </button>
        
        <button
          onClick={handleArchive}
          className="flex items-center space-x-1 text-sm text-orange-600 hover:text-orange-700"
        >
          <span>📦</span>
          <span>Archive</span>
        </button>
        
        <button
          onClick={handleDelete}
          className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 ml-auto"
        >
          <span>🗑️</span>
          <span>Delete</span>
        </button>
      </div>
      
      {/* Enhanced Delete Modal */}
      <EnhancedDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        item={transcript}
        itemType="transcript"
        onDelete={handleEnhancedDelete}
      />

      {/* Chat Modal */}
      <TranscriptChatModal
        transcript={transcript}
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />
    </div>
  );
};