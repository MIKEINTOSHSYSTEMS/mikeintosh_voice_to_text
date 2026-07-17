export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface TranscriptionProvider {
  transcribe(audioBuffer: Buffer, options?: {
    language?: string;
    prompt?: string;
    temperature?: number;
  }): Promise<TranscriptionResult>;
}
