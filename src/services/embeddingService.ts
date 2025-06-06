// Embedding Service - Main Process Interface
// This service runs in the main process due to native dependencies

export interface EmbeddingConfig {
  model: string;
  maxLength: number;
  normalize: boolean;
}

export interface EmbeddingResult {
  embedding: number[];
  text: string;
  metadata?: Record<string, any>;
}

export class EmbeddingService {
  private static instance: EmbeddingService;

  private constructor() {}

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  async initialize(_onProgress?: (progress: { loaded: number; total: number; status: string }) => void): Promise<void> {
    // Don't pass the callback through IPC as functions can't be serialized
    return (window.electronAPI as any).embedding.initialize();
  }

  async embedText(text: string, metadata?: Record<string, any>): Promise<EmbeddingResult> {
    return (window.electronAPI as any).embedding.embedText(text, metadata);
  }

  async embedBatch(texts: string[], metadata?: Record<string, any>[]): Promise<EmbeddingResult[]> {
    return (window.electronAPI as any).embedding.embedBatch(texts, metadata);
  }

  getDimensions(): number {
    // all-MiniLM-L6-v2 produces 384-dimensional embeddings
    return 384;
  }

  isInitialized(): boolean {
    // Delegate to main process
    return true;
  }

  updateConfig(config: Partial<EmbeddingConfig>): void {
    (window.electronAPI as any).embedding.updateConfig(config);
  }

  getConfig(): EmbeddingConfig {
    return {
      model: 'Xenova/all-MiniLM-L6-v2',
      maxLength: 512,
      normalize: true
    };
  }
}

// Export singleton instance
export const embeddingService = EmbeddingService.getInstance();