# Common Issues Guide

Detailed solutions for frequently encountered DeepTalk problems. This guide provides step-by-step troubleshooting for installation, processing, performance, and workflow issues.

## Installation and Setup Issues

### Service Connection Problems

**Symptom**: Cannot connect to Speaches or Ollama services

**Diagnosis Steps:**
1. **Check if services are running**:
   ```bash
   # For Speaches
   curl http://localhost:8000/health
   
   # For Ollama
   curl http://localhost:11434/api/version
   ```

2. **Verify service URLs in DeepTalk**:
   - Settings → Services
   - Speaches URL: `http://localhost:8000`
   - Ollama URL: `http://localhost:11434`

3. **Test network connectivity**:
   - Ping localhost
   - Check firewall settings
   - Verify no port conflicts

**Solutions:**

**Service Not Running:**
```bash
# Start Speaches
speaches serve --port 8000

# Start Ollama
ollama serve
```

**Port Conflicts:**
```bash
# Check what's using the port
lsof -i :8000  # macOS/Linux
netstat -an | findstr :8000  # Windows

# Use alternative ports if needed
speaches serve --port 8001
```

**Firewall Issues:**
- **Windows**: Allow DeepTalk through Windows Firewall
- **macOS**: System Preferences → Security & Privacy → Firewall
- **Linux**: Configure iptables or ufw to allow local connections

**URL Configuration Issues:**
- Ensure URLs use `http://` (not `https://`)
- Verify correct port numbers
- Test URLs in browser first

### Permission and Access Issues

**Symptom**: "Permission denied" or "Access denied" errors

**Common Causes and Solutions:**

**File System Permissions:**
```bash
# macOS/Linux: Fix permissions
sudo chown -R $(whoami) ~/DeepTalk/
chmod -R 755 ~/DeepTalk/

# Windows: Run as Administrator or check folder permissions
```

**Media File Access:**
- **Check file locks**: Ensure files aren't open in other applications
- **Verify file format**: Confirm files are in supported formats
- **Test with small files**: Use simple test files to isolate issues

**Application Permissions:**
- **macOS**: Grant microphone and file access in System Preferences
- **Windows**: Check app permissions in Windows Security
- **Linux**: Verify user has access to audio devices and file directories

### Installation Failures

**Symptom**: DeepTalk won't install or update properly

**Diagnostic Steps:**
1. **Check system requirements**: Verify OS and hardware compatibility
2. **Free up disk space**: Ensure adequate storage available
3. **Close other applications**: Free up system resources
4. **Check administrative rights**: Ensure proper permissions for installation

**Solutions:**

**Insufficient Disk Space:**
- Free up at least 2GB for installation
- Clear temporary files and cache
- Move large files to external storage

**Installation Corruption:**
1. **Uninstall completely**: Remove all DeepTalk files and folders
2. **Clear cache**: Delete temporary installation files
3. **Download fresh**: Re-download installer from official source
4. **Install as administrator**: Use elevated permissions

**Update Failures:**
1. **Backup current data**: Export important projects and settings
2. **Manual update**: Download and install latest version manually
3. **Clean installation**: Uninstall and reinstall if update fails
4. **Restore data**: Import backed-up projects and settings

## Processing Failures

### Audio Processing Issues

**Symptom**: Audio files won't upload or process

**Diagnosis:**
1. **Check file format**: Verify supported audio format (MP3, WAV, M4A, etc.)
2. **Test file integrity**: Try playing file in media player
3. **Check file size**: Ensure file isn't too large (recommended under 500MB)
4. **Monitor system resources**: Check available RAM and CPU

**Solutions:**

**Unsupported Format:**
```bash
# Convert to supported format using FFmpeg
ffmpeg -i input.wma output.mp3
ffmpeg -i input.opus output.wav
```

**File Corruption:**
- Try re-exporting from original source
- Use audio repair tools if available
- Test with different file

**File Size Issues:**
```bash
# Split large files using FFmpeg
ffmpeg -i large_file.mp3 -t 1800 -c copy part1.mp3
ffmpeg -i large_file.mp3 -ss 1800 -c copy part2.mp3
```

**Audio Quality Problems:**
- **Poor quality audio**: Use audio enhancement tools before upload
- **Multiple speakers**: Ensure clear speaker separation
- **Background noise**: Use noise reduction if available

### Transcription Service Failures

**Symptom**: Transcription starts but fails to complete

**Common Failure Patterns:**

