# DeepTalk UX Improvement Plan

**Created:** 2026-04-13
**Status:** Tier 1 + Tier 2 + Tier 3 complete. Tier 4 in progress — local transcription has replaced the Speaches dependency. Diarisation still on the LLM-based fallback (next phase). Build verified clean.

## Background

DeepTalk computes substantial analysis (sentiment, 6 emotion dimensions, speaker tagging, notable quotes, Q&A pairs, concept frequency, research themes) but most of it never renders on screen. The gap between "what's in the database" and "what a user sees" is the single biggest UX problem.

This plan addresses that gap in tiers, from highest-impact / lowest-effort first.

---

## Tier 1 — Surface what's already built but invisible

These features exist in the backend/database but aren't shown to users. Pure UI work, no new analysis logic.

### 1.1 Show sentiment + emotions on TranscriptDetailPage
- **Status:** Done (2026-04-13)
- New `SentimentCard` component (`src/components/SentimentCard.tsx`) — compact mode on Overview, full mode on Analysis tab
- Score bar visualisation (-1 to +1)
- Top emotions as horizontal bars
- **Where:** `src/pages/TranscriptDetailPage.tsx`, schema fields `sentiment_overall`, `sentiment_score`, `emotions` (JSON)
- **What to build:**
  - Sentiment card: overall label (positive/neutral/negative) + score bar (-1.0 to 1.0)
  - Emotion bars: 6 dimensions (frustration, excitement, confusion, confidence, anxiety, satisfaction) as horizontal bars
  - Place in the "Analysis" or "Overview" tab, near the summary
- **Acceptance:** Open any analysed transcript → see sentiment/emotions visually without clicking

### 1.2 Show validation changes (what AI corrected)
- **Status:** Done (2026-04-13)
- New `ValidationChangesCard` component (`src/components/ValidationChangesCard.tsx`)
- Shown on Overview tab with collapsed view + count badges by type (spelling/grammar/etc.)
- Expand to see original → corrected pairs (first 20)
- **Where:** `src/pages/TranscriptDetailPage.tsx`, schema field `validation_changes` (JSON)
- **What to build:**
  - Collapsed "AI Corrections" section showing original → corrected text
  - Count badge: "AI made N corrections"
  - User can expand to see specific changes (spelling, grammar, punctuation, capitalization)
- **Acceptance:** Trust signal — users can see what was changed and approve/dismiss

### 1.3 Find-in-transcript search
- **Status:** Done (2026-04-13)
- New `HighlightedText` component (`src/components/HighlightedText.tsx`)
- Search input now lives at the top of the Transcript tab (was previously dead UI at page level)
- Highlights matches inline, shows total match count badge, segments containing matches get a gold border
- Clear button (X) to reset
- **Where:** `src/pages/TranscriptDetailPage.tsx` (currently has `searchQuery` state but it filters Library, not the open transcript)
- **What to build:**
  - Search input at top of transcript view
  - Highlight all matches
  - Cmd/Ctrl+G to jump between matches, match counter ("3 of 12")
  - Cmd/Ctrl+F focuses the search input
- **Acceptance:** Researchers can find every mention of a keyword in the current transcript

### 1.4 Inline speaker labels in transcript view
- **Status:** Done (2026-04-13)
- `TimestampedTranscript` now reads `speaker` from `SentenceSegment` and renders coloured speaker badges per segment
- Stable colour palette across 6 distinct speakers
- Speaker tagging modal still available for editing
- **Where:** `src/components/TimestampedTranscript.tsx` (or wherever transcript is rendered)
- **What to build:**
  - When `speakers` data exists, prefix each segment with the speaker label
  - Color-code or visually distinguish each speaker
  - Speaker tagging modal stays for editing, but labels are visible inline by default
- **Acceptance:** Open a transcript with speaker tagging → labels visible without opening any modal

---

## Tier 2 — Port useful analysis from talk-buddy

Pure algorithmic, no LLM calls, high perceived value. Reference: `/Users/michael/Projects/talk-buddy/src/renderer/services/analysis.ts`.

### 2.1 Filler word detection
- **Status:** Done (2026-04-13)
- `detectFillerWords()` in `src/services/conversationMetricsService.ts`
- 18 single-word fillers + 8 multi-word phrases
- New `FillerWordsCard` shows percentage + top 5 with counts, banded rating
  (Excellent ≤2%, Good ≤5%, Noticeable ≤10%, High >10%)

