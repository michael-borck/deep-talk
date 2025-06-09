import React, { useState, useMemo, useEffect } from 'react';
import { Clock, Copy, ExternalLink } from 'lucide-react';
import { sentenceSegmentsService } from '../services/sentenceSegmentsService';
import { SentenceSegment } from '../types';

interface TimestampSegment {
  timestamp: string;
  text: string;
  startSeconds?: number;
}

interface TimestampedTranscriptProps {
  transcript: string;
  transcriptId?: string;
  version?: 'original' | 'corrected' | 'speaker_tagged';
  showTimestamps?: boolean;
  editable?: boolean;
  onTextChange?: (newText: string) => void;
  className?: string;
}

export const TimestampedTranscript: React.FC<TimestampedTranscriptProps> = ({
  transcript,
  transcriptId,
  version = 'original',
  showTimestamps = true,
  editable = false,
  onTextChange,
  className = ""
}) => {
  const [highlightedSegment, setHighlightedSegment] = useState<number | null>(null);
  const [sentenceSegments, setSentenceSegments] = useState<SentenceSegment[]>([]);
  const [useSegments, setUseSegments] = useState(false);
  const [loadingSegments, setLoadingSegments] = useState(false);

  // Load sentence segments if available, create them if they don't exist
  useEffect(() => {
    const loadSegments = async () => {
      if (transcriptId) {
        setLoadingSegments(true);
        console.log(`Loading segments for transcript ${transcriptId}, version ${version}`);
        
        let segments = await sentenceSegmentsService.getSegments(transcriptId, version);
        console.log(`Found ${segments.length} existing segments for version ${version}`);
        
        // If no segments found for the requested version, try 'original' as fallback
        if (segments.length === 0 && version !== 'original') {
          console.log(`No segments found for version ${version}, trying 'original' as fallback`);
          segments = await sentenceSegmentsService.getSegments(transcriptId, 'original');
          console.log(`Found ${segments.length} original segments as fallback`);
        }
        
        if (segments.length > 0) {
          setSentenceSegments(segments);
          setUseSegments(true);
          console.log('Using existing segments with timestamps:', segments.some(s => s.start_time != null));
        } else {
          // Try to create segments on-demand for existing transcripts
          if (version === 'original' && transcript) {
            console.log('No segments found, attempting to create segments on-demand for existing transcript');
            try {
              // For existing transcripts, we create basic segments without chunk timing
              const created = await sentenceSegmentsService.createBasicSegments(transcriptId, transcript);
              if (created) {
                // Reload segments after creation
                const newSegments = await sentenceSegmentsService.getSegments(transcriptId, version);
                console.log(`Created ${newSegments.length} new basic segments`);
                if (newSegments.length > 0) {
                  setSentenceSegments(newSegments);
                  setUseSegments(true);
                  console.log('Successfully created and loaded basic segments');
                  setLoadingSegments(false);
                  return;
                }
              }
            } catch (error) {
              console.warn('Failed to create segments on-demand:', error);
            }
          }
          setUseSegments(false);
        }
        setLoadingSegments(false);
      }
    };

    loadSegments();
  }, [transcriptId, version, transcript]);

  const formatTimestampFromSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const segments = useMemo(() => {
    console.log('Processing segments:', { useSegments, sentenceSegmentsLength: sentenceSegments.length });
    
    // Use sentence segments if available
    if (useSegments && sentenceSegments.length > 0) {
      const processedSegments = sentenceSegments.map(segment => ({
        timestamp: segment.start_time ? formatTimestampFromSeconds(segment.start_time) : '',
        text: segment.text,
        startSeconds: segment.start_time
      }));
      
      console.log('Processed sentence segments:', {
        total: processedSegments.length,
        withTimestamps: processedSegments.filter(s => s.timestamp).length,
        firstSegment: processedSegments[0]
      });
      
      return processedSegments;
    }

    // Fallback to parsing existing timestamps in text
    if (!transcript) return [];

    // Parse timestamps in various formats:
    // [MM:SS], [HH:MM:SS], (MM:SS), (HH:MM:SS), MM:SS, HH:MM:SS
    const timestampRegex = /(\[|\()?(\d{1,2}:\d{2}(?::\d{2})?)\]?/g;
    
    const parts = transcript.split(timestampRegex);
    const segments: TimestampSegment[] = [];
    
    for (let i = 0; i < parts.length; i += 3) {
      const beforeTimestamp = parts[i] || '';
      const timestamp = parts[i + 2] || '';
      
      if (timestamp && timestamp.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
        // This is a timestamp
        const nextText = parts[i + 3] || '';
        
        segments.push({
          timestamp,
          text: nextText.trim(),
          startSeconds: parseTimestampToSeconds(timestamp)
        });
      } else if (beforeTimestamp.trim()) {
        // This is text without a timestamp
        segments.push({
          timestamp: '',
          text: beforeTimestamp.trim(),
          startSeconds: undefined
        });
      }
    }

    return segments.filter(seg => seg.text || seg.timestamp);
  }, [transcript, useSegments, sentenceSegments]);

  const parseTimestampToSeconds = (timestamp: string): number => {
    const parts = timestamp.split(':').map(Number);
    if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  const formatTimestamp = (timestamp: string): string => {
    return `[${timestamp}]`;
  };

  const copyTimestamp = (timestamp: string) => {
    navigator.clipboard.writeText(timestamp);
  };

  const generateExternalToolFormat = () => {
    // Generate format suitable for external audio tools
    const formatted = segments
      .filter(seg => seg.timestamp)
      .map(seg => `${seg.timestamp}: ${seg.text}`)
      .join('\n');
    
    navigator.clipboard.writeText(formatted);
    alert('Timestamp format copied to clipboard for external tools!');
  };

  // Show loading state while creating segments
  if (loadingSegments) {
    return (
      <div className={`prose max-w-none ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Creating sentence segments...</span>
        </div>
      </div>
    );
  }

  // If no segments available, show plain text  
  if (segments.length === 0) {
    console.log('Showing plain text view (no segments):', { showTimestamps, segmentsLength: segments.length, useSegments, sentenceSegmentsLength: sentenceSegments.length });
    return (
      <div className={`prose max-w-none ${className}`}>
        <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {transcript}
        </div>
      </div>
    );
  }

  // Count segments with actual timestamps
  const segmentsWithTimestamps = segments.filter(s => s.timestamp && s.timestamp.length > 0);
  console.log('Segments analysis:', { 
    total: segments.length, 
    withTimestamps: segmentsWithTimestamps.length,
    showTimestamps
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <Clock size={16} className="text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            {segmentsWithTimestamps.length > 0 
              ? `${segmentsWithTimestamps.length} timestamped segments` 
              : `${segments.length} sentence segments (no timestamps)`
            }
          </span>
          {segmentsWithTimestamps.length === 0 && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
              No timing data available
            </span>
          )}
        </div>
        
        <button
          onClick={generateExternalToolFormat}
          className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          title="Copy timestamp format for external audio tools"
        >
          <ExternalLink size={12} />
          <span>External Tool Format</span>
        </button>
      </div>

      {/* Timestamped Segments */}
      <div className="space-y-3">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`border rounded-lg transition-colors ${
              highlightedSegment === index 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onMouseEnter={() => setHighlightedSegment(index)}
            onMouseLeave={() => setHighlightedSegment(null)}
          >
            {segment.timestamp ? (
              <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-semibold text-blue-600">
                    {formatTimestamp(segment.timestamp)}
                  </span>
                  {segment.startSeconds !== undefined && (
                    <span className="text-xs text-gray-500">
                      ({segment.startSeconds}s)
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => copyTimestamp(segment.timestamp)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                  title="Copy timestamp"
                >
                  <Copy size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">
                    Sentence {index + 1}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    No timestamp
                  </span>
                </div>
              </div>
            )}
            
            <div className="p-4">
              {editable ? (
                <textarea
                  value={segment.text}
                  onChange={(e) => {
                    const newSegments = [...segments];
                    newSegments[index] = { ...segment, text: e.target.value };
                    const newTranscript = newSegments
                      .map(s => s.timestamp ? `${formatTimestamp(s.timestamp)} ${s.text}` : s.text)
                      .join('\n');
                    onTextChange?.(newTranscript);
                  }}
                  className="w-full resize-none border-none outline-none font-mono text-sm leading-relaxed"
                  rows={Math.max(2, Math.ceil(segment.text.length / 80))}
                />
              ) : (
                <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
                  {segment.text}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {segments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Clock size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No timestamps found in transcript</p>
          <p className="text-sm">
            Add timestamps in format [MM:SS] or [HH:MM:SS] for time-indexed editing
          </p>
        </div>
      )}
    </div>
  );
};