**Service Timeout:**
```
Error: Transcription service timeout
```
**Solutions:**
- **Increase timeout settings**: Configure longer timeout in settings
- **Split large files**: Process smaller segments individually
- **Check service load**: Try processing during off-peak hours
- **Verify service health**: Test service with small sample file

**Model Loading Failures:**
```
Error: Unable to load transcription model
```
**Solutions:**
```bash
# For Speaches - verify model availability
speaches list-models

# Download required models
speaches download-model whisper-large-v2

# For Ollama - verify model status
ollama list
ollama pull llama2  # Re-download if needed
```

**Memory Issues:**
```
Error: Out of memory during transcription
```
**Solutions:**
- **Close other applications**: Free up RAM
- **Process smaller files**: Split large files into segments
- **Increase virtual memory**: Configure swap space if needed
- **Use cloud services**: Consider cloud-based transcription for large files

### AI Analysis Failures

**Symptom**: AI analysis doesn't start or produces poor results

**Service Configuration Issues:**

**Model Availability:**
```bash
# Check available models
ollama list

# Download recommended models
ollama pull llama2
ollama pull mistral
ollama pull codellama  # For technical content
```

**Service Response Issues:**
```bash
# Test Ollama directly
curl http://localhost:11434/api/chat -d '{
  "model": "llama2",
  "messages": [{"role": "user", "content": "Hello"}]
}'
```

**Analysis Quality Problems:**

**Poor Results:**
- **Improve transcription quality**: Better transcripts produce better analysis
- **Use appropriate models**: Select models suited for your content type
- **Customize prompts**: Create specific analysis templates
- **Provide context**: Include background information for better understanding

**Incomplete Analysis:**
- **Check content length**: Very long transcripts may need segmentation
- **Verify model capacity**: Ensure model can handle content length
- **Use focused prompts**: Specify exactly what analysis you need
- **Break into sections**: Analyze different aspects separately

## Performance Optimization

### System Resource Management

**Symptom**: DeepTalk runs slowly or becomes unresponsive

**Resource Monitoring:**
```bash
# Monitor system resources
# macOS
top -o cpu
top -o rsize

# Linux
htop
iotop

# Windows
Task Manager → Performance tab
```

**Memory Optimization:**

**High Memory Usage:**
- **Close unnecessary applications**: Free up RAM for processing
- **Process files individually**: Avoid batch processing large files
- **Restart periodically**: Clear memory accumulation
- **Increase virtual memory**: Configure swap space appropriately

**Memory Leak Detection:**
- **Monitor memory over time**: Watch for gradual increase
- **Restart after large operations**: Clear accumulated memory
- **Update to latest version**: Memory leaks often fixed in updates
- **Report persistent issues**: Help developers identify memory problems

**CPU Optimization:**

**High CPU Usage:**
- **Limit concurrent operations**: Process one file at a time
- **Use appropriate models**: Balance quality vs. processing speed
- **Schedule intensive operations**: Run during off-peak hours
- **Check background processes**: Ensure no other intensive applications running

**Processing Queue Management:**
- **Monitor queue status**: Check processing queue regularly
- **Prioritize urgent content**: Process important files first
- **Batch similar operations**: Group similar processing tasks
- **Use background processing**: Continue other work while processing

### Storage and Disk Issues

**Symptom**: Slow file operations or storage errors

**Disk Space Management:**
```bash
# Check available disk space
df -h  # macOS/Linux
dir   # Windows

# Find large files
find ~/DeepTalk -size +100M  # macOS/Linux
```

**Storage Optimization:**

**Low Disk Space:**
- **Archive old projects**: Move completed projects to external storage
- **Clear temporary files**: Remove processing temporary files
- **Compress large files**: Use compression for archived content
- **Monitor growth**: Track storage usage over time

**Slow Disk Performance:**
- **Use SSD if available**: Much faster than traditional hard drives
- **Defragment drives**: Windows users should defragment regularly
- **Check disk health**: Use disk utility tools to verify drive health
- **Optimize file organization**: Keep frequently accessed files local

**Network Performance Issues:**

**Slow External Service Connections:**
- **Check network speed**: Verify adequate bandwidth
- **Test service latency**: Ping external services
- **Use local services when possible**: Ollama locally vs. cloud AI
- **Configure timeout settings**: Adjust for network conditions

## AI Service Configuration

### Ollama Configuration Issues

**Symptom**: Ollama works but analysis quality is poor

**Model Selection Optimization:**
```bash
# List available models
ollama list

# Recommended models for different use cases
ollama pull llama2          # General purpose
ollama pull mistral         # Better creative tasks
ollama pull codellama       # Technical content
ollama pull llama2:13b      # More comprehensive analysis
```

