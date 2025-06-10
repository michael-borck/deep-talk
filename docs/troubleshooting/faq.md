# Frequently Asked Questions

Quick answers to the most common DeepTalk questions. For more detailed troubleshooting, see the [Common Issues Guide](common-issues.md).

## Getting Started

### What are the system requirements?

**Minimum Requirements:**
- **Operating System**: Windows 10, macOS 10.14, or Linux (Ubuntu 18.04+)
- **RAM**: 4GB (8GB recommended for large files)
- **Storage**: 2GB free space (more for large content libraries)
- **CPU**: Multi-core processor recommended

**For Optimal Performance:**
- **RAM**: 8GB+ for large files and projects
- **Storage**: SSD recommended, 10GB+ for content libraries
- **CPU**: 4+ cores for faster processing
- **Network**: Stable internet for external services

### Do I need internet connection to use DeepTalk?

**Basic Functionality**: DeepTalk can work offline for:
- Viewing and editing existing transcripts
- Basic file management and organization
- Exporting content to various formats

**Internet Required For:**
- **External transcription services** (Speaches, cloud STT)
- **AI analysis and chat** (Ollama, cloud AI services)
- **Software updates** and feature downloads
- **Community support** and documentation access

### What audio formats are supported?

**Supported Audio Formats:**
- **MP3**: Most common, universally supported
- **WAV**: High quality, uncompressed
- **M4A**: Apple format, good compression
- **FLAC**: Lossless compression
- **OGG**: Open source format
- **AAC**: Advanced Audio Coding

**Supported Video Formats:**
- **MP4**: Most common video format
- **MOV**: Apple video format
- **AVI**: Windows video format
- **MKV**: Matroska video format

**File Size Limits:**
- **Maximum file size**: 2GB per file
- **Recommended size**: Under 500MB for optimal performance
- **Duration**: No specific limit, but longer files take more time to process

## Installation and Setup

### How do I install external services?

**For Speaches (Enhanced Transcription):**
```bash
# Option 1: Direct Installation
pip install speaches
speaches serve --port 8000

# Option 2: Docker
docker run -p 8000:8000 speaches/server
```

**For Ollama (AI Analysis):**
```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Download models
ollama pull llama2
ollama serve
```

**Configuration in DeepTalk:**
1. Open Settings → Services
2. Set Speaches URL: `http://localhost:8000`
3. Set Ollama URL: `http://localhost:11434`
4. Test connections and verify functionality

### Why can't DeepTalk connect to external services?

**Common Connection Issues:**

**Service Not Running:**
- Verify Speaches/Ollama services are started
- Check service status in terminal/command prompt
- Restart services if necessary

**Wrong URL Configuration:**
- Default Speaches: `http://localhost:8000`
- Default Ollama: `http://localhost:11434`
- Verify URLs in DeepTalk Settings

**Firewall/Network Issues:**
- Check firewall settings allow local connections
- Verify no other software using the same ports
- Test connectivity with browser or curl

**Service Configuration:**
- Ensure services are configured to accept connections
- Check service logs for error messages
- Verify correct models are downloaded (for Ollama)

### How do I update DeepTalk?

**Automatic Updates:**
- DeepTalk checks for updates automatically
- Notification appears when updates are available
- Follow prompts to download and install

**Manual Update Process:**
1. **Check current version**: Help → About DeepTalk
2. **Download latest**: Visit GitHub releases page
3. **Backup data**: Export important projects and settings
4. **Install update**: Run installer or replace application
5. **Verify functionality**: Test key features after update

**Update Best Practices:**
- **Backup before updating**: Export critical content
- **Read release notes**: Understand new features and changes
- **Test after update**: Verify everything works as expected
- **Report issues**: Submit bugs if problems occur

## Using DeepTalk

### How can I improve transcription quality?

**Audio Quality Optimization:**
- **Use high-quality recordings**: Clear audio produces better transcripts
- **Minimize background noise**: Record in quiet environments
- **Ensure good microphone placement**: Close to speakers, avoid echo
- **Use proper recording levels**: Avoid distortion or very quiet audio

**Service Configuration:**
- **Use enhanced services**: Speaches provides better accuracy than basic STT
- **Select appropriate models**: Choose models optimized for your content type
- **Configure language settings**: Ensure correct language is selected
- **Test different services**: Compare results across different providers

**Post-Processing Improvement:**
- **Review and edit transcripts**: Manual correction improves accuracy
- **Fix speaker labels**: Correct speaker identification and names
- **Add context**: Include background information for better understanding
- **Use consistent terminology**: Maintain consistent vocabulary across transcripts

### How can I improve analysis quality?

**Content Preparation:**
- **High-quality transcripts**: Accurate transcripts produce better analysis
- **Complete speaker information**: Proper speaker identification helps analysis
- **Contextual information**: Add relevant background and context
- **Consistent formatting**: Well-formatted transcripts analyze better

