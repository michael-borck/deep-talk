# DeepTalk Electron App Specification

## 🎯 **Application Overview**

DeepTalk is a professional desktop application for AI-powered conversation
analysis, insight discovery, and interaction. Built with React + Electron, it
provides a native desktop experience with local data storage and external AI
service integration. This comprehensive specification gives you everything
needed to build a professional desktop application that **feels like a real
app**, not a web page wrapped in Electron.

## 🎯 **Key Design Principles:**

### **Native Desktop Feel:**
- **Tab-based navigation** instead of web-style pages
- **Native file dialogs** and system integration
- **Professional layout** with clear information hierarchy
- **Keyboard shortcuts** for power users
- **Status indicators** for connection health

### **Sane Defaults with Configuration:**
- **Works out of box** with localhost URLs
- **Smart assumptions** (auto-backup, cleanup temp files)
- **Progressive disclosure** (advanced settings hidden but accessible)
- **Test connections** with clear success/failure feedback

### **Academic-Focused Workflow:**
- **Upload-centric home page** - primary action is obvious
- **Library management** - organize and find transcripts easily
- **AI chat integration** - interact with content naturally
- **Export flexibility** - multiple formats for different uses

## 🏗️ **Technical Highlights:**

### **React + Electron Architecture:**
```
├── Native desktop chrome and menus
├── Professional window management
├── File system integration  
├── Local SQLite storage
├── External service integration
└── Cross-platform packaging
```

### **User Experience Focus:**
- **Visual feedback** for all operations
- **Graceful error handling** with helpful messages
- **Offline capability** (view existing transcripts)
- **Performance optimization** (< 3 second startup)

## 💡 **This Specification Ensures:**

✅ **Professional appearance** - looks like desktop software, not a web page  
✅ **Academic workflow** - designed for research and teaching use cases  
✅ **Easy deployment** - single executable with sane defaults  
✅ **Scalable complexity** - simple for basic use, powerful for advanced users  
✅ **Data sovereignty** - complete local control with external processing  

The specification balances **immediate usability** (drag-drop-done) with
**professional features** (search, organization, AI chat) while maintaining the
**privacy-first architecture** that makes it perfect for academic use! 🎓✨


## 🏗️ **Application Architecture**

### **Technical Stack:**
```
├── Frontend: React 18+ with TypeScript
├── Desktop: Electron 27+
├── Database: SQLite (local storage)
├── Styling: Tailwind CSS + Custom components
├── State: React Context + useReducer
├── External Services: Speaches (STT/TTS) + Ollama (LLM)
└── Build: Electron Builder for cross-platform distribution
```

### **File Structure:**
```
locallisten/
├── src/
│   ├── components/          # React UI components
│   ├── pages/              # Main application pages
│   ├── services/           # API and data services
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React context providers
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript type definitions
├── public/
│   ├── electron.js         # Electron main process
│   ├── preload.js          # Security bridge
│   └── assets/             # Icons and images
├── database/
│   └── schema.sql          # SQLite database schema
└── dist/                   # Built application files
```

## 🎨 **User Interface Specification**

