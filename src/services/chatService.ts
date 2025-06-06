import { embeddingService } from './embeddingService';
import { chunkingService } from './chunkingService';
import { vectorStoreService, SearchResult } from './vectorStoreService';
import { Transcript, TranscriptSegment } from '../types';

export interface ChatConfig {
  contextChunks: number;
  conversationMemoryLimit: number;
  autoReembed: boolean;
  precomputeEmbeddings: boolean;
  chunkingMethod: 'speaker' | 'time' | 'hybrid';
  maxChunkSize: number;
  chunkOverlap: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    chunks?: SearchResult[];
    processingTime?: number;
    model?: string;
  };
}

export interface ConversationMemory {
  activeMessages: ChatMessage[];     // Recent messages (keep as-is)
  compactedSummary: string;         // Summarized older conversation
  totalExchanges: number;           // Track conversation length
  lastCompactionAt?: string;        // When last compacted
}

export interface ChatConversation {
  id: string;
  transcriptId: string;
  messages: ChatMessage[];
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingProgress {
  stage: 'chunking' | 'embedding' | 'storing' | 'complete';
  progress: number;
  total: number;
  message: string;
}

export class ChatService {
  private static instance: ChatService;
  private config: ChatConfig;
  private isInitialized = false;

  private constructor() {
    this.config = {
      contextChunks: 4,
      conversationMemoryLimit: 20,
      autoReembed: true,
      precomputeEmbeddings: true,
      chunkingMethod: 'speaker',
      maxChunkSize: 60,
      chunkOverlap: 10
    };
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async initialize(
    vectorDbPath?: string,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<void> {
    if (this.isInitialized) return;

    try {
      onProgress?.({ stage: 'embedding', progress: 0, total: 100, message: 'Initializing embedding model...' });
      
      // Initialize embedding service
      await embeddingService.initialize();
      
      onProgress?.({ stage: 'embedding', progress: 100, total: 100, message: 'Embedding model ready' });
      onProgress?.({ stage: 'storing', progress: 0, total: 100, message: 'Initializing vector database...' });
      
      // Initialize vector store
      await vectorStoreService.initialize(vectorDbPath);

      // Update chunking service config
      chunkingService.updateConfig({
        method: this.config.chunkingMethod,
        maxChunkSize: this.config.maxChunkSize,
        chunkOverlap: this.config.chunkOverlap
      });

      onProgress?.({ stage: 'complete', progress: 100, total: 100, message: 'Chat system ready!' });
      
      this.isInitialized = true;
      console.log('Chat service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize chat service:', error);
      throw error;
    }
  }

  async processTranscriptForChat(
    transcript: Transcript,
    segments: TranscriptSegment[] = [],
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Chat service not initialized');
    }

    try {
      // Ensure embedding service is initialized before processing
      onProgress?.({ stage: 'embedding', progress: 0, total: 100, message: 'Ensuring embedding service is ready...' });
      await embeddingService.initialize();
      
      // Step 1: Chunking
      onProgress?.({ stage: 'chunking', progress: 0, total: 100, message: 'Analyzing transcript structure...' });
      
      const chunks = chunkingService.chunkTranscript(
        transcript.id,
        segments,
        transcript.full_text
      );

      onProgress?.({ stage: 'chunking', progress: 100, total: 100, message: `Created ${chunks.length} chunks` });

      if (chunks.length === 0) {
        console.warn('No chunks created for transcript:', transcript.id);
        return;
      }

      // Step 2: Generate embeddings
      onProgress?.({ stage: 'embedding', progress: 0, total: chunks.length, message: 'Generating embeddings...' });
      
      const embeddings = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Enhanced metadata including transcript context
        const enhancedMetadata = {
          chunkId: chunk.id,
          transcriptId: chunk.transcriptId,
          startTime: chunk.startTime,
          endTime: chunk.endTime,
          transcriptTitle: transcript.title,
          transcriptSummary: transcript.summary,
          keyTopics: transcript.key_topics,
          actionItems: transcript.action_items,
          speakers: chunk.metadata?.speakers,
          totalSpeakers: transcript.speaker_count
        };
        
        const embedding = await embeddingService.embedText(chunk.text, enhancedMetadata);
        
        embeddings.push(embedding);
        
        onProgress?.({ 
          stage: 'embedding', 
          progress: i + 1, 
          total: chunks.length, 
          message: `Embedded chunk ${i + 1}/${chunks.length}` 
        });
      }

      // Step 3: Store in vector database
      onProgress?.({ stage: 'storing', progress: 0, total: 100, message: 'Storing in vector database...' });
      
      await vectorStoreService.storeChunks(chunks, embeddings);
      
      onProgress?.({ stage: 'storing', progress: 100, total: 100, message: 'Storage complete' });

      // Update database to mark transcript as chat-ready
      await this.markTranscriptChatReady(transcript.id);

      console.log(`Successfully processed transcript ${transcript.id} for chat`);
    } catch (error) {
      console.error('Failed to process transcript for chat:', error);
      throw error;
    }
  }

