import path from 'path';

interface ProcessingCallbacks {
  onProgress?: (stage: string, percent: number) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export class FileProcessor {
  async processFile(
    filePath: string,
    transcriptId: string,
    callbacks: ProcessingCallbacks = {}
  ): Promise<void> {
    try {
      // Step 1: Get media info
      callbacks.onProgress?.('analyzing', 0);
      const mediaInfo = await window.electronAPI.audio.getMediaInfo(filePath);
      
      if (!mediaInfo.success) {
        throw new Error(mediaInfo.error || 'Failed to get media info');
      }

      let audioPath = filePath;
      
      // Step 2: Extract audio if it's a video file
      if (mediaInfo.hasVideo) {
        callbacks.onProgress?.('extracting', 0);
        
        // Create temp audio file path
        const tempDir = await window.electronAPI.fs.getAppPath('temp');
        const audioFileName = `${transcriptId}_audio.wav`;
        audioPath = path.join(tempDir, audioFileName);
        
        const extractResult = await window.electronAPI.audio.extractAudio(filePath, audioPath);
        
        if (!extractResult.success) {
          throw new Error(extractResult.error || 'Failed to extract audio');
        }
        
        callbacks.onProgress?.('extracting', 100);
      }

      // Step 3: Send to STT service
      callbacks.onProgress?.('transcribing', 0);
      // TODO: Implement STT service call
      // const transcriptResult = await sttService.transcribe(audioPath);
      
      // For now, simulate transcription
      await new Promise(resolve => setTimeout(resolve, 2000));
      callbacks.onProgress?.('transcribing', 100);

      // Step 4: AI Analysis
      callbacks.onProgress?.('analyzing', 0);
      // TODO: Implement AI analysis
      // const analysisResult = await aiService.analyze(transcriptText);
      
      // For now, simulate analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      callbacks.onProgress?.('analyzing', 100);

      // Step 5: Save to database
      callbacks.onProgress?.('saving', 0);
      
      // Update transcript with results
      await window.electronAPI.database.run(
        `UPDATE transcripts 
         SET status = ?, duration = ?, processing_completed_at = ?
         WHERE id = ?`,
        ['completed', mediaInfo.duration || 0, new Date().toISOString(), transcriptId]
      );
      
      callbacks.onProgress?.('saving', 100);
      
      // Cleanup temp files if needed
      if (audioPath !== filePath) {
        // TODO: Delete temp audio file
      }

      callbacks.onComplete?.();
    } catch (error) {
      console.error('Processing error:', error);
      
      // Update transcript with error
      await window.electronAPI.database.run(
        `UPDATE transcripts 
         SET status = ?, error_message = ?
         WHERE id = ?`,
        ['error', (error as Error).message, transcriptId]
      );
      
      callbacks.onError?.(error as Error);
    }
  }

  getStageLabel(stage: string): string {
    switch (stage) {
      case 'analyzing':
        return 'Analyzing media...';
      case 'extracting':
        return 'Extracting audio...';
      case 'transcribing':
        return 'Transcribing...';
      case 'saving':
        return 'Saving results...';
      default:
        return 'Processing...';
    }
  }
}

export const fileProcessor = new FileProcessor();