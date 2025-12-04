// app/api/helpers/llmSummary.ts
import OpenAI from 'openai';
import type { ImmersiveSummary, LlmResult, SummarySection } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

export async function buildImmersiveSummaryFromTranscript(
  transcript: string
): Promise<LlmResult> {
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
- **Imagine**: A vivid, cinematic “you live here now” slice-of-life. 5–10 sentences. Sensory detail. Emotional texture. What a normal day feels like. Make it vivid and cool, generate hype.
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

"""${transcript}"""
`.trim();

  const completion = await openai.chat.completions.create({
    model: 'x-ai/grok-4.1-fast',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1600,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('LLM returned an empty response.');
  }

  // Try strict JSON first
  let parsed: ImmersiveSummary;
  try {
    parsed = JSON.parse(content) as ImmersiveSummary;
  } catch {
    // Fallback: treat whole thing as one block
    const fallbackSection: SummarySection = {
      title: 'Immersive Summary',
      content,
    };

    const summaryText = `${fallbackSection.title.toUpperCase()}\n${
      fallbackSection.content
    }`;

    return {
      sections: [fallbackSection],
      summaryText,
      parseFallback: true,
    };
  }

  const sections: SummarySection[] = [
    { title: 'Hook', content: parsed.hook },
    { title: 'Constraints', content: parsed.constraints },
    { title: 'Core Mechanism', content: parsed.coreMechanism },
    {
      title: 'Escalation & Consequences',
      content: parsed.escalationAndConsequences,
    },
    { title: 'Imagine', content: parsed.imagine },
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

  return {
    sections,
    summaryText,
    parseFallback: false,
  };
}
