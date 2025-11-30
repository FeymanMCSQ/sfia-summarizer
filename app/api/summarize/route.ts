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

//     // Choose transcript source
//     let effectiveTranscript: string;
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

//     const systemPrompt = `
// You are an expert science communicator who specializes in turning dense, narration-heavy futurism and engineering content into immersive narrative briefings.

// Your job is to read the raw transcript of a long-form YouTube video (for example, from "Science & Futurism with Isaac Arthur") and reconstruct the *cognitive journey* of the episode.

// You must produce a single JSON object with the following shape and nothing else:

// {
//   "hook": "string",
//   "constraints": "string",
//   "coreMechanism": "string",
//   "escalationAndConsequences": "string",
//   "newNormal": "string",
//   "openQuestionsAndTensions": "string",
//   "reflectionPrompts": ["string", "string", ...]
// }

// Guidelines:

// - **Hook**: Frame the central idea in a way that immediately creates curiosity and stakes. 2–4 sentences.
// - **Constraints**: Explain the physical, economic, or conceptual limits that the idea must obey (e.g., thermodynamics, orbital mechanics, materials, information limits). 3–6 sentences.
// - **Core Mechanism**: Explain *how it works* in practice, step by step, at a human-comprehensible scale. Avoid equations; use vivid but precise language. 4–8 sentences.
// - **Escalation & Consequences**: Show what happens as the system scales up over time: side effects, second-order impacts on society, politics, ecology, and individual lives. 4–8 sentences.
// - **New Normal**: Describe what everyday life looks like if this technology or idea becomes mature and common. 3–6 sentences.
// - **Open Questions & Tensions**: Highlight unresolved technical, ethical, or civilizational tensions the episode raises. 3–6 sentences.
// - **Reflection Prompts**: 3–5 short, thought-provoking questions that push the reader to apply or critique the ideas. They should not be trivia questions.

// Tone:

// - Clear, grounded, and concrete, as if you’re briefing an intelligent but non-specialist adult.
// - No bullet lists in the main sections; use paragraphs only.
// - You may compress or lightly re-order ideas from the transcript to create a cleaner cognitive arc, but do not invent science that contradicts the source.
// - Avoid generic filler. Each section should feel specific to this transcript, not like a template.
// `.trim();

//     const userPrompt = `
// You are given the raw transcript of a single YouTube episode.

// Your task is to read it carefully and output an immersive, narrative-style summary in the JSON format described above.

// Here is the transcript:

// """${effectiveTranscript}"""
// `.trim();

//     const completion = await openai.chat.completions.create({
//       model: 'x-ai/grok-4.1-fast:free',
//       messages: [
//         { role: 'system', content: systemPrompt },
//         { role: 'user', content: userPrompt },
//       ],
//       temperature: 0.7,
//       max_tokens: 1200,
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

//     let parsed: ImmersiveSummary;

//     try {
//       parsed = JSON.parse(content) as ImmersiveSummary;
//     } catch {
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

//     const sections: SummarySection[] = [
//       { title: 'Hook', content: parsed.hook },
//       { title: 'Constraints', content: parsed.constraints },
//       { title: 'Core Mechanism', content: parsed.coreMechanism },
//       {
//         title: 'Escalation & Consequences',
//         content: parsed.escalationAndConsequences,
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
import OpenAI from 'openai';
import { getTranscriptFromUrl } from '../../lib/getTranscript';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

type SummarySection = {
  title: string;
  content: string;
};

