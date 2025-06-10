# Uploading Files

This guide covers everything you need to know about adding audio and video content to DeepTalk, from supported formats to optimization techniques.

## Quick Start

### Basic Upload Process
1. **Navigate** to the Library page or Home page
2. **Click** the "Upload" or "Add Files" button
3. **Select** your audio or video files
4. **Add** titles and descriptions (optional but recommended)
5. **Start** the upload and processing

### Upload Locations
You can initiate uploads from several places:
- **Library page**: Primary upload location
- **Home page**: Quick upload access
- **Project page**: Upload directly to a specific project
- **Drag and drop**: From anywhere in DeepTalk

## Supported File Formats

### Audio Formats
DeepTalk supports all common audio formats:

**Highly Recommended:**
- **WAV**: Uncompressed, best quality
- **MP3**: Good compression, widely compatible
- **M4A**: Modern format, good quality/size ratio

**Also Supported:**
- **FLAC**: Lossless compression, large files
- **OGG**: Open source format
- **AAC**: Advanced audio codec
- **WMA**: Windows Media Audio

### Video Formats
Video files are processed for their audio content:

**Highly Recommended:**
- **MP4**: Most common, well-supported
- **MOV**: Apple format, good quality
- **AVI**: Older but reliable format

**Also Supported:**
- **WebM**: Web-optimized format
- **MKV**: Container format, flexible
- **FLV**: Flash video format
- **3GP**: Mobile video format

### File Size and Duration Limits

**Recommended Limits:**
- **File size**: Up to 2GB per file
- **Duration**: Up to 3 hours per file
- **Audio quality**: 16kHz or higher sample rate

**Technical Limits:**
- **Maximum file size**: 5GB (system dependent)
- **Maximum duration**: 6 hours
- **Minimum quality**: 8kHz sample rate

## Upload Methods

### Method 1: Button Upload
**Best for: Single files or small batches**

1. **Go to Library** page
2. **Click "Upload Files"** button
3. **Browse** and select files
4. **Configure** titles and settings
5. **Start upload**

### Method 2: Drag and Drop
**Best for: Quick uploads from file explorer**

1. **Open** your file manager/explorer
2. **Drag files** into any DeepTalk window
3. **Drop** files on the interface
4. **Configure** and confirm upload

### Method 3: Project Upload
**Best for: Files belonging to specific projects**

1. **Open** the target project
2. **Click "Add Transcripts"** or "Upload"
3. **Select files** for the project
4. **Files automatically** assigned to project

### Method 4: Batch Upload
**Best for: Many files at once**

1. **Select multiple files** in file browser
2. **Use Ctrl/Cmd+click** to select multiple
3. **Upload all at once** for batch processing
4. **Monitor progress** for all files

## File Preparation Best Practices

### Audio Quality Optimization

**For Best Results:**
- **Clear audio**: Minimize background noise
- **Good volume**: Not too quiet or too loud
- **Consistent levels**: Avoid major volume changes
- **Single language**: One language per file works best

**Audio Settings:**
- **Sample rate**: 16kHz minimum, 44.1kHz recommended
- **Bit depth**: 16-bit minimum, 24-bit for high quality
- **Compression**: Moderate compression is fine (128kbps+ for MP3)

### File Organization Before Upload

