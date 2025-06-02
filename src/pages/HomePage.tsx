import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceContext } from '../contexts/ServiceContext';
import { TranscriptContext } from '../contexts/TranscriptContext';
import { useProjects } from '../contexts/ProjectContext';
import { UploadZone } from '../components/UploadZone';
import { ProcessingQueue } from '../components/ProcessingQueue';
import { formatDistanceToNow, formatDuration } from '../utils/helpers';
import { Upload, Clock, FolderOpen, ArrowRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { serviceStatus, processingQueue } = useContext(ServiceContext);
  const { recentTranscripts } = useContext(TranscriptContext);
  const { projects } = useProjects();

  const getConnectionStatus = () => {
    if (serviceStatus.speechToText === 'connected' && serviceStatus.aiAnalysis === 'connected') {
      return { text: 'All services connected', color: 'text-green-600', icon: '●' };
    } else if (serviceStatus.speechToText === 'error' || serviceStatus.aiAnalysis === 'error') {
      return { text: 'Service connection error', color: 'text-red-600', icon: '●' };
    } else {
      return { text: 'Connecting to services...', color: 'text-yellow-600', icon: '●' };
    }
  };

  const connectionStatus = getConnectionStatus();
  
  // Get recent projects (last 3)
  const recentProjects = projects
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Welcome to LocalListen 👋
          </h1>
          <p className="text-gray-600 mt-1">Transform your audio and video into insights</p>
        </div>
        <div className={`flex items-center space-x-2 ${connectionStatus.color}`}>
          <span>{connectionStatus.icon}</span>
          <span className="text-sm">{connectionStatus.text}</span>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Upload */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Upload</h2>
            <Upload className="text-blue-600" size={24} />
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Drag and drop or click to upload audio/video files for transcription
          </p>
          <UploadZone />
        </div>

        {/* Recent Transcripts */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transcripts</h2>
            <Clock className="text-green-600" size={24} />
          </div>
          {recentTranscripts.length > 0 ? (
            <div className="space-y-3">
              {recentTranscripts.slice(0, 3).map((transcript) => (
                <div
                  key={transcript.id}
                  className="cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded transition-colors"
                  onClick={() => navigate(`/transcript/${transcript.id}`)}
                >
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {transcript.title}
                  </h3>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <span>{formatDistanceToNow(new Date(transcript.created_at))} ago</span>
                    <span>•</span>
                    <span>{formatDuration(transcript.duration)}</span>
                    {transcript.starred && <span>⭐</span>}
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/library')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 mt-3"
              >
                View all transcripts
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              <p>No transcripts yet.</p>
              <p className="mt-2">Upload a file to get started!</p>
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
            <FolderOpen className="text-purple-600" size={24} />
          </div>
          {recentProjects.length > 0 ? (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded transition-colors"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{project.icon || '📁'}</span>
                    <h3 className="font-medium text-gray-900 text-sm truncate flex-1">
                      {project.name}
                    </h3>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1 ml-7">
                    <span>{project.transcript_count || 0} transcripts</span>
                    {project.total_duration && project.total_duration > 0 && (
                      <>
                        <span>•</span>
                        <span>{formatDuration(project.total_duration)}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/projects')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 mt-3"
              >
                View all projects
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              <p>No projects yet.</p>
              <button
                onClick={() => navigate('/projects')}
                className="text-blue-600 hover:text-blue-700 font-medium mt-2"
              >
                Create your first project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Processing Queue */}
      {processingQueue.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Queue</h2>
          <ProcessingQueue items={processingQueue} />
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{recentTranscripts.length}</div>
            <div className="text-sm text-gray-600">Total Transcripts</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{projects.length}</div>
            <div className="text-sm text-gray-600">Projects</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {recentTranscripts.reduce((total, t) => total + (t.duration || 0), 0) > 0
                ? formatDuration(recentTranscripts.reduce((total, t) => total + (t.duration || 0), 0))
                : '0m'}
            </div>
            <div className="text-sm text-gray-600">Total Duration</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {recentTranscripts.filter(t => t.starred).length}
            </div>
            <div className="text-sm text-gray-600">Starred Items</div>
          </div>
        </div>
      </div>
    </div>
  );
};