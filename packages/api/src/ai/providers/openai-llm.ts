import OpenAI from "openai";
import { getConfig } from "../../config.js";
import type {
  LLMProvider,
  SummarizeResult,
  TranslateResult,
  AnalyzeResult,
} from "./llm.js";

export class OpenAILLMProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const config = getConfig();
    this.client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
    this.model = config.OPENAI_MODEL;
  }

  async summarize(
    text: string,
    options?: { maxLength?: number }
  ): Promise<SummarizeResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: `You are a professional transcript summarizer. Summarize the following Amharic transcript concisely. Extract key points. Respond in JSON format: { "summary": "string", "keyPoints": ["string"], "wordCount": number }`,
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content);

    return {
      summary: result.summary || "",
      keyPoints: result.keyPoints || [],
      wordCount: result.wordCount || text.split(/\s+/).length,
    };
  }

  async translate(
    text: string,
    targetLanguage: string
  ): Promise<TranslateResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following Amharic transcript to ${targetLanguage}. Respond in JSON format: { "translatedText": "string", "sourceLanguage": "am", "targetLanguage": "${targetLanguage}" }`,
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content);

    return {
      translatedText: result.translatedText || "",
      sourceLanguage: "am",
      targetLanguage,
    };
  }

  async analyze(text: string): Promise<AnalyzeResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: `You are a professional transcript analyst. Analyze the following Amharic transcript and provide:
1. Sentiment (positive/negative/neutral/mixed) with score 0-1
2. Key topics (list)
3. Action items (list)
4. Brief summary
5. Word count and reading time

Respond in JSON format: { "sentiment": "string", "sentimentScore": number, "keyTopics": ["string"], "actionItems": ["string"], "summary": "string", "wordCount": number, "readingTimeMinutes": number }`,
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content);

    return {
      sentiment: result.sentiment || "neutral",
      sentimentScore: result.sentimentScore || 0.5,
      keyTopics: result.keyTopics || [],
      actionItems: result.actionItems || [],
      summary: result.summary || "",
      wordCount: result.wordCount || text.split(/\s+/).length,
      readingTimeMinutes: result.readingTimeMinutes || 0,
    };
  }
}
