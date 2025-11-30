// app/components/SummaryCard.tsx

import type { SummarySection } from '../helpers/types';

type SummaryCardProps = {
  loading: boolean;
  error: string | null;
  summary: string;
  sections: SummarySection[] | null;
  usedTranscript: boolean | null;
};

const SECTION_ORDER = [
  'Hook',
  'Constraints',
  'Core Mechanism',
  'Escalation & Consequences',
  'New Normal',
  'Open Questions & Tensions',
  'Reflection Prompts',
];

function getSectionLabel(index: number, title: string) {
  const n = index + 1;
  return `${n}. ${title}`;
}

function renderReflectionPrompts(raw: string) {
  // Try to split into prompts:
  // handles content like:
  // "If ...?\n• Would you ...?\n• How might ...?"
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const prompts = lines
    .flatMap((line) =>
      line
        .split('•')
        .map((part) => part.trim())
        .filter(Boolean)
    )
    .filter(Boolean);

  if (prompts.length === 0) {
    return <p className="text-sm leading-relaxed text-slate-100">{raw}</p>;
  }

  return (
    <ul className="ml-4 list-disc space-y-1 text-sm leading-relaxed text-slate-100">
      {prompts.map((p, idx) => (
        <li key={idx}>{p}</li>
      ))}
    </ul>
  );
}

export function SummaryCard({
  loading,
  error,
  summary,
  sections,
  usedTranscript,
}: SummaryCardProps) {
  const hasSections = !!sections && sections.length > 0;

  return (
    <>
      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-900/70 bg-red-950/60 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 border-t border-slate-800 pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-50">Summary</h2>

          {summary && (
            <span className="rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-300 ring-1 ring-slate-700">
              {usedTranscript ? 'Dev transcript mode' : 'URL / default mode'}
            </span>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="rounded-xl bg-slate-950/70 p-4 text-sm text-slate-200 ring-1 ring-slate-800/80">
            <p className="mb-1 font-medium text-slate-100">
              Summarizing… this might take a few seconds.
            </p>
            <p className="text-slate-400">
              We&apos;re reading the full transcript and building a structured
              briefing with seven sections.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !summary && !error && (
          <div className="rounded-xl bg-slate-950/70 p-4 text-sm text-slate-400 ring-1 ring-slate-800/80">
            The structured summary will appear here after you click{' '}
            <span className="font-medium text-slate-200">Summarize</span>.
          </div>
        )}

        {/* Main content */}
        {!loading && summary && (
          <div className="space-y-4">
            {/* If we have structured sections, show them nicely.
                Otherwise, fall back to a single readable block. */}
            {hasSections ? (
              <div className="space-y-4">
                {sections!
                  .slice()
                  .sort(
                    (a, b) =>
                      SECTION_ORDER.indexOf(a.title) -
                      SECTION_ORDER.indexOf(b.title)
                  )
                  .map((section, index) => (
                    <section
                      key={section.title}
                      className="rounded-xl bg-slate-950/70 p-4 ring-1 ring-slate-800/80"
                    >
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-300">
                        {getSectionLabel(index, section.title)}
                      </h3>

                      <div className="max-w-3xl text-sm leading-relaxed text-slate-100">
                        {section.title === 'Reflection Prompts'
                          ? renderReflectionPrompts(section.content)
                          : section.content}
                      </div>
                    </section>
                  ))}
              </div>
            ) : (
              // Fallback: single block (when JSON parsing failed and
              // everything came back as one big string, like your example).
              <div className="rounded-xl bg-slate-950/70 p-4 text-sm leading-relaxed text-slate-100 ring-1 ring-slate-800/80 max-w-3xl">
                {summary}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
