/**
 * Prompt Management System
 * Centralized prompt templates for AI operations.
 * No hardcoded prompts in business logic modules.
 *
 * Each prompt template is a function that receives context
 * and returns { system: string, user: string }.
 */

const PromptManager = (function () {
  'use strict';

  var templates = {

    summarize: {
      short: function (ctx) {
        return {
          system: 'You are a professional transcription assistant. Summarize the provided transcript concisely in 3-5 sentences. Focus on the main message. Preserve the original language of the transcript unless instructed otherwise.',
          user: 'Summarize this transcript:\n\n' + ctx.transcript
        };
      },
      detailed: function (ctx) {
        return {
          system: 'You are a professional transcription assistant. Provide a detailed, structured summary of the transcript. Include context, key themes, and conclusions. Preserve the original language unless instructed otherwise.',
          user: 'Provide a detailed summary of this transcript:\n\n' + ctx.transcript
        };
      },
      meeting: function (ctx) {
        return {
          system: 'You are a professional meeting assistant. Analyze the transcript and produce a structured meeting summary with these sections: Topic, Discussion Summary, Key Decisions, and Action Items. Use bullet points. Preserve the original language unless instructed otherwise.',
          user: 'Create a meeting summary from this transcript:\n\n' + ctx.transcript
        };
      }
    },

    translate: function (ctx) {
      var sourceLang = ctx.sourceLanguage || 'Amharic';
      var targetLang = ctx.targetLanguage || 'English';
      return {
        system: 'You are a professional translator specializing in Ethiopian languages. Translate the provided text accurately from ' + sourceLang + ' to ' + targetLang + '. Preserve meaning, tone, and cultural context. Output only the translation without explanations.',
        user: 'Translate from ' + sourceLang + ' to ' + targetLang + ':\n\n' + ctx.transcript
      };
    },

    analyze: {
      keyPoints: function (ctx) {
        return {
          system: 'You are a text analysis assistant. Extract the key points from the transcript. Present each as a concise bullet point. Focus on actionable items, decisions, and important information.',
          user: 'Extract key points from this transcript:\n\n' + ctx.transcript
        };
      },
      keywords: function (ctx) {
        return {
          system: 'You are a text analysis assistant. Extract the most important keywords and topics from the transcript. List them in order of relevance. Group related terms together.',
          user: 'Extract keywords and topics from this transcript:\n\n' + ctx.transcript
        };
      },
      sentiment: function (ctx) {
        return {
          system: 'You are a sentiment analysis assistant. Analyze the emotional tone of the transcript. Provide: overall sentiment (positive/neutral/negative), confidence level, and brief explanation of the tone.',
          user: 'Analyze the sentiment of this transcript:\n\n' + ctx.transcript
        };
      }
    },

    improveText: function (ctx) {
      return {
        system: 'You are a professional editor. Improve the transcript by fixing grammar, punctuation, and sentence structure. Remove filler words (umm, uh, like, you know). Preserve the original meaning and language. Output only the improved text.',
        user: 'Improve this transcript:\n\n' + ctx.transcript
      };
    }
  };

  function getTemplate(category, variant) {
    if (!category || !templates[category]) {
      return null;
    }

    if (variant && typeof templates[category] === 'object' && templates[category][variant]) {
      return templates[category][variant];
    }

    if (typeof templates[category] === 'function') {
      return templates[category];
    }

    return null;
  }

  function build(category, variant, context) {
    var template = getTemplate(category, variant);
    if (!template) {
      return null;
    }
    return template(context || {});
  }

  function listCategories() {
    return Object.keys(templates);
  }

  function listVariants(category) {
    if (!templates[category]) return [];
    if (typeof templates[category] === 'function') return ['default'];
    return Object.keys(templates[category]);
  }

  function register(category, variant, templateFn) {
    if (typeof variant === 'function') {
      templates[category] = variant;
    } else {
      if (!templates[category] || typeof templates[category] !== 'object') {
        templates[category] = {};
      }
      templates[category][variant] = templateFn;
    }
  }

  return {
    build: build,
    getTemplate: getTemplate,
    listCategories: listCategories,
    listVariants: listVariants,
    register: register
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptManager;
}
