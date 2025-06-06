import React, { useState } from 'react';
import { Archive, FolderOpen, Clock } from 'lucide-react';

export const ArchivePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'transcripts'>('projects');

  const tabs = [
    { id: 'projects' as const, label: 'Archived Projects', icon: FolderOpen },
    { id: 'transcripts' as const, label: 'Archived Transcripts', icon: Clock },
  ];

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Archive</h1>
          <p className="text-gray-600 mt-1">Long-term storage for completed projects and old transcripts</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-6 mb-6 border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                pb-3 text-sm font-medium transition-colors relative flex items-center space-x-2
                ${activeTab === tab.id 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
        <Archive className="mx-auto mb-4 text-gray-400" size={64} />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Archive System Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          Clean up your workspace by archiving completed projects and old transcripts
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Workspace Organization</h3>
            <p className="text-sm text-gray-600">Keep active projects visible while storing completed work</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Easy Restoration</h3>
            <p className="text-sm text-gray-600">Bring archived items back to active workspace anytime</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-6">Phase 4 implementation</p>
      </div>
    </div>
  );
};