**Naming Conventions:**
- Use descriptive, consistent file names
- Include dates if relevant (YYYY-MM-DD format)
- Avoid special characters (&, %, #, etc.)
- Keep names under 100 characters

**Folder Structure:**
- Organize files by project or topic
- Group related recordings together
- Consider chronological organization
- Separate different speakers/sources

## Upload Configuration

### Basic Information

**Title Field:**
- **Auto-generated**: Based on filename if left empty
- **Custom titles**: More descriptive and searchable
- **Best practice**: Include topic, date, and context

**Description Field:**
- **Optional**: But highly recommended for searchability
- **Content suggestions**: Meeting topic, participants, purpose
- **Searchable**: Text appears in search results

### Advanced Options

**Processing Priority:**
- **High**: Process immediately (for urgent content)
- **Normal**: Standard queue processing (default)
- **Low**: Process when system is less busy

**Quality Settings:**
- **Best Quality**: Slower processing, best results
- **Balanced**: Good quality, reasonable speed (default)
- **Fast**: Quick processing, adequate quality

**Project Assignment:**
- **Select project**: Assign to existing project
- **Create new**: Start new project with this file
- **No project**: Keep in general library

## Batch Upload Management

### Selecting Multiple Files

**File Browser Selection:**
- Hold `Ctrl` (Windows/Linux) or `Cmd` (Mac) while clicking
- Hold `Shift` to select ranges
- Use `Ctrl+A`/`Cmd+A` to select all

**Drag and Drop Multiple:**
- Select multiple files in file manager
- Drag the selection into DeepTalk
- All files upload with shared settings

### Batch Configuration

**Apply to All:**
- Set project assignment for entire batch
- Configure processing priority for all files
- Set quality level for complete batch

**Individual Customization:**
- Modify titles and descriptions per file
- Adjust settings for specific files
- Remove files from batch before processing

## Processing and Progress Monitoring

### Understanding the Upload Process

**Stage 1: File Upload**
- Files copied to DeepTalk's storage
- Quick validation of file format
- Progress bar shows upload completion

**Stage 2: Audio Extraction**
- Audio extracted from video files
- Audio conversion for optimization
- Preparation for transcription service

**Stage 3: Transcription Queue**
- Files queued for transcription
- Processing order based on priority and size
- Progress visible on Home page and Library

### Monitoring Progress

**Progress Indicators:**
- **Upload progress**: File transfer percentage
- **Queue position**: Where your file is in line
- **Processing status**: Current processing stage
- **Estimated time**: Approximate completion time

**Where to Check Status:**
- **Home page**: Overview of all processing
- **Library page**: Individual file status
- **Processing queue**: Detailed queue view
- **Notifications**: Status updates and completion alerts

## Large File Handling

### Files Over 1GB

**Preparation:**
- Ensure stable internet connection (if using remote services)
- Close other applications to free memory
- Consider splitting very long recordings

**Processing Considerations:**
- Longer processing times expected
- May be chunked automatically for better handling
- Monitor system resources during processing

### Long Duration Files (Over 2 Hours)

**Automatic Chunking:**
- DeepTalk automatically splits long files
- Chunks processed separately then combined
- Prevents memory issues and improves accuracy

**Chunk Settings:**
- Default chunk size: 5 minutes
- Configurable in Settings > Processing
- Overlap between chunks for continuity

## Troubleshooting Upload Issues

### Common Upload Problems

**File Won't Upload:**
- **Check format**: Ensure file is supported
- **Check size**: Verify file isn't too large
- **Check permissions**: Ensure file isn't locked/in use
- **Try different location**: Some network drives cause issues

**Upload Fails Partway:**
- **Network issues**: Check internet connection
- **Disk space**: Ensure enough free space available
- **File corruption**: Try uploading different file
- **Restart**: Close and reopen DeepTalk

**Processing Stalls:**
- **Service issues**: Check service status in Settings
- **System resources**: Close other applications
- **File complexity**: Some formats take longer
- **Restart processing**: Cancel and retry if needed

### File Quality Issues

**Poor Transcription Quality:**
- **Audio clarity**: Use higher quality source files
- **Background noise**: Minimize environmental sounds
- **Multiple speakers**: Consider speaker separation
- **Service configuration**: Check transcription service settings

**Processing Errors:**
- **Unsupported format**: Convert file to supported format
- **Corrupted file**: Try re-recording or different source
- **Size limits**: Split large files before upload
- **System requirements**: Verify system meets minimum specs

## Tips for Efficient Uploading

### Workflow Optimization

**Batch Similar Content:**
- Upload related files together
- Use consistent naming and organization
- Process similar content types in batches

**Prepare Files in Advance:**
- Organize files before uploading
- Prepare titles and descriptions beforehand
- Check audio quality before processing

**Use Off-Peak Hours:**
- Upload large files during low-usage times
- Take advantage of faster processing
- Avoid conflicts with other system activities

### Quality vs. Speed Trade-offs

**For Quick Results:**
- Use "Fast" processing mode
- Upload smaller files first
- Use compressed audio formats

**For Best Quality:**
- Use "Best Quality" processing mode
- Upload high-quality source files
- Allow extra time for processing

**For Balanced Approach:**
- Use default "Balanced" settings
- Moderate file sizes (under 500MB)
- Standard audio quality (44.1kHz, 16-bit)

---

**Next**: Learn about [managing your transcripts →](managing-transcripts.md)