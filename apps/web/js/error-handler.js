/**
 * Error Handler Module
 * Centralized error handling for the entire application.
 *
 * Categories: permission, browser, storage, ai, network, file, speech
 * Features: user-facing messages, internal logging (sanitized), toast integration
 *
 * Usage:
 *   ErrorHandler.report('storage', 'saveFailed', { detail: 'quota exceeded' });
 *   ErrorHandler.handle(error, 'speech');
 */

var ErrorHandler = (function () {
  'use strict';

  // ============================================
  // ERROR CATEGORIES AND USER-FACING MESSAGES
  // ============================================

  var messages = {
    permission: {
      micDenied: 'Microphone access denied. Please allow microphone access in your browser settings.',
      micUnavailable: 'Microphone is not available on this device.',
      default: 'Permission required. Please check your browser settings.'
    },
    browser: {
      speechUnsupported: 'Speech recognition is not supported in this browser. Please use Chrome or Edge.',
      indexedDBUnavailable: 'Local storage is unavailable. Some features may not work.',
      default: 'Your browser does not support this feature.'
    },
    storage: {
      saveFailed: 'Unable to save. Storage may be full.',
      loadFailed: 'Unable to load saved data.',
      deleteFailed: 'Unable to delete. Please try again.',
      migrationFailed: 'Data migration failed. Your previous data is safe.',
      default: 'A storage error occurred.'
    },
    ai: {
      notConfigured: 'AI service is not configured. Please set your API key in Settings.',
      apiKeyInvalid: 'Invalid API key. Please check your Settings.',
      rateLimited: 'Too many requests. Please wait a moment and try again.',
      timeout: 'AI request timed out. The service may be slow.',
      networkError: 'Network error. Please check your internet connection.',
      processingError: 'AI processing failed. Please try again.',
      busy: 'AI service is busy. Please wait for the current request to finish.',
      default: 'AI service error. Please try again.'
    },
    network: {
      offline: 'You are offline. Please check your internet connection.',
      timeout: 'Request timed out. Please try again.',
      default: 'A network error occurred.'
    },
    file: {
      tooLarge: 'File is too large. Maximum size is 100 MB.',
      invalidType: 'Unsupported file format. Please use MP3, WAV, M4A, OGG, or WEBM.',
      loadFailed: 'Failed to load the audio file. The file may be corrupted.',
      default: 'A file error occurred.'
    },
    speech: {
      noSpeech: 'No speech detected. Please try again.',
      network: 'Speech recognition network error. Check your connection.',
      audioCapture: 'Microphone error. Please check your microphone.',
      notAllowed: 'Microphone permission denied.',
      startFailed: 'Failed to start recording. Please try again.',
      aborted: 'Recording was interrupted.',
      default: 'A speech recognition error occurred.'
    },
    general: {
      default: 'Something went wrong. Please try again.'
    }
  };

  // ============================================
  // STATE
  // ============================================

  var log = [];
  var maxLogSize = 100;
  var toastFn = null;

  // ============================================
  // INITIALIZATION
  // ============================================

  function init(config) {
    if (config && typeof config.showToast === 'function') {
      toastFn = config.showToast;
    }
  }

  // ============================================
  // CORE ERROR HANDLING
  // ============================================

  /**
   * Handle an error: show user message, log internally.
   * @param {string} category - Error category (permission, browser, storage, ai, network, file, speech, general)
   * @param {string} code - Specific error code within the category
   * @param {object} [context] - Additional context (not exposed to user)
   * @returns {string} The user-facing message
   */
  function handle(category, code, context) {
    var userMessage = getUserMessage(category, code);
    logError(category, code, context);
    return userMessage;
  }

  /**
   * Report an error and show toast notification.
   * @param {string} category
   * @param {string} code
   * @param {object} [context]
   */
  function report(category, code, context) {
    var userMessage = handle(category, code, context);
    showToast(userMessage);
    return userMessage;
  }

  /**
   * Handle a raw Error object, categorizing it automatically.
   * @param {Error|string} error
   * @param {string} [fallbackCategory]
   * @returns {string} User-facing message
   */
  function handleError(error, fallbackCategory) {
    var category = fallbackCategory || 'general';
    var code = 'default';
    var message = '';

    if (typeof error === 'string') {
      message = error;
    } else if (error && error.message) {
      message = error.message;
    }

    if (message.includes('timed out') || message.includes('timeout')) {
      category = 'ai';
      code = 'timeout';
    } else if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      category = 'network';
      code = 'default';
    } else if (message.includes('API key') || message.includes('apikey')) {
      category = 'ai';
      code = 'apiKeyInvalid';
    } else if (message.includes('busy')) {
      category = 'ai';
      code = 'busy';
    } else if (message.includes('IndexedDB') || message.includes('database')) {
      category = 'storage';
      code = 'loadFailed';
    } else if (message.includes('microphone') || message.includes('permission')) {
      category = 'permission';
      code = 'micDenied';
    }

    return handle(category, code, { originalMessage: message });
  }

  // ============================================
  // USER-FACING MESSAGES
  // ============================================

  function getUserMessage(category, code) {
    var cat = messages[category] || messages.general;
    return (cat[code]) || cat.default || messages.general.default;
  }

  // ============================================
  // INTERNAL LOGGING (sanitized)
  // ============================================

  function logError(category, code, context) {
    var entry = {
      timestamp: new Date().toISOString(),
      category: category,
      code: code,
      context: sanitizeContext(context)
    };

    log.push(entry);
    if (log.length > maxLogSize) {
      log.shift();
    }
  }

  function sanitizeContext(context) {
    if (!context || typeof context !== 'object') return {};
    var safe = {};
    var sensitiveKeys = ['apiKey', 'apikey', 'key', 'token', 'secret', 'password', 'authorization'];

    Object.keys(context).forEach(function (key) {
      var lowerKey = key.toLowerCase();
      if (sensitiveKeys.indexOf(lowerKey) !== -1) {
        safe[key] = '[REDACTED]';
      } else if (typeof context[key] === 'string' && context[key].length > 200) {
        safe[key] = context[key].substring(0, 200) + '...[truncated]';
      } else {
        safe[key] = context[key];
      }
    });

    return safe;
  }

  // ============================================
  // TOAST NOTIFICATION
  // ============================================

  function showToast(message) {
    if (toastFn) {
      toastFn(message);
    }
  }

  // ============================================
  // LOG ACCESS (for debugging)
  // ============================================

  function getLog() {
    return log.slice();
  }

  function clearLog() {
    log = [];
  }

  function getLogSummary() {
    var summary = {};
    log.forEach(function (entry) {
      var key = entry.category + ':' + entry.code;
      summary[key] = (summary[key] || 0) + 1;
    });
    return summary;
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    init: init,
    handle: handle,
    report: report,
    handleError: handleError,
    getUserMessage: getUserMessage,
    getLog: getLog,
    clearLog: clearLog,
    getLogSummary: getLogSummary
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
}
