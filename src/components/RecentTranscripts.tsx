import React from 'react';
import { Transcript } from '../types';
import { groupTranscriptsByDate } from '../utils/helpers';

interface RecentTranscriptsProps {
  transcripts: Transcript[];
}

export const RecentTranscripts: React.FC<RecentTranscriptsProps> = ({ transcripts }) => {
  const grouped = groupTranscriptsByDate(transcripts);

  const handleChat = (id: string) => {
    // TODO: Implement chat functionality
    console.log('Open chat for transcript:', id);
  };

  const handleExport = (id: string) => {
    // TODO: Implement export functionality
    console.log('Export transcript:', id);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">📋</span> Recent Transcripts
      </h2>
      
      {transcripts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No transcripts yet. Upload a file to get started!
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([period, items]) => {
            if (items.length === 0) return null;
            
            return (
              <div key={period}>
                <h3 className="text-sm font-medium text-gray-500 mb-2">{period}</h3>
                <div className="space-y-2">
                  {items.map(transcript => (
                    <div
                      key={transcript.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {transcript.starred && (
                            <span className="text-yellow-500">⭐</span>
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {transcript.title}
                          </span>
                          {transcript.status === 'processing' && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              Processing
                            </span>
                          )}
                        </div>
                        {transcript.summary && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {transcript.summary}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleChat(transcript.id)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          Chat
                        </button>
                        <button
                          onClick={() => handleExport(transcript.id)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          Export
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          <button className="text-sm text-primary-600 hover:text-primary-700 mt-4">
            View All Transcripts →
          </button>
        </div>
      )}
    </div>
  );
};