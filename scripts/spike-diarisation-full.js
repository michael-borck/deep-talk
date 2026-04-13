#!/usr/bin/env node
/**
 * Spike v3: full diarisation pipeline.
 *   - segmentation finds speech regions and local (per-window) speakers
 *   - wespeaker turns each region into a 256-d voice embedding
 *   - simple agglomerative clustering on cosine distance assigns global
 *     speaker IDs across the whole audio
 *
 * This is the algorithm we'll port to electron.js if it works.
 *
 * Usage: node scripts/spike-diarisation-full.js <audio-file>
 */

const { spawn } = require('child_process');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');

const SR = 16000;

// pyannote-segmentation-3.0 specifics
const PA_WINDOW_SECONDS = 5;          // model expects 5-second windows
const PA_FRAMES_PER_WINDOW = 293;     // empirically — model output frame count
// These get re-derived from the actual output; values above are reference.

function decodeAudioToFloat32(audioPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, [
      '-hide_banner', '-loglevel', 'error',
      '-i', audioPath,
      '-f', 'f32le', '-acodec', 'pcm_f32le',
      '-ac', '1', '-ar', String(SR),
      'pipe:1',
    ]);
    const chunks = [];
    let stderr = '';
    ffmpeg.stdout.on('data', (c) => chunks.push(c));
    ffmpeg.stderr.on('data', (c) => { stderr += c.toString(); });
    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg ${code}: ${stderr}`));
      const buf = Buffer.concat(chunks);
      const float32 = new Float32Array(
        buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4)
      );
      resolve(float32);
    });
  });
}

// Convert powerset class index → array of active speaker indices.
// pyannote-segmentation-3.0 uses 7 classes: silence + 3 single + 3 pairs.
//   0: none
//   1: spk0
//   2: spk1
//   3: spk2
//   4: spk0+spk1
//   5: spk0+spk2
//   6: spk1+spk2
const POWERSET = [
  [],         // 0
  [0],        // 1
  [1],        // 2
  [2],        // 3
  [0, 1],     // 4
  [0, 2],     // 5
  [1, 2],     // 6
];

function argmax(arr) {
  let bestIdx = 0;
  let bestVal = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > bestVal) { bestVal = arr[i]; bestIdx = i; }
  }
  return bestIdx;
}

// Run segmentation on a single audio window (≤5s of audio at 16 kHz)
// and return an array of frame → active-speakers maps.
async function segmentWindow(model, processor, audio) {
  const inputs = await processor(audio);
  const outputs = await model(inputs);
  const logits = outputs.logits;       // dims: [1, F, 7]
  const [_, F, C] = logits.dims;
  const data = logits.data;             // Float32Array of length F*C

  const frames = [];
  for (let f = 0; f < F; f++) {
    const start = f * C;
    const slice = data.subarray(start, start + C);
    const cls = argmax(slice);
    frames.push(POWERSET[cls]);
  }
  return frames;
}

// Convert frame-level speaker assignments into [start, end, localSpeakerId]
// "turns". Frame index → time = (frameIdx / framesPerWindow) * windowSeconds.
function framesToTurns(frames, windowSeconds, windowStart) {
  const turns = [];
  const framesPerSecond = frames.length / windowSeconds;

  for (let speaker = 0; speaker < 3; speaker++) {
    let inTurn = false;
    let startFrame = 0;
    for (let f = 0; f < frames.length; f++) {
      const active = frames[f].includes(speaker);
      if (active && !inTurn) {
        inTurn = true;
        startFrame = f;
      } else if (!active && inTurn) {
        inTurn = false;
        turns.push({
          start: windowStart + startFrame / framesPerSecond,
          end: windowStart + f / framesPerSecond,
          localSpeaker: speaker,
        });
      }
    }
    if (inTurn) {
      turns.push({
        start: windowStart + startFrame / framesPerSecond,
        end: windowStart + frames.length / framesPerSecond,
        localSpeaker: speaker,
      });
    }
  }
  return turns;
}

// Extract a voice embedding from an audio slice using wespeaker
async function embedTurn(model, processor, audio) {
  const inputs = await processor(audio);
  const outputs = await model(inputs);
  // wespeaker output is typically `embeddings` with shape [1, 256]
  const tensor = outputs.embeddings || outputs.last_hidden_state || Object.values(outputs)[0];
  return Array.from(tensor.data);
}

// Cosine similarity between two equal-length vectors
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

// Simple agglomerative clustering: start with one cluster per turn,
// repeatedly merge the most similar pair until no pair exceeds threshold.
function clusterTurns(turns, embeddings, threshold = 0.5) {
  const clusters = turns.map((_, i) => [i]);
  const centroids = embeddings.map((e) => e.slice());

  while (clusters.length > 1) {
    let bestI = -1, bestJ = -1, bestSim = -1;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const sim = cosine(centroids[i], centroids[j]);
        if (sim > bestSim) { bestSim = sim; bestI = i; bestJ = j; }
      }
    }
    if (bestSim < threshold) break;

    // Merge j into i, recompute centroid
    const merged = clusters[bestI].concat(clusters[bestJ]);
    const newCentroid = new Array(centroids[bestI].length).fill(0);
    for (const tIdx of merged) {
      for (let k = 0; k < newCentroid.length; k++) {
        newCentroid[k] += embeddings[tIdx][k];
      }
    }
    for (let k = 0; k < newCentroid.length; k++) {
      newCentroid[k] /= merged.length;
    }
    clusters[bestI] = merged;
    centroids[bestI] = newCentroid;
    clusters.splice(bestJ, 1);
    centroids.splice(bestJ, 1);
  }

  // Map turn index → global cluster ID
  const turnToCluster = new Array(turns.length);
  for (let c = 0; c < clusters.length; c++) {
    for (const turnIdx of clusters[c]) {
      turnToCluster[turnIdx] = c;
    }
  }
  return turnToCluster;
}

async function main() {
  const audioPath = process.argv[2];
  if (!audioPath) {
    console.error('Usage: node scripts/spike-diarisation-full.js <audio>');
    process.exit(1);
  }

  console.log('[diarise] decoding audio...');
  const audio = await decodeAudioToFloat32(path.resolve(audioPath));
  const audioSeconds = audio.length / SR;
  console.log(`[diarise] decoded ${audio.length} samples (${audioSeconds.toFixed(2)}s)`);

  console.log('[diarise] loading models...');
  const tx = await import('@huggingface/transformers');
  const { AutoProcessor, AutoModel, env } = tx;
  env.allowLocalModels = false;
  env.allowRemoteModels = true;

  const tSeg = Date.now();
  const segProcessor = await AutoProcessor.from_pretrained('onnx-community/pyannote-segmentation-3.0');
  const segModel = await AutoModel.from_pretrained('onnx-community/pyannote-segmentation-3.0');
  console.log(`[diarise] segmentation loaded in ${Date.now() - tSeg} ms`);

  const tEmb = Date.now();
  const embProcessor = await AutoProcessor.from_pretrained('onnx-community/wespeaker-voxceleb-resnet34-LM');
  const embModel = await AutoModel.from_pretrained('onnx-community/wespeaker-voxceleb-resnet34-LM');
  console.log(`[diarise] wespeaker loaded in ${Date.now() - tEmb} ms`);

  // ----- Segment in 5-second windows -----
  console.log('\n[diarise] running segmentation...');
  const allTurns = [];
  const windowSamples = PA_WINDOW_SECONDS * SR;
  for (let start = 0; start < audio.length; start += windowSamples) {
    const slice = audio.subarray(start, Math.min(start + windowSamples, audio.length));
    // Pad if necessary so the model gets a fixed-size input
    let windowAudio = slice;
    if (slice.length < windowSamples) {
      windowAudio = new Float32Array(windowSamples);
      windowAudio.set(slice);
    }
    const frames = await segmentWindow(segModel, segProcessor, windowAudio);
    const windowTurns = framesToTurns(frames, PA_WINDOW_SECONDS, start / SR);
    // Clip turns past the actual audio length (for the padded final window)
    for (const t of windowTurns) {
      if (t.start < audioSeconds) {
        t.end = Math.min(t.end, audioSeconds);
        if (t.end > t.start) allTurns.push(t);
      }
    }
  }
  console.log(`[diarise] found ${allTurns.length} local turns`);
  for (const t of allTurns.slice(0, 10)) {
    console.log(`  [${t.start.toFixed(2)}s → ${t.end.toFixed(2)}s] local speaker ${t.localSpeaker}`);
  }
  if (allTurns.length === 0) {
    console.log('No turns detected. Audio may be too short or pure silence.');
    return;
  }

  // ----- Embed each turn -----
  console.log('\n[diarise] computing embeddings...');
  const embeddings = [];
  for (const turn of allTurns) {
    const startSample = Math.floor(turn.start * SR);
    const endSample = Math.floor(turn.end * SR);
    const turnAudio = audio.subarray(startSample, endSample);
    if (turnAudio.length < SR * 0.25) {
      // Too short for a reliable embedding — repeat-pad it
      const padded = new Float32Array(Math.ceil(SR * 0.25));
      padded.set(turnAudio);
      embeddings.push(await embedTurn(embModel, embProcessor, padded));
    } else {
      embeddings.push(await embedTurn(embModel, embProcessor, turnAudio));
    }
  }
  console.log(`[diarise] computed ${embeddings.length} embeddings (dim=${embeddings[0].length})`);

  // ----- Cluster -----
  console.log('\n[diarise] clustering...');
  const labels = clusterTurns(allTurns, embeddings, 0.5);
  const speakerCount = new Set(labels).size;
  console.log(`[diarise] found ${speakerCount} unique speakers`);

  console.log('\n========== FINAL DIARISATION ==========');
  for (let i = 0; i < allTurns.length; i++) {
    const t = allTurns[i];
    console.log(`  [${t.start.toFixed(2)}s → ${t.end.toFixed(2)}s] Speaker ${labels[i]}`);
  }
  console.log('========================================');
}

main().catch((err) => {
  console.error('\n[FATAL]', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