**AI Service Optimization:**
- **Use appropriate models**: Select models suitable for your content type
- **Configure analysis parameters**: Adjust depth and focus areas
- **Provide clear prompts**: Specific analysis requests produce better results
- **Use context effectively**: Include relevant background information

**Analysis Customization:**
- **Custom prompts**: Create specialized analysis templates
- **Focus areas**: Specify what aspects to emphasize
- **Industry-specific analysis**: Tailor analysis for your domain
- **Iterative improvement**: Refine analysis based on results

### How should I organize my projects?

**Project Structure Strategy:**
- **Purpose-based**: Organize by project goal or outcome
- **Time-based**: Group by date ranges or periods
- **Team-based**: Organize by departments or teams
- **Content-based**: Group by meeting type or subject matter

**Effective Organization:**
```
Recommended Project Structure:
├── Active Projects
│   ├── Q1 2024 Planning
│   ├── Product Launch Alpha
│   └── Team Retrospectives
├── Completed Projects
│   ├── Q4 2023 Review
│   ├── Hiring Interviews
│   └── Training Sessions
└── Templates and Standards
    ├── Meeting Templates
    ├── Analysis Templates
    └── Export Formats
```

**Best Practices:**
- **Consistent naming**: Use standardized naming conventions
- **Descriptive titles**: Include date, purpose, and participants
- **Regular maintenance**: Archive completed projects, update active ones
- **Tag systematically**: Use consistent tagging for easy discovery

### What's the difference between search modes?

**Vector Search Mode:**
- **How it works**: Finds similar content based on semantic meaning
- **Best for**: Discovering related concepts and themes
- **Speed**: Fast response times
- **Results**: Ranked by similarity with confidence scores

**Keyword Search Mode:**
- **How it works**: Finds exact word or phrase matches
- **Best for**: Finding specific quotes or precise information
- **Speed**: Very fast
- **Results**: Exact matches with context

**AI Chat Mode:**
- **How it works**: Combines search with AI interpretation
- **Best for**: Natural language questions and analysis
- **Speed**: Slower but more comprehensive
- **Results**: Conversational responses with explanations

**When to Use Each:**
- **Keyword search**: Finding specific quotes, names, or facts
- **Vector search**: Exploring themes, discovering related content
- **AI chat**: Complex questions requiring interpretation and analysis

## Advanced Features

### How do I set up automated workflows?

**Basic Automation Setup:**
1. **Define triggers**: What events should start automation
2. **Configure actions**: What should happen when triggered
3. **Set parameters**: Customize behavior and outputs
4. **Test workflow**: Verify automation works as expected

**Common Automation Examples:**
- **Daily reports**: Automatic export of daily transcript summaries
- **Project updates**: Regular analysis and reporting for ongoing projects
- **Quality assurance**: Automatic review and validation of processed content
- **Integration sync**: Automatic export to external systems

**Advanced Automation:**
- **Custom scripts**: Develop specialized automation scripts
- **API integration**: Connect with external workflow systems
- **Conditional logic**: Complex decision-making in automated processes
- **Error handling**: Robust error recovery and notification

### How do I integrate with other tools?

**Common Integrations:**

**Project Management:**
- **Export action items**: Send tasks to Jira, Asana, Trello
- **Sync timelines**: Update project schedules based on meeting content
- **Track decisions**: Monitor decision implementation and outcomes

**Document Management:**
- **Archive transcripts**: Store in SharePoint, Google Drive, Box
- **Generate reports**: Create documents in standard company formats
- **Version control**: Maintain document history and changes

**Communication Platforms:**
- **Share insights**: Post summaries to Slack, Teams channels
- **Notify stakeholders**: Automated updates via email or messaging
- **Collaboration**: Enable team discussion around transcript content

**Integration Methods:**
- **API connections**: Programmatic integration with business systems
- **Export automation**: Scheduled or triggered content distribution
- **Webhook integration**: Real-time notifications and updates
- **Manual workflows**: Streamlined manual processes for common tasks

### Can I customize analysis prompts?

**Yes, DeepTalk supports extensive analysis customization:**

**Custom Prompt Creation:**
- **Industry-specific analysis**: Tailor prompts for your business domain
- **Role-based perspectives**: Generate insights for different stakeholder groups
- **Outcome-focused analysis**: Emphasize specific types of results
- **Quality standards**: Apply consistent analysis criteria

**Prompt Categories:**
- **Executive summaries**: High-level insights for leadership
- **Technical analysis**: Detailed examination of technical discussions
- **Action item extraction**: Focus on tasks and follow-up items
- **Risk assessment**: Identify potential issues and concerns

**Template Management:**
- **Save reusable prompts**: Create libraries of analysis templates
- **Share with team**: Distribute standard analysis approaches
- **Version control**: Maintain prompt history and improvements
- **Performance tracking**: Monitor effectiveness of different prompts

