// app/components/DevTranscriptPanel.tsx

type DevTranscriptPanelProps = {
  transcript: string;
  onTranscriptChange: (value: string) => void;
};

export function DevTranscriptPanel({
  transcript,
  onTranscriptChange,
}: DevTranscriptPanelProps) {
  return (
    <details className="mt-4 rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-3 text-sm text-slate-200">
      <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide text-slate-300">
        Dev: Paste Transcript (optional)
      </summary>
      <p className="mt-2 text-xs text-slate-400">
        For development only: paste the raw transcript text here (e.g., from{' '}
        <span className="font-medium text-slate-200">
          [English] Megastructures In Space
        </span>
        ). If provided, this will be used instead of fetching captions from
        YouTube.
      </p>
      <textarea
        className="mt-3 h-40 w-full resize-y rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
        placeholder="Paste full transcript text here..."
        value={transcript}
        onChange={(e) => onTranscriptChange(e.target.value)}
      />
    </details>
  );
}
