# DeepTalk

AI-powered conversation analysis and insight discovery platform with local processing and privacy-first design.

## Features

- 🎬 **Audio/Video Support**: Process MP3, WAV, MP4, AVI, MOV, and more
- 🔒 **Privacy-First**: All data stored locally on your machine
- 🎯 **AI-Powered**: Transcription via Speaches, analysis via Ollama
- 📦 **No Dependencies**: FFmpeg bundled - works out of the box
- 🖥️ **Cross-Platform**: Windows, macOS, and Linux support

## Installation

Download the latest release for your platform from the [Releases](https://github.com/michael-borck/deep-talk/releases) page.

## Development

### Prerequisites

- Node.js 20+
- npm or yarn
- (Optional) Speaches service running on http://localhost:8000
- (Optional) Ollama service running on http://localhost:11434

### Setup

```bash
# Clone the repository
git clone https://github.com/michael-borck/deep-talk.git
cd deep-talk

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run dist
```

## Release Process

### GitHub Secrets Required

To enable automatic builds when you create a release tag, set up these GitHub secrets:

1. **For macOS Code Signing (Optional)**:
   - `MAC_CERTS`: Base64 encoded .p12 certificate
   - `MAC_CERTS_PASSWORD`: Certificate password
   - `APPLE_ID`: Your Apple ID
   - `APPLE_ID_PASS`: App-specific password
   - `APPLE_TEAM_ID`: Your Apple Developer Team ID

2. **Automatic (Already exists)**:
   - `GITHUB_TOKEN`: Automatically provided by GitHub Actions

### Creating a Release

1. Update version in `package.json`
2. Commit changes: `git commit -am "Bump version to v1.0.0"`
3. Create tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. GitHub Actions will automatically build for all platforms
6. Edit the draft release on GitHub and publish

### Build Outputs

- **Windows**: `.exe` installer
- **macOS**: `.dmg` installer and `.pkg` for Mac App Store
- **Linux**: `.AppImage` and `.deb` packages

## Architecture

```
DeepTalk/
├── src/               # React TypeScript source
├── public/            # Electron main process
├── database/          # SQLite schema
└── ffmpeg-binaries/   # Platform-specific FFmpeg
```

## Technologies

- **Frontend**: React + TypeScript
- **Desktop**: Electron
- **Database**: SQLite (better-sqlite3)
- **Styling**: Tailwind CSS
- **Transcription**: Speaches API
- **AI Analysis**: Ollama API
- **Media Processing**: FFmpeg (bundled)

## License

MIT