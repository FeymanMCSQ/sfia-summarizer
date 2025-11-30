// app/api/helpers/fetchTranscriptForVideo.ts
import { getTranscriptFromUrl } from '../../lib/getTranscript';

const workerBase = process.env.TRANSCRIPT_WORKER_URL ?? '';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

type WorkerSuccessResponse = {
  transcript: string;
  length?: number;
  errorCode?: null;
};

type WorkerErrorResponse = {
  errorCode?: string;
  message?: string;
};

export async function fetchTranscriptForVideo(
  youtubeUrl: string
): Promise<string> {
  const trimmed = youtubeUrl.trim();
  if (!trimmed) {
    throw new Error('fetchTranscriptForVideo: youtubeUrl is empty.');
  }

  // If we have a transcript worker configured (Railway), use that.
  if (workerBase) {
    console.log('[fetchTranscriptForVideo] Using transcript worker:', workerBase);
    const base = workerBase.replace(/\/$/, '');
    const url = `${base}/api/transcript?url=${encodeURIComponent(trimmed)}`;

    console.log('[fetchTranscriptForVideo] Calling worker URL:', url);
    
    let resp: Response;
    try {
      resp = await fetch(url);
    } catch (fetchErr) {
      console.error('[fetchTranscriptForVideo] Fetch failed:', fetchErr);
      throw new Error(`Failed to connect to transcript worker: ${fetchErr instanceof Error ? fetchErr.message : 'Unknown error'}`);
    }

    let data: unknown;
    try {
      const text = await resp.text();
      console.log('[fetchTranscriptForVideo] Response status:', resp.status);
      console.log('[fetchTranscriptForVideo] Response text preview:', text.slice(0, 500));
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('[fetchTranscriptForVideo] JSON parse failed:', parseErr);
      throw new Error('Transcript worker returned invalid JSON response.');
    }

    if (!resp.ok) {
      const errObj =
        data && typeof data === 'object' ? (data as WorkerErrorResponse) : {};
      const code = errObj.errorCode ?? 'WORKER_ERROR';
      const message = errObj.message ?? 'Transcript worker returned an error.';
      console.error('[fetchTranscriptForVideo] Worker error:', { code, message, status: resp.status, data });
      throw new Error(`Transcript worker error [${code}]: ${message}`);
    }

    console.log('[fetchTranscriptForVideo] Response data keys:', data && typeof data === 'object' ? Object.keys(data) : 'not an object');
    console.log('[fetchTranscriptForVideo] Has transcript field?', data && typeof data === 'object' && 'transcript' in data);
    
    if (
      !data ||
      typeof data !== 'object' ||
      !isNonEmptyString((data as WorkerSuccessResponse).transcript)
    ) {
      console.error('[fetchTranscriptForVideo] Invalid response structure:', {
        isObject: typeof data === 'object',
        hasTranscript: data && typeof data === 'object' && 'transcript' in data,
        transcriptType: data && typeof data === 'object' && 'transcript' in data ? typeof (data as any).transcript : 'N/A',
        transcriptValue: data && typeof data === 'object' && 'transcript' in data ? String((data as any).transcript).slice(0, 100) : 'N/A',
        fullData: JSON.stringify(data).slice(0, 500)
      });
      throw new Error(
        'Transcript worker did not return a valid transcript string.'
      );
    }

    const { transcript } = data as WorkerSuccessResponse;
    console.log('[fetchTranscriptForVideo] Success! Transcript length:', transcript.length);
    return transcript;
  }

  // Fallback: use your local YouTube transcript code (dev)
  console.log('[fetchTranscriptForVideo] TRANSCRIPT_WORKER_URL not set, falling back to local transcript fetching');
  return getTranscriptFromUrl(trimmed);
}
