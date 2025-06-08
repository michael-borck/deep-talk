// Note: Cannot use path module in renderer process

interface ProcessingCallbacks {
  onProgress?: (stage: string, percent: number) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export class FileProcessor {
  async processFile(
    filePath: string,
    transcriptId: string,
    callbacks: ProcessingCallbacks = {}
  ): Promise<void> {
    try {
      // Step 1: Get media info
      callbacks.onProgress?.('analyzing', 0);
      const mediaInfo = await window.electronAPI.audio.getMediaInfo(filePath);
      
      if (!mediaInfo.success) {
        throw new Error(mediaInfo.error || 'Failed to get media info');
      }

      let audioPath = filePath;
      
      // Step 2: Extract audio if it's a video file
      if (mediaInfo.hasVideo) {
        callbacks.onProgress?.('extracting', 0);
        
        // Create temp audio file path
        const tempDir = await window.electronAPI.fs.getAppPath('temp');
        const audioFileName = `${transcriptId}_audio.wav`;
        audioPath = await window.electronAPI.fs.joinPath(tempDir, audioFileName);
        
        const extractResult = await window.electronAPI.audio.extractAudio(filePath, audioPath);
        
        if (!extractResult.success) {
          throw new Error(extractResult.error || 'Failed to extract audio');
        }
        
        callbacks.onProgress?.('extracting', 100);
      }

      // Step 3: Send to STT service
      callbacks.onProgress?.('transcribing', 0);
      
      const transcriptResult = await this.transcribeAudio(audioPath, callbacks.onProgress);
      
      console.log('Transcription result:', transcriptResult);
      
      if (!transcriptResult.success) {
        throw new Error(transcriptResult.error || 'Failed to transcribe audio');
      }
      
      if (!transcriptResult.text || transcriptResult.text.trim() === '') {
        console.warn('Warning: Empty transcript text received');
      }
      
      callbacks.onProgress?.('transcribing', 100);

      // Step 3.5: Validate transcript (if enabled)
      callbacks.onProgress?.('validating', 0);
      const validationResult = await this.validateTranscript(transcriptResult.text || '');
      callbacks.onProgress?.('validating', 100);
      
      // Determine which text to use for analysis
      const analyzeValidatedSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['analyzeValidatedTranscript']
      );
      const textForAnalysis = (analyzeValidatedSetting?.value === 'true' && validationResult.validatedText) 
        ? validationResult.validatedText 
        : transcriptResult.text || '';

      // Step 4: AI Analysis
      callbacks.onProgress?.('analyzing', 0);
      
      const analysisResult = await this.analyzeTranscript(textForAnalysis, callbacks.onProgress);
      
      callbacks.onProgress?.('analyzing', 50);
      
      // Step 4.5: Advanced Analysis (sentiment, speakers, emotions)
      // Use validated text if available and setting is enabled
      const textForAdvancedAnalysis = (analyzeValidatedSetting?.value === 'true' && validationResult.validatedText) 
        ? validationResult.validatedText 
        : transcriptResult.text || '';
      const advancedAnalysisResult = await this.performAdvancedAnalysis(textForAdvancedAnalysis, callbacks.onProgress);
      
      callbacks.onProgress?.('analyzing', 75);
      
      // Step 4.6: Research Analysis (quotes, themes, Q&A, concepts)
      const researchAnalysisResult = await this.performResearchAnalysis(transcriptResult.text || '', callbacks.onProgress);
      
      callbacks.onProgress?.('analyzing', 100);

      // Step 5: Save to database
      callbacks.onProgress?.('saving', 0);
      
      // Update transcript with results
      console.log('Saving transcript to database:', {
        transcriptId,
        textLength: (transcriptResult.text || '').length,
        duration: mediaInfo.duration || 0,
        analysisCompleted: !!analysisResult
      });
      
      const updateResult = await window.electronAPI.database.run(
        `UPDATE transcripts 
         SET status = ?, duration = ?, full_text = ?, validated_text = ?, validation_changes = ?, processed_text = ?,
             summary = ?, key_topics = ?, action_items = ?, 
             sentiment_overall = ?, sentiment_score = ?, emotions = ?, speaker_count = ?, speakers = ?, 
             notable_quotes = ?, research_themes = ?, qa_pairs = ?, concept_frequency = ?,
             processing_completed_at = ?
         WHERE id = ?`,
        [
          'completed', 
          mediaInfo.duration || 0, 
          transcriptResult.text || '', 
          validationResult.validatedText || transcriptResult.text || '',
          JSON.stringify(validationResult.changes || []),
          advancedAnalysisResult.processedText || transcriptResult.text || '',
          analysisResult.summary || '',
          JSON.stringify(analysisResult.keyTopics || []),
          JSON.stringify(analysisResult.actionItems || []),
          advancedAnalysisResult.sentiment || 'neutral',
          advancedAnalysisResult.sentimentScore || 0,
          JSON.stringify(advancedAnalysisResult.emotions || {}),
          advancedAnalysisResult.speakerCount || 1,
          JSON.stringify(advancedAnalysisResult.speakers || []),
          JSON.stringify(researchAnalysisResult.notableQuotes || []),
          JSON.stringify(researchAnalysisResult.researchThemes || []),
          JSON.stringify(researchAnalysisResult.qaPairs || []),
          JSON.stringify(researchAnalysisResult.conceptFrequency || {}),
          new Date().toISOString(), 
          transcriptId
        ]
      );
      
      console.log('Database update result:', updateResult);
      
      callbacks.onProgress?.('saving', 100);
      
      // Cleanup temp files if audio was extracted from video
      if (audioPath !== filePath) {
        console.log('Cleaning up extracted audio file:', audioPath);
        try {
          const deleteResult = await window.electronAPI.fs.deleteFile(audioPath);
          if (deleteResult.success) {
            console.log('Successfully deleted temp file:', audioPath);
          } else {
            console.error('Failed to delete temp file:', deleteResult.error);
          }
        } catch (error) {
          console.error('Error deleting temp file:', error);
        }
      }

      callbacks.onComplete?.();
    } catch (error) {
      console.error('Processing error:', error);
      
      // Update transcript with error
      await window.electronAPI.database.run(
        `UPDATE transcripts 
         SET status = ?, error_message = ?
         WHERE id = ?`,
        ['error', (error as Error).message, transcriptId]
      );
      
      callbacks.onError?.(error as Error);
    }
  }

