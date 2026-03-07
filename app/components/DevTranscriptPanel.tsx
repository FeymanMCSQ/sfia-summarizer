// app/components/DevTranscriptPanel.tsx

'use client';

import { useRef } from 'react';

type DevTranscriptPanelProps = {
  transcript: string;
  onTranscriptChange: (value: string) => void;
};

export function DevTranscriptPanel({
  transcript,
  onTranscriptChange,
}: DevTranscriptPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        onTranscriptChange(text);
      }
    };
    reader.readAsText(file);

    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <details className="mt-4 rounded-lg border border-dashed border-border-accent bg-accent-muted/30 p-3 text-sm text-text-secondary">
      <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide text-accent">
        Dev: Paste or Upload Transcript (optional)
      </summary>
      <p className="mt-2 text-xs text-text-muted">
        For development only: paste transcript text below or upload a{' '}
        <span className="font-medium text-text-secondary">.txt</span> /{' '}
        <span className="font-medium text-text-secondary">.srt</span> file.
        If provided, this will be used instead of fetching captions from
        YouTube.
      </p>

      {/* File upload */}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-md border border-border-accent bg-bg-input px-3 py-1.5 text-xs font-medium text-accent transition-all duration-200 hover:bg-accent hover:text-black"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload .txt / .srt
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.srt,.vtt"
          className="hidden"
          onChange={handleFileUpload}
        />
        {transcript && (
          <span className="text-[11px] text-text-muted">
            {transcript.length.toLocaleString()} characters loaded
          </span>
        )}
      </div>

      <textarea
        className="mt-3 h-40 w-full resize-y rounded-lg border border-border bg-bg-input px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-muted transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        placeholder="Paste full transcript text here..."
        value={transcript}
        onChange={(e) => onTranscriptChange(e.target.value)}
      />
    </details>
  );
}
