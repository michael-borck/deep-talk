import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TranscriptContext } from '../contexts/TranscriptContext';
import { useProjects } from '../contexts/ProjectContext';
import { Transcript, Project } from '../types';
import { formatDate, formatDuration, formatFileSize } from '../utils/helpers';
import { ArrowLeft, Star, Download, Copy, Edit, Users, MessageCircle, Search } from 'lucide-react';
import { SpeakerTaggingModal } from '../components/SpeakerTaggingModal';
import { TranscriptChatModal } from '../components/TranscriptChatModal';
import { ExportModal } from '../components/ExportModal';

type TabType = 'overview' | 'transcript' | 'analysis' | 'conversations' | 'notes';

export const TranscriptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTranscriptById, updateTranscript } = useContext(TranscriptContext);
  const { projects } = useProjects();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showValidationChanges, setShowValidationChanges] = useState(false);
  const [showSpeakerTagging, setShowSpeakerTagging] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [transcriptProjects, setTranscriptProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTranscriptSubTab, setActiveTranscriptSubTab] = useState<string>('full');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  useEffect(() => {
    loadTranscript();
  }, [id]);

  useEffect(() => {
    const loadTranscriptProjects = async () => {
      if (!transcript?.id || projects.length === 0) return;
      
      try {
        const projectRelations = await window.electronAPI.database.all(
          `SELECT project_id FROM project_transcripts WHERE transcript_id = ?`,
          [transcript.id]
        );
        
        const relatedProjects = projects.filter(project => 
          projectRelations.some(relation => relation.project_id === project.id)
        );
        
        setTranscriptProjects(relatedProjects);
      } catch (error) {
        console.error('Error loading transcript projects:', error);
      }
    };

    loadTranscriptProjects();
  }, [transcript?.id, projects]);

  const loadTranscript = async () => {
    if (!id) return;
    
    try {
      const transcriptData = await getTranscriptById(id);
      setTranscript(transcriptData);
      setEditedTitle(transcriptData?.title || '');
      setEditedNotes(transcriptData?.personal_notes || '');
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

  const handleSaveNotes = async () => {
    if (!transcript) return;
    
    const updated = await updateTranscript(transcript.id, { 
      personal_notes: editedNotes 
    });
    if (updated) {
      setTranscript({ ...transcript, personal_notes: editedNotes });
      setIsEditingNotes(false);
    }
  };

  const handleCopyTranscript = () => {
    if (transcript?.full_text) {
      navigator.clipboard.writeText(transcript.full_text);
      alert('Transcript copied to clipboard!');
    }
  };

  const handleExportTranscript = () => {
    setShowExportModal(true);
  };

  const handleSpeakerTaggingSave = async (taggedText: string, speakers: Array<{ id: string; name: string; segments: number }>) => {
    if (!transcript) return;
    
    try {
      const success = await updateTranscript(transcript.id, {
        processed_text: taggedText,
        speakers: speakers,
        speaker_count: speakers.length
      });
      
      if (success) {
        await loadTranscript();
      }
    } catch (error) {
      console.error('Error saving speaker tags:', error);
      alert('Failed to save speaker tags. Please try again.');
    }
  };

  const getAnonymizedSpeakerName = (speaker: { id: string; name: string }) => {
    // Always show real speaker names since anonymize toggle was removed
    return speaker.name;
  };

  // Extract speaker text from transcript using enhanced pattern matching
  const extractSpeakerText = (text: string, speakerName: string): string[] => {
    if (!text) return [];
    
    console.log('Extracting speaker text for:', speakerName);
    console.log('From text (first 200 chars):', text.substring(0, 200));
    console.log('Text source type:', text === transcript?.processed_text ? 'processed_text (tagged)' : 
                                    text === transcript?.validated_text ? 'validated_text' : 'full_text (original)');
    
    // Escape special regex characters in speaker name
    const escapedName = speakerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    console.log('Escaped speaker name:', escapedName);
    
    // Enhanced patterns to match different speaker tagging formats
    const patterns = [
      // [Speaker Name]: text (bracket with colon format)
      new RegExp(`\\[${escapedName}\\]\\s*:\\s*([^\\n]*(?:\\n(?!\\[[^\\]]+\\]\\s*:)[^\\n]*)*)`, 'gi'),
      // Speaker Name: text (simple colon format - used by manual tagging)
      new RegExp(`^${escapedName}\\s*:\\s*([^\\n]*(?:\\n(?!^[A-Za-z0-9\\s]+\\s*:)[^\\n]*)*)`, 'gim'),
      // Multi-line Speaker Name: format
      new RegExp(`${escapedName}\\s*:\\s*([^\\n]*(?:\\n(?!^[A-Za-z0-9\\s]+\\s*:)[^\\n]*)*)`, 'gi'),
      // [Speaker Name] text (bracket without colon)
      new RegExp(`\\[${escapedName}\\]\\s*([^\\n]*(?:\\n(?!\\[[^\\]]+\\])[^\\n]*)*)`, 'gi'),
      // SPEAKER NAME: text (uppercase)
      new RegExp(`^${escapedName.toUpperCase()}\\s*:\\s*([^\\n]*(?:\\n(?!^[A-Z][^:]*:)[^\\n]*)*)`, 'gim')
    ];
    
    const segments: string[] = [];
    
    patterns.forEach((pattern, idx) => {
      console.log(`Testing pattern ${idx + 1}:`, pattern.toString());
      // Reset regex lastIndex to avoid conflicts
      pattern.lastIndex = 0;
      let match;
      let matchCount = 0;
      while ((match = pattern.exec(text)) !== null) {
        matchCount++;
        const segment = match[1]?.trim();
        console.log(`Pattern ${idx + 1} match ${matchCount}:`, segment?.substring(0, 50) + '...');
        if (segment && segment.length > 10) { // Minimum segment length
          segments.push(segment);
        }
      }
      console.log(`Pattern ${idx + 1} found ${matchCount} matches`);
    });
    
    // Remove duplicates and merge very similar segments
    const uniqueSegments = segments.filter((seg, idx) => {
      // Check if this segment is substantially different from previous ones
      return !segments.slice(0, idx).some(prev => 
        prev.length > 50 && seg.length > 50 && 
        prev.substring(0, 50) === seg.substring(0, 50)
      );
    });
    
    console.log(`Total unique segments found for ${speakerName}:`, uniqueSegments.length);
    uniqueSegments.forEach((seg, idx) => {
      console.log(`Segment ${idx + 1}:`, seg.substring(0, 50) + '...');
    });
    
    return uniqueSegments;
  };

  // Get speaker colors consistently
  const getSpeakerColor = (index: number) => {
    const colors = [
      { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', accent: 'bg-blue-500' },
      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', accent: 'bg-green-500' },
      { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', accent: 'bg-yellow-500' },
      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', accent: 'bg-purple-500' },
      { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900', accent: 'bg-pink-500' },
      { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', accent: 'bg-indigo-500' },
    ];
    return colors[index % colors.length];
  };

  const tabs = [
    { id: 'overview' as const, label: '📄 Overview', name: 'Overview' },
    { id: 'transcript' as const, label: '📝 Transcript', name: 'Transcript' },
    { id: 'analysis' as const, label: '🔍 Analysis', name: 'Analysis' },
    { id: 'conversations' as const, label: '💬 Conversations', name: 'Conversations' },
    { id: 'notes' as const, label: '📓 Notes', name: 'Notes' }
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transcript...</p>
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="max-w-6xl mx-auto p-8">
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

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(transcript.duration)}</p>
            </div>
            <div className="text-blue-500">⏱️</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Word Count</p>
              <p className="text-2xl font-bold text-gray-900">
                {transcript.full_text?.split(' ').length || 0}
              </p>
            </div>
            <div className="text-green-500">📄</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Speakers</p>
              <p className="text-2xl font-bold text-gray-900">{transcript.speaker_count || 1}</p>
            </div>
            <div className="text-purple-500">👥</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">File Size</p>
              <p className="text-2xl font-bold text-gray-900">{formatFileSize(transcript.file_size)}</p>
            </div>
            <div className="text-orange-500">💾</div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      {transcript.summary && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 AI Summary</h3>
          <p className="text-gray-700 leading-relaxed">{transcript.summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Topics */}
        {transcript.key_topics && transcript.key_topics.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🏷️ Key Topics</h3>
            <div className="flex flex-wrap gap-2">
              {transcript.key_topics.slice(0, 8).map((topic, idx) => (
                <span key={idx} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                  {topic}
                </span>
              ))}
              {transcript.key_topics.length > 8 && (
                <span className="text-sm text-gray-500">+{transcript.key_topics.length - 8} more</span>
              )}
            </div>
          </div>
        )}

        {/* Action Items */}
        {transcript.action_items && transcript.action_items.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📌 Action Items</h3>
            <div className="space-y-2">
              {transcript.action_items.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
              {transcript.action_items.length > 5 && (
                <p className="text-sm text-gray-500 ml-4">+{transcript.action_items.length - 5} more actions</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Projects */}
      {transcriptProjects.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📁 Projects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transcriptProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <span className="text-2xl">{project.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{project.name}</h4>
                  <p className="text-sm text-gray-500 truncate">{project.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTranscriptTab = () => {
    const currentText = transcript.validated_text || transcript.full_text;
    const speakers = transcript.speakers || [];
    
    // For speaker extraction, prioritize processed_text (contains speaker tags)
    // If not available, use original full_text (validated text might not have speaker tags)
    const textForSpeakerExtraction = transcript.processed_text || transcript.full_text;
    
    // Create sub-tabs: Full transcript + individual speakers
    const transcriptSubTabs = [
      { 
        id: 'full', 
        label: '📄 Full Transcript', 
        name: 'Full',
        speaker: null,
        color: null
      },
      ...speakers.map((speaker, idx) => ({
        id: `speaker-${idx}`,
        label: `👤 ${getAnonymizedSpeakerName(speaker)}`,
        name: getAnonymizedSpeakerName(speaker),
        speaker,
        color: getSpeakerColor(idx)
      }))
    ];

    return (
      <div className="space-y-6">
        {/* Corrections Applied */}
        {transcript.validation_changes && transcript.validation_changes.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📝 Corrections Applied</h3>
              <button
                onClick={() => setShowValidationChanges(!showValidationChanges)}
                className="px-3 py-1 text-sm rounded text-purple-600 hover:bg-purple-100"
              >
                {showValidationChanges ? 'Hide' : 'Show'} Changes ({transcript.validation_changes.length})
              </button>
            </div>
            
            {showValidationChanges && (
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
            )}
          </div>
        )}

        {/* Transcript Sub-tabs */}
        {transcriptSubTabs.length > 1 && (
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Sub-tab Navigation */}
            <div className="border-b border-gray-200 px-4">
              <div className="flex space-x-6 overflow-x-auto">
                {transcriptSubTabs.map(subTab => (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveTranscriptSubTab(subTab.id)}
                    className={`
                      py-3 text-sm font-medium transition-colors relative whitespace-nowrap
                      ${activeTranscriptSubTab === subTab.id 
                        ? 'text-primary-600' 
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    {subTab.label}
                    {activeTranscriptSubTab === subTab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-tab Content */}
            <div className="p-6">
              {activeTranscriptSubTab === 'full' ? (
                // Full transcript view
                currentText ? (
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {currentText}
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
                )
              ) : (
                // Individual speaker view
                (() => {
                  const selectedSubTab = transcriptSubTabs.find(tab => tab.id === activeTranscriptSubTab);
                  if (!selectedSubTab?.speaker || !selectedSubTab?.color || !currentText) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p>No text found for this speaker.</p>
                      </div>
                    );
                  }

                  const speakerSegments = extractSpeakerText(textForSpeakerExtraction || '', selectedSubTab.speaker.name);
                  const color = selectedSubTab.color;

                  return (
                    <div className="space-y-6">
                      {/* Speaker Stats */}
                      <div className={`${color.bg} ${color.border} border rounded-lg p-4`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${color.accent}`}></div>
                            <h4 className={`font-semibold ${color.text}`}>
                              {selectedSubTab.name}
                            </h4>
                          </div>
                          <div className={`text-sm ${color.text}`}>
                            {speakerSegments.length} segments • {speakerSegments.join(' ').split(' ').length} words
                          </div>
                        </div>
                      </div>

                      {/* Speaker Segments */}
                      {speakerSegments.length > 0 ? (
                        <div className="space-y-4">
                          {speakerSegments.map((segment, idx) => (
                            <div key={idx} className={`${color.bg} ${color.border} border rounded-lg p-4`}>
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full ${color.accent} mt-2 flex-shrink-0`}></div>
                                <div className="flex-1">
                                  <div className={`text-sm ${color.text} leading-relaxed`}>
                                    {segment}
                                  </div>
                                  <div className={`text-xs ${color.text} opacity-75 mt-2`}>
                                    Segment {idx + 1} • {segment.split(' ').length} words
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`${color.bg} ${color.border} border rounded-lg p-8 text-center`}>
                          <div className={`${color.text}`}>
                            <p className="text-lg font-medium mb-2">No segments found</p>
                            <p className="text-sm opacity-75">
                              This speaker may not have clearly marked dialogue in the transcript, 
                              or the transcript may need speaker tagging.
                            </p>
                            <button
                              onClick={() => setShowSpeakerTagging(true)}
                              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                            >
                              Add Speaker Tags
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}

        {/* Fallback: Single transcript view if no speakers */}
        {transcriptSubTabs.length <= 1 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {currentText ? (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {currentText}
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
        )}
      </div>
    );
  };

  const renderAnalysisTab = () => (
    <div className="space-y-6">
      {/* Sentiment & Emotions */}
      {(transcript.sentiment_overall || transcript.emotions) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">😊 Sentiment & Emotions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {transcript.sentiment_overall && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Overall Sentiment</h4>
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

            {transcript.emotions && Object.keys(transcript.emotions).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Emotional Tone</h4>
                <div className="space-y-2">
                  {Object.entries(transcript.emotions)
                    .filter(([_, value]) => value > 0.1)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
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
        </div>
      )}

      {/* Speaker Analysis */}
      {transcript.speakers && transcript.speakers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Speaker Analysis</h3>
          
          <div className="space-y-3">
            {transcript.speakers.map((speaker, idx) => {
              const totalSegments = transcript.speakers?.reduce((sum, s) => sum + (s?.segments || 0), 0) ?? 0;
              const percentage = totalSegments > 0 ? (speaker.segments / totalSegments) * 100 : 0;
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
              const color = colors[idx % colors.length];
              
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${color}`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        {getAnonymizedSpeakerName(speaker)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {speaker.segments} segments ({Math.round(percentage)}%)
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${color} transition-all duration-500`}
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notable Quotes */}
      {transcript.notable_quotes && transcript.notable_quotes.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💬 Notable Quotes</h3>
          <div className="space-y-4">
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏷️ Research Themes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transcript.research_themes.map((theme, idx) => (
              <div key={idx} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-purple-900">{theme.theme}</h4>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {Math.round(theme.confidence * 100)}%
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

      {/* Q&A Pairs */}
      {transcript.qa_pairs && transcript.qa_pairs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">❓ Question-Answer Pairs</h3>
          <div className="space-y-4">
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Concept Frequency</h3>
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
  );

  const renderConversationsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <MessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chat History</h3>
          <p className="text-gray-600 mb-4">
            Chat conversations with this transcript will appear here.
          </p>
          <button
            onClick={() => setShowChatModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Start New Conversation
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotesTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">📓 Personal Notes</h3>
          {!isEditingNotes ? (
            <button
              onClick={() => {
                setIsEditingNotes(true);
                setEditedNotes(transcript.personal_notes || '');
              }}
              className="flex items-center space-x-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Edit size={16} />
              <span>Edit Notes</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditingNotes(false);
                  setEditedNotes(transcript.personal_notes || '');
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        
        {isEditingNotes ? (
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y font-mono text-sm"
            placeholder="Add your personal notes about this transcript here...

💡 Tips:
- Capture key insights and observations
- Note connections to other interviews or research
- Record methodological observations
- Add follow-up questions or action items
- Include timestamps for specific moments (e.g., [12:34])
- Use markdown formatting for better organization"
          />
        ) : (
          <div className="prose max-w-none">
            {transcript.personal_notes ? (
              <div className="text-gray-700 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {transcript.personal_notes}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  No personal notes added yet.
                </p>
                <button
                  onClick={() => {
                    setIsEditingNotes(true);
                    setEditedNotes('');
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Add Notes
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Note Statistics */}
      {transcript.personal_notes && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>📅 Last updated: {formatDate(transcript.updated_at)}</span>
            <span>📦 {transcript.personal_notes.length} characters</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/library')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          <span>Back to Library</span>
        </button>
        
        {/* Quick Actions Toolbar */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleStar}
            className={`${transcript.starred ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors`}
          >
            <Star size={20} fill={transcript.starred ? 'currentColor' : 'none'} />
          </button>
          
          <button
            onClick={() => setShowChatModal(true)}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md"
            disabled={transcript.is_archived}
          >
            <MessageCircle size={16} />
            <span>Chat</span>
          </button>
          
          <button
            onClick={handleCopyTranscript}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Copy size={16} />
            <span>Copy</span>
          </button>
          
          <button
            onClick={() => setShowSpeakerTagging(true)}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-300 rounded-md hover:bg-purple-50"
          >
            <Users size={16} />
            <span>Speakers</span>
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

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transcript content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-6 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              pb-3 text-sm font-medium transition-colors relative
              ${activeTab === tab.id 
                ? 'text-primary-600' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'transcript' && renderTranscriptTab()}
        {activeTab === 'analysis' && renderAnalysisTab()}
        {activeTab === 'conversations' && renderConversationsTab()}
        {activeTab === 'notes' && renderNotesTab()}
      </div>

      {/* Modals */}
      <SpeakerTaggingModal
        isOpen={showSpeakerTagging}
        onClose={() => setShowSpeakerTagging(false)}
        transcriptText={transcript.processed_text || transcript.full_text || ''}
        existingSpeakers={transcript.speakers}
        onSave={handleSpeakerTaggingSave}
      />

      <TranscriptChatModal
        transcript={transcript}
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />

      <ExportModal
        transcript={transcript}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};