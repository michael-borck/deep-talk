# First Use Guide

Congratulations on installing DeepTalk! This guide will walk you through your first launch and initial setup.

## First Launch

When you launch DeepTalk for the first time, here's what to expect:

### 1. Welcome Screen
- DeepTalk will open to the **Home** page
- You'll see a clean interface with navigation tabs at the top
- The interface includes: Home, Projects, Library, Settings, and About

### 2. Initial Interface Overview

**Navigation Tabs:**
- 🏠 **Home**: Your dashboard and recent activity
- 📁 **Projects**: Organize transcripts into projects  
- 📋 **Library**: Manage individual transcripts
- ⚙️ **Settings**: Configure DeepTalk preferences
- ℹ️ **About**: Application information

### 3. Service Status Check
On the Home page, you'll see a **Service Status** indicator:
- 🟡 **Yellow**: Services connecting (normal on first launch)
- 🔴 **Red**: Service connection errors (expected without external services)
- 🟢 **Green**: All services connected

**Don't worry**: DeepTalk works great even without external services!

## Basic Configuration (Optional)

### Quick Settings Check

Let's do a quick settings review to ensure everything is configured correctly:

1. **Click** the ⚙️ **Settings** tab
2. **Review** the main sections:

#### Transcription Settings
- **Service URL**: Default is `http://localhost:8000` (for future Speaches setup)
- **Model**: Default speech-to-text model (fine for basic use)
- **Audio Chunk Size**: Default 60 seconds (good for most files)

#### Processing Settings  
- **AI Analysis URL**: Default is `http://localhost:11434` (for future Ollama setup)
- **Transcript Correction**: Enabled by default (improves accuracy)
- **Speaker Tagging**: Disabled by default (can enable later)

#### General Settings
- **Auto-backup**: Enabled by default (recommended)
- **Theme**: System default (matches your OS theme)

**Recommendation**: Keep the default settings for now. You can always adjust them later as you learn more about DeepTalk.

## Understanding DeepTalk's Approach

### Privacy-First Design
- **All data stays on your computer** - nothing is sent to external servers unless you configure specific services
- **Local storage** - your transcripts and analysis are stored in a local database
- **Optional services** - external transcription and AI services are entirely optional

### How It Works
1. **Upload** audio or video files
2. **Transcribe** using built-in capabilities or external services
3. **Analyze** content for insights (basic analysis works offline)
4. **Organize** transcripts into projects for better management
5. **Chat** with your transcripts using AI (requires Ollama setup)

## Your First Transcript (Basic Mode)

Let's create your first transcript to get familiar with the interface:

### Method 1: From Home Page
1. **Stay** on the Home page
2. **Look** for upload options or quick actions
3. **Click** upload or "Add New" button

### Method 2: From Library
1. **Click** the 📋 **Library** tab
2. **Look** for an "Upload" or "Add Transcript" button
3. **Click** to start the upload process

### What to Expect
1. **File Selection**: Choose an audio or video file from your computer
2. **Processing**: DeepTalk will process the file (may take a few minutes)
3. **Basic Transcription**: Even without external services, you'll get basic processing
4. **Results**: View your transcript in the Library

## Understanding Service Status

### With No External Services (Default)
- ✅ **File Processing**: Works perfectly
- ✅ **Basic Transcription**: Limited but functional
- ✅ **Organization**: Full project and library features
- ✅ **Export**: Complete export capabilities
- ❌ **Advanced AI Features**: Requires Ollama setup
- ❌ **High-Quality Transcription**: Requires Speaches setup

### Next Steps for Full Features
If you want the complete DeepTalk experience:
1. **Complete** this first-use setup
2. **Try** the basic workflow with a test file
3. **Follow** the [Quick Start Tutorial](quick-start.md) for service setup

## Data Location

Your DeepTalk data is stored locally:
- **Windows**: `%APPDATA%/deeptalk/`
- **macOS**: `~/Library/Application Support/deeptalk/`
- **Linux**: `~/.config/deeptalk/`

This includes:
- **Database**: All your transcripts and analysis
- **Settings**: Your preferences and configurations
- **Cache**: Temporary processing files

## What's Next?

Now that you're familiar with the interface:

### Immediate Next Steps
1. **Try uploading a short audio file** (2-3 minutes recommended for first test)
2. **Explore the interface** while it processes
3. **Review the results** in your Library

### For the Complete Experience
Follow the [Quick Start Tutorial](quick-start.md) which covers:
- Setting up Speaches for high-quality transcription
- Installing Ollama for AI analysis and chat features
- Complete workflow walkthrough
- Best practices and tips

## Need Help?

### Quick Help
- **Interface questions**: Continue to [Quick Start Tutorial](quick-start.md)
- **Technical issues**: Check [Common Issues](../troubleshooting/common-issues.md)
- **Feature questions**: Browse [User Guide](../user-guide/README.md)

### Common First-Use Questions

**Q: Do I need to set up external services right away?**
A: No! DeepTalk works great for basic transcription and organization without any external services.

**Q: Where are my files stored?**
A: Everything stays on your computer in the local application data folder.

**Q: Can I use DeepTalk offline?**
A: Yes! Core features work completely offline. Only enhanced AI features require internet services.

**Q: What file formats are supported?**
A: MP3, WAV, MP4, AVI, MOV, M4A, WebM, OGG, and more. See [File Formats](../reference/file-formats.md) for the complete list.

---

**Ready for more?** Continue to [Quick Start Tutorial →](quick-start.md)