// app/components/UrlInputRow.tsx

type UrlInputRowProps = {
  url: string;
  onUrlChange: (value: string) => void;
  loading: boolean;
  onSummarize: () => void;
};

export function UrlInputRow({
  url,
  onUrlChange,
  loading,
  onSummarize,
}: UrlInputRowProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <label
          htmlFor="youtube-url"
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300"
        >
          YouTube URL
        </label>
        <input
          id="youtube-url"
          type="text"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
        />
        <p className="mt-1 text-xs text-slate-400">
          For production, this will fetch captions. For now, you can also use
          dev transcript mode below.
        </p>
      </div>

      <button
        onClick={onSummarize}
        disabled={loading}
        className="mt-1 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-md shadow-emerald-500/30 transition hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:bg-emerald-700/70 disabled:text-emerald-100 sm:mt-6"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-900 border-t-transparent" />
            Summarizing…
          </span>
        ) : (
          'Summarize'
        )}
      </button>
    </div>
  );
}
