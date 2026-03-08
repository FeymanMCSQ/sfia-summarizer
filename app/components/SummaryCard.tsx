// app/components/SummaryCard.tsx

'use client';

import { useState } from 'react';
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
  'Imagine',
  'New Normal',
  'Open Questions & Tensions',
  'Reflection Prompts',
];

function getSectionLabel(index: number, title: string) {
  const n = index + 1;
  return `${n}. ${title}`;
}

function extractReflectionPrompts(raw: string): string[] {
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

  return prompts;
}

export function SummaryCard({
  loading,
  error,
  summary,
  sections,
  usedTranscript,
}: SummaryCardProps) {
  const hasSections = !!sections && sections.length > 0;

  const reflectionSection = sections?.find(
    (s) => s.title === 'Reflection Prompts'
  );

  const reflectionPrompts = reflectionSection
    ? extractReflectionPrompts(reflectionSection.content)
    : [];

  const [reflectionNotes, setReflectionNotes] = useState<string[]>(() =>
    reflectionPrompts.map(() => '')
  );
  const [notesSaved, setNotesSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleNoteChange = (index: number, value: string) => {
    setReflectionNotes((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setNotesSaved(false);
  };

  const handleSaveNotes = () => {
    setNotesSaved(true);
  };

  const handleCopy = async () => {
    if (!sections || sections.length === 0) {
      if (summary) {
        await navigator.clipboard.writeText(summary);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    const sorted = sections
      .slice()
      .sort(
        (a, b) =>
          SECTION_ORDER.indexOf(a.title) - SECTION_ORDER.indexOf(b.title)
      );

    const text = sorted
      .map((s, i) => {
        const label = `${i + 1}. ${s.title.toUpperCase()}`;
        if (s.title === 'Reflection Prompts') {
          const prompts = extractReflectionPrompts(s.content);
          return `${label}\n${prompts.map((p) => `• ${p}`).join('\n')}`;
        }
        return `${label}\n${s.content}`;
      })
      .join('\n\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-error/30 bg-red-50 px-3 py-2 text-sm text-error animate-fade-up">
          {error}
        </div>
      )}

      <div className="mt-6 border-t border-border pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2
              className="text-lg font-semibold text-text-primary"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Summary
            </h2>

            {summary && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-text-muted transition-all duration-200 hover:border-accent hover:text-accent"
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            )}
          </div>

          {summary && (
            <span className="rounded-full bg-accent-light px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-accent ring-1 ring-accent/20">
              {usedTranscript ? 'Dev transcript mode' : 'URL / default mode'}
            </span>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="rounded-xl border border-accent/20 bg-accent-light p-5 text-sm text-text-secondary animate-fade-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="orbital-spinner" />
              <p className="font-medium text-text-primary">
                Summarizing… this might take a few seconds.
              </p>
            </div>
            <p className="text-text-muted ml-9">
              Reading the full transcript and building a structured
              briefing with eight sections.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !summary && !error && (
          <div className="rounded-xl border border-border bg-bg-card p-5 text-sm text-text-muted">
            The structured summary will appear here after you click{' '}
            <span className="font-medium text-accent">Summarize</span>.
          </div>
        )}

        {/* Main content */}
        {!loading && summary && (
          <div className="space-y-4">
            {hasSections ? (
              <div className="space-y-4">
                {sections!
                  .slice()
                  .sort(
                    (a, b) =>
                      SECTION_ORDER.indexOf(a.title) -
                      SECTION_ORDER.indexOf(b.title)
                  )
                  .map((section, index) => {
                    const isReflection = section.title === 'Reflection Prompts';

                    if (!isReflection) {
                      return (
                        <section
                          key={section.title}
                          className="section-card animate-fade-up rounded-xl border border-border bg-white p-4 shadow-sm transition-all duration-300 hover:border-accent/30 hover:shadow-md hover:shadow-accent/5"
                        >
                          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent">
                            {getSectionLabel(index, section.title)}
                          </h3>
                          <div className="max-w-3xl text-sm leading-relaxed text-text-primary">
                            {section.content}
                          </div>
                        </section>
                      );
                    }

                    return (
                      <section
                        key={section.title}
                        className="section-card animate-fade-up rounded-xl border border-border bg-white p-4 shadow-sm"
                      >
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent">
                          {getSectionLabel(index, section.title)}
                        </h3>

                        <p className="mb-3 text-xs text-text-muted">
                          These questions are for you to explore the idea, not
                          to &ldquo;get right&rdquo;.
                        </p>

                        <div className="space-y-4 max-w-3xl">
                          {reflectionPrompts.map((prompt, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg border border-border bg-bg-card p-3 transition-all duration-200 hover:border-accent/30"
                            >
                              <p className="text-sm font-medium text-text-primary">
                                {prompt}
                              </p>
                              <textarea
                                className="mt-2 w-full rounded-md border border-border bg-white px-2 py-1 text-xs text-text-primary placeholder:text-text-muted transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                rows={3}
                                placeholder="Type your thoughts here..."
                                value={reflectionNotes[idx] ?? ''}
                                onChange={(e) =>
                                  handleNoteChange(idx, e.target.value)
                                }
                              />
                            </div>
                          ))}
                        </div>

                        {reflectionPrompts.length > 0 && (
                          <div className="mt-3 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={handleSaveNotes}
                              className="inline-flex items-center rounded-md border border-accent bg-transparent px-3 py-1.5 text-xs font-medium text-accent transition-all duration-200 hover:bg-accent hover:text-white hover:shadow-md hover:shadow-accent/20"
                            >
                              Save My Notes
                            </button>
                            {notesSaved && (
                              <span className="text-[11px] text-text-muted">
                                Notes saved locally for this summary.
                              </span>
                            )}
                          </div>
                        )}
                      </section>
                    );
                  })}
              </div>
            ) : (
              <div className="max-w-3xl rounded-xl border border-border bg-white p-4 text-sm leading-relaxed text-text-primary shadow-sm animate-fade-up">
                {summary}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
