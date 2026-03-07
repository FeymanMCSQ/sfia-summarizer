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
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-secondary"
        >
          YouTube URL
        </label>
        <input
          id="youtube-url"
          type="text"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted shadow-sm transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <p className="mt-1 text-xs text-text-muted">
          For production, this will fetch captions. For now, you can also use
          dev transcript mode below.
        </p>
      </div>

      <button
        onClick={onSummarize}
        disabled={loading}
        className="mt-1 inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black shadow-md shadow-accent/20 transition-all duration-200 hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/30 disabled:cursor-not-allowed disabled:bg-accent/40 disabled:text-black/50 sm:mt-6"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="orbital-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            Summarizing…
          </span>
        ) : (
          'Summarize'
        )}
      </button>
    </div>
  );
}
