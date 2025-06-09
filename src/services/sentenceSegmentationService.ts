// Sentence segmentation service for processing transcripts into timestamped sentences

export interface SentenceSegment {
  id: string;
  transcriptId: string;
  sentenceIndex: number;
  text: string;
  startTime?: number;
  endTime?: number;
  speaker?: string;
  confidence?: number;
  version: 'original' | 'corrected' | 'speaker_tagged';
  sourceChunkIndex?: number;
  wordCount: number;
}

export interface ChunkTimingInfo {
  chunkIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  text: string;
}

export interface SegmentationConfig {
  preserveLineBreaks: boolean;
  minSentenceLength: number;
  maxSentenceLength: number;
  confidenceThreshold: number;
}

export class SentenceSegmentationService {
  private static instance: SentenceSegmentationService;
  private config: SegmentationConfig;

  private constructor() {
    this.config = {
      preserveLineBreaks: true,
      minSentenceLength: 3, // Minimum words
      maxSentenceLength: 100, // Maximum words
      confidenceThreshold: 0.8,
    };
  }

  static getInstance(): SentenceSegmentationService {
    if (!SentenceSegmentationService.instance) {
      SentenceSegmentationService.instance = new SentenceSegmentationService();
    }
    return SentenceSegmentationService.instance;
  }

  updateConfig(config: Partial<SegmentationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Split text into sentences with smart boundary detection
   */
  segmentIntoSentences(text: string): string[] {
    if (!text || !text.trim()) return [];

    // Clean up the text
    let cleanText = text.trim();
    
    // Normalize whitespace but preserve intentional line breaks
    cleanText = cleanText.replace(/\s+/g, ' ');
    
    // Split on sentence boundaries while handling edge cases
    const sentences = this.smartSentenceSplit(cleanText);
    
    // Filter and validate sentences
    return sentences
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .filter(s => this.isValidSentence(s));
  }

  /**
   * Create sentence segments with timestamp estimation from chunk timing
   */
  createSegmentsFromChunks(
    transcriptId: string,
    chunkTimings: ChunkTimingInfo[],
    version: 'original' | 'corrected' | 'speaker_tagged' = 'original'
  ): SentenceSegment[] {
    const segments: SentenceSegment[] = [];
    let globalSentenceIndex = 0;

    for (const chunk of chunkTimings) {
      const sentences = this.segmentIntoSentences(chunk.text);
      const chunkDuration = chunk.duration;
      const totalWords = this.countWordsInText(chunk.text);
      const wordsPerSecond = totalWords > 0 ? totalWords / chunkDuration : 0;

      let currentTime = chunk.startTime;

      for (const sentence of sentences) {
        const wordCount = this.countWords(sentence);
        const estimatedDuration = wordsPerSecond > 0 ? wordCount / wordsPerSecond : 0;
        const endTime = currentTime + estimatedDuration;

        segments.push({
          id: `${transcriptId}_${version}_${globalSentenceIndex}`,
          transcriptId,
          sentenceIndex: globalSentenceIndex,
          text: sentence,
          startTime: currentTime,
          endTime: Math.min(endTime, chunk.endTime),
          confidence: this.calculateConfidence(sentence, wordCount, estimatedDuration),
          version,
          sourceChunkIndex: chunk.chunkIndex,
          wordCount,
        });

        currentTime = endTime;
        globalSentenceIndex++;
      }
    }

    return segments;
  }

  /**
   * Smart sentence splitting with edge case handling
   */
  private smartSentenceSplit(text: string): string[] {
    const sentences: string[] = [];
    
    // Common abbreviations that shouldn't trigger sentence breaks
    const abbreviations = new Set([
      'dr', 'mr', 'mrs', 'ms', 'prof', 'vs', 'etc', 'inc', 'ltd', 'corp',
      'jr', 'sr', 'phd', 'md', 'ba', 'ma', 'bsc', 'msc', 'llc',
      'i.e', 'e.g', 'a.m', 'p.m', 'u.s', 'u.k', 'n.y'
    ]);

    // Split on major sentence terminators
    const majorBreaks = text.split(/([.!?]+\s*)/);
    
    let currentSentence = '';
    
    for (let i = 0; i < majorBreaks.length; i++) {
      const part = majorBreaks[i];
      
      if (/^[.!?]+\s*$/.test(part)) {
        // This is a terminator
        currentSentence += part;
        
        // Check if this is a real sentence boundary
        if (this.isRealSentenceBoundary(currentSentence, abbreviations)) {
          sentences.push(currentSentence.trim());
          currentSentence = '';
        }
      } else {
        currentSentence += part;
      }
    }
    
    // Add any remaining text
    if (currentSentence.trim()) {
      sentences.push(currentSentence.trim());
    }

    return sentences;
  }

  /**
   * Check if a potential sentence boundary is real or an abbreviation
   */
  private isRealSentenceBoundary(text: string, abbreviations: Set<string>): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;

    // Check for abbreviations
    const beforePeriod = trimmed.replace(/[.!?]+\s*$/, '');
    const lastWord = beforePeriod.split(/\s+/).pop()?.toLowerCase();
    
    if (lastWord && abbreviations.has(lastWord)) {
      return false;
    }

    // Must have minimum length
    const wordCount = this.countWords(trimmed);
    if (wordCount < this.config.minSentenceLength) {
      return false;
    }

    // Check for sentence patterns
    const hasCapitalStart = /^[A-Z]/.test(trimmed);
    const hasProperEnding = /[.!?]\s*$/.test(trimmed);
    
    return hasCapitalStart || hasProperEnding || wordCount >= 5;
  }