**Performance Tuning:**
```bash
# Configure memory usage
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS=*
export OLLAMA_NUM_PARALLEL=2  # Adjust based on RAM
```

**Model-Specific Issues:**

**Model Loading Failures:**
```bash
# Re-download corrupted models
ollama rm llama2
ollama pull llama2

# Check available disk space
ollama list  # Shows model sizes
```

**Poor Analysis Quality:**
- **Use larger models**: 13B+ parameters for better understanding
- **Adjust temperature settings**: Lower for consistent results
- **Provide better context**: Include more background information
- **Use specialized models**: CodeLlama for technical content

### Speaches Configuration Issues

**Symptom**: Transcription quality is poor or service is slow

**Model Selection:**
```bash
# List available models
speaches list-models

# Download recommended models
speaches download-model whisper-large-v2      # Best accuracy
speaches download-model whisper-medium.en     # Good balance
speaches download-model faster-whisper-small  # Speed focused
```

**Quality Optimization:**

**Audio Preprocessing:**
- **Noise reduction**: Clean audio before transcription
- **Volume normalization**: Ensure consistent audio levels
- **Format optimization**: Use high-quality audio formats
- **Speaker separation**: Ensure clear speaker differentiation

**Service Configuration:**
```bash
# Configure for better quality
speaches serve --port 8000 \
  --model whisper-large-v2 \
  --batch-size 4 \
  --temperature 0.1
```

## Search and Discovery Issues

### Search Performance Problems

**Symptom**: Search is slow or returns poor results

**Index Optimization:**
- **Rebuild search indexes**: Force index regeneration
- **Clear search cache**: Remove old cached results
- **Monitor index size**: Large indexes may need optimization
- **Update search settings**: Adjust relevance thresholds

**Search Quality Issues:**

**Poor Semantic Search Results:**
- **Check vector embeddings**: Ensure embeddings are generated
- **Verify embedding model**: Use appropriate model for your content
- **Update embedding service**: Ensure service is current and responsive
- **Test with known content**: Verify search works with familiar content

**Keyword Search Problems:**
- **Check indexing status**: Ensure all content is indexed
- **Verify text quality**: Poor transcription affects search quality
- **Use multiple search terms**: Try different keyword combinations
- **Check special characters**: Some characters may need escaping

### Content Discovery Issues

**Symptom**: Can't find content that should exist

**Systematic Content Search:**
1. **Check all projects**: Content might be in unexpected projects
2. **Review archive status**: Check if content has been archived
3. **Verify permissions**: Ensure you have access to view content
4. **Check processing status**: Confirm content processing completed

**Search Strategy Optimization:**
- **Use multiple search approaches**: Combine keyword and semantic search
- **Try different time ranges**: Content might be outside expected dates
- **Search by metadata**: Use speaker names, tags, or categories
- **Review recent items**: Check Recently Added or Recent Activity

**Content Organization Issues:**
- **Inconsistent tagging**: Develop systematic tagging strategy
- **Poor project organization**: Reorganize projects for better discovery
- **Missing metadata**: Add descriptive information to content
- **Unclear naming**: Use consistent, descriptive naming conventions

## Export and Sharing Issues

### Export Generation Failures

**Symptom**: Exports fail to generate or contain errors

**Common Export Problems:**

**Format-Specific Issues:**
- **PDF generation fails**: Check template compatibility and content size
- **Word document corruption**: Verify template format and content structure
- **JSON export errors**: Check for special characters or malformed data
- **CSV export truncation**: Verify data fits within format limitations

**Content Preparation:**
```bash
# Check content before export
# Verify transcript completeness
# Confirm analysis is complete
# Check for special characters that might cause issues
```

**Template Problems:**
- **Template corruption**: Re-download or recreate export templates
- **Missing template elements**: Verify all required template components exist
- **Formatting conflicts**: Check template compatibility with content type
- **Version mismatches**: Ensure templates match current DeepTalk version

### Sharing and Collaboration Issues

**Symptom**: Team members can't access shared content

**Permission Configuration:**
1. **Verify sharing settings**: Check that content is marked as shared
2. **Confirm user permissions**: Ensure team members have appropriate access levels
3. **Test sharing links**: Verify links work and aren't expired
4. **Check project membership**: Confirm users are added to relevant projects

**Access Control Issues:**
- **Role conflicts**: Review and adjust user roles and permissions
- **Project visibility**: Ensure projects are visible to intended users
- **Content restrictions**: Check if content has specific access limitations
- **System permissions**: Verify system-level access controls

