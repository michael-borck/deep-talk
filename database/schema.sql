-- AudioScribe Database Schema

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Analysis results (cached)
    themes TEXT, -- JSON array of themes
    key_insights TEXT, -- JSON array
    summary TEXT,
    last_analysis_at DATETIME,
    
    -- Metadata
    tags TEXT, -- JSON array
    color TEXT, -- UI color for the project
    icon TEXT -- emoji or icon identifier
);

-- Project-Transcript relationship
CREATE TABLE IF NOT EXISTS project_transcripts (
    project_id TEXT NOT NULL,
    transcript_id TEXT NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, transcript_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE
);

-- Project chat conversations
CREATE TABLE IF NOT EXISTS project_chat_conversations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project chat messages
CREATE TABLE IF NOT EXISTS project_chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT CHECK(role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES project_chat_conversations(id) ON DELETE CASCADE
);

-- Cross-transcript analysis results
CREATE TABLE IF NOT EXISTS project_analysis (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    analysis_type TEXT NOT NULL, -- 'theme_evolution', 'speaker_comparison', 'pattern_analysis', etc.
    results TEXT NOT NULL, -- JSON data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

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
    full_text TEXT, -- Original transcript
    validated_text TEXT, -- Corrected/validated transcript
    processed_text TEXT, -- Speaker-tagged and formatted transcript
    validation_changes TEXT, -- JSON array of changes made
    summary TEXT,
    action_items TEXT, -- JSON array
    key_topics TEXT, -- JSON array
    
    -- Advanced analysis fields
    sentiment_overall TEXT, -- 'positive', 'negative', 'neutral'
    sentiment_score REAL, -- -1.0 to 1.0
    emotions TEXT, -- JSON object with emotion scores
    speaker_count INTEGER DEFAULT 1,
    speakers TEXT, -- JSON array of speaker info
    
    -- Research analysis fields
    notable_quotes TEXT, -- JSON array of quotable statements
    research_themes TEXT, -- JSON array of research themes/categories
    qa_pairs TEXT, -- JSON array of question-answer mappings
    concept_frequency TEXT, -- JSON object with concept counts
    
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
    sentiment TEXT, -- 'positive', 'negative', 'neutral' for this segment
    emotions TEXT, -- JSON object with emotion scores for this segment
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

-- Project indexes
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_project_transcripts_project_id ON project_transcripts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_transcripts_transcript_id ON project_transcripts(transcript_id);
CREATE INDEX IF NOT EXISTS idx_project_chat_conversations_project_id ON project_chat_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_chat_messages_conversation_id ON project_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_project_analysis_project_id ON project_analysis(project_id);

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

CREATE TRIGGER IF NOT EXISTS update_project_timestamp 
AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_project_chat_conversation_timestamp 
AFTER UPDATE ON project_chat_conversations
BEGIN
    UPDATE project_chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Default settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('speechToTextUrl', 'https://speaches.serveur.au'),
    ('speechToTextModel', 'Systran/faster-distil-whisper-small.en'),
    ('aiAnalysisUrl', 'http://localhost:11434'),
    ('aiModel', 'llama2'),
    ('autoBackup', 'true'),
    ('backupFrequency', 'weekly'),
    ('backupRetention', '5'),
    ('cleanupTempFiles', 'true'),
    ('theme', 'system'),
    ('enableTranscriptValidation', 'true'),
    ('validationOptions', '{"spelling": true, "grammar": true, "punctuation": true, "capitalization": true}'),
    ('analyzeValidatedTranscript', 'true'),
    ('audioChunkSize', '300'),
    ('enableSpeakerTagging', 'true'),
    ('oneTaskAtATime', 'true');

-- Migration: Add missing columns to existing tables (safe to run multiple times)
-- Check if columns exist before adding them (SQLite doesn't support IF NOT EXISTS for ALTER TABLE)

-- First, create a temporary table to check if migration is needed
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mark this migration
INSERT OR IGNORE INTO schema_migrations (version) VALUES (1);