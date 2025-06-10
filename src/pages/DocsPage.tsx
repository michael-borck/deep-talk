import React from 'react';
import { ExternalLink, BookOpen, Play, Settings, Search, HelpCircle, Keyboard } from 'lucide-react';

const DocsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Documentation</h1>
          <p className="text-gray-600">
            Learn how to use DeepTalk effectively with our comprehensive guides and references.
          </p>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Getting Started */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Play className="w-8 h-8 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Getting Started</h3>
            </div>
            <p className="text-gray-600 mb-4">
              New to DeepTalk? Start here with installation, setup, and your first transcript.
            </p>
            <a
              href="https://michael-borck.github.io/deep-talk/getting-started"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              Open Guide
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>

          {/* User Guide */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <BookOpen className="w-8 h-8 text-green-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">User Guide</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Complete guide to using DeepTalk's interface, features, and workflows.
            </p>
            <a
              href="https://michael-borck.github.io/deep-talk/user-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
            >
              Open Guide
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Settings className="w-8 h-8 text-purple-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Features</h3>
            </div>
            <p className="text-gray-600 mb-4">
              In-depth coverage of transcription, AI analysis, search, and export features.
            </p>
            <a
              href="https://michael-borck.github.io/deep-talk/features"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium"
            >
              Explore Features
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>

          {/* Tutorials */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Play className="w-8 h-8 text-orange-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Tutorials</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Step-by-step tutorials from basic workflows to advanced features and automation.
            </p>
            <a
              href="https://michael-borck.github.io/deep-talk/tutorials"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-orange-600 hover:text-orange-800 font-medium"
            >
              Start Learning
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>

          {/* Troubleshooting */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <HelpCircle className="w-8 h-8 text-red-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Troubleshooting</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Find solutions to common issues, FAQ, and detailed troubleshooting guides.
            </p>
            <a
              href="https://michael-borck.github.io/deep-talk/troubleshooting"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-red-600 hover:text-red-800 font-medium"
            >
              Get Help
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>

          {/* Reference */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Search className="w-8 h-8 text-gray-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Reference</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Technical specifications, file formats, system requirements, and quick references.
            </p>
            <a
              href="https://michael-borck.github.io/deep-talk/reference"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 font-medium"
            >
              Browse Reference
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Keyboard Shortcuts */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Keyboard className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h3>
              </div>
              <p className="text-gray-600 mb-3">
                Speed up your workflow with keyboard shortcuts. Press <kbd className="px-2 py-1 text-sm bg-gray-100 rounded">Ctrl+?</kbd> anywhere in the app.
              </p>
              <button
                onClick={() => {
                  // This will be handled by the global keyboard shortcut
                  const event = new KeyboardEvent('keydown', { ctrlKey: true, key: '?' });
                  document.dispatchEvent(event);
                }}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                View Shortcuts
                <Keyboard className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* Quick Start */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Play className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Quick Start</h3>
              </div>
              <p className="text-gray-600 mb-3">
                Get up and running in minutes with our quick start guide covering the essential workflow.
              </p>
              <a
                href="https://michael-borck.github.io/deep-talk/getting-started/quick-start"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
              >
                Quick Start Guide
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>
        </div>

        {/* Complete Documentation Link */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Complete Documentation</h2>
          <p className="text-gray-600 mb-4">
            Access the full documentation website with searchable content, detailed guides, and community contributions.
          </p>
          <a
            href="https://michael-borck.github.io/deep-talk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Open Documentation Website
            <ExternalLink className="w-5 h-5 ml-2" />
          </a>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Tips</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• Use <kbd className="px-2 py-1 text-sm bg-white rounded">Ctrl+?</kbd> to quickly access keyboard shortcuts</li>
            <li>• Bookmark the documentation website for easy access</li>
            <li>• Check the troubleshooting section if you encounter issues</li>
            <li>• The tutorials section provides hands-on learning for all skill levels</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;