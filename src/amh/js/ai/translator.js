/**
 * AI Translator Module
 * Provides transcript translation using the AI service.
 * Supports Amharic <-> English with room for future languages.
 *
 * Factory pattern: creates an instance with dependencies injected.
 */

var AITranslator = (function () {
  'use strict';

  var SUPPORTED_LANGUAGES = {
    am: { name: 'Amharic', nativeName: '\u12A0\u1295\u12CD\u1295\u12A8\u1293\u1295' },
    en: { name: 'English', nativeName: 'English' },
    om: { name: 'Oromo', nativeName: 'Afaan Oromoo' },
    ti: { name: 'Tigrinya', nativeName: '\u1275\u122A\u1275\u134D\u1295\u12A8' },
    ar: { name: 'Arabic', nativeName: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629' },
    fr: { name: 'French', nativeName: 'Fran\u00E7ais' }
  };

  function create(config) {
    var aiService = config && config.aiService;
    var promptManager = config && config.promptManager;

    if (!aiService) {
      throw new Error('AITranslator requires an aiService instance');
    }

    async function translate(transcript, targetLanguage, sourceLanguage) {
      if (!transcript || !transcript.trim()) {
        return { success: false, error: 'No transcript text provided' };
      }

      if (!targetLanguage) {
        return { success: false, error: 'Target language not specified' };
      }

      var source = sourceLanguage || 'am';
      var target = targetLanguage;

      if (!SUPPORTED_LANGUAGES[source]) {
        return { success: false, error: 'Unsupported source language: ' + source };
      }

      if (!SUPPORTED_LANGUAGES[target]) {
        return { success: false, error: 'Unsupported target language: ' + target };
      }

      var sourceName = SUPPORTED_LANGUAGES[source].name;
      var targetName = SUPPORTED_LANGUAGES[target].name;

      var prompt;
      if (promptManager) {
        prompt = promptManager.build('translate', null, {
          transcript: transcript,
          sourceLanguage: sourceName,
          targetLanguage: targetName
        });
      } else {
        prompt = getDefaultPrompt(sourceName, targetName, transcript);
      }

      if (!prompt) {
        return { success: false, error: 'Failed to build translation prompt' };
      }

      return aiService.complete(prompt);
    }

    function getDefaultPrompt(sourceLang, targetLang, transcript) {
      return {
        system: 'You are a professional translator specializing in Ethiopian languages. Translate the provided text accurately from ' + sourceLang + ' to ' + targetLang + '. Preserve meaning, tone, and cultural context. Output only the translation without explanations.',
        user: 'Translate from ' + sourceLang + ' to ' + targetLang + ':\n\n' + transcript
      };
    }

    function getSupportedLanguages() {
      var result = {};
      Object.keys(SUPPORTED_LANGUAGES).forEach(function (code) {
        result[code] = {
          name: SUPPORTED_LANGUAGES[code].name,
          nativeName: SUPPORTED_LANGUAGES[code].nativeName
        };
      });
      return result;
    }

    function getLanguageName(code) {
      if (SUPPORTED_LANGUAGES[code]) {
        return SUPPORTED_LANGUAGES[code].name;
      }
      return code;
    }

    function isSupported(code) {
      return !!SUPPORTED_LANGUAGES[code];
    }

    return {
      translate: translate,
      getSupportedLanguages: getSupportedLanguages,
      getLanguageName: getLanguageName,
      isSupported: isSupported
    };
  }

  return {
    create: create,
    SUPPORTED_LANGUAGES: SUPPORTED_LANGUAGES
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AITranslator;
}
