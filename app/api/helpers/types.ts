// app/api/helpers/types.ts

export type SummarySection = {
  title: string;
  content: string;
};

export type ImmersiveSummary = {
  hook: string;
  constraints: string;
  coreMechanism: string;
  escalationAndConsequences: string;
  imagine: string;
  newNormal: string;
  openQuestionsAndTensions: string;
  reflectionPrompts: string[];
};

export type LlmResult = {
  sections: SummarySection[];
  summaryText: string;
  parseFallback: boolean;
};
