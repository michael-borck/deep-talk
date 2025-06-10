# Installation Guide

This guide will help you download and install DeepTalk on your computer. DeepTalk supports Windows, macOS, and Linux.

## System Requirements

Before installing, make sure your system meets these minimum requirements:

### Minimum Requirements
- **RAM**: 4GB (8GB recommended)
- **Storage**: 500MB free space (more for your transcripts)
- **Operating System**: 
  - Windows 10 or later
  - macOS 10.14 (Mojave) or later
  - Linux (Ubuntu 18.04+, or equivalent)

### Recommended Requirements
- **RAM**: 8GB or more
- **Storage**: 2GB+ free space
- **Audio**: Sound card or audio interface (for audio playback)

## Download DeepTalk

### Option 1: GitHub Releases (Recommended)

1. Visit the [DeepTalk Releases page](https://github.com/michael-borck/deep-talk/releases)
2. Find the latest release
3. Download the appropriate file for your operating system:

#### Windows
- **File**: `DeepTalk-Setup-x.x.x.exe`
- **Size**: ~150MB
- **Type**: Windows installer

#### macOS
- **File**: `DeepTalk-x.x.x.dmg` (Intel & Apple Silicon)
- **Size**: ~150MB
- **Type**: macOS disk image

#### Linux
- **AppImage**: `DeepTalk-x.x.x.AppImage` (Universal)
- **Debian/Ubuntu**: `DeepTalk-x.x.x.deb`
- **Size**: ~150MB

## Installation Instructions

### Windows Installation

1. **Download** the `.exe` installer from the releases page
2. **Run** the installer by double-clicking the downloaded file
3. **Follow** the installation wizard:
   - Choose installation location (default is recommended)
   - Select whether to create desktop shortcut
   - Choose whether to launch DeepTalk after installation
4. **Launch** DeepTalk from the Start Menu or desktop shortcut

**Note**: Windows may show a security warning. Click "More info" and then "Run anyway" if needed.

### macOS Installation

1. **Download** the `.dmg` file from the releases page
2. **Open** the downloaded DMG file
3. **Drag** DeepTalk to your Applications folder
4. **Launch** DeepTalk from Applications or Spotlight

**Important**: macOS may block the app on first launch:
- Go to System Preferences → Security & Privacy
- Click "Open Anyway" next to the DeepTalk entry
- Or right-click DeepTalk in Applications and select "Open"

### Linux Installation

#### Option A: AppImage (Recommended)
1. **Download** the `.AppImage` file
2. **Make it executable**: `chmod +x DeepTalk-*.AppImage`
3. **Run** the AppImage: `./DeepTalk-*.AppImage`

#### Option B: Debian/Ubuntu Package
1. **Download** the `.deb` file
2. **Install** using: `sudo dpkg -i DeepTalk-*.deb`
3. **Fix dependencies** if needed: `sudo apt-get install -f`
4. **Launch** from applications menu or run `deeptalk`

## Verification

After installation, verify that DeepTalk is working correctly:

1. **Launch** DeepTalk
2. **Check** that the application opens without errors
3. **Verify** you see the welcome screen or main interface
4. **Confirm** the version number matches what you downloaded

## What's Included

DeepTalk comes with everything you need to get started:

- ✅ **FFmpeg**: Bundled for audio/video processing
- ✅ **Local Database**: SQLite for storing your data
- ✅ **User Interface**: Complete desktop application
- ✅ **Basic Processing**: Works offline without external services

## Optional Services (Not Required for Basic Use)

For enhanced features, you can optionally install:

- **Speaches**: Enhanced speech-to-text service
- **Ollama**: Local AI analysis and chat features

These are covered in the [Quick Start Tutorial](quick-start.md) and can be added anytime.

## Troubleshooting Installation

### Common Issues

**Windows: "Windows protected your PC"**
- Click "More info" → "Run anyway"
- Or add an exception in Windows Defender

**macOS: "Cannot be opened because it is from an unidentified developer"**
- Go to System Preferences → Security & Privacy
- Click "Open Anyway"

**Linux: "Permission denied"**
- Make sure the AppImage is executable: `chmod +x DeepTalk-*.AppImage`

**General: Application won't start**
- Check [System Requirements](../reference/system-requirements.md)
- Try running from command line to see error messages
- Check our [Common Issues](../troubleshooting/common-issues.md) guide

### Getting Help

If you encounter issues not covered here:
- Check the [Troubleshooting Guide](../troubleshooting/common-issues.md)
- Visit [GitHub Issues](https://github.com/michael-borck/deep-talk/issues)
- Review [System Requirements](../reference/system-requirements.md)

---

**Next Step**: [First Use Setup →](first-use.md)