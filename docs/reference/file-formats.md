# File Formats

Comprehensive reference for all supported input and output formats in DeepTalk. This guide covers audio/video input formats, export options, and optimization recommendations.

## Supported Input Formats

### Audio Formats

**Primary Audio Formats:**
- **MP3** (.mp3)
  - **Compatibility**: Universal support across all platforms
  - **Quality**: Good compression with acceptable quality loss
  - **Recommended for**: General-purpose audio files, podcasts, meetings
  - **File size**: Efficient compression, typically 1MB per minute
  - **Notes**: Most widely supported format

- **WAV** (.wav)
  - **Compatibility**: Universal uncompressed format
  - **Quality**: Lossless, highest quality
  - **Recommended for**: High-quality recordings, professional audio
  - **File size**: Large files, typically 10MB per minute
  - **Notes**: Best quality for transcription accuracy

- **M4A** (.m4a)
  - **Compatibility**: Apple format, widely supported
  - **Quality**: Good compression with high quality
  - **Recommended for**: Apple device recordings, AAC encoded content
  - **File size**: Efficient compression, similar to MP3
  - **Notes**: Default format for Apple devices

**Additional Audio Formats:**
- **FLAC** (.flac)
  - **Quality**: Lossless compression
  - **File size**: Smaller than WAV, larger than MP3
  - **Use case**: Archival quality with compression

- **OGG** (.ogg, .oga)
  - **Quality**: Open source, good compression
  - **File size**: Similar to MP3
  - **Use case**: Open source projects, Linux environments

- **AAC** (.aac)
  - **Quality**: Advanced Audio Coding, efficient compression
  - **File size**: Smaller than MP3 with similar quality
  - **Use case**: Streaming, mobile applications

- **WMA** (.wma)
  - **Quality**: Windows Media Audio format
  - **File size**: Variable compression
  - **Use case**: Windows-specific audio files

### Video Formats

**Primary Video Formats:**
- **MP4** (.mp4)
  - **Compatibility**: Universal video format
  - **Audio extraction**: Automatic audio track extraction
  - **Recommended for**: Video meetings, presentations, interviews
  - **File size**: Efficient compression for video content
  - **Notes**: Most common video format, excellent support

- **MOV** (.mov)
  - **Compatibility**: Apple QuickTime format, widely supported
  - **Audio extraction**: High-quality audio extraction
  - **Recommended for**: Apple device recordings, professional video
  - **File size**: Variable based on compression settings
  - **Notes**: Common for Apple device recordings

**Additional Video Formats:**
- **AVI** (.avi)
  - **Compatibility**: Windows video format, widely supported
  - **Audio extraction**: Multiple audio track support
  - **Use case**: Windows-based video files

- **MKV** (.mkv)
  - **Compatibility**: Matroska format, open source
  - **Audio extraction**: Supports multiple audio tracks and languages
  - **Use case**: High-quality video with multiple audio options

- **WebM** (.webm)
  - **Compatibility**: Web-optimized format
  - **Audio extraction**: Web-standard audio extraction
  - **Use case**: Web-based video recordings

- **FLV** (.flv)
  - **Compatibility**: Flash video format
  - **Audio extraction**: Legacy format support
  - **Use case**: Older web video content

### File Size and Duration Limits

**Recommended Limits:**
- **Maximum file size**: 2GB per file
- **Optimal file size**: Under 500MB for best performance
- **Maximum duration**: No specific limit, but longer files take more time
- **Optimal duration**: 2-3 hours for interactive processing

**Performance Considerations:**
```
File Size    Processing Time    Memory Usage    Recommendation
─────────    ───────────────    ────────────    ──────────────
< 50MB       1-3 minutes        < 1GB RAM      Optimal
50-200MB     3-10 minutes       1-2GB RAM      Good
200-500MB    10-30 minutes      2-4GB RAM      Acceptable
500MB-1GB    30-60 minutes      4-6GB RAM      Slow but manageable
> 1GB        60+ minutes        6+ GB RAM      Consider splitting
```

**File Splitting Recommendations:**
- **Large files**: Split files over 1GB into smaller segments
- **Long recordings**: Break recordings longer than 3 hours into parts
- **Multiple topics**: Split by topic or speaker changes for better organization
- **Processing efficiency**: Smaller files process faster and use less memory

## Export Formats

### Document Formats

**PDF Export:**
- **Extension**: .pdf
- **Use case**: Professional reports, sharing, archival
- **Features**: 
  - Formatted layout with headers and footers
  - Table of contents for long documents
  - Searchable text content
  - Print-optimized formatting
- **Customization**: Custom templates, branding, layout options
- **Best for**: Executive summaries, meeting minutes, formal reports

**Microsoft Word (.docx):**
- **Extension**: .docx
- **Use case**: Collaborative editing, further customization
- **Features**:
  - Fully editable document format
  - Style preservation and formatting
  - Comment and revision tracking support
  - Template-based generation
- **Customization**: Custom styles, corporate templates
- **Best for**: Documents requiring further editing or collaboration

