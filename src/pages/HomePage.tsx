import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceContext } from '../contexts/ServiceContext';
import { TranscriptContext } from '../contexts/TranscriptContext';
import { useProjects } from '../contexts/ProjectContext';
import { formatDistanceToNow, formatDuration } from '../utils/helpers';
import { Clock, FolderOpen, ArrowRight, Activity, TrendingUp } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { serviceStatus } = useContext(ServiceContext);
  const { recentTranscripts, loadTranscripts } = useContext(TranscriptContext);
  const { projects } = useProjects();

  // Reload transcripts when page is opened
  useEffect(() => {
    loadTranscripts();
  }, []);

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
  
  // Get 3 most active projects (sorted by last used, not created)
  const mostActiveProjects = projects
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);

  // Get 5 most recent transcripts
  const mostRecentTranscripts = recentTranscripts.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Welcome to DeepTalk 👋
          </h1>
          <p className="text-gray-600 mt-1">Your recent activity and quick access</p>
        </div>
        <div className={`flex items-center space-x-2 ${connectionStatus.color}`}>
          <span>{connectionStatus.icon}</span>
          <span className="text-sm">{connectionStatus.text}</span>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Transcripts - Now showing 5 */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transcripts</h2>
            <div className="flex items-center space-x-2">
              <Activity className="text-green-600" size={20} />
              <span className="text-sm text-gray-500">{mostRecentTranscripts.length} of {recentTranscripts.length}</span>
            </div>
          </div>
          {mostRecentTranscripts.length > 0 ? (
            <div className="space-y-3">
              {mostRecentTranscripts.map((transcript) => (
                <div
                  key={transcript.id}
                  className="cursor-pointer hover:bg-gray-50 p-3 -m-3 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                  onClick={() => navigate(`/transcript/${transcript.id}`)}
                >
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {transcript.title}
                  </h3>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <span>{formatDistanceToNow(new Date(transcript.created_at))} ago</span>
                    <span>•</span>
                    <span>{formatDuration(transcript.duration)}</span>
                    <span>•</span>
                    <span className={`capitalize ${
                      transcript.status === 'completed' ? 'text-green-600' :
                      transcript.status === 'processing' ? 'text-blue-600' :
                      transcript.status === 'error' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {transcript.status}
                    </span>
                    {transcript.starred && <span>⭐</span>}
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/library')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 mt-4 w-full justify-center py-2 border border-blue-200 hover:border-blue-300 rounded-lg"
              >
                View all transcripts ({recentTranscripts.length})
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">
              <Clock className="mx-auto mb-3 text-gray-400" size={32} />
              <p className="font-medium">No transcripts yet</p>
              <p className="mt-1">Use the Upload & Process button in the sidebar to get started!</p>
            </div>
          )}
        </div>

        {/* Most Active Projects - Now labeled as such */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Most Active Projects</h2>
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-purple-600" size={20} />
              <span className="text-sm text-gray-500">{mostActiveProjects.length} of {projects.length}</span>
            </div>
          </div>
          {mostActiveProjects.length > 0 ? (
            <div className="space-y-3">
              {mostActiveProjects.map((project) => (
                <div
                  key={project.id}
                  className="cursor-pointer hover:bg-gray-50 p-3 -m-3 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{project.icon || '📁'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {project.name}
                      </h3>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                        <span>{project.transcript_count || 0} transcripts</span>
                        {project.total_duration && project.total_duration > 0 && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(project.total_duration)}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Updated {formatDistanceToNow(new Date(project.updated_at))} ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/projects')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 mt-4 w-full justify-center py-2 border border-blue-200 hover:border-blue-300 rounded-lg"
              >
                View all projects ({projects.length})
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">
              <FolderOpen className="mx-auto mb-3 text-gray-400" size={32} />
              <p className="font-medium">No projects yet</p>
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