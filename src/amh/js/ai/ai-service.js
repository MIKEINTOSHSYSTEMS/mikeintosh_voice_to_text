/**
 * AI Service - Base Abstraction Layer
 *
 * Factory pattern: create an instance per provider.
 * Pluggable architecture — supports OpenAI, local AI, future providers.
 *
 * Usage:
 *   var service = AIService.create({
 *     provider: 'openai',
 *     apiKey: 'sk-...',
 *     model: 'gpt-4o-mini',
 *     timeout: 30000
 *   });
 *   var result = await service.complete({ system: '...', user: '...' });
 */

var AIService = (function () {
  'use strict';

  var DEFAULT_TIMEOUT = 30000;
  var MAX_RETRIES = 2;

  // ============================================
  // PROVIDER ADAPTERS
  // ============================================

  var providers = {

    openai: {
      name: 'openai',

      buildRequest: function (config, prompt) {
        return {
          url: (config.baseUrl || 'https://api.openai.com') + '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + config.apiKey
          },
          body: JSON.stringify({
            model: config.model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: prompt.system },
              { role: 'user', content: prompt.user }
            ],
            temperature: config.temperature || 0.3,
            max_tokens: config.maxTokens || 2048
          })
        };
      },

      parseResponse: function (data) {
        if (data.choices && data.choices[0] && data.choices[0].message) {
          return {
            success: true,
            text: data.choices[0].message.content.trim(),
            usage: data.usage || null
          };
        }
        return { success: false, error: 'Unexpected response format from OpenAI' };
      }
    },

    anthropic: {
      name: 'anthropic',

      buildRequest: function (config, prompt) {
        return {
          url: (config.baseUrl || 'https://api.anthropic.com') + '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: config.model || 'claude-3-haiku-20240307',
            max_tokens: config.maxTokens || 2048,
            system: prompt.system,
            messages: [
              { role: 'user', content: prompt.user }
            ]
          })
        };
      },

      parseResponse: function (data) {
        if (data.content && data.content[0] && data.content[0].text) {
          return {
            success: true,
            text: data.content[0].text.trim(),
            usage: data.usage || null
          };
        }
        return { success: false, error: 'Unexpected response format from Anthropic' };
      }
    },

    local: {
      name: 'local',

      buildRequest: function (config, prompt) {
        return {
          url: (config.baseUrl || 'http://localhost:11434') + '/api/chat',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: config.model || 'llama3',
            messages: [
              { role: 'system', content: prompt.system },
              { role: 'user', content: prompt.user }
            ],
            stream: false
          })
        };
      },

      parseResponse: function (data) {
        if (data.message && data.message.content) {
          return {
            success: true,
            text: data.message.content.trim(),
            usage: null
          };
        }
        return { success: false, error: 'Unexpected response format from local AI' };
      }
    }
  };

  // ============================================
  // FACTORY
  // ============================================

  function create(config) {
    if (!config || !config.provider) {
      throw new Error('AIService.create requires a provider configuration');
    }

    var providerName = config.provider;
    var adapter = providers[providerName];
    if (!adapter) {
      throw new Error('Unknown AI provider: ' + providerName + '. Supported: ' + Object.keys(providers).join(', '));
    }

    var state = {
      isProcessing: false,
      lastError: null,
      requestCount: 0,
      lastRequestTime: null
    };

    // ============================================
    // CORE REQUEST METHOD
    // ============================================

    async function complete(prompt, options) {
      if (!prompt || !prompt.system || !prompt.user) {
        return { success: false, error: 'Prompt must include system and user fields' };
      }

      if (state.isProcessing) {
        return { success: false, error: 'AI service is busy. Please wait for the current request to finish.' };
      }

      if (!config.apiKey && providerName !== 'local') {
        return { success: false, error: 'API key not configured. Please set your API key in Settings.' };
      }

      state.isProcessing = true;
      state.lastError = null;
      state.requestCount++;
      state.lastRequestTime = Date.now();

      var timeout = (options && options.timeout) || config.timeout || DEFAULT_TIMEOUT;
      var retries = (options && options.retries !== undefined) ? options.retries : MAX_RETRIES;

      try {
        var result = await executeWithRetry(prompt, timeout, retries);
        return result;
      } catch (error) {
        state.lastError = error.message;
        return {
          success: false,
          error: classifyError(error),
          originalError: error.message
        };
      } finally {
        state.isProcessing = false;
      }
    }

    async function executeWithRetry(prompt, timeout, retriesLeft) {
      var request = adapter.buildRequest(config, prompt);

      try {
        var response = await fetchWithTimeout(request, timeout);
        var data = await response.json();

        if (!response.ok) {
          var errorMessage = (data.error && data.error.message) || ('HTTP ' + response.status);
          if (retriesLeft > 0 && response.status >= 500) {
            await delay(1000 * (MAX_RETRIES - retriesLeft + 1));
            return executeWithRetry(prompt, timeout, retriesLeft - 1);
          }
          return { success: false, error: errorMessage };
        }

        return adapter.parseResponse(data);

      } catch (error) {
        if (retriesLeft > 0 && isRetryable(error)) {
          await delay(1000 * (MAX_RETRIES - retriesLeft + 1));
          return executeWithRetry(prompt, timeout, retriesLeft - 1);
        }
        throw error;
      }
    }

    async function fetchWithTimeout(request, timeout) {
      var controller = new AbortController();
      var timeoutId = setTimeout(function () {
        controller.abort();
      }, timeout);

      try {
        var response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          signal: controller.signal
        });
        return response;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out after ' + timeout + 'ms');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    function classifyError(error) {
      if (error.message && error.message.includes('timed out')) {
        return 'Request timed out. The AI service may be slow or unavailable.';
      }
      if (error.message && error.message.includes('Failed to fetch')) {
        return 'Network error. Please check your internet connection.';
      }
      if (error.message && error.message.includes('busy')) {
        return error.message;
      }
      if (error.message && error.message.includes('API key')) {
        return error.message;
      }
      return 'AI service error: ' + (error.message || 'Unknown error');
    }

    function isRetryable(error) {
      return error.name === 'TypeError' && error.message.includes('Failed to fetch');
    }

    function delay(ms) {
      return new Promise(function (resolve) {
        setTimeout(resolve, ms);
      });
    }

    // ============================================
    // CONFIGURATION
    // ============================================

    function updateConfig(newConfig) {
      if (newConfig.apiKey !== undefined) config.apiKey = newConfig.apiKey;
      if (newConfig.model !== undefined) config.model = newConfig.model;
      if (newConfig.baseUrl !== undefined) config.baseUrl = newConfig.baseUrl;
      if (newConfig.timeout !== undefined) config.timeout = newConfig.timeout;
      if (newConfig.temperature !== undefined) config.temperature = newConfig.temperature;
      if (newConfig.maxTokens !== undefined) config.maxTokens = newConfig.maxTokens;
    }

    function getConfig() {
      return {
        provider: providerName,
        model: config.model || '',
        baseUrl: config.baseUrl || '',
        hasApiKey: !!config.apiKey,
        timeout: config.timeout || DEFAULT_TIMEOUT
      };
    }

    // ============================================
    // HEALTH & STATE
    // ============================================

    function getState() {
      return {
        isProcessing: state.isProcessing,
        lastError: state.lastError,
        requestCount: state.requestCount,
        lastRequestTime: state.lastRequestTime
      };
    }

    function isBusy() {
      return state.isProcessing;
    }

    async function healthCheck() {
      var testPrompt = { system: 'Reply with OK', user: 'Ping' };
      var result = await complete(testPrompt, { timeout: 10000, retries: 0 });
      return result.success;
    }

    // ============================================
    // PUBLIC API
    // ============================================

    return {
      complete: complete,
      updateConfig: updateConfig,
      getConfig: getConfig,
      getState: getState,
      isBusy: isBusy,
      healthCheck: healthCheck,
      providerName: providerName
    };
  }

  // ============================================
  // STATIC UTILITIES
  // ============================================

  function listProviders() {
    return Object.keys(providers);
  }

  function registerProvider(name, adapter) {
    if (!adapter || typeof adapter.buildRequest !== 'function' || typeof adapter.parseResponse !== 'function') {
      throw new Error('Provider adapter must implement buildRequest() and parseResponse()');
    }
    providers[name] = adapter;
  }

  return {
    create: create,
    listProviders: listProviders,
    registerProvider: registerProvider
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIService;
}
