#!/usr/bin/env node
/**
 * Spike: prove that @huggingface/transformers can transcribe a local
 * audio file inside Node.js without any external server.
 *
 * Usage:
 *   node scripts/spike-whisper.js /path/to/audio.mp3
 *
 * What it does:
 *   1. Spawns the bundled ffmpeg-static to decode the input file to raw
 *      16 kHz mono PCM Float32 (the format Whisper expects).
 *   2. Dynamically imports @huggingface/transformers (ESM-only) from CJS.
 *   3. Loads the whisper-tiny.en pipeline (~75 MB, downloaded on first run
 *      and cached under .cache/huggingface/hub in the cwd).
 *   4. Runs transcription with timestamps.
 *   5. Prints the result.
 *
 * Kept in the repo as a reproducible regression test for the Whisper
 * pipeline that powers the in-app local transcription.
 */

const { spawn } = require('child_process');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');

// ---------- Audio decoding ----------

function decodeAudioToFloat32(audioPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n[ffmpeg] decoding ${audioPath} to 16 kHz mono PCM...`);
    const t0 = Date.now();

    const ffmpeg = spawn(ffmpegPath, [
      '-hide_banner',
      '-loglevel', 'error',
      '-i', audioPath,
      '-f', 'f32le',           // raw 32-bit float little-endian
      '-acodec', 'pcm_f32le',
      '-ac', '1',              // mono
      '-ar', '16000',          // 16 kHz
      'pipe:1',                // write PCM to stdout
    ]);

    const chunks = [];
    let stderr = '';

    ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}\nstderr: ${stderr}`));
        return;
      }
      const buffer = Buffer.concat(chunks);
      // Float32Array view over the same memory
      const float32 = new Float32Array(
        buffer.buffer,
        buffer.byteOffset,
        Math.floor(buffer.byteLength / 4)
      );
      const seconds = float32.length / 16000;
      console.log(`[ffmpeg] decoded ${float32.length} samples (${seconds.toFixed(2)}s) in ${Date.now() - t0} ms`);
      resolve(float32);
    });
  });
}

// ---------- Transcription ----------

async function transcribe(audioPath) {
  // Dynamic import — transformers.js v4 is ESM-only and we're in CJS land.
  console.log('[transformers.js] loading library...');
  const tx = await import('@huggingface/transformers');
  const { pipeline, env } = tx;

  // Allow downloading models from the Hugging Face Hub
  env.allowLocalModels = false;
  env.allowRemoteModels = true;

  // Surface progress while the model downloads (first run only)
  const progressCallback = (data) => {
    if (data.status === 'progress') {
      const pct = data.progress?.toFixed(1) ?? '?';
      process.stdout.write(`\r[download] ${data.file ?? ''} ${pct}%   `);
    } else if (data.status === 'done') {
      console.log(`\n[download] done: ${data.file ?? ''}`);
    } else if (data.status === 'ready') {
      console.log(`[transformers.js] model ready: ${data.model ?? ''}`);
    } else if (data.status === 'initiate') {
      console.log(`[download] starting: ${data.file ?? ''}`);
    }
  };

  console.log('[transformers.js] loading whisper-tiny.en pipeline...');
  const t0 = Date.now();
  const transcriber = await pipeline(
    'automatic-speech-recognition',
    'Xenova/whisper-tiny.en',
    { progress_callback: progressCallback }
  );
  console.log(`[transformers.js] pipeline ready in ${Date.now() - t0} ms`);

  // Decode the audio to the format whisper expects
  const audio = await decodeAudioToFloat32(audioPath);

  if (audio.length === 0) {
    throw new Error('Decoded audio is empty — ffmpeg may have failed silently');
  }

  console.log('\n[whisper] transcribing...');
  const t1 = Date.now();
  const result = await transcriber(audio, {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: true,
  });
  const elapsed = Date.now() - t1;

  console.log(`\n[whisper] done in ${elapsed} ms`);

  console.log('\n========== RESULT ==========');
  console.log('Text:', result.text);
  if (Array.isArray(result.chunks)) {
    console.log(`\nChunks (${result.chunks.length}):`);
    for (const c of result.chunks) {
      const ts = Array.isArray(c.timestamp)
        ? `[${c.timestamp[0]?.toFixed?.(2)}s → ${c.timestamp[1]?.toFixed?.(2)}s]`
        : '';
      console.log(`  ${ts} ${c.text}`);
    }
  }
  console.log('============================\n');

  // Performance summary
  const audioSeconds = audio.length / 16000;
  const realtimeFactor = (audioSeconds / (elapsed / 1000)).toFixed(2);
  console.log(`Audio length:      ${audioSeconds.toFixed(2)}s`);
  console.log(`Transcription:     ${(elapsed / 1000).toFixed(2)}s`);
  console.log(`Realtime factor:   ${realtimeFactor}x  (>1 = faster than realtime)`);
}

// ---------- Entry ----------

const audioPath = process.argv[2];
if (!audioPath) {
  console.error('Usage: node scripts/spike-whisper.js <audio-file>');
  process.exit(1);
}

const absolutePath = path.resolve(audioPath);

transcribe(absolutePath)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n[ERROR]', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  });
