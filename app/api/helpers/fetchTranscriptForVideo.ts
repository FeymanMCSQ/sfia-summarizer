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
    const base = workerBase.replace(/\/$/, '');
    const url = `${base}/api/transcript?url=${encodeURIComponent(trimmed)}`;

    const resp = await fetch(url);
    const data: unknown = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const errObj =
        data && typeof data === 'object' ? (data as WorkerErrorResponse) : {};
      const code = errObj.errorCode ?? 'WORKER_ERROR';
      const message = errObj.message ?? 'Transcript worker returned an error.';
      throw new Error(`Transcript worker error [${code}]: ${message}`);
    }

    if (
      !data ||
      typeof data !== 'object' ||
      !isNonEmptyString((data as WorkerSuccessResponse).transcript)
    ) {
      throw new Error(
        'Transcript worker did not return a valid transcript string.'
      );
    }

    const { transcript } = data as WorkerSuccessResponse;
    return transcript;
  }

  // Fallback: use your local YouTube transcript code (dev)
  return getTranscriptFromUrl(trimmed);
}
