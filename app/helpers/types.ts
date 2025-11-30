// app/helpers/types.ts

export type SummarySection = {
  title: string;
  content: string;
};

export type SummarizeMeta = {
  usedTranscript?: boolean;
  usedYoutubeUrl?: boolean;
  parseFallback?: boolean;
};

export type SummarizeStatus = 'ok' | 'no-transcript' | 'error';

export type SummarizeResponse = {
  status?: SummarizeStatus;
  error?: string;
  summary?: string;
  sections?: SummarySection[];
  meta?: SummarizeMeta;
};
