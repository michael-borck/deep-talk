import React, { useContext } from 'react';
import { Transcript } from '../types';
import { TranscriptContext } from '../contexts/TranscriptContext';
import { formatDate, formatDuration, formatFileSize } from '../utils/helpers';

interface TranscriptCardProps {
  transcript: Transcript;
}

export const TranscriptCard: React.FC<TranscriptCardProps> = ({ transcript }) => {
  const { updateTranscript, deleteTranscript } = useContext(TranscriptContext);

  const handleToggleStar = async () => {
    await updateTranscript(transcript.id, { starred: !transcript.starred });
  };

  const handleView = () => {
    // TODO: Implement view functionality
    console.log('View transcript:', transcript.id);
  };

  const handleChat = () => {
    // TODO: Implement chat functionality
    console.log('Chat with transcript:', transcript.id);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export transcript:', transcript.id);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this transcript?')) {
      await deleteTranscript(transcript.id);
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
          className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
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
          onClick={handleDelete}
          className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 ml-auto"
        >
          <span>🗑️</span>
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};