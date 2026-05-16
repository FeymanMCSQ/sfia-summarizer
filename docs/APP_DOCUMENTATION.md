**Overview**
This app is a Next.js (App Router) UI that turns a YouTube video (or a manually pasted transcript) into an “immersive narrative” summary. The UI posts input to a single server endpoint, which retrieves captions/transcripts, runs an LLM prompt, and returns formatted sections for display.

**What It Does (User-Facing)**
1. You paste a YouTube URL or a raw transcript.
2. The app retrieves captions from YouTube (or uses the pasted transcript).
3. The server calls an LLM to transform the transcript into a multi-section narrative.
4. The UI displays the summary and sections.

**What It Calls (Network + System)**
- Client -> Server
  - `POST /api/summarize` from the browser.
- Server -> Transcript worker (optional)
  - `GET ${TRANSCRIPT_WORKER_URL}/api/transcript?url=<encoded>` if `TRANSCRIPT_WORKER_URL` is set.
- Server -> OpenRouter LLM
  - `POST https://openrouter.ai/api/v1` via the OpenAI SDK.
  - Model: `x-ai/grok-4.3`.
- Server -> System binary (local fallback)
  - `yt-dlp` is executed to download auto subtitles if the worker is not configured.

**Primary Entry Points**
- UI page: `app/page.tsx`
- Client API wrapper: `app/helpers/summarizeClient.ts`
- API route: `app/api/summarize/route.ts`
- Transcript retrieval: `app/api/helpers/fetchTranscriptForVideo.ts` and `app/lib/getTranscript.ts`
- LLM summary: `app/api/helpers/llmSummary.ts`

**End-to-End Flow**
1. UI collects a YouTube URL and/or a pasted transcript.
2. `callSummarizeApi` sends both fields to `POST /api/summarize`.
3. The server chooses a transcript source:
   - If a manual transcript is present, it is used directly.
   - Otherwise, `fetchTranscriptForVideo` is called to fetch captions.
4. The transcript is passed to `buildImmersiveSummaryFromTranscript`, which calls the OpenRouter LLM.
5. The response is normalized into sections and returned to the client for display.

**Transcript Retrieval Logic**
This is the core of “how it gets subtitles.”

**Path A: External Transcript Worker (preferred in production)**
File: `app/api/helpers/fetchTranscriptForVideo.ts`
- If `TRANSCRIPT_WORKER_URL` is set, the server calls:
  - `GET ${TRANSCRIPT_WORKER_URL}/api/transcript?url=<encoded>`
- The response is expected to be JSON with a non-empty `transcript` string.
- Errors are surfaced with detailed logging and a normalized error message.

**Path B: Local Fetch (development fallback)**
File: `app/lib/getTranscript.ts`
- Triggered when `TRANSCRIPT_WORKER_URL` is not set.
- Step 1: Try `youtube-transcript` library (HTTP based).
  - It fetches captions with language `en`.
  - The app concatenates caption segments into one string.
- Step 2: If that fails, fallback to `yt-dlp`.
  - A temporary directory is created in `os.tmpdir()`.
  - Command executed:
    - `yt-dlp --skip-download --write-auto-subs --sub-lang en --sub-format vtt -o "<tmp>/%(id)s.%(ext)s" "<url>"`
  - The `.vtt` subtitle file is read and converted to plain text by removing:
    - `WEBVTT` header
    - cue numbers
    - timestamp lines
    - blank lines
  - The temp directory is deleted afterward.

**Supported YouTube URL Shapes**
File: `app/lib/getTranscript.ts`
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://youtu.be/VIDEO_ID`

**LLM Summarization**
File: `app/api/helpers/llmSummary.ts`
- Uses OpenAI SDK configured with OpenRouter base URL.
- Requires `OPENROUTER_API_KEY`.
- Prompts the model to return a strict JSON object with sections:
  - hook, constraints, coreMechanism, escalationAndConsequences, imagine, newNormal, openQuestionsAndTensions, reflectionPrompts
- If JSON parsing fails, the response becomes a single fallback section labeled “Immersive Summary.”

**API Contract: `/api/summarize`**
File: `app/api/summarize/route.ts`

Input JSON:
- `youtubeUrl`: `string | null`
- `transcript`: `string | null`

Success response:
- `status: "ok"`
- `summary: string`
- `sections: { title: string, content: string }[]`
- `meta: { usedTranscript?: boolean, usedYoutubeUrl?: boolean, parseFallback?: boolean }`

Non-fatal “no transcript” response (HTTP 200):
- `status: "no-transcript"`
- `error: string`

Fatal error response:
- `status: "error"`
- `error: string`

**UI Behavior**
- If both URL and transcript are empty, the UI blocks submission.
- If `status === "no-transcript"`, the UI shows a “couldn’t fetch captions” error.
- If `status === "error"`, the UI shows a generic error unless a message is provided.
- The UI displays “Dev transcript mode” when a manual transcript was used.

**Environment Variables**
- `OPENROUTER_API_KEY` (required for summarization)
- `TRANSCRIPT_WORKER_URL` (optional, enables external transcript worker)

**Operational Requirements**
- Local transcript fallback requires `yt-dlp` on the server PATH.
- The server must be allowed to execute `yt-dlp` and read/write to `os.tmpdir()`.
- In serverless environments, the local fallback may not be permitted, so the worker is the reliable production path.

**Logging and Diagnostics**
- Transcript worker requests log:
  - URL used
  - HTTP status
  - response preview
  - whether a transcript field exists
- Local transcript logic logs previews and lengths for both `youtube-transcript` and `yt-dlp` paths.

**Known Limits and Edge Cases**
- If captions are not available on YouTube, the app returns `no-transcript`.
- `youtube-transcript` may fail on some videos, triggering the `yt-dlp` fallback.
- Auto subtitles are used for `yt-dlp` (`--write-auto-subs`), which may be lower quality.
- Only English captions are requested (`--sub-lang en`).
- If the LLM returns invalid JSON, the app degrades gracefully to a single raw section.

**File Map (Quick Reference)**
- UI page: `app/page.tsx`
- Client API: `app/helpers/summarizeClient.ts`
- API route: `app/api/summarize/route.ts`
- Transcript worker integration: `app/api/helpers/fetchTranscriptForVideo.ts`
- Local transcript fallback: `app/lib/getTranscript.ts`
- LLM prompt and parsing: `app/api/helpers/llmSummary.ts`
