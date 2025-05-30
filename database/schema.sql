-- LocalListen Database Schema

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT,
    duration INTEGER, -- in seconds
    file_size INTEGER, -- in bytes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('processing', 'completed', 'error')) DEFAULT 'processing',
    
    -- Content fields
    full_text TEXT,
    summary TEXT,
    action_items TEXT, -- JSON array
    key_topics TEXT, -- JSON array
    
    -- Metadata
    tags TEXT, -- JSON array
    starred BOOLEAN DEFAULT 0,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    
    -- Processing metadata
    error_message TEXT,
    processing_started_at DATETIME,
    processing_completed_at DATETIME
);

-- Transcript segments for timestamps
CREATE TABLE IF NOT EXISTS transcript_segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transcript_id TEXT NOT NULL,
    start_time REAL NOT NULL, -- in seconds
    end_time REAL NOT NULL,
    text TEXT NOT NULL,
    speaker TEXT,
    FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE
);

-- Chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
    id TEXT PRIMARY KEY,
    transcript_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT CHECK(role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Processing queue
CREATE TABLE IF NOT EXISTS processing_queue (
    id TEXT PRIMARY KEY,
    transcript_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT CHECK(status IN ('queued', 'transcribing', 'analyzing', 'completed', 'error')) DEFAULT 'queued',
    progress REAL DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transcripts_status ON transcripts(status);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at);
CREATE INDEX IF NOT EXISTS idx_transcripts_starred ON transcripts(starred);
CREATE INDEX IF NOT EXISTS idx_transcript_segments_transcript_id ON transcript_segments(transcript_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_transcript_id ON chat_conversations(transcript_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_processing_queue_status ON processing_queue(status);

-- Triggers to update timestamps
CREATE TRIGGER IF NOT EXISTS update_transcript_timestamp 
AFTER UPDATE ON transcripts
BEGIN
    UPDATE transcripts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_chat_conversation_timestamp 
AFTER UPDATE ON chat_conversations
BEGIN
    UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_settings_timestamp 
AFTER UPDATE ON settings
BEGIN
    UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
END;

-- Default settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('speechToTextUrl', 'http://localhost:8000'),
    ('aiAnalysisUrl', 'http://localhost:11434'),
    ('aiModel', 'llama2'),
    ('autoBackup', 'true'),
    ('backupFrequency', 'weekly'),
    ('backupRetention', '5'),
    ('cleanupTempFiles', 'true'),
    ('theme', 'system');