**Rich Text Format (.rtf):**
- **Extension**: .rtf
- **Use case**: Cross-platform document sharing
- **Features**:
  - Universal word processor compatibility
  - Basic formatting preservation
  - Smaller file size than Word format
  - Cross-platform compatibility
- **Best for**: Simple formatted documents, legacy system compatibility

### Text Formats

**Plain Text (.txt):**
- **Extension**: .txt
- **Use case**: Simple text sharing, data processing
- **Features**:
  - No formatting, pure text content
  - Universal compatibility
  - Smallest file size
  - Easy to process programmatically
- **Best for**: Raw transcription text, data analysis, simple sharing

**Markdown (.md):**
- **Extension**: .md
- **Use case**: Documentation, web publishing
- **Features**:
  - Structured text with simple markup
  - Version control friendly
  - Easy conversion to HTML and other formats
  - Widely supported by documentation platforms
- **Best for**: Technical documentation, GitHub integration, web publishing

**HTML Export:**
- **Extension**: .html
- **Use case**: Web publishing, email sharing
- **Features**:
  - Web-ready format with styling
  - Interactive elements and links
  - Custom CSS styling support
  - Accessible web format
- **Best for**: Web publishing, email newsletters, accessible sharing

### Data Formats

**JSON Export:**
- **Extension**: .json
- **Use case**: API integration, data analysis
- **Features**:
  - Machine-readable structured data
  - Complete metadata preservation
  - Hierarchical data organization
  - Programming language friendly
- **Structure**:
  ```json
  {
    "transcript": {
      "id": "unique-identifier",
      "title": "Meeting Title",
      "duration": 3600,
      "speakers": [...],
      "segments": [...],
      "analysis": {...}
    }
  }
  ```
- **Best for**: Custom integrations, data processing, backup

**CSV Export:**
- **Extension**: .csv
- **Use case**: Spreadsheet analysis, database import
- **Features**:
  - Tabular data format
  - Spreadsheet application compatible
  - Database import ready
  - Simple data analysis
- **Structure**:
  ```csv
  timestamp,speaker,text,confidence
  00:00:00,Speaker 1,"Welcome to the meeting",0.95
  00:00:05,Speaker 2,"Thank you for having me",0.92
  ```
- **Best for**: Data analysis, spreadsheet import, reporting

**XML Export:**
- **Extension**: .xml
- **Use case**: Enterprise integration, structured data exchange
- **Features**:
  - Structured markup format
  - Schema validation support
  - Enterprise system compatibility
  - Hierarchical data representation
- **Best for**: Enterprise integration, data transformation, validation

### Specialized Formats

**Subtitle Formats:**
- **SRT** (.srt): Standard subtitle format
- **VTT** (.vtt): Web Video Text Tracks format
- **ASS/SSA** (.ass/.ssa): Advanced subtitle formats
- **Use case**: Video captioning, accessibility, media production

**Audio Export:**
- **Extract audio segments**: Export specific portions as audio files
- **Speaker isolation**: Export individual speaker audio tracks
- **Time-coded audio**: Audio with embedded timestamp information
- **Use case**: Audio analysis, speaker training, quality review

**Custom Templates:**
- **Template-based export**: Use custom document templates
- **Branded formats**: Corporate branding and styling
- **Specialized layouts**: Industry-specific document formats
- **Use case**: Corporate compliance, standardized reporting

## Format Selection Guidelines

### Choosing Input Formats

**For Best Transcription Quality:**
1. **WAV or FLAC**: Lossless formats for highest accuracy
2. **High bitrate MP3**: 320kbps or higher for good quality
3. **Uncompressed audio**: When file size is not a concern
4. **Clear recording**: Quality matters more than format

**For Processing Efficiency:**
1. **MP3 or M4A**: Good balance of quality and file size
2. **Moderate compression**: Avoid over-compressed files
3. **Consistent format**: Use same format across project
4. **Optimized recording**: Record at appropriate levels

**For Compatibility:**
1. **MP3**: Universal compatibility across all systems
2. **MP4**: For video content with audio extraction
3. **Standard bitrates**: Use common compression settings
4. **Verified formats**: Test format compatibility before large uploads

### Choosing Export Formats

**For Professional Sharing:**
- **PDF**: Executive reports, formal documentation
- **Word**: Collaborative documents, editable reports
- **HTML**: Web sharing, accessible documentation

**For Technical Use:**
- **JSON**: API integration, data processing
- **CSV**: Data analysis, spreadsheet import
- **XML**: Enterprise systems, structured data

**For Simple Distribution:**
- **Text**: Raw content, simple sharing
- **Markdown**: Technical documentation, version control
- **RTF**: Cross-platform compatibility

## Quality Optimization

### Input Quality Guidelines

**Audio Recording Best Practices:**
- **Sample rate**: 44.1kHz or higher
- **Bit depth**: 16-bit minimum, 24-bit preferred
- **Format**: Uncompressed or lossless when possible
- **Recording levels**: Avoid clipping, maintain consistent levels
- **Environment**: Minimize background noise and echo

