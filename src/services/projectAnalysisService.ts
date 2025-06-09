import { Transcript } from '../types';

export interface ProjectAnalysisConfig {
  enableCrossTranscriptAnalysis: boolean;
  maxTranscriptsPerAnalysis: number;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  cacheResults: boolean;
}

export interface CollatedAnalysisResult {
  combinedSummary: string;
  mergedTopics: string[];
  mergedActionItems: string[];
  aggregatedThemes: Array<{
    theme: string;
    frequency: number;
    sources: Array<{
      transcriptId: string;
      transcriptTitle: string;
      relevance: number;
    }>;
  }>;
  consensusInsights: string[];
}

export class ProjectAnalysisService {
  private static instance: ProjectAnalysisService;
  private config: ProjectAnalysisConfig;

  private constructor() {
    this.config = {
      enableCrossTranscriptAnalysis: true,
      maxTranscriptsPerAnalysis: 10,
      analysisDepth: 'detailed',
      cacheResults: true
    };
  }

  static getInstance(): ProjectAnalysisService {
    if (!ProjectAnalysisService.instance) {
      ProjectAnalysisService.instance = new ProjectAnalysisService();
    }
    return ProjectAnalysisService.instance;
  }

  /**
   * Perform collated analysis - combine individual transcript analyses
   */
  async performCollatedAnalysis(projectId: string): Promise<CollatedAnalysisResult> {
    const startTime = Date.now();

    try {
      // Get project transcripts
      const transcripts = await this.getProjectTranscripts(projectId);
      
      if (transcripts.length === 0) {
        throw new Error('No transcripts found for project');
      }

      console.log(`Performing collated analysis for project ${projectId} with ${transcripts.length} transcripts`);

      // Aggregate data from individual transcripts
      const combinedData = this.aggregateTranscriptData(transcripts);

      // Generate combined summary
      const combinedSummary = await this.generateCombinedSummary(transcripts, combinedData);

      // Analyze for consensus
      const consensusAnalysis = this.analyzeConsensus(transcripts);

      const result: CollatedAnalysisResult = {
        combinedSummary,
        mergedTopics: combinedData.allTopics,
        mergedActionItems: combinedData.allActionItems,
        aggregatedThemes: combinedData.themeFrequency,
        consensusInsights: consensusAnalysis.consensus
      };

      // Cache result if enabled
      if (this.config.cacheResults) {
        await this.cacheAnalysisResult(projectId, 'collated_analysis', result);
      }

      console.log(`Collated analysis completed in ${Date.now() - startTime}ms`);
      return result;

    } catch (error) {
      console.error('Failed to perform collated analysis:', error);
      throw error;
    }
  }

  /**
   * Get project transcripts
   */
  private async getProjectTranscripts(projectId: string): Promise<Transcript[]> {
    try {
      return await window.electronAPI.database.all(`
        SELECT t.* FROM transcripts t
        JOIN project_transcripts pt ON t.id = pt.transcript_id
        WHERE pt.project_id = ? 
          AND t.status = 'completed' 
          AND t.is_deleted = 0
        ORDER BY t.created_at ASC
      `, [projectId]);
    } catch (error) {
      console.error('Failed to get project transcripts:', error);
      return [];
    }
  }

  /**
   * Aggregate data from all transcripts
   */
  private aggregateTranscriptData(transcripts: Transcript[]): {
    allTopics: string[];
    allActionItems: string[];
    themeFrequency: Array<{
      theme: string;
      frequency: number;
      sources: Array<{
        transcriptId: string;
        transcriptTitle: string;
        relevance: number;
      }>;
    }>;
  } {
    const allTopics: string[] = [];
    const allActionItems: string[] = [];
    const themeMap = new Map<string, Array<{ transcriptId: string; transcriptTitle: string; relevance: number }>>();

    transcripts.forEach(transcript => {
      // Collect topics
      if (transcript.key_topics) {
        const topics = typeof transcript.key_topics === 'string' ? JSON.parse(transcript.key_topics) : transcript.key_topics;
        allTopics.push(...topics);

        // Track theme frequency
        topics.forEach((topic: string) => {
          if (!themeMap.has(topic)) {
            themeMap.set(topic, []);
          }
          themeMap.get(topic)!.push({
            transcriptId: transcript.id,
            transcriptTitle: transcript.title,
            relevance: 1.0
          });
        });
      }

      // Collect action items
      if (transcript.action_items) {
        const actionItems = typeof transcript.action_items === 'string' ? JSON.parse(transcript.action_items) : transcript.action_items;
        allActionItems.push(...actionItems);
      }
    });

    // Convert theme map to frequency array
    const themeFrequency = Array.from(themeMap.entries()).map(([theme, sources]) => ({
      theme,
      frequency: sources.length,
      sources
    })).sort((a, b) => b.frequency - a.frequency);

    // Remove duplicates
    const uniqueTopics = [...new Set(allTopics)];
    const uniqueActionItems = [...new Set(allActionItems)];

    return {
      allTopics: uniqueTopics,
      allActionItems: uniqueActionItems,
      themeFrequency
    };
  }

