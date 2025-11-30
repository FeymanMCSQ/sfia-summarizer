'use client';

import { useState } from 'react';

import type { SummarySection } from './helpers/types';
import { callSummarizeApi } from './helpers/summarizeClient';

import { AppHeader } from './components/AppHeader';
import { UrlInputRow } from './components/UrlInputRow';
import { DevTranscriptPanel } from './components/DevTranscriptPanel';
import { SummaryCard } from './components/SummaryCard';

export default function Home() {
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [sections, setSections] = useState<SummarySection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedTranscript, setUsedTranscript] = useState<boolean | null>(null);

  const handleSummarize = async () => {
    setError(null);
    setSummary('');
    setSections(null);
    setUsedTranscript(null);

    const trimmedUrl = url.trim();
    const trimmedTranscript = transcript.trim();

    if (!trimmedUrl && !trimmedTranscript) {
      setError('Paste a YouTube URL or dev transcript first.');
      return;
    }

    setLoading(true);

    try {
      const data = await callSummarizeApi({
        youtubeUrl: trimmedUrl || null,
        transcript: trimmedTranscript || null,
      });

      setSummary(data.summary ?? '');
      setSections(data.sections ?? null);

      if (typeof data.meta?.usedTranscript === 'boolean') {
        setUsedTranscript(data.meta.usedTranscript);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Something went wrong.');
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <AppHeader />

        <section className="flex-1">
          <div className="rounded-2xl bg-slate-900/80 p-5 shadow-xl shadow-black/40 ring-1 ring-slate-800 sm:p-6">
            <UrlInputRow
              url={url}
              onUrlChange={setUrl}
              loading={loading}
              onSummarize={handleSummarize}
            />

            <DevTranscriptPanel
              transcript={transcript}
              onTranscriptChange={setTranscript}
            />

            <SummaryCard
              loading={loading}
              error={error}
              summary={summary}
              sections={sections}
              usedTranscript={usedTranscript}
            />
          </div>
        </section>

        <footer className="mt-6 text-xs text-slate-500">
          Built as a sandbox for transcript → narrative experiments. The real
          LLM pipeline will drop into the same API route.
        </footer>
      </main>
    </div>
  );
}
