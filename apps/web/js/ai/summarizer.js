/**
 * AI Summarizer Module
 * Provides transcript summarization using the AI service.
 * Supports short, detailed, and meeting-style summaries.
 *
 * Factory pattern: creates an instance with dependencies injected.
 */

var AISummarizer = (function () {
  'use strict';

  function create(config) {
    var aiService = config && config.aiService;
    var promptManager = config && config.promptManager;

    if (!aiService) {
      throw new Error('AISummarizer requires an aiService instance');
    }

    async function summarize(transcript, variant) {
      if (!transcript || !transcript.trim()) {
        return { success: false, error: 'No transcript text provided' };
      }

      var summaryType = variant || 'short';
      var validTypes = ['short', 'detailed', 'meeting'];

      if (validTypes.indexOf(summaryType) === -1) {
        summaryType = 'short';
      }

      var prompt;
      if (promptManager) {
        prompt = promptManager.build('summarize', summaryType, { transcript: transcript });
      } else {
        prompt = getDefaultPrompt(summaryType, transcript);
      }

      if (!prompt) {
        return { success: false, error: 'Failed to build summary prompt' };
      }

      return aiService.complete(prompt);
    }

    function getDefaultPrompt(variant, transcript) {
      var prompts = {
        short: {
          system: 'You are a professional transcription assistant. Summarize the provided transcript concisely in 3-5 sentences. Focus on the main message. Preserve the original language.',
          user: 'Summarize this transcript:\n\n' + transcript
        },
        detailed: {
          system: 'You are a professional transcription assistant. Provide a detailed, structured summary of the transcript. Include context, key themes, and conclusions. Preserve the original language.',
          user: 'Provide a detailed summary of this transcript:\n\n' + transcript
        },
        meeting: {
          system: 'You are a professional meeting assistant. Analyze the transcript and produce a structured meeting summary with: Topic, Discussion Summary, Key Decisions, and Action Items. Use bullet points. Preserve the original language.',
          user: 'Create a meeting summary from this transcript:\n\n' + transcript
        }
      };
      return prompts[variant] || prompts.short;
    }

    function getSupportedVariants() {
      return ['short', 'detailed', 'meeting'];
    }

    return {
      summarize: summarize,
      getSupportedVariants: getSupportedVariants
    };
  }

  return {
    create: create
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AISummarizer;
}
