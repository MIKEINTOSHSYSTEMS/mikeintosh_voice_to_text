import type { TranscriptionProvider } from "./transcription.js";
import type { LLMProvider } from "./llm.js";
import { OpenAIWhisperProvider } from "./whisper.js";
import { OpenAILLMProvider } from "./openai-llm.js";

let _transcriptionProvider: TranscriptionProvider | null = null;
let _llmProvider: LLMProvider | null = null;

export function getTranscriptionProvider(): TranscriptionProvider {
  if (!_transcriptionProvider) {
    _transcriptionProvider = new OpenAIWhisperProvider();
  }
  return _transcriptionProvider;
}

export function getLLMProvider(): LLMProvider {
  if (!_llmProvider) {
    _llmProvider = new OpenAILLMProvider();
  }
  return _llmProvider;
}

export type { TranscriptionProvider, TranscriptionResult } from "./transcription.js";
export type { LLMProvider, SummarizeResult, TranslateResult, AnalyzeResult, CompleteResult } from "./llm.js";
