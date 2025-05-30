import React, { useContext } from 'react';
import { ServiceContext } from '../contexts/ServiceContext';

export const StatusBar: React.FC = () => {
  const { serviceStatus, processingQueue } = useContext(ServiceContext);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
        return 'bg-red-500';
      case 'error':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const activeProcessing = processingQueue.filter(item => 
    item.status === 'transcribing' || item.status === 'analyzing'
  ).length;

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Speech-to-Text:</span>
            <div className={`w-2 h-2 rounded-full ${getStatusColor(serviceStatus.speechToText)}`} />
            <span className="text-gray-700 capitalize">{serviceStatus.speechToText}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">AI Analysis:</span>
            <div className={`w-2 h-2 rounded-full ${getStatusColor(serviceStatus.aiAnalysis)}`} />
            <span className="text-gray-700 capitalize">{serviceStatus.aiAnalysis}</span>
          </div>
        </div>
        
        {activeProcessing > 0 && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-gray-600">
              Processing {activeProcessing} file{activeProcessing > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};