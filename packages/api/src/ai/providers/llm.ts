export interface SummarizeResult {
  summary: string;
  keyPoints: string[];
  wordCount: number;
}

export interface TranslateResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface AnalyzeResult {
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  sentimentScore: number;
  keyTopics: string[];
  actionItems: string[];
  summary: string;
  wordCount: number;
  readingTimeMinutes: number;
}

export interface CompleteResult {
  text: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number } | null;
}

export interface LLMProvider {
  summarize(text: string, options?: { maxLength?: number }): Promise<SummarizeResult>;
  translate(text: string, targetLanguage: string): Promise<TranslateResult>;
  analyze(text: string): Promise<AnalyzeResult>;
  complete(system: string, user: string, options?: { model?: string; temperature?: number; maxTokens?: number }): Promise<CompleteResult>;
}
