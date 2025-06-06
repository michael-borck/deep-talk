import React from 'react';
import { Search } from 'lucide-react';

export const SearchPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Search & Filter</h1>
          <p className="text-gray-600 mt-1">Find transcripts and projects across your entire library</p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
        <Search className="mx-auto mb-4 text-gray-400" size={64} />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Universal Search Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          This powerful search interface will let you find content across all your transcripts and projects
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Full-Text Search</h3>
            <p className="text-sm text-gray-600">Search through all transcript content, themes, and analysis</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Advanced Filters</h3>
            <p className="text-sm text-gray-600">Filter by date, duration, speakers, sentiment, and more</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Bulk Actions</h3>
            <p className="text-sm text-gray-600">Select multiple items to organize into projects</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-6">Phase 3 implementation</p>
      </div>
    </div>
  );
};