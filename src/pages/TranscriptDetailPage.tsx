import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TranscriptContext } from '../contexts/TranscriptContext';
import { Transcript } from '../types';
import { formatDate, formatDuration, formatFileSize } from '../utils/helpers';
import { ArrowLeft, Star, Download, Copy, Edit } from 'lucide-react';

export const TranscriptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTranscriptById, updateTranscript } = useContext(TranscriptContext);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showValidated, setShowValidated] = useState(true);
  const [showValidationChanges, setShowValidationChanges] = useState(false);

  useEffect(() => {
    loadTranscript();
  }, [id]);

  const loadTranscript = async () => {
    if (!id) return;
    
    try {
      const transcriptData = await getTranscriptById(id);
      setTranscript(transcriptData);
      setEditedTitle(transcriptData?.title || '');
    } catch (error) {
      console.error('Error loading transcript:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async () => {
    if (!transcript) return;
    
    const updated = await updateTranscript(transcript.id, { 
      starred: !transcript.starred 
    });
    if (updated) {
      setTranscript({ ...transcript, starred: !transcript.starred });
    }
  };

  const handleSaveTitle = async () => {
    if (!transcript) return;
    
    const updated = await updateTranscript(transcript.id, { 
      title: editedTitle 
    });
    if (updated) {
      setTranscript({ ...transcript, title: editedTitle });
      setIsEditing(false);
    }
  };

  const handleCopyTranscript = () => {
    if (transcript?.full_text) {
      navigator.clipboard.writeText(transcript.full_text);
      alert('Transcript copied to clipboard!');
    }
  };

  const handleExportTranscript = () => {
    if (!transcript) return;
    
    // Build advanced analysis section
    let advancedAnalysisContent = '';
    if (transcript.sentiment_overall || transcript.emotions || transcript.speakers) {
      advancedAnalysisContent = `

## Advanced Analysis

### Sentiment Analysis
${transcript.sentiment_overall ? `**Overall Sentiment:** ${transcript.sentiment_overall}` : ''}
${transcript.sentiment_score !== undefined ? ` (Score: ${transcript.sentiment_score > 0 ? '+' : ''}${transcript.sentiment_score.toFixed(2)})` : ''}

### Emotional Tone
${transcript.emotions && Object.keys(transcript.emotions).length > 0 ?
  Object.entries(transcript.emotions)
    .filter(([_, value]) => value > 0.1)
    .sort(([,a], [,b]) => b - a)
    .map(([emotion, value]) => `- **${emotion.charAt(0).toUpperCase() + emotion.slice(1)}:** ${Math.round(value * 100)}%`)
    .join('\n') :
  'No significant emotions detected.'}

### Speaker Information
${transcript.speaker_count && transcript.speaker_count > 1 ? 
  `**Speakers Detected:** ${transcript.speaker_count}` : 
  '**Speakers Detected:** 1 (single speaker)'}

${transcript.speakers && transcript.speakers.length > 0 ?
  transcript.speakers.map(speaker => `- **${speaker.name}:** ${speaker.segments} segments`).join('\n') :
  ''}`;
    }

    // Build research analysis section
    let researchAnalysisContent = '';
    if (transcript.notable_quotes || transcript.research_themes || transcript.qa_pairs || transcript.concept_frequency) {
      researchAnalysisContent = `

## Research Analysis

### Notable Quotes
${transcript.notable_quotes && transcript.notable_quotes.length > 0 ?
  transcript.notable_quotes.slice(0, 5).map((quote, idx) => 
    `${idx + 1}. "${quote.text}" ${quote.speaker ? `— ${quote.speaker}` : ''} (Relevance: ${Math.round(quote.relevance * 100)}%)`
  ).join('\n\n') :
  'No notable quotes identified.'}

### Research Themes
${transcript.research_themes && transcript.research_themes.length > 0 ?
  transcript.research_themes.map(theme => 
    `- **${theme.theme}** (${Math.round(theme.confidence * 100)}% confidence)${theme.examples && theme.examples.length > 0 ? `\n  Examples: ${theme.examples.slice(0, 2).join(', ')}` : ''}`
  ).join('\n') :
  'No research themes identified.'}

### Question-Answer Mapping
${transcript.qa_pairs && transcript.qa_pairs.length > 0 ?
  transcript.qa_pairs.slice(0, 3).map((qa, idx) => 
    `**Q${idx + 1}:** ${qa.question}\n**A${idx + 1}:** ${qa.answer}${qa.speaker ? ` — ${qa.speaker}` : ''}`
  ).join('\n\n') :
  'No question-answer pairs identified.'}

### Concept Frequency
${transcript.concept_frequency && Object.keys(transcript.concept_frequency).length > 0 ?
  Object.entries(transcript.concept_frequency)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 10)
    .map(([concept, data]) => `- **${concept}:** ${data.count} occurrences`)
    .join('\n') :
  'No key concepts identified.'}`;
    }

    const content = `# ${transcript.title}

**Date:** ${formatDate(transcript.created_at)}
**Duration:** ${formatDuration(transcript.duration)}
**File:** ${transcript.file_path?.split('/').pop() || transcript.filename}

## AI Summary

${transcript.summary || 'No summary available.'}

## Key Topics

${transcript.key_topics && transcript.key_topics.length > 0 ? 
  transcript.key_topics.map(topic => `- ${topic}`).join('\n') : 
  'No key topics identified.'}

## Action Items

${transcript.action_items && transcript.action_items.length > 0 ?
  transcript.action_items.map(item => `- ${item}`).join('\n') :
  'No action items identified.'}${advancedAnalysisContent}${researchAnalysisContent}

## Full Transcript

${transcript.full_text || 'No transcript available.'}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transcript.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transcript...</p>
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Transcript not found.</p>
          <button 
            onClick={() => navigate('/library')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Return to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/library')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          <span>Back to Library</span>
        </button>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleStar}
            className={`${transcript.starred ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors`}
          >
            <Star size={20} fill={transcript.starred ? 'currentColor' : 'none'} />
          </button>
          
          <button
            onClick={handleCopyTranscript}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Copy size={16} />
            <span>Copy</span>
          </button>
          
          <button
            onClick={handleExportTranscript}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Title Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          {isEditing ? (
            <div className="flex-1 flex items-center space-x-3">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="flex-1 text-xl font-semibold border border-gray-300 rounded px-3 py-2"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedTitle(transcript.title);
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">{transcript.title}</h1>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Edit size={18} />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-6 text-sm text-gray-500 mt-4">
          <span>📅 {formatDate(transcript.created_at)}</span>
          <span>⏱️ {formatDuration(transcript.duration)}</span>
          <span>📁 {formatFileSize(transcript.file_size)}</span>
          <span>📄 {transcript.file_path?.split('/').pop() || transcript.filename}</span>
        </div>
      </div>

      {/* Summary Section */}
      {transcript.summary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">AI Summary</h2>
          <p className="text-gray-700 leading-relaxed">{transcript.summary}</p>
        </div>
      )}

      {/* Key Topics */}
      {transcript.key_topics && transcript.key_topics.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Key Topics</h2>
          <div className="flex flex-wrap gap-2">
            {transcript.key_topics.map((topic, idx) => (
              <span key={idx} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {transcript.action_items && transcript.action_items.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Action Items</h2>
          <div className="space-y-2">
            {transcript.action_items.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Analysis Section */}
      {(transcript.sentiment_overall || transcript.emotions || transcript.speakers || 
        transcript.notable_quotes || transcript.research_themes || transcript.qa_pairs || transcript.concept_frequency) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Advanced Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sentiment Analysis */}
            {transcript.sentiment_overall && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Overall Sentiment</h3>
                <div className="flex items-center space-x-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    transcript.sentiment_overall === 'positive' ? 'bg-green-100 text-green-800' :
                    transcript.sentiment_overall === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {transcript.sentiment_overall === 'positive' ? '😊 Positive' :
                     transcript.sentiment_overall === 'negative' ? '😔 Negative' :
                     '😐 Neutral'}
                  </div>
                  {transcript.sentiment_score !== undefined && (
                    <span className="text-sm text-gray-500">
                      ({transcript.sentiment_score > 0 ? '+' : ''}{transcript.sentiment_score.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Speaker Count */}
            {transcript.speaker_count && transcript.speaker_count > 1 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Speakers Detected</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-semibold text-primary-600">{transcript.speaker_count}</span>
                  <span className="text-sm text-gray-500">
                    {transcript.speaker_count === 1 ? 'speaker' : 'speakers'}
                  </span>
                </div>
              </div>
            )}

            {/* Emotions */}
            {transcript.emotions && Object.keys(transcript.emotions).length > 0 && (
              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <h3 className="text-sm font-medium text-gray-700">Emotional Tone</h3>
                <div className="space-y-1">
                  {Object.entries(transcript.emotions)
                    .filter(([_, value]) => value > 0.1) // Only show emotions with some presence
                    .sort(([,a], [,b]) => b - a) // Sort by intensity
                    .slice(0, 3) // Show top 3
                    .map(([emotion, value]) => (
                      <div key={emotion} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{emotion}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-500 h-2 rounded-full" 
                              style={{ width: `${Math.round(value * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 w-8">{Math.round(value * 100)}%</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Speakers List */}
          {transcript.speakers && transcript.speakers.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Speaker Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {transcript.speakers.map((speaker, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-700">
                          {speaker.id.replace('Speaker ', '')}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{speaker.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{speaker.segments} segments</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Research Analysis */}
          {(transcript.notable_quotes || transcript.research_themes || transcript.qa_pairs || transcript.concept_frequency) && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Research Analysis</h3>

              {/* Notable Quotes */}
              {transcript.notable_quotes && transcript.notable_quotes.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">📝 Notable Quotes</h4>
                  <div className="space-y-3">
                    {transcript.notable_quotes.slice(0, 5).map((quote, idx) => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-lg">
                        <blockquote className="text-gray-700 italic">"{quote.text}"</blockquote>
                        <div className="flex items-center justify-between mt-2">
                          {quote.speaker && (
                            <span className="text-xs text-gray-500">— {quote.speaker}</span>
                          )}
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">Relevance:</span>
                            <div className="w-12 bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-blue-500 h-1 rounded-full" 
                                style={{ width: `${Math.round(quote.relevance * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{Math.round(quote.relevance * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Research Themes */}
              {transcript.research_themes && transcript.research_themes.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">🏷️ Research Themes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {transcript.research_themes.map((theme, idx) => (
                      <div key={idx} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-purple-900">{theme.theme}</h5>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {Math.round(theme.confidence * 100)}% confidence
                          </span>
                        </div>
                        {theme.examples && theme.examples.length > 0 && (
                          <div className="text-xs text-purple-700">
                            Examples: {theme.examples.slice(0, 2).join(', ')}
                            {theme.examples.length > 2 && '...'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question-Answer Pairs */}
              {transcript.qa_pairs && transcript.qa_pairs.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">❓ Question-Answer Mapping</h4>
                  <div className="space-y-3">
                    {transcript.qa_pairs.slice(0, 3).map((qa, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-2">
                          <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Question</span>
                          <p className="text-sm text-gray-800 mt-1">{qa.question}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Answer</span>
                          <p className="text-sm text-gray-700 mt-1">{qa.answer}</p>
                        </div>
                        {qa.speaker && (
                          <div className="mt-2 text-xs text-gray-500">— {qa.speaker}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concept Frequency */}
              {transcript.concept_frequency && Object.keys(transcript.concept_frequency).length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">📊 Concept Frequency</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(transcript.concept_frequency)
                      .sort(([,a], [,b]) => b.count - a.count)
                      .slice(0, 9)
                      .map(([concept, data]) => (
                        <div key={concept} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-orange-900 capitalize">{concept}</span>
                            <span className="text-lg font-bold text-orange-600">{data.count}</span>
                          </div>
                          <div className="text-xs text-orange-700">
                            {data.contexts && data.contexts.length > 0 && data.contexts[0]}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Transcript Text */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
          <div className="flex items-center space-x-4">
            {/* Show transcript type toggle if validated text exists */}
            {transcript.validated_text && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowValidated(false)}
                  className={`px-3 py-1 text-sm rounded ${
                    !showValidated ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setShowValidated(true)}
                  className={`px-3 py-1 text-sm rounded ${
                    showValidated ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Validated
                </button>
                {transcript.validation_changes && transcript.validation_changes.length > 0 && (
                  <button
                    onClick={() => setShowValidationChanges(!showValidationChanges)}
                    className="px-3 py-1 text-sm rounded text-purple-600 hover:bg-purple-100"
                  >
                    {showValidationChanges ? 'Hide' : 'Show'} Changes ({transcript.validation_changes.length})
                  </button>
                )}
              </div>
            )}
            {/* Word count */}
            {(transcript.full_text || transcript.validated_text) && (
              <div className="text-sm text-gray-500">
                {(showValidated && transcript.validated_text ? transcript.validated_text : transcript.full_text)?.split(' ').length} words
              </div>
            )}
          </div>
        </div>

        {/* Validation Changes */}
        {showValidationChanges && transcript.validation_changes && transcript.validation_changes.length > 0 && (
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-sm font-medium text-purple-900 mb-2">Validation Changes:</h3>
            <div className="space-y-2">
              {transcript.validation_changes.slice(0, 10).map((change, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium text-purple-700 capitalize">{change.type}:</span>
                  <span className="text-red-600 line-through ml-2">{change.original}</span>
                  <span className="text-green-600 ml-2">→ {change.corrected}</span>
                </div>
              ))}
              {transcript.validation_changes.length > 10 && (
                <p className="text-xs text-purple-600">... and {transcript.validation_changes.length - 10} more changes</p>
              )}
            </div>
          </div>
        )}
        
        {/* Transcript text */}
        {(transcript.full_text || transcript.validated_text) ? (
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {showValidated && transcript.validated_text ? transcript.validated_text : transcript.full_text}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No transcript available.</p>
            {transcript.status === 'processing' && (
              <p className="mt-2">Transcript is still being processed...</p>
            )}
            {transcript.status === 'error' && (
              <p className="mt-2 text-red-600">There was an error processing this file.</p>
            )}
          </div>
        )}
      </div>

      {/* Debug Section - Analysis Data */}
      <details className="bg-gray-50 rounded-lg p-4 mt-6">
        <summary className="text-sm font-medium text-gray-700 cursor-pointer mb-2">
          🔍 Debug: Analysis Data (Click to expand)
        </summary>
        <div className="space-y-4 text-xs text-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Basic Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Basic Info:</h4>
              <ul className="space-y-1">
                <li><strong>Status:</strong> {transcript.status}</li>
                <li><strong>Duration:</strong> {transcript.duration || 0} seconds</li>
                <li><strong>File Size:</strong> {formatFileSize(transcript.file_size)}</li>
                <li><strong>Original Text:</strong> {transcript.full_text ? `${transcript.full_text.length} chars` : 'None'}</li>
                <li><strong>Validated Text:</strong> {transcript.validated_text ? `${transcript.validated_text.length} chars` : 'None'}</li>
                <li><strong>Validation Changes:</strong> {transcript.validation_changes?.length || 0}</li>
              </ul>
            </div>

            {/* Analysis Results */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Analysis Results:</h4>
              <ul className="space-y-1">
                <li><strong>Summary:</strong> {transcript.summary ? `${transcript.summary.length} chars` : 'None'}</li>
                <li><strong>Key Topics:</strong> {transcript.key_topics?.length || 0}</li>
                <li><strong>Action Items:</strong> {transcript.action_items?.length || 0}</li>
                <li><strong>Sentiment:</strong> {transcript.sentiment_overall || 'None'} 
                  {transcript.sentiment_score !== undefined && ` (${transcript.sentiment_score})`}</li>
                <li><strong>Speaker Count:</strong> {transcript.speaker_count || 'None'}</li>
                <li><strong>Speakers:</strong> {transcript.speakers?.length || 0}</li>
                <li><strong>Notable Quotes:</strong> {transcript.notable_quotes?.length || 0}</li>
                <li><strong>Research Themes:</strong> {transcript.research_themes?.length || 0}</li>
                <li><strong>Q&A Pairs:</strong> {transcript.qa_pairs?.length || 0}</li>
                <li><strong>Concepts:</strong> {transcript.concept_frequency ? Object.keys(transcript.concept_frequency).length : 0}</li>
              </ul>
            </div>
          </div>

          {/* Raw Data Preview */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Raw Analysis Data Preview:</h4>
            <div className="bg-white p-2 rounded border max-h-96 overflow-auto">
              <pre className="text-xs">
                {JSON.stringify({
                  sentiment_overall: transcript.sentiment_overall,
                  sentiment_score: transcript.sentiment_score,
                  emotions: transcript.emotions,
                  speakers: transcript.speakers,
                  notable_quotes: transcript.notable_quotes?.slice(0, 2),
                  research_themes: transcript.research_themes?.slice(0, 2),
                  qa_pairs: transcript.qa_pairs?.slice(0, 2),
                  concept_frequency: transcript.concept_frequency ? 
                    Object.fromEntries(Object.entries(transcript.concept_frequency).slice(0, 3)) : {}
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};