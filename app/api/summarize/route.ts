// // app/api/summarize/route.ts
// import { NextResponse } from 'next/server';
// import OpenAI from 'openai';
// import { getTranscriptFromUrl } from '../../lib/getTranscript';

// const openai = new OpenAI({
//   apiKey: process.env.OPENROUTER_API_KEY,
//   baseURL: 'https://openrouter.ai/api/v1',
// });

// type SummarySection = {
//   title: string;
//   content: string;
// };

// type ImmersiveSummary = {
//   hook: string;
//   constraints: string;
//   coreMechanism: string;
//   escalationAndConsequences: string;
//   imagine: string;
//   newNormal: string;
//   openQuestionsAndTensions: string;
//   reflectionPrompts: string[];
// };

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const youtubeUrl = body?.youtubeUrl as string | null | undefined;
//     const transcript = body?.transcript as string | null | undefined;

//     const trimmedTranscript = (transcript ?? '').trim();
//     const trimmedUrl = (youtubeUrl ?? '').trim();

//     const hasManualTranscript = trimmedTranscript.length > 0;
//     const hasUrl = trimmedUrl.length > 0;

//     if (!hasManualTranscript && !hasUrl) {
//       return NextResponse.json(
//         {
//           status: 'error',
//           error: 'Paste a YouTube URL or transcript first.',
//         },
//         { status: 400 }
//       );
//     }

//     if (!process.env.OPENROUTER_API_KEY) {
//       return NextResponse.json(
//         {
//           status: 'error',
//           error: 'OPENROUTER_API_KEY is not configured on the server.',
//         },
//         { status: 500 }
//       );
//     }

//     // ---------------------------------------------
//     // TRANSCRIPT RETRIEVAL
//     // ---------------------------------------------

//     let effectiveTranscript = '';
//     let usedTranscriptFlag = false;
//     let usedYoutubeUrlFlag = false;

//     if (hasManualTranscript) {
//       effectiveTranscript = trimmedTranscript;
//       usedTranscriptFlag = true;
//     } else {
//       try {
//         effectiveTranscript = await getTranscriptFromUrl(trimmedUrl);
//         usedYoutubeUrlFlag = true;
//       } catch (err) {
//         console.error('[route] Transcript fetch error:', err);
//         return NextResponse.json(
//           {
//             status: 'no-transcript',
//             error:
//               "I couldn't find captions for this video or couldn't fetch them. Try another video or paste the transcript manually.",
//           },
//           { status: 200 }
//         );
//       }
//     }

//     // ---------------------------------------------
//     // PROMPTS
//     // ---------------------------------------------

//     const systemPrompt = `
// You are an expert science communicator who specializes in turning dense futurism and engineering lectures into immersive narrative briefings.

// You must output a single JSON object with the following shape and nothing else:

// {
//   "hook": "string",
//   "constraints": "string",
//   "coreMechanism": "string",
//   "escalationAndConsequences": "string",
//   "imagine": "string",
//   "newNormal": "string",
//   "openQuestionsAndTensions": "string",
//   "reflectionPrompts": ["string", "string", ...]
// }

// Guidelines:

// - **Hook**: Frame the core idea with curiosity + stakes. 2–4 sentences.
// - **Constraints**: Explain the physical/economic/engineering limits the idea must obey. 3–6 sentences.
// - **Core Mechanism**: Explain *how it works* operationally. 4–8 sentences.
// - **Escalation & Consequences**: Describe how scaling the concept transforms society, industry, risks. 4–8 sentences.
// - **Imagine**: A vivid, cinematic “you live here now” slice-of-life. 5–10 sentences. Sensory detail. Emotional texture. What a normal day feels like. Make it vivid and cool, generate hype
// - **New Normal**: What the stable, mature version of this future looks like. 3–6 sentences.
// - **Open Questions & Tensions**: Technical, ethical, geopolitical uncertainties. 3–6 sentences.
// - **Reflection Prompts**: 3–5 short, thought-provoking personal questions.

// Tone:
// - Concrete, grounded, adult.
// - No bullet lists except reflection prompts.
// - Avoid generic filler; each section should feel tailored to the transcript.
//     `.trim();

//     const userPrompt = `
// Here is the full transcript of the episode. Produce the JSON summary exactly as specified:

// """${effectiveTranscript}"""
// `.trim();

//     // ---------------------------------------------
//     // LLM CALL
//     // ---------------------------------------------

//     const completion = await openai.chat.completions.create({
//       model: 'x-ai/grok-4.1-fast:free',
//       messages: [
//         { role: 'system', content: systemPrompt },
//         { role: 'user', content: userPrompt },
//       ],
//       temperature: 0.7,
//       max_tokens: 1600,
//     });

//     const content = completion.choices[0]?.message?.content;

//     if (!content) {
//       return NextResponse.json(
//         {
//           status: 'error',
//           error: 'LLM returned an empty response.',
//         },
//         { status: 500 }
//       );
//     }

//     // ---------------------------------------------
//     // PARSE JSON OR FALLBACK
//     // ---------------------------------------------

//     let parsed: ImmersiveSummary;

//     try {
//       parsed = JSON.parse(content) as ImmersiveSummary;
//     } catch {
//       console.warn('[route] JSON parse failed. Returning fallback.');
//       const fallbackSection: SummarySection = {
//         title: 'Immersive Summary',
//         content,
//       };

//       return NextResponse.json(
//         {
//           status: 'ok',
//           summary: content,
//           sections: [fallbackSection],
//           meta: {
//             usedTranscript: usedTranscriptFlag,
//             usedYoutubeUrl: usedYoutubeUrlFlag,
//             parseFallback: true,
//           },
//         },
//         { status: 200 }
//       );
//     }

//     // ---------------------------------------------
//     // STRUCTURED SECTIONS (INCLUDING IMAGINE)
//     // ---------------------------------------------

//     const sections: SummarySection[] = [
//       { title: 'Hook', content: parsed.hook },
//       { title: 'Constraints', content: parsed.constraints },
//       { title: 'Core Mechanism', content: parsed.coreMechanism },
//       {
//         title: 'Escalation & Consequences',
//         content: parsed.escalationAndConsequences,
//       },
//       {
//         title: 'Imagine',
//         content: parsed.imagine,
//       },
//       { title: 'New Normal', content: parsed.newNormal },
//       {
//         title: 'Open Questions & Tensions',
//         content: parsed.openQuestionsAndTensions,
//       },
//       {
//         title: 'Reflection Prompts',
//         content: parsed.reflectionPrompts.join('\n• '),
//       },
//     ];

//     const summaryText = sections
//       .map((s) => `${s.title.toUpperCase()}\n${s.content}`)
//       .join('\n\n');

//     // ---------------------------------------------
//     // SUCCESS RESPONSE
//     // ---------------------------------------------

//     return NextResponse.json(
//       {
//         status: 'ok',
//         summary: summaryText,
//         sections,
//         meta: {
//           usedTranscript: usedTranscriptFlag,
//           usedYoutubeUrl: usedYoutubeUrlFlag,
//           parseFallback: false,
//         },
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error('Error in /api/summarize:', err);
//     return NextResponse.json(
//       {
//         status: 'error',
//         error: 'Something went wrong while generating the summary.',
//       },
//       { status: 500 }
//     );
//   }
// }

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