### **Application Shell:**
```
┌─────────────────────────────────────────────────────┐
│ [🎤] DeepTalk                                 [_][□][×] │
├─────────────────────────────────────────────────────┤
│ 🏠 Home    📋 Library    ⚙️ Settings    ℹ️ About      │
├─────────────────────────────────────────────────────┤
│                                                     │
│                 [Page Content]                      │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### **Navigation Structure:**
- **Primary Navigation:** Tab-based top navigation
- **Secondary Navigation:** Contextual breadcrumbs where needed
- **Quick Actions:** Floating action buttons for common tasks
- **Status Bar:** Connection status and processing indicators

## 📱 **Page Specifications**

### **🏠 Home Page (Main Dashboard)**

#### **Purpose:** 
Primary workspace for uploading and processing audio/video files with immediate access to recent transcripts.

#### **Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Welcome back! 👋                    [Connection: ●] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │           📁 Quick Upload                       ││
│  │  ┌─────────────────────────────────────────────┐││
│  │  │     Drag & drop files here                  │││
│  │  │         or click to browse                  │││
│  │  │                                             │││
│  │  │     [Browse Files]  [Record Audio]         │││
│  │  └─────────────────────────────────────────────┘││
│  │  Supports: MP3, WAV, MP4, AVI, MOV, M4A        ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │           📊 Processing Queue                   ││
│  │  [File1.mp3] ████████░░ 80% Transcribing...    ││
│  │  [File2.wav] ██████████ 100% Complete ✓        ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │           📋 Recent Transcripts                 ││
│  │  [Today]                                        ││
│  │  • Interview with Dr. Smith     [Chat] [Export] ││
│  │  • Lecture Recording Ch 3       [Chat] [Export] ││
│  │                                                 ││
│  │  [This Week]                                    ││
│  │  • Team Meeting 10/15           [Chat] [Export] ││
│  │  • Research Interview #5        [Chat] [Export] ││
│  │                                                 ││
│  │  [View All Transcripts →]                      ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

#### **Features:**
- **Drag & Drop Upload:** Primary interaction method
- **File Browser:** Native file picker integration
- **Audio Recording:** Built-in recorder for quick voice memos
- **Processing Queue:** Real-time progress indicators
- **Recent Activity:** Quick access to latest transcripts
- **Connection Status:** Visual indicators for service health

#### **Quick Actions:**
- Upload new file (Ctrl+O)
- Start recording (Ctrl+R)  
- Search transcripts (Ctrl+F)
- Open settings (Ctrl+,)

### **📋 Library Page (Transcript Management)**

#### **Purpose:**
Comprehensive view and management of all transcripts with advanced search, filtering, and organization capabilities.

#### **Layout:**
```
┌─────────────────────────────────────────────────────┐
│ 🔍 [Search transcripts...]              [🔧 Filter] │
├─────────────────────────────────────────────────────┤
│ [All] [Today] [This Week] [This Month] [Favorites]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📝 Interview Dr. Smith - Qualitative Research  │ │
│ │ 📅 Oct 15, 2024  ⏱️ 45:30  📁 2.1MB  ⭐ Starred │ │
│ │ Summary: Discussion about methodology...        │ │
│ │ Topics: Research, Methodology, Ethics           │ │
│ │ [👁️ View] [💬 Chat] [📤 Export] [🗑️ Delete]    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🎓 Lecture Recording - Chapter 3 Introduction  │ │
│ │ 📅 Oct 14, 2024  ⏱️ 62:15  📁 3.7MB            │ │
│ │ Summary: Covering fundamentals of cognitive...  │ │
│ │ Topics: Psychology, Cognition, Learning         │ │
│ │ [👁️ View] [💬 Chat] [📤 Export] [🗑️ Delete]    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Load More...] or [1 2 3 ... 12 Next →]           │
└─────────────────────────────────────────────────────┘
```

#### **Features:**
- **Advanced Search:** Full-text search across transcripts, summaries, topics
- **Smart Filters:** Date ranges, duration, file type, tags
- **Sorting Options:** Date, duration, title, rating
- **Bulk Actions:** Select multiple transcripts for batch operations
- **Star/Favorite System:** Quick access to important transcripts
- **Export Options:** Individual or batch export in multiple formats

#### **Metadata Display:**
- Title (editable)
- Date/time created
- Duration
- File size
- Processing status
- Star rating
- Custom tags
- Quick summary preview

### **👁️ Transcript Detail View (Modal/Overlay)**

#### **Purpose:**
Comprehensive view of individual transcript with all analysis results and interactive features.

#### **Layout:**
```
┌─────────────────────────────────────────────────────┐
│ ← Back to Library    Interview Dr. Smith        [×] │
├─────────────────────────────────────────────────────┤
│ 📝 [Edit Title]  ⭐ Star  🏷️ Tags  📤 Export  🗑️ Delete │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─ 📊 Summary ─────────────────────────────────────┐ │
│ │ This interview focused on qualitative research   │ │
│ │ methodologies, particularly phenomenological...  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ ✅ Action Items ────────────────────────────────┐ │
│ │ • Review literature on phenomenology             │ │
│ │ • Schedule follow-up interview                   │ │
│ │ • Draft methodology section                      │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ 🏷️ Key Topics ──────────────────────────────────┐ │
│ │ [Research Methods] [Phenomenology] [Ethics]      │ │
│ │ [Qualitative Analysis] [Interview Techniques]    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ 📝 Full Transcript ─────────────────────────────┐ │
│ │ [00:00] Dr. Smith: Thank you for agreeing to...  │ │
│ │ [00:15] Interviewer: I'm excited to discuss...   │ │
│ │ [00:32] Dr. Smith: Phenomenological research...  │ │
│ │ [Show All] [Search in Transcript]                │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ 💬 AI Chat ──────────────────────────────────────┐ │
│ │ [Previous conversations...]                       │ │
│ │ You: What were the main methodological points?   │ │
│ │ AI: The main methodological points discussed...  │ │
│ │                                                  │ │
│ │ [Type your question...] [Send]                   │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### **Features:**
- **Inline Editing:** Click to edit title, add tags
- **Expandable Sections:** Collapsible content areas
- **Search in Transcript:** Find specific content
- **Timestamp Navigation:** Click timestamps to play audio (if available)
- **AI Chat History:** Persistent conversation with transcript
- **Export Options:** PDF, Word, JSON, SRT subtitles