## Troubleshooting

### DeepTalk won't start or crashes frequently

**Common Startup Issues:**
- **Check system requirements**: Verify minimum hardware/software requirements
- **Free up resources**: Close other applications, restart computer
- **Check permissions**: Ensure DeepTalk has necessary file system access
- **Review logs**: Look for error messages during startup

**Crash Prevention:**
- **Update software**: Ensure latest version of DeepTalk
- **Monitor resources**: Watch memory and CPU usage during operation
- **Manage file sizes**: Break up very large files into smaller segments
- **Regular maintenance**: Clear temporary files and restart periodically

### Processing takes too long or fails

**Performance Optimization:**

**For Transcription:**
- **Audio quality**: Better quality audio processes faster and more accurately
- **File size**: Smaller files process faster; consider splitting large files
- **Service selection**: Try different transcription services for speed/quality balance
- **System resources**: Ensure adequate RAM and CPU available

**For AI Analysis:**
- **Model selection**: Faster models for routine analysis, comprehensive models for detailed work
- **Content scope**: Analyze specific sections rather than entire long transcripts
- **Prompt efficiency**: Use focused, specific analysis prompts
- **Service configuration**: Optimize AI service settings for your hardware

**Processing Failures:**
- **Check service connectivity**: Verify external services are responding
- **Review file format**: Ensure supported audio/video format
- **Monitor system resources**: Avoid processing during high system load
- **Retry with smaller content**: Test with shorter files to isolate issues

### My exports don't look right

**Common Export Issues:**

**Formatting Problems:**
- **Template selection**: Choose appropriate template for your needs
- **Content selection**: Verify all desired elements are included
- **Format compatibility**: Ensure target format supports required features
- **Preview before export**: Check preview to identify issues early

**Missing Content:**
- **Selection settings**: Verify content selection includes all desired elements
- **Permission issues**: Ensure export has access to all referenced content
- **Template configuration**: Check that template includes all required sections
- **Processing status**: Ensure all content has completed processing

**Quality Improvement:**
- **Template customization**: Modify templates to better fit your needs
- **Content preparation**: Improve source content quality before export
- **Format optimization**: Choose formats that best support your content type
- **Review and iterate**: Test different options to find optimal settings

### I can't find content I know I uploaded

**Content Discovery:**

**Search Strategies:**
- **Use multiple search terms**: Try different keywords and phrases
- **Check all projects**: Content might be in unexpected projects
- **Review recent items**: Check Recent section on Home page
- **Search by metadata**: Use date, speaker, or tag filters

**Organization Check:**
- **Project assignments**: Verify content is assigned to expected projects
- **Archive status**: Check if content has been archived
- **Permission settings**: Ensure you have access to view content
- **Folder structure**: Review project and folder organization

**Recovery Options:**
- **Check trash/deleted items**: Content might be in trash folder
- **Review import history**: Check upload logs for processing status
- **Backup recovery**: Restore from backup if content was accidentally deleted
- **Contact support**: Get help if content appears to be lost

## Getting Help

### Where can I get additional support?

**Community Resources:**
- **GitHub Discussions**: https://github.com/michael-borck/deep-talk/discussions
- **GitHub Issues**: https://github.com/michael-borck/deep-talk/issues (for bug reports)
- **Documentation**: Complete guides in the docs/ directory

**Self-Help Resources:**
- **Common Issues Guide**: Detailed troubleshooting for frequent problems
- **User Guide**: Comprehensive feature explanations and usage guidance
- **Tutorials**: Step-by-step learning workflows
- **Features Guide**: In-depth capability documentation

**Before Requesting Help:**
- **Search existing issues**: Check if your problem has been reported
- **Try troubleshooting steps**: Follow relevant troubleshooting guides
- **Gather information**: Include error messages, system info, steps to reproduce
- **Test reproducibility**: Verify the issue occurs consistently

### How do I report bugs or request features?

**Bug Reports:**
1. **Check existing issues**: Search GitHub issues for similar problems
2. **Gather details**: Error messages, system information, steps to reproduce
3. **Create clear report**: Use GitHub issue template with all relevant information
4. **Provide examples**: Include sample files or screenshots if helpful

**Feature Requests:**
1. **Describe use case**: Explain the problem you're trying to solve
2. **Propose solution**: Suggest how the feature might work
3. **Consider alternatives**: Think about different approaches to the same goal
4. **Engage community**: Discuss with others who might benefit

**Effective Communication:**
- **Be specific**: Provide detailed, actionable information
- **Be respectful**: Remember that development is volunteer work
- **Be patient**: Complex issues take time to investigate and resolve
- **Follow up**: Provide additional information if requested

---

**Still need help?** Check the [Common Issues Guide](common-issues.md) for detailed troubleshooting, or visit our [GitHub Discussions](https://github.com/michael-borck/deep-talk/discussions) for community support.