**File Preparation:**
- **Normalization**: Consistent audio levels
- **Noise reduction**: Remove background noise if possible
- **Format conversion**: Convert to optimal format before upload
- **File naming**: Use descriptive, consistent naming conventions

**Quality Indicators:**
- **File size**: Larger files often indicate better quality
- **Duration vs. size**: Check if compression is appropriate
- **Audio clarity**: Test playback quality before upload
- **Metadata**: Include relevant information for processing

### Export Quality Settings

**Document Export Quality:**
- **PDF resolution**: 300 DPI for print, 150 DPI for screen
- **Image compression**: Balance quality and file size
- **Font embedding**: Ensure consistent appearance
- **Layout optimization**: Optimize for intended use

**Data Export Quality:**
- **Character encoding**: UTF-8 for international character support
- **Data validation**: Verify data integrity after export
- **Format compliance**: Ensure standards compliance
- **Metadata preservation**: Include relevant metadata

## Troubleshooting Format Issues

### Common Format Problems

**Unsupported Format Errors:**
```
Error: Unsupported file format
```
**Solutions:**
- Verify format is in supported list above
- Convert file to supported format
- Check file extension matches actual format
- Test with sample file of known format

**Corrupted File Errors:**
```
Error: Unable to read file
```
**Solutions:**
- Test file in media player first
- Re-export from original source
- Use file repair tools if available
- Try different compression settings

**Large File Issues:**
```
Error: File too large to process
```
**Solutions:**
- Split file into smaller segments
- Compress file to reduce size
- Use cloud processing if available
- Upgrade system resources

### Format Conversion Tools

**Free Conversion Tools:**
- **FFmpeg**: Command-line tool for audio/video conversion
- **Audacity**: Free audio editing and conversion
- **VLC Media Player**: Simple format conversion
- **Online converters**: Web-based conversion services

**FFmpeg Conversion Examples:**
```bash
# Convert various formats to MP3
ffmpeg -i input.wav output.mp3
ffmpeg -i input.m4a output.mp3
ffmpeg -i input.flac output.mp3

# Extract audio from video
ffmpeg -i input.mp4 -vn -acodec mp3 output.mp3
ffmpeg -i input.mov -vn -acodec wav output.wav

# Compress large files
ffmpeg -i input.wav -ab 128k output.mp3
ffmpeg -i input.wav -ar 44100 -ab 192k output.mp3
```

**Quality vs. Size Optimization:**
```bash
# High quality (larger files)
ffmpeg -i input.wav -ab 320k output.mp3

# Balanced quality (medium files)
ffmpeg -i input.wav -ab 192k output.mp3

# Small size (lower quality)
ffmpeg -i input.wav -ab 128k output.mp3
```

### Platform-Specific Considerations

**Windows:**
- **Media Foundation**: Built-in support for common formats
- **DirectShow**: Legacy support for additional formats
- **Windows Media Player**: Test compatibility
- **File associations**: Verify correct program associations

**macOS:**
- **Core Audio**: Native audio format support
- **QuickTime**: Video and audio format support
- **iTunes/Music**: Audio format compatibility testing
- **File type associations**: Check default applications

**Linux:**
- **GStreamer**: Multimedia framework for format support
- **FFmpeg**: Primary tool for format conversion
- **Package management**: Install codec packages as needed
- **Audio server**: Ensure proper audio system configuration

## Format Standards and Specifications

### Audio Format Specifications

**MP3 (MPEG-1/2 Audio Layer 3):**
- **Standard**: ISO/IEC 11172-3, ISO/IEC 13818-3
- **Compression**: Lossy compression
- **Bitrates**: 32-320 kbps
- **Sample rates**: 16, 22.05, 24, 32, 44.1, 48 kHz
- **Channels**: Mono, stereo

**WAV (Waveform Audio File Format):**
- **Standard**: Microsoft/IBM specification
- **Compression**: Uncompressed PCM
- **Bit depth**: 8, 16, 24, 32 bit
- **Sample rates**: 8-192 kHz
- **Channels**: Mono to multi-channel

**AAC (Advanced Audio Coding):**
- **Standard**: ISO/IEC 13818-7, ISO/IEC 14496-3
- **Compression**: Lossy compression
- **Bitrates**: 8-529 kbps
- **Sample rates**: 8-96 kHz
- **Channels**: Mono to 48 channels

### Export Format Standards

**PDF Standards:**
- **PDF/A**: Archival format for long-term preservation
- **PDF/UA**: Universal accessibility standard
- **PDF 1.4-2.0**: Version compatibility
- **Searchability**: Text layer preservation

**Document Standards:**
- **DOCX**: Office Open XML format
- **RTF**: Rich Text Format specification
- **HTML5**: Modern web standard
- **Markdown**: CommonMark specification

**Data Format Standards:**
- **JSON**: RFC 7159 specification
- **CSV**: RFC 4180 specification
- **XML**: W3C XML 1.0 specification
- **UTF-8**: Unicode character encoding

---

**Quick format check**: If you're unsure about a file format, try uploading a small sample first, or use the `file` command on Linux/macOS to identify the format: `file yourfile.ext`