  async chatWithTranscript(
    transcriptId: string,
    conversationId: string,
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatMessage> {
    if (!this.isInitialized) {
      throw new Error('Chat service not initialized');
    }

    const startTime = Date.now();

    try {
      // 1. Ensure embedding service is ready
      await embeddingService.initialize();
      
      // 2. Manage conversation memory (compact if needed)
      const memory = await this.manageConversationMemory(conversationId, conversationHistory);

      // 3. Generate embedding for user question
      const questionEmbedding = await embeddingService.embedText(userMessage);

      // 4. Search for relevant chunks
      const searchResults = await vectorStoreService.searchSimilar(
        questionEmbedding.embedding,
        {
          limit: this.config.contextChunks,
          transcriptId,
          minScore: 0.1 // Minimum similarity threshold
        }
      );

      // 5. Build context from relevant chunks and managed memory
      const context = this.buildContextWithMemory(searchResults, memory);

      // 6. Generate response using Ollama
      const response = await this.generateResponse(context, userMessage, transcriptId);

      // 7. Create assistant message
      const assistantMessage: ChatMessage = {
        id: `${conversationId}_${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        metadata: {
          chunks: searchResults,
          processingTime: Date.now() - startTime,
          model: 'ollama' // This could be dynamic based on settings
        }
      };

      // 8. Store messages in database
      // First store the user message
      const userChatMessage: ChatMessage = {
        id: `${conversationId}_user_${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      };
      await this.storeChatMessage(conversationId, userChatMessage);
      
      // Then store the assistant message
      await this.storeChatMessage(conversationId, assistantMessage);

      return assistantMessage;
    } catch (error) {
      console.error('Failed to chat with transcript:', error);
      throw error;
    }
  }


  /**
   * Enhanced context building with memory management
   */
  private buildContextWithMemory(
    searchResults: SearchResult[],
    memory: ConversationMemory
  ): string {
    let context = '';

    // Add relevant transcript chunks
    if (searchResults.length > 0) {
      context += 'RELEVANT TRANSCRIPT CONTENT:\n\n';
      searchResults.forEach((result) => {
        const timeStamp = this.formatTime(result.chunk.startTime);
        const speaker = result.chunk.speaker ? `[${result.chunk.speaker}]` : '';
        context += `[${timeStamp}] ${speaker} ${result.chunk.text}\n\n`;
      });
    }

    // Add compacted conversation summary if exists
    if (memory.compactedSummary) {
      context += 'CONVERSATION SUMMARY:\n\n';
      context += `${memory.compactedSummary}\n\n`;
    }

    // Add recent active messages
    if (memory.activeMessages.length > 0) {
      context += 'RECENT CONVERSATION:\n\n';
      memory.activeMessages.forEach(msg => {
        context += `${msg.role.toUpperCase()}: ${msg.content}\n\n`;
      });
    }

    return context;
  }

  /**
   * Manage conversation memory with compaction
   */
  private async manageConversationMemory(
    conversationId: string,
    messages: ChatMessage[]
  ): Promise<ConversationMemory> {
    
    if (messages.length <= this.config.conversationMemoryLimit) {
      return {
        activeMessages: messages,
        compactedSummary: '',
        totalExchanges: messages.length
      };
    }

    // Check if we already have compacted memory for this conversation
    const existingMemory = await this.getConversationMemory(conversationId);
    
    // Determine how many messages to keep active
    const keepCount = Math.floor(this.config.conversationMemoryLimit * 0.4); // Keep last 40%
    const activeMessages = messages.slice(-keepCount);
    
    // Get messages that need to be compacted
    const messagesToCompact = messages.slice(0, -keepCount);
    
    // If we have existing summary, include it with new messages to compact
    let allMessagesToCompact = messagesToCompact;
    if (existingMemory && existingMemory.compactedSummary) {
      // Create a synthetic message representing the previous summary
      const summaryMessage: ChatMessage = {
        id: 'summary',
        role: 'assistant',
        content: `Previous conversation summary: ${existingMemory.compactedSummary}`,
        timestamp: existingMemory.lastCompactionAt || new Date().toISOString()
      };
      allMessagesToCompact = [summaryMessage, ...messagesToCompact];
    }
    
    // Generate new compacted summary
    const compactedSummary = await this.compactMessages(allMessagesToCompact);
    
    const memory: ConversationMemory = {
      activeMessages,
      compactedSummary,
      totalExchanges: messages.length,
      lastCompactionAt: new Date().toISOString()
    };
    
    // Store the updated memory
    await this.storeConversationMemory(conversationId, memory);
    
    return memory;
  }

  /**
   * Compact older messages into a summary
   */
  private async compactMessages(messages: ChatMessage[]): Promise<string> {
    if (messages.length === 0) {
      return '';
    }

    try {
      const conversationText = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
        
      const compactionPrompt = `
You are helping manage a conversation between a user and an AI assistant about a transcript. 
Please create a concise summary of the conversation below, preserving:
- Key topics discussed
- Important questions asked
- Main conclusions reached
- Any specific transcript references or timestamps mentioned

Keep the summary to 2-3 bullet points maximum. Focus on what would be useful context for continuing the conversation.

Conversation to summarize:
${conversationText}

Summary:`;
      
      const response = await (window.electronAPI.services as any).chatWithOllama({
        prompt: compactionPrompt,
        message: '',
        context: ''
      });
      
      if (response.success) {
        return response.response.trim();
      } else {
        console.error('Failed to compact conversation:', response.error);
        // Fallback: create a simple summary
        return this.createFallbackSummary(messages);
      }
    } catch (error) {
      console.error('Error compacting messages:', error);
      return this.createFallbackSummary(messages);
    }
  }

  /**
   * Create a simple fallback summary when AI compaction fails
   */
  private createFallbackSummary(messages: ChatMessage[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    const topics = userMessages.map(m => m.content).slice(0, 3);
    
    return `Previous conversation covered: ${topics.join(', ')}. (${messages.length} total exchanges)`;
  }

  /**
   * Get existing conversation memory from database
   */
  private async getConversationMemory(conversationId: string): Promise<ConversationMemory | null> {
    try {
      const result = await window.electronAPI.database.get(
        'SELECT * FROM conversation_memory WHERE conversation_id = ?',
        [conversationId]
      );
      
      if (result) {
        return {
          activeMessages: [], // Will be populated separately
          compactedSummary: result.compacted_summary || '',
          totalExchanges: result.total_exchanges || 0,
          lastCompactionAt: result.last_compaction_at
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get conversation memory:', error);
      return null;
    }
  }

  /**
   * Store conversation memory in database
   */
  private async storeConversationMemory(conversationId: string, memory: ConversationMemory): Promise<void> {
    try {
      await window.electronAPI.database.run(
        `INSERT OR REPLACE INTO conversation_memory 
         (conversation_id, compacted_summary, total_exchanges, last_compaction_at) 
         VALUES (?, ?, ?, ?)`,
        [
          conversationId,
          memory.compactedSummary,
          memory.totalExchanges,
          memory.lastCompactionAt || new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error('Failed to store conversation memory:', error);
    }
  }

  private async generateResponse(context: string, userMessage: string, transcriptId: string): Promise<string> {
    try {
      // Get transcript metadata for better context
      const transcript = await this.getTranscriptMetadata(transcriptId);
      
      const systemPrompt = `You are an AI assistant helping analyze a transcript titled "${transcript?.title || 'Audio Transcript'}". 
      
Your role is to answer questions about the transcript content accurately and helpfully. 

Guidelines:
- Base your answers primarily on the provided transcript content
- If information isn't in the transcript, clearly state that
- Include timestamps when referencing specific parts of the transcript
- Be conversational but accurate
- If the user asks about speakers, use the speaker names/labels from the transcript

Context provided:
${context}

Current question: ${userMessage}`;

      // Call Ollama API through electron API
      const response = await (window.electronAPI.services as any).chatWithOllama({
        prompt: systemPrompt,
        message: userMessage,
        context: context
      });

      if (response.success) {
        return response.response;
      } else {
        throw new Error(response.error || 'Failed to generate response');
      }
    } catch (error) {
      console.error('Failed to generate response:', error);
      return "I'm sorry, I encountered an error while processing your question. Please try again.";
    }
  }

  private async getTranscriptMetadata(transcriptId: string): Promise<any> {
    try {
      return await window.electronAPI.database.get(
        'SELECT title, duration, speaker_count FROM transcripts WHERE id = ?',
        [transcriptId]
      );
    } catch (error) {
      console.error('Failed to get transcript metadata:', error);
      return null;
    }
  }

  private async markTranscriptChatReady(transcriptId: string): Promise<void> {
    try {
      await window.electronAPI.database.run(
        "UPDATE transcripts SET metadata = JSON_SET(COALESCE(metadata, '{}'), '$.chatReady', 1) WHERE id = ?",
        [transcriptId]
      );
    } catch (error) {
      console.error('Failed to mark transcript as chat ready:', error);
    }
  }

  private async storeChatMessage(conversationId: string, message: ChatMessage): Promise<void> {
    try {
      await window.electronAPI.database.run(
        'INSERT INTO chat_messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)',
        [conversationId, message.role, message.content, message.timestamp]
      );
    } catch (error) {
      console.error('Failed to store chat message:', error);
    }
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  async reprocessTranscript(transcriptId: string, onProgress?: (progress: ProcessingProgress) => void): Promise<void> {
    // Delete existing chunks
    await vectorStoreService.deleteTranscriptChunks(transcriptId);
    
    // Get transcript data
    const transcript = await window.electronAPI.database.get(
      'SELECT * FROM transcripts WHERE id = ?',
      [transcriptId]
    );
    
    const segments = await window.electronAPI.database.all(
      'SELECT * FROM transcript_segments WHERE transcript_id = ? ORDER BY start_time',
      [transcriptId]
    );

    // Reprocess
    await this.processTranscriptForChat(transcript, segments, onProgress);
  }

  updateConfig(config: Partial<ChatConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update chunking service if relevant config changed
    if (config.chunkingMethod || config.maxChunkSize || config.chunkOverlap) {
      chunkingService.updateConfig({
        method: this.config.chunkingMethod,
        maxChunkSize: this.config.maxChunkSize,
        chunkOverlap: this.config.chunkOverlap
      });
    }
  }

  /**
   * Load conversation history from database
   */
  async loadConversationHistory(conversationId: string): Promise<ChatMessage[]> {
    try {
      const messages = await window.electronAPI.database.all(
        'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [conversationId]
      );
      
      return messages.map((row: any) => ({
        id: row.id.toString(),
        role: row.role,
        content: row.content,
        timestamp: row.created_at,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined
      }));
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      return [];
    }
  }

  /**
   * Create or get conversation for transcript
   */
  async getOrCreateConversation(transcriptId: string): Promise<string> {
    try {
      // Try to find existing conversation
      const existing = await window.electronAPI.database.get(
        'SELECT id FROM chat_conversations WHERE transcript_id = ? ORDER BY created_at DESC LIMIT 1',
        [transcriptId]
      );
      
      if (existing) {
        return existing.id;
      }
      
      // Create new conversation
      const conversationId = `conv_${transcriptId}_${Date.now()}`;
      await window.electronAPI.database.run(
        'INSERT INTO chat_conversations (id, transcript_id) VALUES (?, ?)',
        [conversationId, transcriptId]
      );
      
      return conversationId;
    } catch (error) {
      console.error('Failed to get or create conversation:', error);
      // Fallback to timestamp-based ID
      return `conv_${transcriptId}_${Date.now()}`;
    }
  }

  /**
   * Reset conversation memory (for testing or cleanup)
   */
  async resetConversationMemory(conversationId: string): Promise<void> {
    try {
      await window.electronAPI.database.run(
        'DELETE FROM conversation_memory WHERE conversation_id = ?',
        [conversationId]
      );
    } catch (error) {
      console.error('Failed to reset conversation memory:', error);
    }
  }

  getConfig(): ChatConfig {
    return { ...this.config };
  }

  isReady(): boolean {
    return this.isInitialized && 
           embeddingService.isInitialized() && 
           vectorStoreService.isInitialized();
  }

  async getStats(): Promise<{
    isReady: boolean;
    vectorStats: any;
    embeddingModel: string;
    config: ChatConfig;
  }> {
    return {
      isReady: this.isReady(),
      vectorStats: await vectorStoreService.getStats(),
      embeddingModel: embeddingService.getConfig().model,
      config: this.getConfig()
    };
  }
}

// Export singleton instance
export const chatService = ChatService.getInstance();