  /**
   * Generate combined summary from all transcripts
   */
  private async generateCombinedSummary(
    transcripts: Transcript[],
    aggregatedData: any
  ): Promise<string> {
    try {
      const summaries = transcripts
        .filter(t => t.summary)
        .map(t => `**${t.title}**: ${t.summary}`)
        .join('\n\n');

      if (!summaries) {
        return `Project contains ${transcripts.length} transcripts. Individual summaries not yet available.`;
      }

      const prompt = `Please create a cohesive project summary that combines the following transcript summaries. Focus on overarching themes, common patterns, and key insights:

${summaries}

Create a comprehensive summary (200-300 words) that identifies main themes and overall project scope.`;

      const response = await (window.electronAPI.services as any).chatWithOllama({
        prompt: prompt,
        message: '',
        context: ''
      });

      if (response.success) {
        return response.response.trim();
      } else {
        return this.createFallbackSummary(transcripts, aggregatedData);
      }
    } catch (error) {
      console.error('Failed to generate combined summary:', error);
      return this.createFallbackSummary(transcripts, aggregatedData);
    }
  }

  /**
   * Create fallback summary when AI generation fails
   */
  private createFallbackSummary(transcripts: Transcript[], aggregatedData: any): string {
    const topThemes = aggregatedData.themeFrequency.slice(0, 5).map((t: any) => t.theme);
    
    return `This project consists of ${transcripts.length} transcripts spanning from ${new Date(transcripts[0].created_at).toLocaleDateString()} to ${new Date(transcripts[transcripts.length - 1].created_at).toLocaleDateString()}. 

Main themes include: ${topThemes.join(', ')}. 

The project contains ${aggregatedData.allActionItems.length} action items and covers ${aggregatedData.allTopics.length} distinct topics.`;
  }

  /**
   * Analyze consensus points
   */
  private analyzeConsensus(transcripts: Transcript[]): {
    consensus: string[];
  } {
    const consensus: string[] = [];
    const topicOccurrences = new Map<string, string[]>();
    
    transcripts.forEach(transcript => {
      if (transcript.key_topics) {
        const topics = typeof transcript.key_topics === 'string' ? JSON.parse(transcript.key_topics) : transcript.key_topics;
        topics.forEach((topic: string) => {
          if (!topicOccurrences.has(topic)) {
            topicOccurrences.set(topic, []);
          }
          topicOccurrences.get(topic)!.push(transcript.id);
        });
      }
    });

    // Topics appearing in most transcripts are consensus points
    topicOccurrences.forEach((transcriptIds, topic) => {
      const frequency = transcriptIds.length / transcripts.length;
      if (frequency >= 0.6) {
        consensus.push(`${topic} (mentioned across ${transcriptIds.length} transcripts)`);
      }
    });

    return { consensus };
  }

  /**
   * Cache analysis result
   */
  private async cacheAnalysisResult(projectId: string, analysisType: string, result: any): Promise<void> {
    try {
      const id = `${projectId}_${analysisType}_${Date.now()}`;
      await window.electronAPI.database.run(
        'INSERT INTO project_analysis (id, project_id, analysis_type, results) VALUES (?, ?, ?, ?)',
        [id, projectId, analysisType, JSON.stringify(result)]
      );
    } catch (error) {
      console.error('Failed to cache analysis result:', error);
    }
  }

  /**
   * Main project analysis method - performs comprehensive analysis
   */
  async analyzeProject(projectId: string): Promise<CollatedAnalysisResult> {
    console.log(`Starting comprehensive analysis for project ${projectId}`);
    
    // For now, we'll use collated analysis as the main method
    // This can be extended to include cross-transcript analysis later
    return await this.performCollatedAnalysis(projectId);
  }

  getConfig(): ProjectAnalysisConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const projectAnalysisService = ProjectAnalysisService.getInstance();