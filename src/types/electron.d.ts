// Type definitions for Electron API

export interface ElectronAPI {
  // Database operations
  database: {
    query: (type: string, sql: string, params?: any[]) => Promise<any>;
    all: (sql: string, params?: any[]) => Promise<any[]>;
    get: (sql: string, params?: any[]) => Promise<any>;
    run: (sql: string, params?: any[]) => Promise<any>;
  };

  // Dialog operations
  dialog: {
    openFile: () => Promise<string[]>;
    saveFile: (options?: any) => Promise<string>;
  };

  // File system operations
  fs: {
    readFile: (filePath: string) => Promise<Buffer>;
    writeFile: (filePath: string, data: any) => Promise<{ success: boolean; error?: string }>;
    getAppPath: (type: string) => Promise<string>;
    getFileStats: (filePath: string) => Promise<{ size: number; mtime: Date; error?: string }>;
    joinPath: (...pathSegments: string[]) => Promise<string>;
  };

  // Service operations
  services: {
    testConnection: (url: string, service: string) => Promise<{ success: boolean; status?: number; error?: string }>;
    getOllamaModels: (url: string) => Promise<{ success: boolean; models?: any[]; error?: string }>;
    chatWithOllama: (data: { prompt: string; message: string; context: string }) => Promise<{ success: boolean; response?: string; error?: string }>;
  };

  // Vector store operations (delegated to main process)
  vectorStore: {
    initialize: (dbPath?: string) => Promise<void>;
    storeChunks: (chunks: any[], embeddings: any[]) => Promise<void>;
    searchSimilar: (queryEmbedding: number[], options: any) => Promise<any[]>;
    deleteTranscriptChunks: (transcriptId: string) => Promise<void>;
    getTranscriptChunks: (transcriptId: string) => Promise<any[]>;
    updateChunks: (chunks: any[], embeddings: any[]) => Promise<void>;
    getStats: () => Promise<{ totalChunks: number; transcripts: string[]; avgChunkSize: number; speakers: string[] }>;
    close: () => Promise<void>;
  };

  // Embedding operations (delegated to main process)
  embedding: {
    initialize: (onProgress?: (progress: { loaded: number; total: number; status: string }) => void) => Promise<void>;
    embedText: (text: string, metadata?: any) => Promise<{ embedding: number[]; text: string; metadata?: any }>;
    embedBatch: (texts: string[], metadata?: any[]) => Promise<{ embedding: number[]; text: string; metadata?: any }[]>;
    updateConfig: (config: any) => Promise<void>;
  };

  // Audio extraction
  audio: {
    extractAudio: (inputPath: string, outputPath: string) => Promise<any>;
    getMediaInfo: (filePath: string) => Promise<any>;
    transcribeAudio: (audioPath: string, sttUrl: string, sttModel: string) => Promise<any>;
  };

  // Navigation events
  onNavigate: (callback: (page: string) => void) => void;

  // Menu actions
  onMenuAction: (callback: (action: string) => void) => void;

  // Remove all listeners
  removeAllListeners: (channel: string) => void;

  // Database management
  getDatabaseInfo: () => Promise<any>;
  changeDatabaseLocation: (newPath: string) => Promise<any>;
  backupDatabase: (backupPath: string) => Promise<any>;

  // Shell operations
  shell: {
    showItemInFolder: (fullPath: string) => void;
  };

  // System information
  platform: string;
  versions: {
    electron: string;
    node: string;
    chrome: string;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};