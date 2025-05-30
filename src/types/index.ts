export interface Transcript {
  id: string;
  title: string;
  filename: string;
  file_path?: string;
  duration: number;
  file_size: number;
  created_at: string;
  updated_at: string;
  status: 'processing' | 'completed' | 'error';
  
  // Content
  full_text?: string;
  summary?: string;
  action_items?: string[];
  key_topics?: string[];
  
  // Metadata
  tags?: string[];
  starred: boolean;
  rating?: number;
  error_message?: string;
}

export interface TranscriptSegment {
  id?: number;
  transcript_id: string;
  start_time: number;
  end_time: number;
  text: string;
  speaker?: string;
}

export interface ProcessingItem {
  id: string;
  transcript_id: string;
  file_path: string;
  status: 'queued' | 'transcribing' | 'analyzing' | 'completed' | 'error';
  progress: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ServiceStatus {
  speechToText: 'connected' | 'disconnected' | 'error';
  aiAnalysis: 'connected' | 'disconnected' | 'error';
  lastChecked: Date;
}

export interface ChatConversation {
  id: string;
  transcript_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id?: number;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Settings {
  speechToTextUrl: string;
  aiAnalysisUrl: string;
  aiModel: string;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupRetention: number;
  cleanupTempFiles: boolean;
  theme: 'light' | 'dark' | 'system';
  
  // Additional settings
  autoTestOnStartup?: boolean;
  showNotifications?: boolean;
  compactMode?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  accentColor?: 'blue' | 'green' | 'purple' | 'orange';
}

// Electron API types
declare global {
  interface Window {
    electronAPI: {
      database: {
        query: (type: string, sql: string, params?: any[]) => Promise<any>;
        all: (sql: string, params?: any[]) => Promise<any[]>;
        get: (sql: string, params?: any[]) => Promise<any>;
        run: (sql: string, params?: any[]) => Promise<any>;
      };
      dialog: {
        openFile: () => Promise<string[]>;
        saveFile: (options: { defaultPath?: string; filters?: any[] }) => Promise<string | null>;
      };
      fs: {
        readFile: (filePath: string) => Promise<Buffer>;
        writeFile: (filePath: string, data: any) => Promise<void>;
        getAppPath: (type: string) => Promise<string>;
      };
      services: {
        testConnection: (url: string, service: string) => Promise<{
          success: boolean;
          status?: number;
          error?: string;
        }>;
      };
      onNavigate: (callback: (page: string) => void) => void;
      onMenuAction: (callback: (action: string) => void) => void;
      removeAllListeners: (channel: string) => void;
      audio: {
        extractAudio: (inputPath: string, outputPath: string) => Promise<{
          success: boolean;
          error?: string;
        }>;
        getMediaInfo: (filePath: string) => Promise<{
          success: boolean;
          duration?: number;
          hasVideo?: boolean;
          hasAudio?: boolean;
          error?: string;
        }>;
      };
    };
  }
}