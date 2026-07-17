import { getTranscriptionProvider, getLLMProvider } from "../providers/index.js";
import type { TranscriptionResult } from "../providers/transcription.js";
import type { SummarizeResult, TranslateResult, AnalyzeResult } from "../providers/llm.js";

export interface PipelineResult {
  transcription?: TranscriptionResult;
  summary?: SummarizeResult;
  translation?: TranslateResult;
  analysis?: AnalyzeResult;
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  options?: { language?: string; prompt?: string }
): Promise<TranscriptionResult> {
  const provider = getTranscriptionProvider();
  return provider.transcribe(audioBuffer, options);
}

export async function summarizeTranscript(
  text: string,
  options?: { maxLength?: number }
): Promise<SummarizeResult> {
  const provider = getLLMProvider();
  return provider.summarize(text, options);
}

export async function translateTranscript(
  text: string,
  targetLanguage: string
): Promise<TranslateResult> {
  const provider = getLLMProvider();
  return provider.translate(text, targetLanguage);
}

export async function analyzeTranscript(
  text: string
): Promise<AnalyzeResult> {
  const provider = getLLMProvider();
  return provider.analyze(text);
}

export async function processTranscript(
  text: string,
  operations: Array<"summarize" | "translate" | "analyze">
): Promise<PipelineResult> {
  const result: PipelineResult = {};

  for (const op of operations) {
    switch (op) {
      case "summarize":
        result.summary = await summarizeTranscript(text);
        break;
      case "translate":
        result.translation = await translateTranscript(text, "en");
        break;
      case "analyze":
        result.analysis = await analyzeTranscript(text);
        break;
    }
  }

  return result;
}