type ImmersiveSummary = {
  hook: string;
  constraints: string;
  coreMechanism: string;
  escalationAndConsequences: string;
  imagine: string;
  newNormal: string;
  openQuestionsAndTensions: string;
  reflectionPrompts: string[];
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const youtubeUrl = body?.youtubeUrl as string | null | undefined;
    const transcript = body?.transcript as string | null | undefined;

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

    // ---------------------------------------------
    // TRANSCRIPT RETRIEVAL
    // ---------------------------------------------

    let effectiveTranscript = '';
    let usedTranscriptFlag = false;
    let usedYoutubeUrlFlag = false;

    if (hasManualTranscript) {
      effectiveTranscript = trimmedTranscript;
      usedTranscriptFlag = true;
    } else {
      try {
        effectiveTranscript = await getTranscriptFromUrl(trimmedUrl);
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

    // ---------------------------------------------
    // PROMPTS
    // ---------------------------------------------

    const systemPrompt = `
You are an expert science communicator who specializes in turning dense futurism and engineering lectures into immersive narrative briefings.

You must output a single JSON object with the following shape and nothing else:

{
  "hook": "string",
  "constraints": "string",
  "coreMechanism": "string",
  "escalationAndConsequences": "string",
  "imagine": "string",
  "newNormal": "string",
  "openQuestionsAndTensions": "string",
  "reflectionPrompts": ["string", "string", ...]
}

Guidelines:

- **Hook**: Frame the core idea with curiosity + stakes. 2–4 sentences.
- **Constraints**: Explain the physical/economic/engineering limits the idea must obey. 3–6 sentences.
- **Core Mechanism**: Explain *how it works* operationally. 4–8 sentences.
- **Escalation & Consequences**: Describe how scaling the concept transforms society, industry, risks. 4–8 sentences.
- **Imagine**: A vivid, cinematic “you live here now” slice-of-life. 5–10 sentences. Sensory detail. Emotional texture. What a normal day feels like. Make it vivid and cool, generate hype
- **New Normal**: What the stable, mature version of this future looks like. 3–6 sentences.
- **Open Questions & Tensions**: Technical, ethical, geopolitical uncertainties. 3–6 sentences.
- **Reflection Prompts**: 3–5 short, thought-provoking personal questions.

Tone:
- Concrete, grounded, adult.
- No bullet lists except reflection prompts.
- Avoid generic filler; each section should feel tailored to the transcript.
    `.trim();

    const userPrompt = `
Here is the full transcript of the episode. Produce the JSON summary exactly as specified:

"""${effectiveTranscript}"""
`.trim();

    // ---------------------------------------------
    // LLM CALL
    // ---------------------------------------------

    const completion = await openai.chat.completions.create({
      model: 'x-ai/grok-4.1-fast:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1600,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'LLM returned an empty response.',
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------
    // PARSE JSON OR FALLBACK
    // ---------------------------------------------

    let parsed: ImmersiveSummary;

    try {
      parsed = JSON.parse(content) as ImmersiveSummary;
    } catch {
      console.warn('[route] JSON parse failed. Returning fallback.');
      const fallbackSection: SummarySection = {
        title: 'Immersive Summary',
        content,
      };

      return NextResponse.json(
        {
          status: 'ok',
          summary: content,
          sections: [fallbackSection],
          meta: {
            usedTranscript: usedTranscriptFlag,
            usedYoutubeUrl: usedYoutubeUrlFlag,
            parseFallback: true,
          },
        },
        { status: 200 }
      );
    }

    // ---------------------------------------------
    // STRUCTURED SECTIONS (INCLUDING IMAGINE)
    // ---------------------------------------------

    const sections: SummarySection[] = [
      { title: 'Hook', content: parsed.hook },
      { title: 'Constraints', content: parsed.constraints },
      { title: 'Core Mechanism', content: parsed.coreMechanism },
      {
        title: 'Escalation & Consequences',
        content: parsed.escalationAndConsequences,
      },
      {
        title: 'Imagine',
        content: parsed.imagine,
      },
      { title: 'New Normal', content: parsed.newNormal },
      {
        title: 'Open Questions & Tensions',
        content: parsed.openQuestionsAndTensions,
      },
      {
        title: 'Reflection Prompts',
        content: parsed.reflectionPrompts.join('\n• '),
      },
    ];

    const summaryText = sections
      .map((s) => `${s.title.toUpperCase()}\n${s.content}`)
      .join('\n\n');

    // ---------------------------------------------
    // SUCCESS RESPONSE
    // ---------------------------------------------

    return NextResponse.json(
      {
        status: 'ok',
        summary: summaryText,
        sections,
        meta: {
          usedTranscript: usedTranscriptFlag,
          usedYoutubeUrl: usedYoutubeUrlFlag,
          parseFallback: false,
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