  /**
   * Validate if a string is a proper sentence
   */
  private isValidSentence(sentence: string): boolean {
    const wordCount = this.countWords(sentence);
    
    // Too short
    if (wordCount < this.config.minSentenceLength) {
      return false;
    }
    
    // Too long - might be a paragraph
    if (wordCount > this.config.maxSentenceLength) {
      return false;
    }
    
    // Contains actual words (not just punctuation)
    const hasWords = /[a-zA-Z]/.test(sentence);
    if (!hasWords) {
      return false;
    }

    return true;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Count words in larger text (more efficient for chunks)
   */
  private countWordsInText(text: string): number {
    const matches = text.match(/\b\w+\b/g);
    return matches ? matches.length : 0;
  }

  /**
   * Calculate confidence score for a sentence segment
   */
  private calculateConfidence(
    sentence: string, 
    wordCount: number, 
    estimatedDuration: number
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence for well-formed sentences
    if (/^[A-Z]/.test(sentence) && /[.!?]\s*$/.test(sentence)) {
      confidence += 0.2;
    }

    // Boost confidence for reasonable word count
    if (wordCount >= 5 && wordCount <= 30) {
      confidence += 0.2;
    }

    // Boost confidence for reasonable duration (1-10 seconds per sentence)
    if (estimatedDuration >= 1 && estimatedDuration <= 10) {
      confidence += 0.1;
    }

    // Penalize very short or very long segments
    if (wordCount < 3 || wordCount > 50) {
      confidence -= 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Merge segments from different versions while preserving relationships
   */
  mergeSegmentVersions(segments: SentenceSegment[]): SentenceSegment[] {
    // Group by transcript and sentence index
    const grouped = new Map<string, SentenceSegment[]>();
    
    for (const segment of segments) {
      const key = `${segment.transcriptId}_${segment.sentenceIndex}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(segment);
    }

    // Return the latest version of each segment
    const merged: SentenceSegment[] = [];
    for (const [_, versions] of grouped) {
      // Sort by version priority: speaker_tagged > corrected > original
      const versionPriority = { 'speaker_tagged': 3, 'corrected': 2, 'original': 1 };
      const latest = versions.sort((a, b) => 
        versionPriority[b.version] - versionPriority[a.version]
      )[0];
      merged.push(latest);
    }

    return merged.sort((a, b) => a.sentenceIndex - b.sentenceIndex);
  }

  /**
   * Convert segments back to full text
   */
  segmentsToText(segments: SentenceSegment[], includeTimestamps: boolean = false): string {
    return segments
      .sort((a, b) => a.sentenceIndex - b.sentenceIndex)
      .map(segment => {
        if (includeTimestamps && segment.startTime !== undefined) {
          const timestamp = this.formatTimestamp(segment.startTime);
          return `${timestamp} ${segment.text}`;
        }
        return segment.text;
      })
      .join('\n\n');
  }

  /**
   * Format seconds to MM:SS or HH:MM:SS timestamp
   */
  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `[${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
    } else {
      return `[${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
    }
  }

  /**
   * Get segmentation statistics
   */
  getSegmentationStats(segments: SentenceSegment[]): {
    totalSentences: number;
    avgWordsPerSentence: number;
    avgDurationPerSentence: number;
    confidenceDistribution: { high: number; medium: number; low: number };
    versionsCount: Record<string, number>;
  } {
    if (segments.length === 0) {
      return {
        totalSentences: 0,
        avgWordsPerSentence: 0,
        avgDurationPerSentence: 0,
        confidenceDistribution: { high: 0, medium: 0, low: 0 },
        versionsCount: {}
      };
    }

    const totalWords = segments.reduce((sum, s) => sum + s.wordCount, 0);
    const segmentsWithDuration = segments.filter(s => s.startTime !== undefined && s.endTime !== undefined);
    const totalDuration = segmentsWithDuration.reduce((sum, s) => 
      sum + ((s.endTime || 0) - (s.startTime || 0)), 0);

    const confidenceDistribution = { high: 0, medium: 0, low: 0 };
    const versionsCount: Record<string, number> = {};

    for (const segment of segments) {
      // Confidence distribution
      const confidence = segment.confidence || 0;
      if (confidence >= 0.8) confidenceDistribution.high++;
      else if (confidence >= 0.5) confidenceDistribution.medium++;
      else confidenceDistribution.low++;

      // Version count
      versionsCount[segment.version] = (versionsCount[segment.version] || 0) + 1;
    }

    return {
      totalSentences: segments.length,
      avgWordsPerSentence: totalWords / segments.length,
      avgDurationPerSentence: segmentsWithDuration.length > 0 ? totalDuration / segmentsWithDuration.length : 0,
      confidenceDistribution,
      versionsCount
    };
  }
}

// Export singleton instance
export const sentenceSegmentationService = SentenceSegmentationService.getInstance();