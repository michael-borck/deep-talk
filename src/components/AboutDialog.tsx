import React from 'react';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShowLicenses?: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose, onShowLicenses }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">About AudioScribe</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* App Info */}
          <div className="text-center">
            <div className="text-6xl mb-4">🎤</div>
            <h3 className="text-3xl font-bold text-gray-900">AudioScribe</h3>
            <p className="text-xl text-gray-600 mt-2">Version 1.0.0</p>
            <p className="text-gray-500 mt-1">AI-Powered Transcription & Analysis</p>
          </div>

          {/* System Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">System Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Platform:</span>
                <span className="text-gray-900 font-medium">
                  {window.electronAPI?.platform === 'darwin' ? 'macOS' : 
                   window.electronAPI?.platform === 'win32' ? 'Windows' : 'Linux'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Electron:</span>
                <span className="text-gray-900 font-medium">
                  {window.electronAPI?.versions?.electron || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Node.js:</span>
                <span className="text-gray-900 font-medium">
                  {window.electronAPI?.versions?.node || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Chrome:</span>
                <span className="text-gray-900 font-medium">
                  {window.electronAPI?.versions?.chrome || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Key Features</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Local audio/video transcription with Whisper models</li>
              <li>• AI-powered transcript analysis and summarization</li>
              <li>• Smart transcript correction and enhancement</li>
              <li>• Interactive chat with your transcripts using RAG</li>
              <li>• Project-based organization</li>
              <li>• All data stored locally for privacy</li>
            </ul>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => console.log('Documentation coming soon')}
              disabled
              className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
              title="Documentation will be available when the app is feature-complete"
            >
              <span>📚</span>
              <span>Documentation</span>
            </button>
            <button
              onClick={onShowLicenses}
              className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <span>📜</span>
              <span>Licenses</span>
            </button>
            <button
              onClick={() => window.open('https://github.com/michael-borck/audio-scribe', '_blank')}
              className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <span>🐙</span>
              <span>GitHub</span>
            </button>
            <button
              onClick={() => window.open('https://github.com/michael-borck/audio-scribe/issues', '_blank')}
              className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <span>🐛</span>
              <span>Report Issue</span>
            </button>
          </div>

          {/* Check for Updates */}
          <button
            onClick={() => console.log('Check for updates')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <span>🔄</span>
            <span>Check for Updates</span>
          </button>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              © 2024 AudioScribe Project
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Built with ❤️ for Academic Research
            </p>
            <div className="mt-3 text-xs text-gray-500">
              <button className="hover:text-blue-600 transition-colors">Privacy Policy</button>
              <span className="mx-2">•</span>
              <button className="hover:text-blue-600 transition-colors">Terms of Service</button>
              <span className="mx-2">•</span>
              <button className="hover:text-blue-600 transition-colors">Acknowledgments</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};