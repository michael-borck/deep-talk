import React, { useState } from 'react';
import { X, Download, FileText, CheckCircle, Edit3, Users } from 'lucide-react';
import { Transcript } from '../types';

interface ExportModalProps {
  transcript: Transcript;
  isOpen: boolean;
  onClose: () => void;
}

type ExportVersion = 'original' | 'corrected' | 'speaker-tagged';
type ExportFormat = 'markdown' | 'txt' | 'json';

export const ExportModal: React.FC<ExportModalProps> = ({
  transcript,
  isOpen,
  onClose,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<ExportVersion>('corrected');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);

  if (!isOpen) return null;

  const getTranscriptContent = (): string => {
    switch (selectedVersion) {
      case 'original':
        return transcript.full_text || 'No original transcript available.';
      case 'corrected':
        return transcript.validated_text || transcript.full_text || 'No corrected transcript available.';
      case 'speaker-tagged':
        return transcript.processed_text || transcript.validated_text || transcript.full_text || 'No speaker-tagged transcript available.';
      default:
        return transcript.full_text || 'No transcript available.';
    }
  };

  const getVersionDescription = (version: ExportVersion): string => {
    switch (version) {
      case 'original':
        return 'Raw transcript as received from speech-to-text service';
      case 'corrected':
        return 'AI-corrected version with improved spelling, grammar, and punctuation';
      case 'speaker-tagged':
        return 'Formatted version with speaker identification and proper formatting';
    }
  };

  const isVersionAvailable = (version: ExportVersion): boolean => {
    switch (version) {
      case 'original':
        return !!transcript.full_text;
      case 'corrected':
        return !!transcript.validated_text;
      case 'speaker-tagged':
        return !!transcript.processed_text;
    }
  };

  const getVersionIcon = (version: ExportVersion) => {
    switch (version) {
      case 'original':
        return <FileText size={16} className="text-gray-500" />;
      case 'corrected':
        return <Edit3 size={16} className="text-blue-500" />;
      case 'speaker-tagged':
        return <Users size={16} className="text-green-500" />;
    }
  };

  const buildExportContent = (): string => {
    const transcriptContent = getTranscriptContent();

    if (selectedFormat === 'txt') {
      return transcriptContent;
    }

    if (selectedFormat === 'json') {
      const exportData = {
        metadata: {
          title: transcript.title,
          filename: transcript.filename,
          created_at: transcript.created_at,
          updated_at: transcript.updated_at,
          duration: transcript.duration,
          version: selectedVersion
        },
        content: transcriptContent,
        ...(includeAnalysis && {
          analysis: {
            summary: transcript.summary,
            key_topics: transcript.key_topics,
            action_items: transcript.action_items,
            sentiment_overall: transcript.sentiment_overall,
            sentiment_score: transcript.sentiment_score,
            emotions: transcript.emotions,
            speaker_count: transcript.speaker_count,
            speakers: transcript.speakers
          }
        })
      };
      return JSON.stringify(exportData, null, 2);
    }

    // Markdown format
    let content = `# ${transcript.title}\n\n`;

    if (includeMetadata) {
      content += `## Transcript Information\n\n`;
      content += `- **File:** ${transcript.filename}\n`;
      content += `- **Created:** ${new Date(transcript.created_at).toLocaleString()}\n`;
      if (transcript.duration) {
        const minutes = Math.floor(transcript.duration / 60);
        const seconds = transcript.duration % 60;
        content += `- **Duration:** ${minutes}:${seconds.toString().padStart(2, '0')}\n`;
      }
      content += `- **Version:** ${selectedVersion.charAt(0).toUpperCase() + selectedVersion.slice(1).replace('-', ' ')}\n`;
      if (transcript.speaker_count && transcript.speaker_count > 1) {
        content += `- **Speakers:** ${transcript.speaker_count}\n`;
      }
      content += `\n`;
    }

    if (includeAnalysis && transcript.summary) {
      content += `## Summary\n\n${transcript.summary}\n\n`;
    }

    if (includeAnalysis && transcript.key_topics && transcript.key_topics.length > 0) {
      content += `## Key Topics\n\n${transcript.key_topics.map(topic => `- ${topic}`).join('\n')}\n\n`;
    }

    if (includeAnalysis && transcript.action_items && transcript.action_items.length > 0) {
      content += `## Action Items\n\n${transcript.action_items.map(item => `- ${item}`).join('\n')}\n\n`;
    }

    if (includeAnalysis && (transcript.sentiment_overall || transcript.emotions)) {
      content += `## Analysis\n\n`;
      
      if (transcript.sentiment_overall) {
        content += `**Sentiment:** ${transcript.sentiment_overall}`;
        if (transcript.sentiment_score !== undefined) {
          content += ` (${transcript.sentiment_score > 0 ? '+' : ''}${transcript.sentiment_score.toFixed(2)})`;
        }
        content += `\n\n`;
      }

      if (transcript.emotions && Object.keys(transcript.emotions).length > 0) {
        content += `**Emotions:**\n`;
        Object.entries(transcript.emotions)
          .filter(([_, value]) => value > 0.1)
          .sort(([,a], [,b]) => b - a)
          .forEach(([emotion, value]) => {
            content += `- ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}: ${Math.round(value * 100)}%\n`;
          });
        content += `\n`;
      }
    }

    content += `## Transcript\n\n${transcriptContent}\n`;

    return content;
  };

  const handleExport = () => {
    const content = buildExportContent();
    const mimeType = selectedFormat === 'json' ? 'application/json' : 'text/plain';
    const extension = selectedFormat === 'markdown' ? 'md' : selectedFormat;
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transcript.title.replace(/[^a-z0-9]/gi, '_')}_${selectedVersion}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Export Transcript</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Version Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Transcript Version
            </label>
            <div className="space-y-2">
              {(['original', 'corrected', 'speaker-tagged'] as ExportVersion[]).map((version) => {
                const available = isVersionAvailable(version);
                return (
                  <div
                    key={version}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedVersion === version
                        ? 'border-blue-500 bg-blue-50'
                        : available
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                    }`}
                    onClick={() => available && setSelectedVersion(version)}
                  >
                    <div className="flex items-center space-x-3">
                      {getVersionIcon(version)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${available ? 'text-gray-900' : 'text-gray-400'}`}>
                            {version.charAt(0).toUpperCase() + version.slice(1).replace('-', ' ')}
                          </span>
                          {available && selectedVersion === version && (
                            <CheckCircle size={16} className="text-blue-500" />
                          )}
                          {!available && (
                            <span className="text-xs text-gray-400">(Not available)</span>
                          )}
                        </div>
                        <p className={`text-xs ${available ? 'text-gray-600' : 'text-gray-400'}`}>
                          {getVersionDescription(version)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="markdown">Markdown (.md)</option>
              <option value="txt">Plain Text (.txt)</option>
              <option value="json">JSON (.json)</option>
            </select>
          </div>

          {/* Options */}
          {selectedFormat !== 'txt' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Include Additional Data
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">File metadata and information</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeAnalysis}
                    onChange={(e) => setIncludeAnalysis(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Analysis results (summary, topics, sentiment)</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!isVersionAvailable(selectedVersion)}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};