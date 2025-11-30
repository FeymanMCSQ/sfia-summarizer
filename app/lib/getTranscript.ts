// app/lib/getTranscript.ts
import { YoutubeTranscript } from 'youtube-transcript';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());

    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;

      // Shorts: https://www.youtube.com/shorts/VIDEO_ID
      const shortsMatch = u.pathname.match(/\/shorts\/([^/]+)/);
      if (shortsMatch) return shortsMatch[1];
    }

    // youtu.be short URL: https://youtu.be/VIDEO_ID
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace('/', '');
      if (id) return id;
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchWithYoutubeTranscript(
  videoId: string
): Promise<string | null> {
  try {
    const transcriptEntries = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en',
    });

    if (!transcriptEntries || transcriptEntries.length === 0) {
      return null;
    }

    const fullText = transcriptEntries
      .map((entry) => entry.text.trim())
      .filter(Boolean)
      .join(' ');

    if (!fullText.trim()) {
      return null;
    }

    console.log(
      '[getTranscriptFromUrl/youtube-transcript] Preview:',
      fullText.slice(0, 200),
      '...'
    );
    console.log(
      '[getTranscriptFromUrl/youtube-transcript] Length:',
      fullText.length
    );

    return fullText;
  } catch (err) {
    console.warn(
      '[getTranscriptFromUrl/youtube-transcript] Failed, will try yt-dlp:',
      err
    );
    return null;
  }
}

function stripVttToPlainText(vtt: string): string {
  const lines = vtt.split(/\r?\n/);
  const out: string[] = [];

  const timestampRegex =
    /^\d{2}:\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}/;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) continue; // skip blank
    if (trimmed === 'WEBVTT') continue;
    if (/^\d+$/.test(trimmed)) continue; // cue number
    if (timestampRegex.test(trimmed)) continue;

    out.push(trimmed);
  }

  return out.join(' ');
}

async function fetchWithYtDlp(url: string, videoId: string): Promise<string> {
  // temp dir for this run
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'yt-dlp-sfia-transcript-')
  );

  try {
    // We tell yt-dlp to:
    // - skip media download
    // - fetch auto subs in English as VTT
    // - write files into our temp dir with a simple pattern
    const outPattern = path.join(tempDir, '%(id)s.%(ext)s');

    const cmd = [
      'yt-dlp',
      '--skip-download',
      '--write-auto-subs',
      '--sub-lang',
      'en',
      '--sub-format',
      'vtt',
      '-o',
      `"${outPattern}"`,
      `"${url}"`,
    ].join(' ');

    console.log('[getTranscriptFromUrl/yt-dlp] Running:', cmd);

    await execAsync(cmd);

    const files = await fs.readdir(tempDir);
    const vttFile = files.find((f) => f.endsWith('.vtt'));

    if (!vttFile) {
      throw new Error('No .vtt subtitle file produced by yt-dlp.');
    }

    const vttPath = path.join(tempDir, vttFile);
    const vttContent = await fs.readFile(vttPath, 'utf8');

    const text = stripVttToPlainText(vttContent);

    if (!text.trim()) {
      throw new Error('VTT subtitles were empty after cleaning.');
    }

    console.log(
      '[getTranscriptFromUrl/yt-dlp] Preview:',
      text.slice(0, 200),
      '...'
    );
    console.log('[getTranscriptFromUrl/yt-dlp] Length:', text.length);

    return text;
  } finally {
    // Clean up the temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

export async function getTranscriptFromUrl(url: string): Promise<string> {
  const videoId = extractVideoId(url);

  if (!videoId) {
    throw new Error('Could not extract a valid video ID from the URL.');
  }

  // 1) Try the simple HTTP-based library first
  const viaApi = await fetchWithYoutubeTranscript(videoId);
  if (viaApi) {
    return viaApi;
  }

  // 2) Fallback to yt-dlp for older / tricky videos
  try {
    const viaYtDlp = await fetchWithYtDlp(url, videoId);
    return viaYtDlp;
  } catch (err) {
    console.error('[getTranscriptFromUrl/yt-dlp] Failed:', err);
    throw new Error('Failed to fetch transcript from YouTube.');
  }
}
