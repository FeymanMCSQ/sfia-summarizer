// app/components/AppHeader.tsx

export function AppHeader() {
  return (
    <header className="mb-8">
      <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-700/80">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
        SFIA Immersive Summarizer · Prototype
      </div>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
        Turn dense futurism lectures into immersive narratives
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-300">
        Paste a YouTube URL from{' '}
        <span className="font-medium text-slate-100">
          Science &amp; Futurism with Isaac Arthur
        </span>{' '}
        (or similar) and generate a structured, story-like summary.
      </p>
    </header>
  );
}