  async transcribeAudio(audioPath: string, onProgress?: (stage: string, percent: number) => void): Promise<{
    success: boolean;
    text?: string;
    error?: string;
  }> {
    try {
      // Get STT service settings
      const sttUrlSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['speechToTextUrl']
      );
      
      const sttModelSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['speechToTextModel']
      );
      
      const sttUrl = sttUrlSetting?.value || 'https://speaches.serveur.au';
      const sttModel = sttModelSetting?.value || 'Systran/faster-distil-whisper-small.en';
      
      onProgress?.('transcribing', 25);
      
      // Use IPC to transcribe in main process (bypasses CSP)
      const result = await window.electronAPI.audio.transcribeAudio(audioPath, sttUrl, sttModel);
      
      onProgress?.('transcribing', 75);
      
      return result;
    } catch (error) {
      console.error('Transcription error:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async analyzeTranscript(transcriptText: string, onProgress?: (stage: string, percent: number) => void): Promise<{
    summary: string;
    keyTopics: string[];
    actionItems: string[];
  }> {
    try {
      if (!transcriptText || transcriptText.trim() === '') {
        console.warn('No transcript text to analyze');
        return { summary: '', keyTopics: [], actionItems: [] };
      }

      // Get AI service settings
      const aiUrlSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['aiAnalysisUrl']
      );
      
      const aiModelSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['aiModel']
      );
      
      const aiUrl = aiUrlSetting?.value || 'http://localhost:11434';
      const aiModel = aiModelSetting?.value || 'llama2';
      
      onProgress?.('analyzing', 25);
      
      // Create analysis prompt
      const analysisPrompt = `Please analyze the following transcript and provide:
1. A concise summary (2-3 sentences)
2. Key topics discussed (as a bullet list)
3. Action items or next steps mentioned (as a bullet list)

Transcript:
${transcriptText}

Please format your response as JSON:
{
  "summary": "Your summary here",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "actionItems": ["action1", "action2", "action3"]
}`;

      onProgress?.('analyzing', 50);
      
      // Make request to AI service (Ollama)
      const response = await fetch(`${aiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: aiModel,
          prompt: analysisPrompt,
          stream: false,
          format: 'json'
        })
      });
      
      onProgress?.('analyzing', 75);
      
      if (!response.ok) {
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Parse the AI response
      let analysisData;
      try {
        analysisData = JSON.parse(result.response);
      } catch (parseError) {
        console.warn('Failed to parse AI response as JSON, using fallback parsing');
        // Fallback: extract data manually if JSON parsing fails
        analysisData = this.parseAnalysisText(result.response);
      }
      
      console.log('Analysis completed:', analysisData);
      
      return {
        summary: analysisData.summary || '',
        keyTopics: Array.isArray(analysisData.keyTopics) ? analysisData.keyTopics : [],
        actionItems: Array.isArray(analysisData.actionItems) ? analysisData.actionItems : []
      };
      
    } catch (error) {
      console.error('Analysis error:', error);
      // Return empty analysis rather than failing the entire process
      return { summary: '', keyTopics: [], actionItems: [] };
    }
  }

  private parseAnalysisText(text: string): { summary: string; keyTopics: string[]; actionItems: string[] } {
    // Fallback parser for when JSON parsing fails
    const summary = this.extractSection(text, 'summary') || '';
    const keyTopics = this.extractList(text, 'key topics') || [];
    const actionItems = this.extractList(text, 'action items') || [];
    
    return { summary, keyTopics, actionItems };
  }

  private extractSection(text: string, section: string): string {
    const regex = new RegExp(`${section}[:"\\s]*([^\\n\\r]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractList(text: string, section: string): string[] {
    const regex = new RegExp(`${section}[:"\\s]*([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
    const match = text.match(regex);
    if (!match) return [];
    
    const listText = match[1];
    const items = listText.split(/[-•*]\s*/).filter(item => item.trim().length > 0);
    return items.map(item => item.trim().replace(/\n/g, ' '));
  }

  // Helper functions for AI service settings
  async getAiUrl(): Promise<string> {
    const aiUrlSetting = await window.electronAPI.database.get(
      'SELECT value FROM settings WHERE key = ?',
      ['aiAnalysisUrl']
    );
    return aiUrlSetting?.value || 'http://localhost:11434';
  }

  async getAiModel(): Promise<string> {
    const aiModelSetting = await window.electronAPI.database.get(
      'SELECT value FROM settings WHERE key = ?',
      ['aiModel']
    );
    return aiModelSetting?.value || 'llama2';
  }

  async callAI(aiUrl: string, aiModel: string, prompt: string, expectJson: boolean = true): Promise<any> {
    try {
      const response = await fetch(`${aiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: aiModel,
          prompt: prompt,
          stream: false,
          format: expectJson ? 'json' : undefined
        })
      });
      
      if (!response.ok) {
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (expectJson) {
        try {
          return { parsed: JSON.parse(result.response), raw: result.response };
        } catch (parseError) {
          console.warn('Failed to parse AI response as JSON:', result.response);
          return { parsed: null, raw: result.response };
        }
      } else {
        return result.response;
      }
    } catch (error) {
      console.error('AI call error:', error);
      return expectJson ? { parsed: null, raw: '' } : '';
    }
  }

  async performSentimentAnalysis(transcriptText: string): Promise<{
    sentiment: string;
    sentimentScore: number;
  }> {
    try {
      const aiUrl = await this.getAiUrl();
      const aiModel = await this.getAiModel();
      
      const prompt = `Analyze the sentiment of this transcript. Provide:
1. Overall sentiment: positive, negative, or neutral
2. Sentiment score: -1.0 (very negative) to 1.0 (very positive)

Transcript: ${transcriptText}

Respond in JSON format:
{"sentiment": "positive|negative|neutral", "sentimentScore": 0.0}`;

      const aiResponse = await this.callAI(aiUrl, aiModel, prompt);
      const result = aiResponse.parsed || {};
      return {
        sentiment: result.sentiment || 'neutral',
        sentimentScore: typeof result.sentimentScore === 'number' ? result.sentimentScore : 0
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return { sentiment: 'neutral', sentimentScore: 0 };
    }
  }

  async performEmotionAnalysis(transcriptText: string): Promise<Record<string, number>> {
    try {
      const aiUrl = await this.getAiUrl();
      const aiModel = await this.getAiModel();
      
      const prompt = `Analyze the emotional content of this transcript. Rate each emotion from 0.0 to 1.0:

Emotions to analyze: frustration, excitement, confusion, confidence, anxiety, satisfaction

Transcript: ${transcriptText}

Respond in JSON format:
{"frustration": 0.0, "excitement": 0.0, "confusion": 0.0, "confidence": 0.0, "anxiety": 0.0, "satisfaction": 0.0}`;

      const aiResponse = await this.callAI(aiUrl, aiModel, prompt);
      return aiResponse.parsed || {};
    } catch (error) {
      console.error('Emotion analysis error:', error);
      return {};
    }
  }

  // Enhanced hybrid speaker detection with rule-based preprocessing
  async performSpeakerDetection(transcriptText: string): Promise<{
    speakerCount: number;
    speakers: Array<{ id: string; name: string; segments: number }>;
  }> {
    try {
      // First, apply rule-based preprocessing
      const preprocessed = this.preprocessTranscriptForSpeakers(transcriptText);
      
      // Debug logging for speaker detection
      console.log('Speaker Detection Debug:', {
        likelySingleSpeaker: preprocessed.likelySingleSpeaker,
        hasExistingSpeakerTags: preprocessed.hasExistingSpeakerTags,
        segmentCount: preprocessed.segments.length,
        textLength: transcriptText.length
      });

      // If obvious single speaker or already has speaker tags, skip AI
      if (preprocessed.likelySingleSpeaker || preprocessed.hasExistingSpeakerTags) {
        console.log('Skipping AI analysis:', preprocessed.likelySingleSpeaker ? 'Single speaker detected' : 'Existing tags found');
        return {
          speakerCount: preprocessed.hasExistingSpeakerTags ? preprocessed.detectedSpeakers.length : 1,
          speakers: preprocessed.hasExistingSpeakerTags ? 
            preprocessed.detectedSpeakers.map((name, idx) => ({
              id: `Speaker ${idx + 1}`,
              name: name,
              segments: preprocessed.speakerSegmentCounts[name] || 1
            })) :
            [{ id: 'Speaker 1', name: 'Speaker 1', segments: 1 }]
        };
      }

      console.log('Proceeding with AI-based speaker detection...');

      // Use two-stage AI approach for better results with weak models
      const aiUrl = await this.getAiUrl();
      const aiModel = await this.getAiModel();
      
      // Stage 1: Simple speaker count detection
      const countPrompt = `Analyze this transcript and determine how many distinct speakers are present.
Consider:
- Changes in perspective (I/you/we)
- Question and answer patterns
- Different speaking styles

Transcript excerpt (first 500 chars):
${transcriptText.substring(0, 500)}...

Respond with ONLY a JSON object:
{"speaker_count": N}`;

      const countResponse = await this.callAI(aiUrl, aiModel, countPrompt);
      const speakerCount = countResponse.parsed?.speaker_count || 1;

      if (speakerCount === 1) {
        return {
          speakerCount: 1,
          speakers: [{ id: 'Speaker 1', name: 'Speaker 1', segments: 1 }]
        };
      }

      // Stage 2: Identify speaker segments using simpler prompts
      const segments = preprocessed.segments.slice(0, 10); // Analyze first 10 segments
      const segmentPrompt = `Given ${speakerCount} speakers in this conversation, identify speaker changes.
Mark each segment with a speaker number (1 to ${speakerCount}).

Segments:
${segments.map((seg, idx) => `[${idx}]: "${seg.substring(0, 100)}..."`).join('\n')}

Respond with ONLY a JSON array of speaker IDs:
{"segments": [1, 2, 1, 2, ...]}`;

      const segmentResponse = await this.callAI(aiUrl, aiModel, segmentPrompt);
      const speakerIds = segmentResponse.parsed?.segments || [];

      // Count segments per speaker
      const speakerSegmentMap = new Map<number, number>();
      speakerIds.forEach((id: number) => {
        speakerSegmentMap.set(id, (speakerSegmentMap.get(id) || 0) + 1);
      });

      // Create speaker array
      const speakers = Array.from({ length: speakerCount }, (_, i) => ({
        id: `Speaker ${i + 1}`,
        name: `Speaker ${i + 1}`,
        segments: speakerSegmentMap.get(i + 1) || Math.ceil(preprocessed.segments.length / speakerCount)
      }));

      return { speakerCount, speakers };
    } catch (error) {
      console.error('Speaker detection error:', error);
      return { speakerCount: 1, speakers: [{ id: 'Speaker 1', name: 'Speaker 1', segments: 1 }] };
    }
  }

  // Rule-based preprocessing for speaker detection
  preprocessTranscriptForSpeakers(text: string): {
    segments: string[];
    likelySingleSpeaker: boolean;
    hasExistingSpeakerTags: boolean;
    detectedSpeakers: string[];
    speakerSegmentCounts: Record<string, number>;
  } {
    // Check for existing speaker tags
    const colonPattern = /^([A-Za-z0-9\s]+):\s/gm;
    const bracketPattern = /^\[([A-Za-z0-9\s]+)\]\s/gm;
    const existingTags = [...text.matchAll(colonPattern), ...text.matchAll(bracketPattern)];
    
    if (existingTags.length > 0) {
      const speakers = new Set<string>();
      const counts: Record<string, number> = {};
      
      existingTags.forEach(match => {
        const speaker = match[1].trim();
        speakers.add(speaker);
        counts[speaker] = (counts[speaker] || 0) + 1;
      });
      
      return {
        segments: [],
        likelySingleSpeaker: false,
        hasExistingSpeakerTags: true,
        detectedSpeakers: Array.from(speakers),
        speakerSegmentCounts: counts
      };
    }

    // Enhanced segment splitting for conversations
    let segments = text
      .split(/\n{2,}/) // Double line breaks
      .filter(s => s.trim().length > 20) // Remove very short segments
      .map(s => s.trim());
    
    // If we get very few segments, try alternative splitting methods
    if (segments.length < 3) {
      // Try splitting on conversation markers
      const conversationSplit = text.split(/\b(?:Well,|So,|Yeah,|Yes,|No,|Okay,|And so|Can you|What was|How do)\b/i)
        .filter(s => s.trim().length > 30)
        .map(s => s.trim());
      
      if (conversationSplit.length > segments.length) {
        segments = conversationSplit;
      }
      
      // If still very few segments, try sentence-based splitting for long texts
      if (segments.length < 3 && text.length > 500) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        if (sentences.length > 10) {
          // Group sentences into larger segments
          const groupSize = Math.ceil(sentences.length / 6); // Aim for ~6 segments
          segments = [];
          for (let i = 0; i < sentences.length; i += groupSize) {
            const group = sentences.slice(i, i + groupSize).join(' ').trim();
            if (group.length > 50) {
              segments.push(group);
            }
          }
        }
      }
    }

    // Enhanced conversation detection
    const questionCount = (text.match(/\?/g) || []).length;
    const secondPersonCount = (text.match(/\b(you|you're|you've|your)\b/gi) || []).length;
    const wordCount = text.split(/\s+/).length;
    
    // Look for conversation indicators
    const conversationWords = (text.match(/\b(well|so|yeah|yes|no|okay|um|uh|hmm)\b/gi) || []).length;
    const responsePatterns = (text.match(/\b(can you tell me|what do you think|how do you|do you remember)\b/gi) || []).length;
    const interviewPatterns = (text.match(/\b(my name is|I understand|I'm doing|to start out)\b/gi) || []).length;
    
    // Calculate ratios
    const conversationRatio = conversationWords / wordCount;
    
    // Strong indicators of conversation
    const hasConversationMarkers = 
      questionCount >= 3 || 
      responsePatterns > 0 || 
      interviewPatterns > 0 ||
      conversationRatio > 0.01;
    
    // Likely single speaker ONLY if very clear indicators
    const likelySingleSpeaker = 
      !hasConversationMarkers &&
      segments.length < 2 && 
      questionCount === 0 && 
      secondPersonCount === 0 &&
      wordCount < 200;

    return {
      segments,
      likelySingleSpeaker,
      hasExistingSpeakerTags: false,
      detectedSpeakers: [],
      speakerSegmentCounts: {}
    };
  }

  async performSpeakerTagging(transcriptText: string, speakers: Array<{ id: string; name: string; segments: number }>): Promise<string> {
    try {
      if (!speakers || speakers.length <= 1) {
        return transcriptText; // No need to tag single speaker
      }

      const aiUrl = await this.getAiUrl();
      const aiModel = await this.getAiModel();
      
      // Stage 0: Pre-analyze for speaker patterns (like quotes analysis does)
      const patternPrompt = `Analyze this conversation to understand speaker patterns and provide guidance for tagging.

Transcript:
${transcriptText.substring(0, 2000)}...

Look for:
- Who asks questions vs who answers
- Different speaking styles or vocabulary
- Conversation flow patterns

Respond with ONLY a JSON object:
{"speaker1_role": "interviewer|interviewee|participant", "speaker2_role": "interviewer|interviewee|participant", "main_patterns": ["pattern1", "pattern2"], "question_asker": "Speaker 1|Speaker 2"}`;

      let speakerGuidance = null;
      try {
        const guidanceResponse = await this.callAI(aiUrl, aiModel, patternPrompt);
        speakerGuidance = guidanceResponse.parsed || {};
        console.log('Speaker pattern guidance:', speakerGuidance);
      } catch (error) {
        console.error('Pattern analysis failed:', error);
      }

      // Enhanced speaker tagging with segment-based approach
      const preprocessed = this.preprocessTranscriptForSpeakers(transcriptText);
      let segments = preprocessed.segments;
      
      // Always split by sentences for better speaker detection (matching manual tagging approach)
      const sentences = transcriptText.split(/([.!?]+)/).filter(s => s.trim());
      const sentenceSegments: string[] = [];
      
      for (let i = 0; i < sentences.length; i += 2) {
        const sentence = sentences[i] || '';
        const punctuation = sentences[i + 1] || '';
        const fullSentence = (sentence + punctuation).trim();
        
        if (fullSentence.length > 0) {
          sentenceSegments.push(fullSentence);
        }
      }
      
      // Use sentence segments if we have more than paragraph segments
      if (sentenceSegments.length > segments.length) {
        console.log(`Using sentence-based segmentation: ${sentenceSegments.length} sentences vs ${segments.length} paragraphs`);
        segments = sentenceSegments;
      }

      // Use full transcript approach (like quotes analysis) for better accuracy
      const fullTranscriptPrompt = `You are analyzing a conversation to identify which speaker said each sentence. You will see the full conversation context to understand speaker patterns and roles.

Context: This is ${speakers.length === 2 ? 'likely an interview or conversation between two people' : `a conversation with ${speakers.length} speakers`}.

Available speakers: ${speakers.map(s => s.name).join(', ')}

${speakerGuidance ? `Speaker patterns identified:
- ${speakerGuidance.speaker1_role ? `Speaker 1: ${speakerGuidance.speaker1_role}` : ''}
- ${speakerGuidance.speaker2_role ? `Speaker 2: ${speakerGuidance.speaker2_role}` : ''}
- Questions typically asked by: ${speakerGuidance.question_asker || 'Unknown'}
- Key patterns: ${speakerGuidance.main_patterns?.join(', ') || 'None'}` : ''}

Full Conversation:
${transcriptText}

Sentences to tag:
${segments.map((seg, idx) => `[${idx}]: "${seg}"`).join('\n')}

Analyze the full conversation context and identify patterns like:
- Questions vs answers (interviewers ask, interviewees respond)
- Speaking style consistency
- Conversation flow and turn-taking
- Topic introduction vs responses

Respond with ONLY a JSON object mapping ALL sentence numbers to speaker names:
{"assignments": {"0": "Speaker 1", "1": "Speaker 1", "2": "Speaker 2", "3": "Speaker 1", "4": "Speaker 2", ...}}`;

      let taggedSegments: Array<{ text: string; speaker: string }> = [];
      
      try {
        console.log('Sending full transcript for speaker tagging...');
        const response = await this.callAI(aiUrl, aiModel, fullTranscriptPrompt);
        const assignments = response.parsed?.assignments || {};
        
        // Process all segments based on AI response
        segments.forEach((seg, idx) => {
          const assignedSpeaker = assignments[idx.toString()] || 
                                 speakers[idx % speakers.length].name;
          taggedSegments.push({
            text: seg,
            speaker: assignedSpeaker
          });
        });
        
        console.log(`Successfully tagged ${taggedSegments.length} segments using full context`);
      } catch (fullError) {
        console.error('Full transcript tagging error:', fullError);
        // Fallback: alternate speakers based on patterns
        segments.forEach((seg) => {
          // Simple fallback: questions to Speaker 1, answers to Speaker 2
          const isQuestion = seg.trim().endsWith('?') || 
                           /^(what|how|why|when|where|who|can you|do you|would you|could you)/i.test(seg.trim());
          const defaultSpeaker = isQuestion ? speakers[0].name : speakers[1].name;
          
          taggedSegments.push({
            text: seg,
            speaker: defaultSpeaker
          });
        });
        console.log('Used fallback speaker assignment based on question patterns');
      }

      // Reconstruct the transcript with speaker tags
      let taggedTranscript = '';
      let lastSpeaker = '';
      
      taggedSegments.forEach(segment => {
        if (segment.speaker !== lastSpeaker) {
          taggedTranscript += `\n\n[${segment.speaker}]: `;
          lastSpeaker = segment.speaker;
        } else {
          taggedTranscript += ' ';
        }
        taggedTranscript += segment.text;
      });
      
      return taggedTranscript.trim();
    } catch (error) {
      console.error('Speaker tagging error:', error);
      return transcriptText;
    }
  }

  async performAdvancedAnalysis(transcriptText: string, onProgress?: (stage: string, percent: number) => void): Promise<{
    sentiment: string;
    sentimentScore: number;
    emotions: Record<string, number>;
    speakerCount: number;
    speakers: Array<{ id: string; name: string; segments: number }>;
    processedText: string;
  }> {
    try {
      if (!transcriptText || transcriptText.trim() === '') {
        console.warn('No transcript text for advanced analysis');
        return { sentiment: 'neutral', sentimentScore: 0, emotions: {}, speakerCount: 1, speakers: [], processedText: transcriptText };
      }

      // Check if we should use one-task-at-a-time approach
      const oneTaskSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['oneTaskAtATime']
      );
      const useOneTaskAtATime = oneTaskSetting?.value === 'true';

      if (useOneTaskAtATime) {
        console.log('Using one-task-at-a-time analysis approach');
        onProgress?.('analyzing', 60);
        
        // Step 1: Sentiment Analysis
        const sentimentResult = await this.performSentimentAnalysis(transcriptText);
        onProgress?.('analyzing', 65);
        
        // Step 2: Emotion Analysis
        const emotionResult = await this.performEmotionAnalysis(transcriptText);
        onProgress?.('analyzing', 70);
        
        // Step 3: Speaker Detection
        const speakerResult = await this.performSpeakerDetection(transcriptText);
        onProgress?.('analyzing', 75);
        
        // Step 4: Speaker Tagging (if enabled and multiple speakers detected)
        let processedText = transcriptText;
        const speakerTaggingSetting = await window.electronAPI.database.get(
          'SELECT value FROM settings WHERE key = ?',
          ['enableSpeakerTagging']
        );
        
        if (speakerTaggingSetting?.value === 'true' && speakerResult.speakerCount > 1) {
          processedText = await this.performSpeakerTagging(transcriptText, speakerResult.speakers);
        }
        onProgress?.('analyzing', 85);
        
        return {
          sentiment: sentimentResult.sentiment,
          sentimentScore: sentimentResult.sentimentScore,
          emotions: emotionResult,
          speakerCount: speakerResult.speakerCount,
          speakers: speakerResult.speakers,
          processedText
        };
      } else {
        // Legacy monolithic approach
        console.log('Using legacy monolithic analysis approach');
        return this.performLegacyAdvancedAnalysis(transcriptText, onProgress);
      }
      
    } catch (error) {
      console.error('Advanced analysis error:', error);
      // Return defaults rather than failing the entire process
      return { sentiment: 'neutral', sentimentScore: 0, emotions: {}, speakerCount: 1, speakers: [], processedText: transcriptText };
    }
  }

  async performLegacyAdvancedAnalysis(transcriptText: string, onProgress?: (stage: string, percent: number) => void): Promise<{
    sentiment: string;
    sentimentScore: number;
    emotions: Record<string, number>;
    speakerCount: number;
    speakers: Array<{ id: string; name: string; segments: number }>;
    processedText: string;
  }> {
    // Get AI service settings
    const aiUrl = await this.getAiUrl();
    const aiModel = await this.getAiModel();
    
    onProgress?.('analyzing', 60);
    
    // Create advanced analysis prompt
    const advancedPrompt = `Please perform advanced analysis on the following transcript:

1. Sentiment Analysis: Determine the overall emotional tone (positive, negative, or neutral) and provide a sentiment score from -1.0 (very negative) to 1.0 (very positive).

2. Speaker Identification: Identify distinct speakers in the conversation. Look for speaker changes, different speaking styles, or dialogue patterns. Assign each speaker an ID like "Speaker 1", "Speaker 2", etc.

3. Emotion Detection: Analyze the emotional content and detect levels of:
   - Frustration (0.0 to 1.0)
   - Excitement (0.0 to 1.0) 
   - Confusion (0.0 to 1.0)
   - Confidence (0.0 to 1.0)
   - Anxiety (0.0 to 1.0)
   - Satisfaction (0.0 to 1.0)

Transcript:
${transcriptText}

Please format your response as JSON:
{
  "sentiment": "positive|negative|neutral",
  "sentimentScore": 0.0,
  "emotions": {
    "frustration": 0.0,
    "excitement": 0.0,
    "confusion": 0.0,
    "confidence": 0.0,
    "anxiety": 0.0,
    "satisfaction": 0.0
  },
  "speakerCount": 1,
  "speakers": [
    {
      "id": "Speaker 1",
      "name": "Speaker 1",
      "segments": 5
    }
  ]
}`;

    onProgress?.('analyzing', 75);
    
    const aiResponse = await this.callAI(aiUrl, aiModel, advancedPrompt);
    
    onProgress?.('analyzing', 85);
    
    // Use parsed response if available, otherwise fall back to text parsing
    const result = aiResponse.parsed || this.parseAdvancedAnalysisText(aiResponse.raw || '');
    
    return {
      sentiment: result.sentiment || 'neutral',
      sentimentScore: typeof result.sentimentScore === 'number' ? result.sentimentScore : 0,
      emotions: result.emotions || {},
      speakerCount: typeof result.speakerCount === 'number' ? result.speakerCount : 1,
      speakers: Array.isArray(result.speakers) ? result.speakers : [],
      processedText: transcriptText
    };
  }

  private parseAdvancedAnalysisText(text: string): any {
    // Fallback parser for advanced analysis when JSON parsing fails
    return {
      sentiment: this.extractSentiment(text),
      sentimentScore: this.extractSentimentScore(text),
      emotions: this.extractEmotions(text),
      speakerCount: this.extractSpeakerCount(text),
      speakers: this.extractSpeakers(text)
    };
  }

  private extractSentiment(text: string): string {
    const sentimentMatch = text.match(/sentiment["\s:]*([a-z]+)/i);
    const sentiment = sentimentMatch ? sentimentMatch[1].toLowerCase() : 'neutral';
    return ['positive', 'negative', 'neutral'].includes(sentiment) ? sentiment : 'neutral';
  }

  private extractSentimentScore(text: string): number {
    const scoreMatch = text.match(/sentiment[_\s]*score["\s:]*(-?\d*\.?\d+)/i);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
    return Math.max(-1, Math.min(1, score)); // Clamp between -1 and 1
  }

  private extractEmotions(text: string): Record<string, number> {
    const emotions = ['frustration', 'excitement', 'confusion', 'confidence', 'anxiety', 'satisfaction'];
    const result: Record<string, number> = {};
    
    emotions.forEach(emotion => {
      const regex = new RegExp(`${emotion}["\s:]*(\d*\.?\d+)`, 'i');
      const match = text.match(regex);
      result[emotion] = match ? Math.max(0, Math.min(1, parseFloat(match[1]))) : 0;
    });
    
    return result;
  }

  private extractSpeakerCount(text: string): number {
    const countMatch = text.match(/speaker[_\s]*count["\s:]*(\d+)/i);
    return countMatch ? parseInt(countMatch[1]) : 1;
  }

  private extractSpeakers(text: string): Array<{ id: string; name: string; segments: number }> {
    // Basic extraction - in practice, this would be more sophisticated
    const speakerMatches = text.match(/speaker\s+\d+/gi) || [];
    return speakerMatches.map((_, index) => ({
      id: `Speaker ${index + 1}`,
      name: `Speaker ${index + 1}`,
      segments: 1
    }));
  }

  async validateTranscript(transcriptText: string): Promise<{
    validatedText: string;
    changes: Array<{ type: string; original: string; corrected: string; position: number }>;
  }> {
    // Initialize variables outside try block for catch block access
    let processedText = transcriptText;
    let duplicateRemovalChanges: any[] = [];
    
    try {
      // Get validation settings
      const validationEnabledSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['enableTranscriptValidation']
      );
      
      if (validationEnabledSetting?.value !== 'true') {
        return { validatedText: transcriptText, changes: [] };
      }
      
      const validationOptionsSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['validationOptions']
      );
      
      const options = validationOptionsSetting?.value ? JSON.parse(validationOptionsSetting.value) : {};
      
      // First, remove duplicate sentences if enabled (separate setting)
      const duplicateRemovalSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['enableDuplicateRemoval']
      );
      
      if (duplicateRemovalSetting?.value !== 'false') {
        const duplicateResult = await this.removeDuplicateSentences(transcriptText);
        processedText = duplicateResult.cleanedText;
        
        if (duplicateResult.removedCount > 0) {
          duplicateRemovalChanges = duplicateResult.removedSentences.map(sentence => ({
            type: 'duplicate_removal',
            original: sentence,
            corrected: '[REMOVED]',
            position: -1
          }));
        }
      }
      
      // Get AI service settings
      const aiUrlSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['aiAnalysisUrl']
      );
      
      const aiModelSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['aiModel']
      );
      
      const aiUrl = aiUrlSetting?.value || 'http://localhost:11434';
      const aiModel = aiModelSetting?.value || 'llama2';
      
      // Create validation prompt
      const validationPrompt = `Please validate and correct the following transcript. Focus on:
${options.spelling !== false ? '- Spelling errors' : ''}
${options.grammar !== false ? '- Grammar mistakes' : ''}
${options.punctuation !== false ? '- Punctuation' : ''}
${options.capitalization !== false ? '- Proper capitalization' : ''}

Important: 
- Preserve the original meaning and speaker intent
- Do not change technical terms or proper nouns unless clearly misspelled
- Return the corrected text and a list of changes made

Original transcript:
${processedText}

Please format your response as JSON:
{
  "validatedText": "The corrected transcript text",
  "changes": [
    {
      "type": "spelling|grammar|punctuation|capitalization",
      "original": "original text",
      "corrected": "corrected text",
      "position": 0
    }
  ]
}`;

      console.log(`Validation input length: ${processedText.length} characters`);
      
      // For very long transcripts, use chunked validation
      if (processedText.length > 4000) {
        console.log('Using chunked validation for long transcript');
        const chunkResult = await this.performChunkedValidation(processedText, options, aiUrl, aiModel);
        return {
          validatedText: chunkResult.validatedText,
          changes: [...duplicateRemovalChanges, ...chunkResult.changes]
        };
      }

      // Make request to AI service
      const response = await fetch(`${aiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: aiModel,
          prompt: validationPrompt,
          stream: false,
          format: 'json'
        })
      });
      
      if (!response.ok) {
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`Validation output length: ${result.response?.length || 0} characters`);
      
      // Parse the AI response
      let validationData;
      try {
        validationData = JSON.parse(result.response);
      } catch (parseError) {
        console.warn('Failed to parse validation response as JSON');
        return { 
          validatedText: processedText, // Use duplicate-cleaned text as fallback
          changes: duplicateRemovalChanges 
        };
      }
      
      // Check if AI returned full text (within 10% of original length)
      const originalLength = processedText.length;
      const validatedLength = validationData.validatedText?.length || 0;
      const lengthRatio = validatedLength / originalLength;
      
      if (lengthRatio < 0.9) {
        console.warn(`AI validation may have truncated text. Original: ${originalLength}, Validated: ${validatedLength}`);
        // Return original text with duplicate removal only
        return {
          validatedText: processedText,
          changes: duplicateRemovalChanges
        };
      }
      
      return {
        validatedText: validationData.validatedText || processedText,
        changes: [
          ...duplicateRemovalChanges,
          ...(Array.isArray(validationData.changes) ? validationData.changes : [])
        ]
      };
      
    } catch (error) {
      console.error('Validation error:', error);
      // Return duplicate-cleaned text if validation fails, or original if duplicate removal also failed
      return { 
        validatedText: processedText || transcriptText, 
        changes: duplicateRemovalChanges || [] 
      };
    }
  }

  async performChunkedValidation(text: string, options: any, aiUrl: string, aiModel: string): Promise<{
    validatedText: string;
    changes: Array<{ type: string; original: string; corrected: string; position: number }>;
  }> {
    const CHUNK_SIZE = 3500; // Safe size for most models
    const chunks = [];
    let currentPos = 0;
    
    // Split into chunks at sentence boundaries
    while (currentPos < text.length) {
      let chunkEnd = currentPos + CHUNK_SIZE;
      
      if (chunkEnd >= text.length) {
        chunks.push(text.substring(currentPos));
        break;
      }
      
      // Find the last sentence ending within chunk size
      const chunk = text.substring(currentPos, chunkEnd);
      const lastSentenceEnd = Math.max(
        chunk.lastIndexOf('.'),
        chunk.lastIndexOf('!'),
        chunk.lastIndexOf('?')
      );
      
      if (lastSentenceEnd > 0) {
        chunkEnd = currentPos + lastSentenceEnd + 1;
      }
      
      chunks.push(text.substring(currentPos, chunkEnd));
      currentPos = chunkEnd;
    }
    
    console.log(`Processing ${chunks.length} chunks for validation`);
    
    const validatedChunks: string[] = [];
    const allChanges: Array<{ type: string; original: string; corrected: string; position: number }> = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Validating chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
      
      try {
        const validationPrompt = `Please validate and correct the following text segment. Focus on:
${options.spelling !== false ? '- Spelling errors' : ''}
${options.grammar !== false ? '- Grammar mistakes' : ''}
${options.punctuation !== false ? '- Punctuation' : ''}
${options.capitalization !== false ? '- Proper capitalization' : ''}

Important: 
- Preserve the original meaning and speaker intent
- Do not change technical terms or proper nouns unless clearly misspelled
- Return the corrected text and a list of changes made

Text segment:
${chunk}

Please format your response as JSON:
{
  "validatedText": "The corrected text segment",
  "changes": [
    {
      "type": "spelling|grammar|punctuation|capitalization",
      "original": "original text",
      "corrected": "corrected text",
      "position": 0
    }
  ]
}`;

        const response = await fetch(`${aiUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: aiModel,
            prompt: validationPrompt,
            stream: false,
            format: 'json'
          })
        });

        if (response.ok) {
          const result = await response.json();
          const chunkData = JSON.parse(result.response);
          validatedChunks.push(chunkData.validatedText || chunk);
          
          if (Array.isArray(chunkData.changes)) {
            // Adjust positions for the full text
            const adjustedChanges = chunkData.changes.map((change: any) => ({
              ...change,
              position: change.position + (i > 0 ? validatedChunks.slice(0, i).join('').length : 0)
            }));
            allChanges.push(...adjustedChanges);
          }
        } else {
          console.warn(`Failed to validate chunk ${i + 1}, using original`);
          validatedChunks.push(chunk);
        }
      } catch (error) {
        console.warn(`Error validating chunk ${i + 1}:`, error);
        validatedChunks.push(chunk);
      }
      
      // Small delay to be nice to the AI service
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return {
      validatedText: validatedChunks.join(''),
      changes: allChanges
    };
  }

  async removeDuplicateSentences(transcriptText: string): Promise<{ 
    cleanedText: string; 
    removedCount: number;
    removedSentences: string[];
  }> {
    try {
      if (!transcriptText || transcriptText.trim() === '') {
        return { cleanedText: transcriptText, removedCount: 0, removedSentences: [] };
      }

      // Split into sentences
      const sentences = transcriptText
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (sentences.length <= 1) {
        return { cleanedText: transcriptText, removedCount: 0, removedSentences: [] };
      }

      const uniqueSentences: string[] = [];
      const removedSentences: string[] = [];
      const seenSentences = new Set<string>();

      for (let i = 0; i < sentences.length; i++) {
        let sentence = sentences[i].trim();
        
        // Normalize sentence for comparison (lowercase, remove extra spaces, common words)
        const normalized = sentence
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s]/g, '')
          .trim();

        // Skip very short sentences (likely fragments)
        if (normalized.length < 10) {
          uniqueSentences.push(sentence);
          continue;
        }

        // Check for exact or near-exact duplicates
        let isDuplicate = false;

        // Check against all previously seen sentences
        for (const seenNormalized of seenSentences) {
          const similarity = this.calculateSimilarity(normalized, seenNormalized);
          
          // Consider duplicates if >85% similar
          if (similarity > 0.85) {
            isDuplicate = true;
            removedSentences.push(sentence);
            break;
          }
        }

        if (!isDuplicate) {
          seenSentences.add(normalized);
          uniqueSentences.push(sentence);
        }
      }

      // Rebuild text with proper punctuation
      const cleanedText = uniqueSentences
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .join('. ')
        .replace(/\.\s*\./g, '.') // Remove double periods
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();

      console.log(`Removed ${removedSentences.length} duplicate sentences from transcript`);

      return {
        cleanedText: cleanedText + (cleanedText.endsWith('.') ? '' : '.'),
        removedCount: removedSentences.length,
        removedSentences
      };

    } catch (error) {
      console.error('Error removing duplicate sentences:', error);
      return { cleanedText: transcriptText, removedCount: 0, removedSentences: [] };
    }
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation using Levenshtein distance
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  async performResearchAnalysis(transcriptText: string, onProgress?: (stage: string, percent: number) => void): Promise<{
    notableQuotes: Array<{ text: string; speaker?: string; timestamp?: number; relevance: number }>;
    researchThemes: Array<{ theme: string; confidence: number; examples: string[] }>;
    qaPairs: Array<{ question: string; answer: string; speaker?: string; timestamp?: number }>;
    conceptFrequency: Record<string, { count: number; contexts: string[] }>;
  }> {
    try {
      if (!transcriptText || transcriptText.trim() === '') {
        console.warn('No transcript text for research analysis');
        return { notableQuotes: [], researchThemes: [], qaPairs: [], conceptFrequency: {} };
      }

      // Get AI service settings
      const aiUrlSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['aiAnalysisUrl']
      );
      
      const aiModelSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['aiModel']
      );
      
      const aiUrl = aiUrlSetting?.value || 'http://localhost:11434';
      const aiModel = aiModelSetting?.value || 'llama2';
      
      onProgress?.('analyzing', 80);
      
      // Create research analysis prompt
      const researchPrompt = `Please perform detailed research analysis on the following transcript for qualitative research purposes:

1. **Notable Quotes**: Extract 3-5 most significant, quotable statements that capture key insights, surprising revelations, or memorable expressions. Rate each quote's relevance (0.0 to 1.0).

2. **Research Themes**: Identify 3-7 major themes or categories that emerge from the content. These should be suitable for qualitative research coding. Provide confidence scores (0.0 to 1.0) and specific examples for each theme.

3. **Question-Answer Mapping**: If this appears to be an interview or Q&A session, identify clear question-answer pairs. Look for interrogative statements followed by responses.

4. **Concept Frequency**: Identify key concepts, technical terms, or important topics mentioned repeatedly. Count occurrences and provide brief context snippets.

Transcript:
${transcriptText}

Please format your response as JSON:
{
  "notableQuotes": [
    {
      "text": "The exact quote text here",
      "speaker": "Speaker 1",
      "relevance": 0.9
    }
  ],
  "researchThemes": [
    {
      "theme": "Technology Adoption",
      "confidence": 0.85,
      "examples": ["specific example 1", "specific example 2"]
    }
  ],
  "qaPairs": [
    {
      "question": "What do you think about...",
      "answer": "I believe that...",
      "speaker": "Speaker 2"
    }
  ],
  "conceptFrequency": {
    "artificial intelligence": {
      "count": 5,
      "contexts": ["context snippet 1", "context snippet 2"]
    }
  }
}`;

      onProgress?.('analyzing', 90);
      
      // Make request to AI service
      const response = await fetch(`${aiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: aiModel,
          prompt: researchPrompt,
          stream: false,
          format: 'json'
        })
      });
      
      onProgress?.('analyzing', 95);
      
      if (!response.ok) {
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Parse the AI response
      let analysisData;
      try {
        analysisData = JSON.parse(result.response);
      } catch (parseError) {
        console.warn('Failed to parse research analysis response as JSON, using fallback');
        analysisData = this.parseResearchAnalysisText(result.response, transcriptText);
      }
      
      console.log('Research analysis completed:', analysisData);
      
      return {
        notableQuotes: Array.isArray(analysisData.notableQuotes) ? analysisData.notableQuotes : [],
        researchThemes: Array.isArray(analysisData.researchThemes) ? analysisData.researchThemes : [],
        qaPairs: Array.isArray(analysisData.qaPairs) ? analysisData.qaPairs : [],
        conceptFrequency: analysisData.conceptFrequency || {}
      };
      
    } catch (error) {
      console.error('Research analysis error:', error);
      // Return empty analysis rather than failing the entire process
      return { notableQuotes: [], researchThemes: [], qaPairs: [], conceptFrequency: {} };
    }
  }

  private parseResearchAnalysisText(text: string, transcript: string): any {
    // Fallback parser for research analysis when JSON parsing fails
    return {
      notableQuotes: this.extractNotableQuotes(text, transcript),
      researchThemes: this.extractResearchThemes(text),
      qaPairs: this.extractQAPairs(text, transcript),
      conceptFrequency: this.extractConceptFrequency(text, transcript)
    };
  }

  private extractNotableQuotes(text: string, transcript: string): Array<{ text: string; speaker?: string; relevance: number }> {
    // Look for quoted text in the AI response or extract interesting sentences from transcript
    const quotes: Array<{ text: string; speaker?: string; relevance: number }> = [];
    
    // Try to find quotes in AI response
    const quoteMatches = text.match(/"([^"]{20,200})"/g);
    if (quoteMatches) {
      quoteMatches.slice(0, 5).forEach(quote => {
        quotes.push({
          text: quote.replace(/"/g, ''),
          relevance: 0.7
        });
      });
    }
    
    // Fallback: extract meaningful sentences from transcript
    if (quotes.length === 0) {
      const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 30);
      sentences.slice(0, 3).forEach(sentence => {
        quotes.push({
          text: sentence.trim(),
          relevance: 0.5
        });
      });
    }
    
    return quotes;
  }

  private extractResearchThemes(text: string): Array<{ theme: string; confidence: number; examples: string[] }> {
    const themes: Array<{ theme: string; confidence: number; examples: string[] }> = [];
    
    // Look for theme-related keywords
    const themeKeywords = ['theme', 'category', 'pattern', 'topic', 'concept'];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (themeKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        const themeMatch = line.match(/([A-Z][^:.\n]{10,50})/);
        if (themeMatch) {
          themes.push({
            theme: themeMatch[1].trim(),
            confidence: 0.6,
            examples: []
          });
        }
      }
    });
    
    // Default themes if none found
    if (themes.length === 0) {
      themes.push({
        theme: 'General Discussion',
        confidence: 0.5,
        examples: ['Content analysis needed']
      });
    }
    
    return themes.slice(0, 5);
  }

  private extractQAPairs(_text: string, transcript: string): Array<{ question: string; answer: string; speaker?: string }> {
    const pairs: Array<{ question: string; answer: string; speaker?: string }> = [];
    
    // Look for question patterns in transcript
    const questionPattern = /([^.!?]*\?)/g;
    const questions = transcript.match(questionPattern);
    
    if (questions) {
      questions.slice(0, 3).forEach(question => {
        // Find the text that follows this question
        const questionIndex = transcript.indexOf(question);
        const afterQuestion = transcript.substring(questionIndex + question.length, questionIndex + question.length + 200);
        const firstSentence = afterQuestion.split(/[.!?]/)[0];
        
        if (firstSentence && firstSentence.trim().length > 10) {
          pairs.push({
            question: question.trim(),
            answer: firstSentence.trim()
          });
        }
      });
    }
    
    return pairs;
  }

  private extractConceptFrequency(_text: string, transcript: string): Record<string, { count: number; contexts: string[] }> {
    const concepts: Record<string, { count: number; contexts: string[] }> = {};
    
    // Common concepts to look for
    const conceptWords = [
      'technology', 'innovation', 'process', 'system', 'solution', 'challenge', 'opportunity',
      'experience', 'perspective', 'approach', 'strategy', 'method', 'tool', 'platform',
      'communication', 'collaboration', 'efficiency', 'improvement', 'change', 'development'
    ];
    
    const transcriptLower = transcript.toLowerCase();
    
    conceptWords.forEach(concept => {
      const regex = new RegExp(`\\b${concept}\\b`, 'gi');
      const matches = transcriptLower.match(regex);
      
      if (matches && matches.length > 1) {
        concepts[concept] = {
          count: matches.length,
          contexts: [`Mentioned ${matches.length} times throughout the conversation`]
        };
      }
    });
    
    return concepts;
  }

  getStageLabel(stage: string): string {
    switch (stage) {
      case 'analyzing':
        return 'Analyzing media...';
      case 'extracting':
        return 'Extracting audio...';
      case 'transcribing':
        return 'Transcribing...';
      case 'validating':
        return 'Validating transcript...';
      case 'saving':
        return 'Saving results...';
      default:
        return 'Processing...';
    }
  }
}

export const fileProcessor = new FileProcessor();