### 2.2 Talk-time distribution per speaker
- **Status:** Done (2026-04-13)
- `analyzeTalkTime()` reads speaker info from sentence segments
- New `TalkTimeCard` shows stacked horizontal bar + per-speaker breakdown
  with words, duration (when available), and percentage
- Detects imbalance (>70% single speaker) and offers context note

### 2.3 Conversation Quality rubric (0-100 score)
- **Status:** Done (2026-04-13)
- Reframed from talk-buddy's personal "Fluency" to neutral observational
  "Quality" — appropriate for analysing other people's conversations
- Four factors, 0-25 each: **Clarity** (filler rate), **Depth** (turn length),
  **Balance** (talk-time evenness), **Pace** (words/min vs 130-170 ideal)
- New `ConversationQualityCard` shows score + factor bars + auto-generated
  strengths and observations
- Compact version on Overview tab, full version on Analysis tab

### Foundation
- New service `src/services/conversationMetricsService.ts` — pure functions,
  no LLM calls, no network. Exports `analyzeConversation()`, `detectFillerWords()`,
  `analyzeTalkTime()`, `countQuestions()`, `calculateQuality()`, `generateInsights()`.
- TranscriptDetailPage loads sentence segments for the current transcript and
  computes metrics with `useMemo`

---

## Tier 3 — Structural improvements

### 3.1 Audio playback synced to transcript
- **Status:** Done (2026-04-14)
- New `useAudioPlayer` hook (`src/hooks/useAudioPlayer.ts`) — loads local files via Electron IPC `fs.readFile`, wraps in Blob URL, exposes play/pause/seek/currentTime via an HTMLAudioElement ref
- New `AudioPlayerBar` component (`src/components/AudioPlayerBar.tsx`) — renders the `<audio>` element, play/pause button, scrubber, time display, error states
- `TimestampedTranscript` accepts `currentPlaybackTime` and `onSeek` props:
  - Click any segment → seeks audio to that segment's `start_time`
  - Currently playing segment is highlighted with primary border
  - Auto-scrolls into view
- Audio is unloaded when navigating away from a transcript

### 3.2 Export to DOCX and PDF
- **Status:** Done (2026-04-14)
- New `exportService.ts` with `buildDocx()` (using `docx@9.6.1`) and `buildPdf()` (using `jspdf@4.2.1`)
- `ExportModal` extended with two new format options; binary path uses async builder, downloads a Blob
- Both formats include metadata, analysis (sentiment, emotions, topics, action items), and the chosen transcript version
- DOCX uses native heading levels and bullet lists; PDF uses helvetica with hand-rolled layout (auto page breaks)

### 3.3 Move advanced settings into a collapsed section
- **Status:** Done (2026-04-14)
- New reusable `Collapsible` component (`src/components/Collapsible.tsx`) — closed by default
- Wrapped the "Advanced Chat Settings" panel (chunking method, max chunk size, chunk overlap, context chunks, memory limit) in a Collapsible
- Wrapped the Vector Database section in a Collapsible and renamed to "Chat Search Index" with friendlier copy
- Conversation Mode radios renamed: "Quote Lookup" / "Smart Search (Recommended)" / "Full Transcript" — non-developer language
- Removed remaining emoji from chat tab section headers

---

## Tier 4 — Simplify

