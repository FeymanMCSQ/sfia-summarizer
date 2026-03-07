// app/components/AppHeader.tsx

import Image from 'next/image';

export function AppHeader() {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Image
          src="/sfia-logo.png"
          alt="SFIA Logo"
          width={44}
          height={44}
          className="rounded-full"
        />
        <div className="inline-flex items-center gap-2 rounded-full bg-bg-card px-3 py-1 text-xs font-medium text-accent ring-1 ring-border-accent">
          <span className="inline-block h-2 w-2 rounded-full bg-accent animate-glow-pulse" />
          SFIA Immersive Summarizer
        </div>
      </div>

      <h1
        className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Turn dense futurism lectures into{' '}
        <span className="text-accent">immersive narratives</span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-text-secondary">
        Paste a YouTube URL from{' '}
        <span className="font-medium text-text-primary">
          Science &amp; Futurism with Isaac Arthur
        </span>{' '}
        (or similar) and generate a structured, story-like summary.
      </p>
    </header>
  );
}
