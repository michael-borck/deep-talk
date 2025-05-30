import React, { useContext } from 'react';
import { ServiceContext } from '../contexts/ServiceContext';
import { TranscriptContext } from '../contexts/TranscriptContext';
import { UploadZone } from '../components/UploadZone';
import { ProcessingQueue } from '../components/ProcessingQueue';
import { RecentTranscripts } from '../components/RecentTranscripts';

export const HomePage: React.FC = () => {
  const { serviceStatus, processingQueue } = useContext(ServiceContext);
  const { recentTranscripts } = useContext(TranscriptContext);

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

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back! 👋
        </h1>
        <div className={`flex items-center space-x-2 ${connectionStatus.color}`}>
          <span>{connectionStatus.icon}</span>
          <span className="text-sm">{connectionStatus.text}</span>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="mb-8">
        <UploadZone />
      </div>

      {/* Processing Queue */}
      {processingQueue.length > 0 && (
        <div className="mb-8">
          <ProcessingQueue items={processingQueue} />
        </div>
      )}

      {/* Recent Transcripts */}
      <div>
        <RecentTranscripts transcripts={recentTranscripts} />
      </div>
    </div>
  );
};