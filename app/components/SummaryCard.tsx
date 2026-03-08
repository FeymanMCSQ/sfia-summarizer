// app/components/SummaryCard.tsx

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  return `${index + 1}. ${title}`;
}

function extractReflectionPrompts(raw: string): string[] {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .flatMap((line) =>
      line.split('•').map((part) => part.trim()).filter(Boolean)
    )
    .filter(Boolean);
}

function getReadingTime(sections: SummarySection[]): string {
  const totalWords = sections.reduce((sum, s) => sum + s.content.split(/\s+/).length, 0);
  const minutes = Math.max(1, Math.round(totalWords / 200));
  return `~${minutes} min read`;
}

/* ───── Inline Toast ───── */
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 1700);
    const t2 = setTimeout(onDone, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-lg shadow-accent/20 ${exiting ? 'toast-exit' : 'toast-enter'}`}>
      {message}
    </div>
  );
}

/* ───── Skeleton loader ───── */
function SkeletonCards() {
  return (
    <div className="space-y-4 mt-4">
      {SECTION_ORDER.map((title, i) => (
        <div
          key={title}
          className="rounded-xl border border-border bg-white p-4 animate-fade-up"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="skeleton h-4 w-28 rounded mb-3" />
          <div className="space-y-2">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
            <div className="skeleton h-3 w-4/6 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───── Per-section copy icon ───── */
function CopySectionButton({ text, title }: { text: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(`${title.toUpperCase()}\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-auto shrink-0 rounded p-1 text-text-muted hover:text-accent"
      title="Copy section"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

/* ───── Main Component ───── */
export function SummaryCard({
  loading,
  error,
  summary,
  sections,
  usedTranscript,
}: SummaryCardProps) {
  const hasSections = !!sections && sections.length > 0;
  const summaryRef = useRef<HTMLDivElement>(null);

  const reflectionSection = sections?.find((s) => s.title === 'Reflection Prompts');
  const reflectionPrompts = reflectionSection
    ? extractReflectionPrompts(reflectionSection.content)
    : [];

  const [reflectionNotes, setReflectionNotes] = useState<string[]>(() =>
    reflectionPrompts.map(() => '')
  );
  const [notesSaved, setNotesSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Auto-scroll to results
  useEffect(() => {
    if (summary && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [summary]);

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
    setToast('Notes saved!');
  };

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const handleCopyAll = useCallback(async () => {
    if (!sections || sections.length === 0) {
      if (summary) await navigator.clipboard.writeText(summary);
      setToast('Copied to clipboard!');
      return;
    }

    const sorted = sections.slice().sort(
      (a, b) => SECTION_ORDER.indexOf(a.title) - SECTION_ORDER.indexOf(b.title)
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
    setToast('Copied to clipboard!');
  }, [sections, summary]);

  return (
    <>
      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-error/30 bg-red-50 px-3 py-2 text-sm text-error animate-fade-up">
          {error}
        </div>
      )}

      <div ref={summaryRef} className="mt-6 border-t border-border pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2
              className="text-lg font-semibold text-text-primary"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Summary
            </h2>

            {/* Reading time */}
            {hasSections && (
              <span className="text-[11px] text-text-muted">
                {getReadingTime(sections!)}
              </span>
            )}

            {summary && (
              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-text-muted transition-all duration-200 hover:border-accent hover:text-accent"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy All
              </button>
            )}
          </div>

          {summary && (
            <span className="rounded-full bg-accent-light px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-accent ring-1 ring-accent/20">
              {usedTranscript ? 'Dev transcript mode' : 'URL / default mode'}
            </span>
          )}
        </div>

        {/* Skeleton loading */}
        {loading && <SkeletonCards />}

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
                    const isCollapsed = collapsedSections.has(section.title);

                    if (!isReflection) {
                      return (
                        <section
                          key={section.title}
                          className="group section-card animate-fade-up rounded-xl border border-border bg-white p-4 shadow-sm hover-lift transition-all duration-300 hover:border-accent/30"
                        >
                          <div
                            className="flex items-center gap-2 cursor-pointer select-none"
                            onClick={() => toggleSection(section.title)}
                          >
                            <svg
                              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className={`text-text-muted transition-transform duration-200 shrink-0 ${isCollapsed ? '' : 'rotate-90'}`}
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-accent">
                              {getSectionLabel(index, section.title)}
                            </h3>
                            <CopySectionButton text={section.content} title={section.title} />
                          </div>
                          {!isCollapsed && (
                            <div className="max-w-3xl text-sm leading-relaxed text-text-primary mt-2 ml-5 animate-fade-up">
                              {section.content}
                            </div>
                          )}
                        </section>
                      );
                    }

                    // Reflection prompts section
                    return (
                      <section
                        key={section.title}
                        className="group section-card animate-fade-up rounded-xl border border-border bg-white p-4 shadow-sm hover-lift"
                      >
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none"
                          onClick={() => toggleSection(section.title)}
                        >
                          <svg
                            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className={`text-text-muted transition-transform duration-200 shrink-0 ${isCollapsed ? '' : 'rotate-90'}`}
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-accent">
                            {getSectionLabel(index, section.title)}
                          </h3>
                        </div>

                        {!isCollapsed && (
                          <div className="mt-2 ml-5 animate-fade-up">
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
                                    onChange={(e) => handleNoteChange(idx, e.target.value)}
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
                              </div>
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
