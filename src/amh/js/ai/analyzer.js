/**
 * AI Analyzer Module
 * Provides transcript analysis using the AI service.
 * Supports key points, keywords, and sentiment analysis.
 *
 * Factory pattern: creates an instance with dependencies injected.
 */

var AIAnalyzer = (function () {
  'use strict';

  var ANALYSIS_TYPES = {
    keyPoints: { label: 'Key Points', icon: '\u2713' },
    keywords: { label: 'Keywords & Topics', icon: '#' },
    sentiment: { label: 'Sentiment Analysis', icon: '\u263A' }
  };

  function create(config) {
    var aiService = config && config.aiService;
    var promptManager = config && config.promptManager;

    if (!aiService) {
      throw new Error('AIAnalyzer requires an aiService instance');
    }

    async function analyze(transcript, type) {
      if (!transcript || !transcript.trim()) {
        return { success: false, error: 'No transcript text provided' };
      }

      var analysisType = type || 'keyPoints';
      var validTypes = Object.keys(ANALYSIS_TYPES);

      if (validTypes.indexOf(analysisType) === -1) {
        analysisType = 'keyPoints';
      }

      var prompt;
      if (promptManager) {
        prompt = promptManager.build('analyze', analysisType, { transcript: transcript });
      } else {
        prompt = getDefaultPrompt(analysisType, transcript);
      }

      if (!prompt) {
        return { success: false, error: 'Failed to build analysis prompt' };
      }

      var result = await aiService.complete(prompt);

      if (result.success) {
        result.analysisType = analysisType;
        result.analysisLabel = ANALYSIS_TYPES[analysisType].label;
      }

      return result;
    }

    function getDefaultPrompt(type, transcript) {
      var prompts = {
        keyPoints: {
          system: 'You are a text analysis assistant. Extract the key points from the transcript. Present each as a concise bullet point. Focus on actionable items, decisions, and important information.',
          user: 'Extract key points from this transcript:\n\n' + transcript
        },
        keywords: {
          system: 'You are a text analysis assistant. Extract the most important keywords and topics from the transcript. List them in order of relevance. Group related terms together.',
          user: 'Extract keywords and topics from this transcript:\n\n' + transcript
        },
        sentiment: {
          system: 'You are a sentiment analysis assistant. Analyze the emotional tone of the transcript. Provide: overall sentiment (positive/neutral/negative), confidence level, and brief explanation of the tone.',
          user: 'Analyze the sentiment of this transcript:\n\n' + transcript
        }
      };
      return prompts[type] || prompts.keyPoints;
    }

    function getAnalysisTypes() {
      var result = {};
      Object.keys(ANALYSIS_TYPES).forEach(function (key) {
        result[key] = {
          label: ANALYSIS_TYPES[key].label,
          icon: ANALYSIS_TYPES[key].icon
        };
      });
      return result;
    }

    function getAnalysisLabel(type) {
      if (ANALYSIS_TYPES[type]) {
        return ANALYSIS_TYPES[type].label;
      }
      return type;
    }

    return {
      analyze: analyze,
      getAnalysisTypes: getAnalysisTypes,
      getAnalysisLabel: getAnalysisLabel
    };
  }

  return {
    create: create,
    ANALYSIS_TYPES: ANALYSIS_TYPES
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAnalyzer;
}
