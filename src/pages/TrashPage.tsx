import React from 'react';
import { Trash } from 'lucide-react';

export const TrashPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Trash</h1>
          <p className="text-gray-600 mt-1">Recover deleted items within 30 days</p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
        <Trash className="mx-auto mb-4 text-gray-400" size={64} />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Trash System Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          Safe deletion with 30-day recovery period for both transcripts and projects
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Safe Deletion</h3>
            <p className="text-sm text-gray-600">Items are moved to trash instead of permanent deletion</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Easy Recovery</h3>
            <p className="text-sm text-gray-600">Restore individual items or entire projects with one click</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-6">Phase 4 implementation</p>
      </div>
    </div>
  );
};