**Collaboration Workflow Problems:**
- **Version conflicts**: Implement clear versioning and review processes
- **Communication gaps**: Establish clear collaboration protocols
- **Notification issues**: Verify notification settings and delivery
- **Integration problems**: Check integration with collaboration tools

## Data Recovery and Backup

### Content Recovery

**Symptom**: Important content appears to be lost or corrupted

**Recovery Steps:**
1. **Check trash/recycle bin**: Content might be marked as deleted
2. **Review backup systems**: Check for automatic or manual backups
3. **Examine temp files**: Look for processing temporary files
4. **Check file system**: Use file recovery tools if necessary

**Backup Strategies:**
- **Regular exports**: Export important projects regularly
- **Project duplication**: Maintain copies of critical projects
- **External storage**: Store backups on separate systems
- **Version control**: Track changes and maintain content history

**Prevention Measures:**
- **Automated backups**: Set up regular backup schedules
- **Redundant storage**: Use multiple backup locations
- **Regular verification**: Test backup integrity periodically
- **Documentation**: Maintain records of important content and locations

### System Recovery

**Symptom**: DeepTalk database or configuration is corrupted

**Database Recovery:**
1. **Stop DeepTalk**: Ensure application is completely closed
2. **Backup current state**: Copy database and configuration files
3. **Check database integrity**: Use database repair tools if available
4. **Restore from backup**: Use most recent known good backup

**Configuration Recovery:**
```bash
# Backup configuration
cp ~/.deeptalk/config.json ~/.deeptalk/config.json.backup

# Reset to defaults if corrupted
rm ~/.deeptalk/config.json
# Restart DeepTalk to regenerate defaults
```

**Complete System Recovery:**
1. **Document current state**: Note what content and settings exist
2. **Export accessible content**: Save anything that can be accessed
3. **Uninstall and reinstall**: Complete clean installation
4. **Restore content**: Import backed-up projects and transcripts
5. **Reconfigure settings**: Restore settings and service connections

## Advanced Troubleshooting

### Debugging Tools and Techniques

**Log Analysis:**
```bash
# Find DeepTalk logs
# macOS
~/Library/Logs/DeepTalk/

# Linux
~/.local/share/DeepTalk/logs/

# Windows
%APPDATA%/DeepTalk/logs/
```

**Network Debugging:**
```bash
# Test service connectivity
curl -v http://localhost:8000/health
curl -v http://localhost:11434/api/version

# Check port usage
netstat -an | grep 8000
netstat -an | grep 11434
```

**Performance Monitoring:**
```bash
# Monitor resource usage during operations
# Record memory, CPU, and disk usage patterns
# Identify bottlenecks and optimization opportunities
```

### Systematic Problem Isolation

**Problem Isolation Strategy:**
1. **Identify symptoms**: Document exactly what isn't working
2. **Test with minimal case**: Use simple test files and basic operations
3. **Eliminate variables**: Test one component at a time
4. **Document findings**: Record what works and what doesn't
5. **Escalate systematically**: Progress from simple to complex solutions

**Component Testing:**
- **File upload**: Test with small, simple audio files
- **Transcription**: Test each service independently
- **Analysis**: Test with known good transcripts
- **Export**: Test each format with simple content
- **Search**: Test with known content and simple queries

**Environment Testing:**
- **Clean environment**: Test in fresh installation or clean user profile
- **Minimal configuration**: Test with default settings
- **Different hardware**: Test on different systems if available
- **Different content**: Test with various file types and sizes

### Community Support and Bug Reporting

**Effective Bug Reports:**
1. **Clear description**: Explain exactly what happens vs. what should happen
2. **Steps to reproduce**: Provide detailed steps to recreate the issue
3. **System information**: Include OS, version, hardware specs
4. **Error messages**: Include complete error messages and log entries
5. **Test files**: Provide sample files that demonstrate the issue (if appropriate)

**Community Engagement:**
- **Search existing issues**: Check GitHub issues for similar problems
- **Participate in discussions**: Help others with similar issues
- **Share solutions**: Document solutions you discover
- **Provide feedback**: Help improve troubleshooting documentation

**Getting Professional Help:**
- **Document everything**: Maintain detailed records of issues and attempted solutions
- **Provide context**: Explain your use case and requirements
- **Be responsive**: Reply quickly to requests for additional information
- **Test suggestions**: Try proposed solutions and report results

---

**Need more help?** If these solutions don't resolve your issue, visit our [GitHub Discussions](https://github.com/michael-borck/deep-talk/discussions) for community support or [submit a bug report](https://github.com/michael-borck/deep-talk/issues) with detailed information about your problem.