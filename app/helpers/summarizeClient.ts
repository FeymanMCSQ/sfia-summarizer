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

  let data: SummarizeResponse;
  try {
    data = (await res.json()) as SummarizeResponse;
  } catch {
    data = {};
  }

  if (!res.ok) {
    // HTTP-level error: normalize it into a structured error payload
    return {
      ...data,
      status: data.status ?? 'error',
      error: data.error ?? 'Something went wrong, try again.',
    };
  }

  return data;
}
