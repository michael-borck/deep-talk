import { Transcript } from '../types';

export interface ProjectAnalysisResult {
  themes: string[];
  key_insights: string[];
  summary: string;
  themeEvolution: ThemeEvolution[];
  conceptFrequency: ConceptFrequency;
  speakerAnalysis: SpeakerAnalysis;
  timelineAnalysis: TimelineAnalysis;
  crossTranscriptPatterns: CrossTranscriptPattern[];
}

export interface ThemeEvolution {
  theme: string;
  occurrences: {
    transcript_id: string;
    transcript_title: string;
    date: string;
    count: number;
    quotes: string[];
    relevance: number;
  }[];
  trend: 'increasing' | 'decreasing' | 'stable' | 'emerging' | 'declining';
  totalOccurrences: number;
  avgRelevance: number;
}

export interface ConceptFrequency {
  [concept: string]: {
    totalCount: number;
    transcriptCount: number;
    avgFrequency: number;
    contexts: {
      transcript_id: string;
      transcript_title: string;
      count: number;
      examples: string[];
    }[];
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface SpeakerAnalysis {
  totalSpeakers: number;
  speakerDistribution: {
    [speaker: string]: {
      transcriptCount: number;
      totalSegments: number;
      avgSegmentsPerTranscript: number;
      themes: string[];
      keyQuotes: string[];
    };
  };
  speakerInteractions: {
    transcript_id: string;
    transcript_title: string;
    speakers: string[];
    interactionPattern: 'interview' | 'discussion' | 'presentation' | 'unknown';
  }[];
}

export interface TimelineAnalysis {
  dateRange: {
    start: string;
    end: string;
  };
  transcriptsByPeriod: {
    period: string;
    count: number;
    totalDuration: number;
    themes: string[];
  }[];
  themeEvolutionTimeline: {
    date: string;
    themes: { theme: string; strength: number }[];
  }[];
  sentimentTrend: {
    date: string;
    avgSentiment: number;
    transcriptCount: number;
  }[];
}

export interface CrossTranscriptPattern {
  type: 'theme_consistency' | 'theme_evolution' | 'speaker_behavior' | 'sentiment_shift' | 'concept_emergence';
  description: string;
  strength: number; // 0-1
  evidence: {
    transcript_id: string;
    transcript_title: string;
    date: string;
    supporting_data: any;
  }[];
  insights: string[];
}

export class ProjectAnalysisService {
  private static instance: ProjectAnalysisService;

  private constructor() {}

  static getInstance(): ProjectAnalysisService {
    if (!ProjectAnalysisService.instance) {
      ProjectAnalysisService.instance = new ProjectAnalysisService();
    }
    return ProjectAnalysisService.instance;
  }

  /**
   * Perform comprehensive project analysis by collating transcript analyses
   */
  async analyzeProject(projectId: string): Promise<ProjectAnalysisResult> {
    try {
      console.log(`Starting project analysis for project ${projectId}`);
      
      // Get all project transcripts with their analysis data
      const transcripts = await this.getProjectTranscriptsWithAnalysis(projectId);
      
      if (transcripts.length === 0) {
        throw new Error('No transcripts found for project');
      }

      console.log(`Analyzing ${transcripts.length} transcripts`);

      // Perform different types of analysis
      const [
        themes,
        keyInsights,
        summary,
        themeEvolution,
        conceptFrequency,
        speakerAnalysis,
        timelineAnalysis,
        crossTranscriptPatterns
      ] = await Promise.all([
        this.aggregateThemes(transcripts),
        this.aggregateInsights(transcripts),
        this.generateProjectSummary(transcripts),
        this.analyzeThemeEvolution(transcripts),
        this.analyzeConceptFrequency(transcripts),
        this.analyzeSpeakers(transcripts),
        this.analyzeTimeline(transcripts),
        this.identifyCrossTranscriptPatterns(transcripts)
      ]);

      return {
        themes,
        key_insights: keyInsights,
        summary,
        themeEvolution,
        conceptFrequency,
        speakerAnalysis,
        timelineAnalysis,
        crossTranscriptPatterns
      };
    } catch (error) {
      console.error('Project analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get project transcripts with their analysis data
   */
  private async getProjectTranscriptsWithAnalysis(projectId: string): Promise<Transcript[]> {
    const result = await window.electronAPI.database.all(`
      SELECT t.*, pt.added_at
      FROM transcripts t
      JOIN project_transcripts pt ON t.id = pt.transcript_id
      WHERE pt.project_id = ? AND t.status = 'completed'
      ORDER BY t.created_at ASC
    `, [projectId]);

    return result.map((row: any) => ({
      ...row,
      action_items: row.action_items ? JSON.parse(row.action_items) : [],
      key_topics: row.key_topics ? JSON.parse(row.key_topics) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      research_themes: row.research_themes ? JSON.parse(row.research_themes) : [],
      notable_quotes: row.notable_quotes ? JSON.parse(row.notable_quotes) : [],
      qa_pairs: row.qa_pairs ? JSON.parse(row.qa_pairs) : [],
      concept_frequency: row.concept_frequency ? JSON.parse(row.concept_frequency) : {},
      emotions: row.emotions ? JSON.parse(row.emotions) : {},
      speakers: row.speakers ? JSON.parse(row.speakers) : [],
      validation_changes: row.validation_changes ? JSON.parse(row.validation_changes) : []
    }));
  }

  /**
   * Aggregate themes across all transcripts
   */
  private async aggregateThemes(transcripts: Transcript[]): Promise<string[]> {
    const themeFrequency: { [theme: string]: number } = {};
    
    for (const transcript of transcripts) {
      // Aggregate from research themes
      if (transcript.research_themes) {
        for (const themeData of transcript.research_themes) {
          const theme = typeof themeData === 'string' ? themeData : themeData.theme;
          if (theme) {
            themeFrequency[theme] = (themeFrequency[theme] || 0) + 1;
          }
        }
      }
      
      // Aggregate from key topics
      if (transcript.key_topics) {
        for (const topic of transcript.key_topics) {
          themeFrequency[topic] = (themeFrequency[topic] || 0) + 1;
        }
      }
    }

    // Return themes that appear in at least 2 transcripts or 20% of transcripts, whichever is lower
    const minOccurrences = Math.max(1, Math.min(2, Math.ceil(transcripts.length * 0.2)));
    return Object.entries(themeFrequency)
      .filter(([_, count]) => count >= minOccurrences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Top 10 themes
      .map(([theme]) => theme);
  }

  /**
   * Aggregate insights from action items and analysis
   */
  private async aggregateInsights(transcripts: Transcript[]): Promise<string[]> {
    const insights: string[] = [];
    
    // Collect action items
    const allActionItems = transcripts
      .flatMap(t => t.action_items || [])
      .filter(item => item && item.length > 10); // Filter out very short items

    // Collect notable quotes with high relevance
    const highRelevanceQuotes = transcripts
      .flatMap(t => t.notable_quotes || [])
      .filter(quote => (typeof quote === 'object' && quote.relevance > 0.7) || typeof quote === 'string')
      .map(quote => typeof quote === 'string' ? quote : quote.text);

    // Collect research themes with high confidence
    const highConfidenceThemes = transcripts
      .flatMap(t => t.research_themes || [])
      .filter(theme => typeof theme === 'object' && theme.confidence > 0.8)
      .map(theme => `Theme: ${theme.theme} - Evidence: ${theme.examples?.join(', ')}`);

    // Combine and deduplicate
    insights.push(...allActionItems.slice(0, 5));
    insights.push(...highRelevanceQuotes.slice(0, 3));
    insights.push(...highConfidenceThemes.slice(0, 3));

    return insights.slice(0, 10); // Limit to 10 insights
  }

  /**
   * Generate project summary
   */
  private async generateProjectSummary(transcripts: Transcript[]): Promise<string> {
    const transcriptCount = transcripts.length;
    const totalDuration = transcripts.reduce((sum, t) => sum + (t.duration || 0), 0);
    const dateRange = {
      start: new Date(Math.min(...transcripts.map(t => new Date(t.created_at).getTime()))),
      end: new Date(Math.max(...transcripts.map(t => new Date(t.created_at).getTime())))
    };

    const uniqueSpeakers = new Set(
      transcripts.flatMap(t => (t.speakers || []).map(s => typeof s === 'string' ? s : s.name || s.id))
    ).size;

    const avgSentiment = transcripts
      .filter(t => t.sentiment_score !== undefined)
      .reduce((sum, t, _, arr) => sum + (t.sentiment_score || 0) / arr.length, 0);

    const durationHours = Math.floor(totalDuration / 3600);
    const durationMinutes = Math.floor((totalDuration % 3600) / 60);

    return `This project contains ${transcriptCount} transcripts spanning ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}. ` +
           `Total content duration: ${durationHours}h ${durationMinutes}m with ${uniqueSpeakers} unique speakers. ` +
           `Overall sentiment: ${avgSentiment > 0.1 ? 'positive' : avgSentiment < -0.1 ? 'negative' : 'neutral'} (${avgSentiment.toFixed(2)}).`;
  }

  /**
   * Analyze theme evolution across transcripts
   */
  private async analyzeThemeEvolution(transcripts: Transcript[]): Promise<ThemeEvolution[]> {
    const themeOccurrences: { [theme: string]: ThemeEvolution } = {};
    
    for (const transcript of transcripts) {
      const themes = [
        ...(transcript.research_themes || []).map(t => typeof t === 'string' ? t : t.theme),
        ...(transcript.key_topics || [])
      ].filter(Boolean);

      for (const theme of themes) {
        if (!themeOccurrences[theme]) {
          themeOccurrences[theme] = {
            theme,
            occurrences: [],
            trend: 'stable',
            totalOccurrences: 0,
            avgRelevance: 0
          };
        }

        // Find quotes related to this theme
        const relatedQuotes = (transcript.notable_quotes || [])
          .filter(quote => {
            const text = typeof quote === 'string' ? quote : quote.text;
            return text.toLowerCase().includes(theme.toLowerCase());
          })
          .map(quote => typeof quote === 'string' ? quote : quote.text)
          .slice(0, 2);

        themeOccurrences[theme].occurrences.push({
          transcript_id: transcript.id,
          transcript_title: transcript.title,
          date: transcript.created_at,
          count: 1,
          quotes: relatedQuotes,
          relevance: 0.8 // Default relevance
        });

        themeOccurrences[theme].totalOccurrences++;
      }
    }

    // Calculate trends and average relevance
    for (const themeData of Object.values(themeOccurrences)) {
      // Sort occurrences by date
      themeData.occurrences.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Calculate trend (simple heuristic based on first half vs second half)
      const midpoint = Math.floor(themeData.occurrences.length / 2);
      const firstHalf = themeData.occurrences.slice(0, midpoint).length;
      const secondHalf = themeData.occurrences.slice(midpoint).length;
      
      if (secondHalf > firstHalf * 1.5) {
        themeData.trend = 'increasing';
      } else if (firstHalf > secondHalf * 1.5) {
        themeData.trend = 'decreasing';
      } else if (themeData.totalOccurrences === 1) {
        themeData.trend = 'emerging';
      } else {
        themeData.trend = 'stable';
      }

      themeData.avgRelevance = themeData.occurrences.reduce((sum, occ) => sum + occ.relevance, 0) / themeData.occurrences.length;
    }

    return Object.values(themeOccurrences)
      .sort((a, b) => b.totalOccurrences - a.totalOccurrences)
      .slice(0, 15); // Top 15 themes
  }

  /**
   * Analyze concept frequency across transcripts
   */
  private async analyzeConceptFrequency(transcripts: Transcript[]): Promise<ConceptFrequency> {
    const conceptAnalysis: ConceptFrequency = {};
    
    for (const transcript of transcripts) {
      const concepts = transcript.concept_frequency || {};
      
      for (const [concept, data] of Object.entries(concepts)) {
        if (!conceptAnalysis[concept]) {
          conceptAnalysis[concept] = {
            totalCount: 0,
            transcriptCount: 0,
            avgFrequency: 0,
            contexts: [],
            trend: 'stable'
          };
        }

        const conceptData = typeof data === 'object' ? data : { count: 1, contexts: [] };
        const count = conceptData.count || 1;
        const contexts = conceptData.contexts || [];

        conceptAnalysis[concept].totalCount += count;
        conceptAnalysis[concept].transcriptCount++;
        conceptAnalysis[concept].contexts.push({
          transcript_id: transcript.id,
          transcript_title: transcript.title,
          count,
          examples: contexts.slice(0, 3) // Limit examples
        });
      }
    }

    // Calculate averages and trends
    for (const data of Object.values(conceptAnalysis)) {
      data.avgFrequency = data.totalCount / data.transcriptCount;
      
      // Simple trend analysis based on chronological distribution
      data.contexts.sort((a, b) => a.transcript_id.localeCompare(b.transcript_id));
      const midpoint = Math.floor(data.contexts.length / 2);
      const firstHalfAvg = data.contexts.slice(0, midpoint).reduce((sum, ctx) => sum + ctx.count, 0) / midpoint || 0;
      const secondHalfAvg = data.contexts.slice(midpoint).reduce((sum, ctx) => sum + ctx.count, 0) / (data.contexts.length - midpoint) || 0;
      
      if (secondHalfAvg > firstHalfAvg * 1.3) {
        data.trend = 'increasing';
      } else if (firstHalfAvg > secondHalfAvg * 1.3) {
        data.trend = 'decreasing';
      } else {
        data.trend = 'stable';
      }
    }

    // Return top concepts by total frequency
    return Object.fromEntries(
      Object.entries(conceptAnalysis)
        .sort(([, a], [, b]) => b.totalCount - a.totalCount)
        .slice(0, 20) // Top 20 concepts
    );
  }

  /**
   * Analyze speaker patterns across transcripts
   */
  private async analyzeSpeakers(transcripts: Transcript[]): Promise<SpeakerAnalysis> {
    const speakerData: { [speaker: string]: any } = {};
    const interactions: SpeakerAnalysis['speakerInteractions'] = [];

    for (const transcript of transcripts) {
      const speakers = transcript.speakers || [];
      const speakerNames = speakers.map(s => typeof s === 'string' ? s : s.name || s.id).filter(Boolean);
      
      // Record speaker interactions
      interactions.push({
        transcript_id: transcript.id,
        transcript_title: transcript.title,
        speakers: speakerNames,
        interactionPattern: this.detectInteractionPattern(transcript, speakerNames)
      });

      // Aggregate speaker data
      for (const speakerName of speakerNames) {
        if (!speakerData[speakerName]) {
          speakerData[speakerName] = {
            transcriptCount: 0,
            totalSegments: 0,
            avgSegmentsPerTranscript: 0,
            themes: new Set(),
            keyQuotes: []
          };
        }

        speakerData[speakerName].transcriptCount++;
        
        // Get speaker-specific themes from research data
        if (transcript.research_themes) {
          for (const theme of transcript.research_themes) {
            const themeText = typeof theme === 'string' ? theme : theme.theme;
            if (themeText) {
              speakerData[speakerName].themes.add(themeText);
            }
          }
        }

        // Get speaker quotes
        if (transcript.notable_quotes) {
          const speakerQuotes = transcript.notable_quotes
            .filter(quote => {
              const speaker = typeof quote === 'object' ? quote.speaker : null;
              return speaker === speakerName;
            })
            .map(quote => typeof quote === 'string' ? quote : quote.text);
          
          speakerData[speakerName].keyQuotes.push(...speakerQuotes);
        }
      }
    }

    // Convert sets to arrays and calculate averages
    const speakerDistribution: SpeakerAnalysis['speakerDistribution'] = {};
    for (const [speaker, data] of Object.entries(speakerData)) {
      speakerDistribution[speaker] = {
        transcriptCount: data.transcriptCount,
        totalSegments: data.totalSegments,
        avgSegmentsPerTranscript: data.totalSegments / data.transcriptCount,
        themes: Array.from(data.themes as Set<string>).slice(0, 10),
        keyQuotes: data.keyQuotes.slice(0, 5)
      };
    }

    return {
      totalSpeakers: Object.keys(speakerData).length,
      speakerDistribution,
      speakerInteractions: interactions
    };
  }

  /**
   * Detect interaction pattern in transcript
   */
  private detectInteractionPattern(transcript: Transcript, speakers: string[]): 'interview' | 'discussion' | 'presentation' | 'unknown' {
    if (speakers.length === 1) return 'presentation';
    if (speakers.length === 2) {
      // Look for Q&A patterns to detect interviews
      const hasQA = (transcript.qa_pairs || []).length > 0;
      return hasQA ? 'interview' : 'discussion';
    }
    if (speakers.length > 2) return 'discussion';
    return 'unknown';
  }

  /**
   * Analyze timeline and temporal patterns
   */
  private async analyzeTimeline(transcripts: Transcript[]): Promise<TimelineAnalysis> {
    // Sort transcripts by date
    const sortedTranscripts = transcripts.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const dateRange = {
      start: sortedTranscripts[0]?.created_at || new Date().toISOString(),
      end: sortedTranscripts[sortedTranscripts.length - 1]?.created_at || new Date().toISOString()
    };

    // Group by month for timeline analysis
    const transcriptsByPeriod = this.groupTranscriptsByMonth(sortedTranscripts);
    
    // Analyze theme evolution over time
    const themeEvolutionTimeline = this.analyzeThemeEvolutionTimeline(sortedTranscripts);
    
    // Analyze sentiment trend
    const sentimentTrend = this.analyzeSentimentTrend(sortedTranscripts);

    return {
      dateRange,
      transcriptsByPeriod,
      themeEvolutionTimeline,
      sentimentTrend
    };
  }

  private groupTranscriptsByMonth(transcripts: Transcript[]) {
    const groups: { [period: string]: Transcript[] } = {};
    
    for (const transcript of transcripts) {
      const date = new Date(transcript.created_at);
      const period = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!groups[period]) {
        groups[period] = [];
      }
      groups[period].push(transcript);
    }

    return Object.entries(groups).map(([period, transcripts]) => ({
      period,
      count: transcripts.length,
      totalDuration: transcripts.reduce((sum, t) => sum + (t.duration || 0), 0),
      themes: [...new Set(transcripts.flatMap(t => t.key_topics || []))].slice(0, 5)
    }));
  }

  private analyzeThemeEvolutionTimeline(transcripts: Transcript[]) {
    const timeline: { [date: string]: { [theme: string]: number } } = {};
    
    for (const transcript of transcripts) {
      const date = transcript.created_at.split('T')[0]; // Get date part only
      if (!timeline[date]) {
        timeline[date] = {};
      }
      
      const themes = [
        ...(transcript.key_topics || []),
        ...(transcript.research_themes || []).map(t => typeof t === 'string' ? t : t.theme)
      ].filter(Boolean);
      
      for (const theme of themes) {
        timeline[date][theme] = (timeline[date][theme] || 0) + 1;
      }
    }

    return Object.entries(timeline).map(([date, themes]) => ({
      date,
      themes: Object.entries(themes).map(([theme, count]) => ({
        theme,
        strength: count / transcripts.length // Normalize by total transcripts
      }))
    }));
  }

  private analyzeSentimentTrend(transcripts: Transcript[]) {
    const sentimentByDate: { [date: string]: { scores: number[]; count: number } } = {};
    
    for (const transcript of transcripts) {
      if (transcript.sentiment_score !== undefined) {
        const date = transcript.created_at.split('T')[0];
        if (!sentimentByDate[date]) {
          sentimentByDate[date] = { scores: [], count: 0 };
        }
        
        sentimentByDate[date].scores.push(transcript.sentiment_score);
        sentimentByDate[date].count++;
      }
    }

    return Object.entries(sentimentByDate).map(([date, data]) => ({
      date,
      avgSentiment: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
      transcriptCount: data.count
    }));
  }

  /**
   * Identify cross-transcript patterns
   */
  private async identifyCrossTranscriptPatterns(transcripts: Transcript[]): Promise<CrossTranscriptPattern[]> {
    const patterns: CrossTranscriptPattern[] = [];

    // Theme consistency analysis
    patterns.push(...this.analyzeThemeConsistency(transcripts));
    
    // Concept emergence analysis
    patterns.push(...this.analyzeConceptEmergence(transcripts));
    
    // Sentiment shift analysis
    patterns.push(...this.analyzeSentimentShifts(transcripts));

    return patterns.sort((a, b) => b.strength - a.strength).slice(0, 10);
  }

  private analyzeThemeConsistency(transcripts: Transcript[]): CrossTranscriptPattern[] {
    const themeOccurrences: { [theme: string]: any[] } = {};
    
    // Collect theme occurrences
    for (const transcript of transcripts) {
      const themes = [...(transcript.key_topics || []), ...(transcript.research_themes || []).map(t => typeof t === 'string' ? t : t.theme)].filter(Boolean);
      
      for (const theme of themes) {
        if (!themeOccurrences[theme]) {
          themeOccurrences[theme] = [];
        }
        themeOccurrences[theme].push({
          transcript_id: transcript.id,
          transcript_title: transcript.title,
          date: transcript.created_at,
          supporting_data: { theme }
        });
      }
    }

    // Find consistent themes (appear in >50% of transcripts)
    const consistentThemes = Object.entries(themeOccurrences)
      .filter(([_, occurrences]) => occurrences.length / transcripts.length > 0.5)
      .map(([theme, evidence]) => ({
        type: 'theme_consistency' as const,
        description: `Theme "${theme}" appears consistently across ${evidence.length}/${transcripts.length} transcripts`,
        strength: evidence.length / transcripts.length,
        evidence,
        insights: [
          `This theme shows strong consistency across the project`,
          `Consider this as a core concept for the project`
        ]
      }));

    return consistentThemes;
  }

  private analyzeConceptEmergence(transcripts: Transcript[]): CrossTranscriptPattern[] {
    // Sort transcripts chronologically
    const sortedTranscripts = transcripts.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const conceptTimeline: { [concept: string]: { transcript_id: string; date: string; title: string }[] } = {};
    
    // Track when concepts first appear
    for (const transcript of sortedTranscripts) {
      const concepts = Object.keys(transcript.concept_frequency || {});
      
      for (const concept of concepts) {
        if (!conceptTimeline[concept]) {
          conceptTimeline[concept] = [];
        }
        conceptTimeline[concept].push({
          transcript_id: transcript.id,
          date: transcript.created_at,
          title: transcript.title
        });
      }
    }

    // Find emerging concepts (appear in later transcripts)
    const emergingConcepts = Object.entries(conceptTimeline)
      .filter(([_, timeline]) => {
        const firstAppearance = timeline[0];
        const firstIndex = sortedTranscripts.findIndex(t => t.id === firstAppearance.transcript_id);
        return firstIndex > sortedTranscripts.length / 2; // Appears in second half
      })
      .map(([concept, evidence]) => ({
        type: 'concept_emergence' as const,
        description: `Concept "${concept}" emerged in later transcripts`,
        strength: 0.7,
        evidence: evidence.map(e => ({
          transcript_id: e.transcript_id,
          transcript_title: e.title,
          date: e.date,
          supporting_data: { concept, emergence: true }
        })),
        insights: [
          `This concept represents a new development in the project`,
          `Consider investigating why this concept became relevant`
        ]
      }));

    return emergingConcepts;
  }

  private analyzeSentimentShifts(transcripts: Transcript[]): CrossTranscriptPattern[] {
    const sortedTranscripts = transcripts
      .filter(t => t.sentiment_score !== undefined)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (sortedTranscripts.length < 3) return [];

    // Calculate moving average of sentiment
    const windowSize = Math.max(2, Math.floor(sortedTranscripts.length / 3));
    const sentimentShifts: CrossTranscriptPattern[] = [];

    for (let i = windowSize; i < sortedTranscripts.length; i++) {
      const prevWindow = sortedTranscripts.slice(i - windowSize, i);
      const currWindow = sortedTranscripts.slice(i - windowSize + 1, i + 1);
      
      const prevAvg = prevWindow.reduce((sum, t) => sum + (t.sentiment_score || 0), 0) / prevWindow.length;
      const currAvg = currWindow.reduce((sum, t) => sum + (t.sentiment_score || 0), 0) / currWindow.length;
      
      const shift = Math.abs(currAvg - prevAvg);
      
      if (shift > 0.3) { // Significant sentiment shift
        sentimentShifts.push({
          type: 'sentiment_shift',
          description: `Significant sentiment shift detected: ${prevAvg > currAvg ? 'decline' : 'improvement'}`,
          strength: Math.min(shift, 1.0),
          evidence: currWindow.map(t => ({
            transcript_id: t.id,
            transcript_title: t.title,
            date: t.created_at,
            supporting_data: { sentiment_score: t.sentiment_score }
          })),
          insights: [
            `Sentiment ${prevAvg > currAvg ? 'declined' : 'improved'} significantly`,
            `Consider investigating contextual factors around this period`
          ]
        });
      }
    }

    return sentimentShifts;
  }
}

// Export singleton instance
export const projectAnalysisService = ProjectAnalysisService.getInstance();