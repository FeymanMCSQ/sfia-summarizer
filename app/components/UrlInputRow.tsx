// app/components/UrlInputRow.tsx

'use client';

import { useState, useEffect } from 'react';

type UrlInputRowProps = {
  url: string;
  onUrlChange: (value: string) => void;
  loading: boolean;
  onSummarize: () => void;
};

function isValidYoutubeUrl(url: string): boolean {
  if (!url.trim()) return false;
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes('youtube.com')) {
      return !!u.searchParams.get('v') || /\/shorts\/[^/]+/.test(u.pathname);
    }
    if (u.hostname === 'youtu.be') {
      return u.pathname.replace('/', '').length > 0;
    }
    return false;
  } catch {
    return false;
  }
}

export function UrlInputRow({
  url,
  onUrlChange,
  loading,
  onSummarize,
}: UrlInputRowProps) {
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(isValidYoutubeUrl(url));
  }, [url]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !loading) {
      e.preventDefault();
      onSummarize();
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <label
          htmlFor="youtube-url"
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-secondary"
        >
          YouTube URL
        </label>
        <div className="relative">
          <input
            id="youtube-url"
            type="text"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 pr-16 text-sm text-text-primary placeholder:text-text-muted shadow-sm transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {/* Valid URL indicator */}
            {url.trim() && (
              <span
                className={`flex items-center transition-all duration-200 ${
                  isValid ? 'text-green-500' : 'text-text-muted'
                }`}
                title={isValid ? 'Valid YouTube URL' : 'Not a valid YouTube URL'}
              >
                {isValid ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                )}
              </span>
            )}
            {/* Clear button */}
            {url && (
              <button
                type="button"
                onClick={() => onUrlChange('')}
                className="flex items-center justify-center rounded p-0.5 text-text-muted transition-colors duration-150 hover:text-text-secondary"
                title="Clear"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-text-muted">
          For production, this will fetch captions. For now, you can also use
          dev transcript mode below.{' '}
          <span className="text-text-muted/60">Ctrl+Enter to submit.</span>
        </p>
      </div>

      <button
        onClick={onSummarize}
        disabled={loading}
        className="mt-1 inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/20 transition-all duration-200 hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:mt-6"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="orbital-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
            Summarizing…
          </span>
        ) : (
          'Summarize'
        )}
      </button>
    </div>
  );
}
