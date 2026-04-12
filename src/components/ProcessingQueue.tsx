import React, { useContext } from 'react';
import { BarChart3, X } from 'lucide-react';
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
        return 'bg-error';
      case 'completed':
        return 'bg-success';
      default:
        return 'bg-primary-500';
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="card-interactive p-5">
      <h2 className="text-base font-display text-surface-900 mb-4 flex items-center gap-2">
        <BarChart3 size={18} className="text-primary-500" />
        Processing Queue
      </h2>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="flex items-center space-x-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-surface-700 truncate">
                  {item.file_path.split('/').pop() || item.file_path}
                </span>
                <span className="text-xs text-surface-500 ml-2 whitespace-nowrap">
                  {item.progress}% {getStatusText(item.status)}
                </span>
              </div>

              <div className="w-full bg-surface-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out ${getProgressBarColor(item.status)}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              {item.error_message && (
                <p className="text-xs text-error mt-1">{item.error_message}</p>
              )}
            </div>

            {(item.status === 'completed' || item.status === 'error') && (
              <button
                onClick={() => removeFromProcessingQueue(item.id)}
                className="text-surface-400 hover:text-surface-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
