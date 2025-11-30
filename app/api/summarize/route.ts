// app/api/summarize/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Configure OpenRouter via OpenAI-compatible SDK
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

    const hasTranscript = trimmedTranscript.length > 0;
    const hasUrl = trimmedUrl.length > 0;

    if (!hasTranscript && !hasUrl) {
      return NextResponse.json(
        { error: 'Either transcript or youtubeUrl is required.' },
        { status: 400 }
      );
    }

    if (!hasTranscript) {
      // For now we only support dev transcript mode
      return NextResponse.json(
        {
          error:
            'Transcript mode only for now. Paste the raw transcript in the dev field.',
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is not configured on the server.' },
        { status: 500 }
      );
    }

    const systemPrompt = `
You are an expert science communicator who specializes in turning dense, narration-heavy futurism and engineering content into immersive narrative briefings.

Your job is to read the raw transcript of a long-form YouTube video (for example, from "Science & Futurism with Isaac Arthur") and reconstruct the *cognitive journey* of the episode.

You must produce a single JSON object with the following shape and nothing else:

{
  "hook": "string",
  "constraints": "string",
  "coreMechanism": "string",
  "escalationAndConsequences": "string",
  "newNormal": "string",
  "openQuestionsAndTensions": "string",
  "reflectionPrompts": ["string", "string", ...]
}

Guidelines:

- **Hook**: Frame the central idea in a way that immediately creates curiosity and stakes. 2–4 sentences.
- **Constraints**: Explain the physical, economic, or conceptual limits that the idea must obey (e.g., thermodynamics, orbital mechanics, materials, information limits). 3–6 sentences.
- **Core Mechanism**: Explain *how it works* in practice, step by step, at a human-comprehensible scale. Avoid equations; use vivid but precise language. 4–8 sentences.
- **Escalation & Consequences**: Show what happens as the system scales up over time: side effects, second-order impacts on society, politics, ecology, and individual lives. 4–8 sentences.
- **New Normal**: Describe what everyday life looks like if this technology or idea becomes mature and common. 3–6 sentences.
- **Open Questions & Tensions**: Highlight unresolved technical, ethical, or civilizational tensions the episode raises. 3–6 sentences.
- **Reflection Prompts**: 3–5 short, thought-provoking questions that push the reader to apply or critique the ideas. They should not be trivia questions.

Tone:

- Clear, grounded, and concrete, as if you’re briefing an intelligent but non-specialist adult.
- No bullet lists in the main sections; use paragraphs only.
- You may compress or lightly re-order ideas from the transcript to create a cleaner cognitive arc, but do not invent science that contradicts the source.
- Avoid generic filler. Each section should feel specific to this transcript, not like a template.
`.trim();

    const userPrompt = `
You are given the raw transcript of a single YouTube episode.

Your task is to read it carefully and output an immersive, narrative-style summary in the JSON format described above.

Here is the transcript:

"""${trimmedTranscript}"""
`.trim();

    const completion = await openai.chat.completions.create({
      // Use any OpenRouter model you like; this is your current choice
      model: 'x-ai/grok-4.1-fast:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'LLM returned an empty response.' },
        { status: 500 }
      );
    }

    let parsed: ImmersiveSummary;

    try {
      parsed = JSON.parse(content) as ImmersiveSummary;
    } catch {
      // If the model didn't return strict JSON, just fall back to putting it all in one section.
      const fallbackSection: SummarySection = {
        title: 'Immersive Summary',
        content,
      };

      return NextResponse.json(
        {
          summary: content,
          sections: [fallbackSection],
          meta: {
            usedTranscript: true,
            usedYoutubeUrl: false,
            parseFallback: true,
          },
        },
        { status: 200 }
      );
    }

    const sections: SummarySection[] = [
      { title: 'Hook', content: parsed.hook },
      { title: 'Constraints', content: parsed.constraints },
      { title: 'Core Mechanism', content: parsed.coreMechanism },
      {
        title: 'Escalation & Consequences',
        content: parsed.escalationAndConsequences,
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

    return NextResponse.json(
      {
        summary: summaryText,
        sections,
        meta: {
          usedTranscript: true,
          usedYoutubeUrl: !hasTranscript && hasUrl,
          parseFallback: false,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in /api/summarize:', err);
    return NextResponse.json(
      { error: 'Internal server error while generating summary.' },
      { status: 500 }
    );
  }
}
