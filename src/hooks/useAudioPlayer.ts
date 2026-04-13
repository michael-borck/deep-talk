import { useState, useEffect, useRef, useCallback } from 'react';

export type AudioLoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface AudioPlayerState {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  loadState: AudioLoadState;
  errorMessage: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  load: (filePath: string) => Promise<void>;
  unload: () => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
}

/**
 * useAudioPlayer — manages an HTMLAudioElement and a Blob URL loaded via
 * Electron IPC from a local file path. The element itself is rendered by
 * the consumer; we just expose state and controls.
 */
export function useAudioPlayer(): AudioPlayerState {
  const audioRef = useRef<HTMLAudioElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [loadState, setLoadState] = useState<AudioLoadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Wire up audio element listeners once it's mounted
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoadState('ready');
    };
    const onError = () => {
      setLoadState('error');
      setErrorMessage('This file format cannot be played in the browser. Audio playback requires MP3, WAV, M4A, or compatible audio.');
    };
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // Clean up the blob URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const unload = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setLoadState('idle');
    setErrorMessage(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const load = useCallback(async (filePath: string) => {
    setLoadState('loading');
    setErrorMessage(null);

    try {
      // Use the safe-file:// custom protocol registered in the main process.
      // This lets the browser stream the file directly from disk with range
      // requests — no full-file buffering, instant playback on large videos.
      const url = `safe-file:///${encodeURI(filePath.replace(/^\/+/, ''))}`;

      // Revoke any previous blob URL left over (shouldn't happen, but safe)
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      const audio = audioRef.current;
      if (audio) {
        audio.src = url;
        audio.load();
      }
    } catch (error) {
      setLoadState('error');
      setErrorMessage(`Could not open audio file: ${(error as Error).message}`);
    }
  }, []);

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {
      // Browser may block autoplay; surface as error
      setErrorMessage('Playback was blocked by the browser. Click play again.');
    });
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play();
    else pause();
  }, [play, pause]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = Math.max(0, Math.min(seconds, audio.duration || seconds));
    audio.currentTime = target;
  }, []);

  return {
    audioRef,
    loadState,
    errorMessage,
    isPlaying,
    currentTime,
    duration,
    load,
    unload,
    play,
    pause,
    toggle,
    seek,
  };
}
