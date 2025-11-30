// app/api/summarize/route.ts
import { NextResponse } from 'next/server';
import { fetchTranscriptForVideo } from '../helpers/fetchTranscriptForVideo';
import { buildImmersiveSummaryFromTranscript } from '../helpers/llmSummary';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const youtubeUrl = (body?.youtubeUrl as string | null | undefined) ?? null;
    const transcript = (body?.transcript as string | null | undefined) ?? null;

    const trimmedTranscript = (transcript ?? '').trim();
    const trimmedUrl = (youtubeUrl ?? '').trim();

    const hasManualTranscript = trimmedTranscript.length > 0;
    const hasUrl = trimmedUrl.length > 0;

    if (!hasManualTranscript && !hasUrl) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Paste a YouTube URL or transcript first.',
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'OPENROUTER_API_KEY is not configured on the server.',
        },
        { status: 500 }
      );
    }

    // ------------------------------
    // Transcript retrieval
    // ------------------------------
    let effectiveTranscript = '';
    let usedTranscriptFlag = false;
    let usedYoutubeUrlFlag = false;

    if (hasManualTranscript) {
      effectiveTranscript = trimmedTranscript;
      usedTranscriptFlag = true;
    } else {
      try {
        effectiveTranscript = await fetchTranscriptForVideo(trimmedUrl);
        usedYoutubeUrlFlag = true;
      } catch (err) {
        console.error('[route] Transcript fetch error:', err);
        return NextResponse.json(
          {
            status: 'no-transcript',
            error:
              "I couldn't find captions for this video or couldn't fetch them. Try another video or paste the transcript manually.",
          },
          { status: 200 }
        );
      }
    }

    // ------------------------------
    // LLM summary
    // ------------------------------
    const { sections, summaryText, parseFallback } =
      await buildImmersiveSummaryFromTranscript(effectiveTranscript);

    return NextResponse.json(
      {
        status: 'ok',
        summary: summaryText,
        sections,
        meta: {
          usedTranscript: usedTranscriptFlag,
          usedYoutubeUrl: usedYoutubeUrlFlag,
          parseFallback,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in /api/summarize:', err);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Something went wrong while generating the summary.',
      },
      { status: 500 }
    );
  }
}
