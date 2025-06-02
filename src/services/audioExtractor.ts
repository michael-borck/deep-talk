import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export class AudioExtractor {
  private ffmpegPath: string;

  constructor() {
    this.ffmpegPath = this.getFFmpegPath();
  }

  private getFFmpegPath(): string {
    // Get the bundled FFmpeg path based on platform
    const platform = process.platform;
    const isPackaged = process.mainModule?.filename.indexOf('app.asar') !== -1;
    
    let ffmpegName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    
    if (isPackaged) {
      // In production, use resourcesPath
      // Note: resourcesPath is only available in main process
      // This will be handled by the main process via IPC
      return path.join('resources', 'bin', ffmpegName);
    } else {
      // In development, use project directory
      return path.join(__dirname, '..', '..', '..', 'ffmpeg-binaries', platform, ffmpegName);
    }
  }

  async extractAudio(inputPath: string, outputPath: string, onProgress?: (percent: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      // Build FFmpeg command for audio extraction
      // -i: input file
      // -vn: no video
      // -acodec pcm_s16le: 16-bit PCM audio (best for STT)
      // -ar 16000: 16kHz sample rate (optimal for speech)
      // -ac 1: mono channel (reduces file size, good for speech)
      const command = `"${this.ffmpegPath}" -i "${inputPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}" -y`;

      const ffmpeg = exec(command);
      
      let duration = 0;
      
      // Parse FFmpeg output for progress
      ffmpeg.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        
        // Extract total duration
        const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
        if (durationMatch && duration === 0) {
          const hours = parseInt(durationMatch[1]);
          const minutes = parseInt(durationMatch[2]);
          const seconds = parseInt(durationMatch[3]);
          duration = hours * 3600 + minutes * 60 + seconds;
        }
        
        // Extract current time for progress
        const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
        if (timeMatch && duration > 0) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const seconds = parseInt(timeMatch[3]);
          const currentTime = hours * 3600 + minutes * 60 + seconds;
          const percent = Math.min(100, Math.round((currentTime / duration) * 100));
          
          if (onProgress) {
            onProgress(percent);
          }
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg error: ${error.message}`));
      });

      ffmpeg.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });
    });
  }

  async getMediaInfo(inputPath: string): Promise<{
    duration: number;
    hasVideo: boolean;
    hasAudio: boolean;
    audioCodec?: string;
    videoCodec?: string;
  }> {
    try {
      // Use ffprobe to get media information
      const ffprobePath = this.ffmpegPath.replace('ffmpeg', 'ffprobe');
      const command = `"${ffprobePath}" -v quiet -print_format json -show_streams -show_format "${inputPath}"`;
      
      const { stdout } = await execAsync(command);
      const info = JSON.parse(stdout);
      
      const audioStream = info.streams?.find((s: any) => s.codec_type === 'audio');
      const videoStream = info.streams?.find((s: any) => s.codec_type === 'video');
      
      return {
        duration: parseFloat(info.format?.duration || '0'),
        hasVideo: !!videoStream,
        hasAudio: !!audioStream,
        audioCodec: audioStream?.codec_name,
        videoCodec: videoStream?.codec_name
      };
    } catch (error) {
      // If ffprobe fails, try with ffmpeg
      return this.getMediaInfoFallback(inputPath);
    }
  }

  private async getMediaInfoFallback(inputPath: string): Promise<{
    duration: number;
    hasVideo: boolean;
    hasAudio: boolean;
    audioCodec?: string;
    videoCodec?: string;
  }> {
    return new Promise((resolve) => {
      const command = `"${this.ffmpegPath}" -i "${inputPath}" -f null -`;
      const ffmpeg = exec(command);
      
      let output = '';
      ffmpeg.stderr?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      ffmpeg.on('exit', () => {
        const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
        let duration = 0;
        
        if (durationMatch) {
          const hours = parseInt(durationMatch[1]);
          const minutes = parseInt(durationMatch[2]);
          const seconds = parseInt(durationMatch[3]);
          duration = hours * 3600 + minutes * 60 + seconds;
        }
        
        const hasVideo = output.includes('Video:');
        const hasAudio = output.includes('Audio:');
        
        resolve({
          duration,
          hasVideo,
          hasAudio,
          audioCodec: hasAudio ? 'unknown' : undefined,
          videoCodec: hasVideo ? 'unknown' : undefined
        });
      });
    });
  }

  isVideoFile(filePath: string): boolean {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v'];
    const ext = path.extname(filePath).toLowerCase();
    return videoExtensions.includes(ext);
  }

  isAudioFile(filePath: string): boolean {
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.opus', '.wma', '.aac'];
    const ext = path.extname(filePath).toLowerCase();
    return audioExtensions.includes(ext);
  }
}

// Singleton instance
export const audioExtractor = new AudioExtractor();