// app/helpers/types.ts

export type SummarySection = {
  title: string;
  content: string;
};

export type SummarizeMeta = {
  usedTranscript?: boolean;
  usedYoutubeUrl?: boolean;
};

export type SummarizeResponse = {
  summary: string;
  sections: SummarySection[];
  meta?: SummarizeMeta;
};