### 4.0 Drop Speaches, run Whisper locally
- **Status:** Phase 1 done (2026-04-14). Phase 2 (diarisation) still pending.
- **Why:** DeepTalk pitched itself as "privacy-first local desktop" but required users to run a separate Speaches server. Bundling makes the marketing literally true and removes a whole category of bugs (CORS, auth, network).
- **Phase 1 — Local Whisper transcription (done):**
  - New spike script `scripts/spike-whisper.js` validated `@xenova/transformers` Whisper running entirely in-process: ~75 MB tiny.en model, 1.5x realtime, correct output, no network after first download.
  - `public/electron.js` — added `getWhisperPipeline()` (lazy singleton, cache in `app.getPath('userData')/models`), `decodeAudioToFloat32()` via bundled ffmpeg, two new IPC handlers: `local-transcription-load-model` and `local-transcription-transcribe`.
  - Deleted ~400 lines of legacy Speaches code: the entire `transcribe-audio` IPC handler, `transcribeSingleFile` helper, ffmpeg chunking pipeline, `get-speaches-models` handler.
  - Simplified `test-service-connection` to ollama-only (no more service branching, no apiKey).
  - `public/preload.js` — `audio.transcribe(audioPath, modelName)`, `audio.loadTranscriptionModel()`, `onTranscriptionProgress`/`offTranscriptionProgress` for download progress streaming. Removed `services.getSpeachesModels` and the old `audio.transcribeAudio` signature.
  - `src/types/index.ts` — updated `audio` and `services` interfaces.
  - `src/services/fileProcessor.ts` — reads `localTranscriptionModel` from settings (defaults to `Xenova/whisper-tiny.en`), calls `audio.transcribe()`. Dropped Speaches URL/key/model lookups.
  - `src/contexts/ServiceContext.tsx` — speech-to-text status is always `connected` (no server to test). Only Ollama is tested now.
  - `src/pages/SettingsPage.tsx` — Transcription tab fully rewritten:
    - Three-option radio picker: tiny.en (default, 75 MB, "Recommended"), base.en (140 MB, "Balanced"), small.en (470 MB, "Best accuracy")
    - "Download model now" button with live progress messages
    - Removed: Speaches server URL field, bearer key field, free-text model name input, Test button, Refresh models button, status indicator, audio chunk size slider
    - Removed state: `speechToTextUrl`, `speechToTextKey`, `speechToTextModel`, `availableSttModels`, `loadingSttModels`, `audioChunkSize`
    - Removed functions: `fetchSttModels`, the speaches branch of `handleTestConnection`
- **Phase 2 — Local diarisation (next):**
  - Add pyannote-segmentation + wespeaker-voxceleb embedding via transformers.js
  - Cluster embeddings → speaker labels per audio segment
  - Align with whisper segments by timestamp
  - Delete the entire LLM-based speaker tagging pipeline (`fileProcessor.ts` ~600-770)
  - Speaker tagging modal stays for renaming/merging only

### 4.1 Decide on project-level analysis
- `projectAnalysisService.ts` computes theme evolution, speaker interactions, sentiment trends, cross-transcript patterns
- Most never render — either build the UI or delete the dead code

### 4.2 Pick one analysis architecture
- `performAdvancedAnalysis` → `performLegacyAdvancedAnalysis` → 6 separate AI calls
- `oneTaskAtATime` toggle adds branching complexity
- Keep one path, delete the other

---

## Other UX issues identified (not yet tiered)

- Upload page forces project selection up front — should be "transcribe first, assign later"
- No bulk operations (export many, batch tag, select all)
- Analysis has no "done" feedback after transcription progress finishes
- STT confidence scores collected (`confidence` field) but never displayed
- Speaker diarisation has no quality feedback or "re-run with hints"
- No diff view for original vs corrected vs speaker-tagged versions

---

## Progress log

- **2026-04-13** — Plan created. Tier 1 complete: SentimentCard + ValidationChangesCard + HighlightedText components added; in-transcript search wired up; inline speaker labels in TimestampedTranscript; emoji icons replaced with Lucide throughout TranscriptDetailPage. Build verified.
- **2026-04-13** — Tier 2 complete: ported talk-buddy's algorithmic conversation analysis, reframed for DeepTalk's audience. New `conversationMetricsService.ts` (pure, no LLM). Three new cards: ConversationQualityCard, FillerWordsCard, TalkTimeCard. Surfaces appear on both Overview and Analysis tabs. Build verified.
- **2026-04-14** — Tier 3 complete: audio playback synced to transcript (useAudioPlayer hook + AudioPlayerBar component, click segments to seek, auto-scroll playing segment), DOCX/PDF export (new exportService using docx + jspdf), advanced settings collapsed under reusable Collapsible component. Build verified.
- **2026-04-14** — Tier 4 Phase 1 complete: dropped the Speaches dependency entirely. Whisper now runs in-process via @xenova/transformers (already installed). Validated end-to-end with the spike script — `hello.mp3` transcribed correctly in ~700 ms at 1.5x realtime with the tiny.en model. Settings page rewritten with a simple model picker (tiny.en/base.en/small.en) and a "Download now" button. ~400 lines of legacy Speaches code deleted from electron.js. Build verified clean. Spike script kept in `scripts/spike-whisper.js` as a reproducible validation tool.
- **Next:** Tier 4 Phase 2 — replace LLM-based speaker tagging with real audio diarisation using pyannote-segmentation + wespeaker via transformers.js. Then 4.1/4.2 — delete dead project-level analysis code, collapse dual analysis paths.
