import React, { useContext } from 'react';
import { ServiceContext } from '../contexts/ServiceContext';

export const StatusBar: React.FC = () => {
  const { serviceStatus, processingQueue } = useContext(ServiceContext);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-500';
      case 'disconnected':
        return 'bg-red-400';
      case 'error':
        return 'bg-amber-500';
      default:
        return 'bg-surface-400';
    }
  };

  const activeProcessing = processingQueue.filter(item =>
    item.status === 'transcribing' || item.status === 'analyzing'
  ).length;

  return (
    <div className="bg-surface-50 border-t border-surface-200 px-6 py-1.5">
      <div className="flex items-center justify-between text-xs font-sans">
        <div className="flex items-center space-x-5">
          <div className="flex items-center space-x-1.5">
            <span className="text-surface-500">Speech-to-Text</span>
            <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(serviceStatus.speechToText)}`} />
            <span className="text-surface-600 capitalize">{serviceStatus.speechToText}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-surface-500">AI Analysis</span>
            <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(serviceStatus.aiAnalysis)}`} />
            <span className="text-surface-600 capitalize">{serviceStatus.aiAnalysis}</span>
          </div>
        </div>

        {activeProcessing > 0 && (
          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse" />
            <span className="text-surface-600">
              Processing {activeProcessing} file{activeProcessing > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
