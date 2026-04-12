# DeepTalk UX Improvement Plan

**Created:** 2026-04-13
**Status:** Tier 1 + Tier 2 complete. Build verified clean.

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
- Click any line/segment → play audio from that timestamp
- Highlight currently-playing segment
- Reuse `start_time`/`end_time` already in `transcript_segments`

### 3.2 Export to DOCX and PDF
- Currently supports TXT, Markdown, JSON only
- Add DOCX (for reports) and PDF (for sharing)
- Optional: include analysis summary in export

### 3.3 Move advanced settings into a collapsed section
- Hide chunking method, vector store reset, prompt editor under "Advanced"
- Keep transcription/AI service config visible by default
- Reduces overwhelm for non-technical users

---

## Tier 4 — Simplify

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
- **Next:** Tier 3 — audio playback synced to transcript, DOCX/PDF export, move advanced settings into a collapsed section.
