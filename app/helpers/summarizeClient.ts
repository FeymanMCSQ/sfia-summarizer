// app/helpers/summarizeClient.ts

import type { SummarizeResponse } from './types';

export type SummarizeInput = {
  youtubeUrl: string | null;
  transcript: string | null;
};

export async function callSummarizeApi(
  input: SummarizeInput
): Promise<SummarizeResponse> {
  const res = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    const msg = data.error || 'Something went wrong.';
    throw new Error(msg);
  }

  const data = (await res.json()) as SummarizeResponse;
  return data;
}
