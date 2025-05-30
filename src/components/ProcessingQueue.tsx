import React, { useContext } from 'react';
import { ProcessingItem } from '../types';
import { ServiceContext } from '../contexts/ServiceContext';

interface ProcessingQueueProps {
  items: ProcessingItem[];
}

export const ProcessingQueue: React.FC<ProcessingQueueProps> = ({ items }) => {
  const { removeFromProcessingQueue } = useContext(ServiceContext);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'queued':
        return 'Waiting...';
      case 'transcribing':
        return 'Transcribing...';
      case 'analyzing':
        return 'Analyzing...';
      case 'completed':
        return 'Complete';
      case 'error':
        return 'Error';
      default:
        return status;
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'error':
        return 'bg-red-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-primary-500';
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">📊</span> Processing Queue
      </h2>
      
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {item.file_path.split('/').pop() || item.file_path}
                </span>
                <span className="text-sm text-gray-500">
                  {item.progress}% {getStatusText(item.status)}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(item.status)}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              
              {item.error_message && (
                <p className="text-xs text-red-600 mt-1">{item.error_message}</p>
              )}
            </div>
            
            {(item.status === 'completed' || item.status === 'error') && (
              <button
                onClick={() => removeFromProcessingQueue(item.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};