import OpenAI from "openai";
import { getConfig } from "../../config.js";
import type { TranscriptionProvider, TranscriptionResult } from "./transcription.js";

export class OpenAIWhisperProvider implements TranscriptionProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const config = getConfig();
    this.client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
    this.model = config.WHISPER_MODEL;
  }

  async transcribe(
    audioBuffer: Buffer,
    options?: { language?: string; prompt?: string; temperature?: number }
  ): Promise<TranscriptionResult> {
    const file = new File([audioBuffer], "audio.wav", { type: "audio/wav" });

    const response = await this.client.audio.transcriptions.create({
      model: this.model,
      file,
      language: options?.language || "am",
      prompt: options?.prompt,
      temperature: options?.temperature || 0,
      response_format: "verbose_json",
    });

    const result = response as unknown as {
      text: string;
      language: string;
      duration: number;
      segments?: Array<{ start: number; end: number; text: string }>;
    };

    return {
      text: result.text,
      language: result.language || options?.language || "am",
      duration: result.duration || 0,
      segments: result.segments,
    };
  }
}