### **⚙️ Settings Page**

#### **Purpose:**
Configuration management with sane defaults and clear explanations for all options.

#### **Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Settings                                            │
├─────────────────────────────────────────────────────┤
│ [🔌 Services] [📁 Storage] [🎨 Appearance] [🔒 Privacy] [ℹ️ About] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🔌 EXTERNAL SERVICES                                │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Speech-to-Text Service (Speaches)               │ │
│ │ URL: [http://localhost:8000        ] [Test]     │ │
│ │ Status: ● Connected                             │ │
│ │                                                 │ │
│ │ AI Analysis Service (Ollama)                    │ │
│ │ URL: [http://localhost:11434       ] [Test]     │ │
│ │ Model: [llama2                ▼] [Refresh]      │ │
│ │ Status: ● Connected                             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 📁 STORAGE & DATA                                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Database Location:                              │ │
│ │ /Users/john/Documents/DeepTalk/                 │ │
│ │ [Change Location] [Open Folder] [Backup Now]   │ │
│ │                                                 │ │
│ │ Auto-backup: [✓] Every 7 days                  │ │
│ │ Keep backups: [5] copies                       │ │
│ │                                                 │ │
│ │ Data Retention:                                 │ │
│ │ Auto-delete transcripts: [Never        ▼]      │ │
│ │ Cleanup temp files: [✓] After processing       │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Reset to Defaults] [Import Settings] [Export Settings] │
└─────────────────────────────────────────────────────┘
```

#### **Settings Categories:**

##### **🔌 Services Tab:**
```javascript
const servicesSettings = {
  speechToText: {
    url: "http://localhost:8000",
    timeout: 300, // seconds
    autoRetry: true,
    retryAttempts: 3
  },
  
  aiAnalysis: {
    url: "http://localhost:11434", 
    model: "llama2",
    temperature: 0.7,
    maxTokens: 2048,
    timeout: 120
  },
  
  connectionTest: {
    autoTestOnStartup: true,
    showNotifications: true
  }
};
```

##### **📁 Storage Tab:**
```javascript
const storageSettings = {
  database: {
    location: "~/Documents/DeepTalk/",
    autoBackup: true,
    backupFrequency: "weekly", // daily, weekly, monthly
    backupRetention: 5 // number of backups to keep
  },
  
  tempFiles: {
    cleanupAfterProcessing: true,
    tempLocation: "system", // system temp or custom
    maxTempSize: "1GB"
  },
  
  dataRetention: {
    autoDeleteTranscripts: "never", // never, 1year, 2years, custom
    warnBeforeDelete: true
  }
};
```

##### **🎨 Appearance Tab:**
```javascript
const appearanceSettings = {
  theme: "system", // light, dark, system
  compactMode: false,
  fontSize: "medium", // small, medium, large
  accentColor: "blue", // blue, green, purple, orange
  
  notifications: {
    showProcessingComplete: true,
    showErrors: true,
    soundEnabled: false
  }
};
```

##### **🔒 Privacy Tab:**
```javascript
const privacySettings = {
  analytics: {
    sendUsageData: false,
    sendErrorReports: false,
    sendPerformanceData: false
  },
  
  security: {
    requireConfirmationForDelete: true,
    warnOnLargeUploads: true,
    encryptLocalData: false // future feature
  }
};
```

### **ℹ️ About Page**

#### **Layout:**
```
┌─────────────────────────────────────────────────────┐
│                    🎤 LocalListen                   │
│                   Version 1.0.0                    │
│            AI-Powered Transcription & Analysis      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │              System Information                 │ │
│ │                                                 │ │
│ │ Platform: macOS 14.1                           │ │
│ │ Database: SQLite 3.42.0                        │ │
│ │ Data Location: ~/Documents/LocalListen/         │ │
│ │ Total Transcripts: 47                           │ │
│ │ Database Size: 156 MB                           │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │                Support & Help                   │ │
│ │                                                 │ │
│ │ [📚 User Guide]    [🐛 Report Bug]             │ │
│ │ [💡 Feature Request]    [📧 Contact Support]   │ │
│ │ [🔄 Check for Updates]                         │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │                   Legal                         │ │
│ │                                                 │ │
│ │ Privacy Policy • Terms of Service • Licenses   │ │
│ │                                                 │ │
│ │ © 2024 Your Institution                        │ │
│ │ Built with ❤️ for Academic Research            │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 🛠️ **Component Architecture**

### **Core Components:**
```typescript
// Main layout components
interface AppShellProps {
  children: React.ReactNode;
  currentPage: string;
}

interface NavigationProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

interface StatusBarProps {
  serviceStatus: ServiceStatus;
  processingQueue: ProcessingItem[];
}

// Feature components
interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes: string[];
  maxSize: number;
}

interface TranscriptCardProps {
  transcript: Transcript;
  onView: (id: string) => void;
  onChat: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
}

interface ProcessingQueueProps {
  items: ProcessingItem[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
}
```

### **Data Models:**
```typescript
interface Transcript {
  id: string;
  title: string;
  filename: string;
  duration: number;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'processing' | 'completed' | 'error';
  
  // Content
  fullText: string;
  segments: TranscriptSegment[];
  summary: string;
  actionItems: string[];
  keyTopics: string[];
  
  // Metadata
  tags: string[];
  starred: boolean;
  rating?: number;
}

interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

interface ProcessingItem {
  id: string;
  filename: string;
  status: 'queued' | 'transcribing' | 'analyzing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface ServiceStatus {
  speechToText: 'connected' | 'disconnected' | 'error';
  aiAnalysis: 'connected' | 'disconnected' | 'error';
  lastChecked: Date;
}
```

## 🔧 **Technical Requirements**

### **Performance:**
- App startup: < 3 seconds
- File upload response: < 1 second
- Search results: < 500ms
- Page navigation: < 200ms
- Database queries: < 100ms

### **Reliability:**
- Auto-save drafts every 30 seconds
- Retry failed network requests (3 attempts)
- Graceful degradation when services offline
- Data integrity checks on startup

### **Cross-Platform:**
- Windows 10+ (64-bit)
- macOS 10.14+ (Intel & Apple Silicon)
- Linux (Ubuntu 18.04+, Debian 10+)

### **Resource Usage:**
- RAM: < 200MB idle, < 500MB active
- Storage: < 50MB application, user data separate
- CPU: < 5% idle, burst during processing

## 🎨 **Design System**

### **Colors:**
```css
:root {
  /* Primary brand colors */
  --primary-50: #eff6ff;
  --primary-500: #667eea;
  --primary-600: #5a67d8;
  --primary-700: #4c51bf;
  
  /* Semantic colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Neutral grays */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-500: #6b7280;
  --gray-900: #111827;
}
```

### **Typography:**
```css
/* Font stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;

/* Type scale */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### **Spacing:**
```css
/* Spacing scale (based on 0.25rem = 4px) */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
```

## 🚀 **Key User Flows**

### **Primary Flow: Upload and Process**
1. Launch LocalListen
2. Drag audio file to upload zone OR click browse
3. File appears in processing queue with progress
4. Processing completes → notification + transcript appears in recent
5. Click transcript to view details and chat with AI

### **Secondary Flow: Manage Transcripts**
1. Navigate to Library tab
2. Search/filter transcripts as needed
3. Select transcript for detailed view
4. Perform actions: edit, export, delete, chat

### **Settings Flow: Configure Services**
1. Navigate to Settings tab
2. Test service connections
3. Adjust preferences as needed
4. Changes auto-save

## 🔒 **Security & Privacy**

### **Data Protection:**
- All data stored locally in SQLite database
- No user data transmitted to external services except for processing
- Processing requests contain only audio/text, no metadata
- Secure file handling with temp file cleanup

### **Service Communication:**
- HTTPS required for external service connections
- Request timeouts to prevent hanging
- No authentication tokens stored permanently
- Connection status monitoring

## 📦 **Packaging & Distribution**

### **Build Outputs:**
- Windows: NSIS installer (.exe) + portable (.exe)
- macOS: DMG installer (.dmg) + notarized app bundle
- Linux: AppImage (.AppImage) + Debian package (.deb)

### **Auto-Updates:**
- Check for updates on startup (optional)
- Download and install updates automatically
- Graceful update process with data preservation

### **Installation Size:**
- < 100MB download
- < 200MB installed
- User data stored separately

## 🎯 **Success Metrics**

### **Usability:**
- Time to first transcript: < 2 minutes
- User can find settings: < 30 seconds
- Search finds relevant results: > 90% accuracy

### **Performance:**
- App startup time: < 3 seconds
- File processing starts: < 5 seconds after upload
- Chat response time: < 10 seconds

### **Reliability:**
- Crash rate: < 0.1% of sessions
- Data loss incidents: 0
- Service connection success: > 95%

This specification provides a comprehensive foundation for building a professional, user-friendly LocalListen desktop application that feels native and provides excellent user experience for academic transcription workflows.
