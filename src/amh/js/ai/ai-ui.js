/**
 * AI UI Module
 * Handles AI assistant interface: buttons, loading states, results display.
 * Follows the service/ui separation pattern (like history.js / history-ui.js).
 *
 * Depends on: AIService, AISummarizer, AITranslator, AIAnalyzer, PromptManager
 * Receives DOM elements and callbacks via init().
 */

var AIUI = (function () {
  'use strict';

  var els = {};
  var callbacks = {};
  var summarizer = null;
  var translator = null;
  var analyzer = null;
  var lastResult = null;
  var lastAction = null;

  // ============================================
  // INITIALIZATION
  // ============================================

  function init(config) {
    if (!config || !config.elements) {
      return;
    }

    els = config.elements;
    callbacks = config.callbacks || {};

    bindEvents();
    updateProviderBadge(false);
  }

  function setServices(summaryInst, translateInst, analyzeInst) {
    summarizer = summaryInst;
    translator = translateInst;
    analyzer = analyzeInst;
  }

  // ============================================
  // PROVIDER STATUS
  // ============================================

  function updateProviderBadge(ready) {
    if (!els.badge) return;
    if (ready) {
      els.badge.textContent = 'Ready';
      els.badge.setAttribute('data-state', 'ready');
    } else {
      els.badge.textContent = 'Not configured';
      els.badge.removeAttribute('data-state');
    }
  }

  function setButtonsEnabled(enabled) {
    var buttons = [
      els.improveBtn, els.summaryShortBtn, els.summaryDetailedBtn,
      els.summaryMeetingBtn, els.translateBtn, els.keypointsBtn, els.keywordsBtn
    ];
    buttons.forEach(function (btn) {
      if (btn) btn.disabled = !enabled;
    });
    if (els.translateTarget) els.translateTarget.disabled = !enabled;
  }

  // ============================================
  // LOADING STATE
  // ============================================

  function setLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
      button.classList.add('is-loading');
      button.disabled = true;
    } else {
      button.classList.remove('is-loading');
      button.disabled = false;
    }
  }

  function clearAllLoading() {
    var buttons = [
      els.improveBtn, els.summaryShortBtn, els.summaryDetailedBtn,
      els.summaryMeetingBtn, els.translateBtn, els.keypointsBtn, els.keywordsBtn
    ];
    buttons.forEach(function (btn) {
      if (btn) {
        btn.classList.remove('is-loading');
        btn.disabled = false;
      }
    });
  }

  // ============================================
  // STATUS DISPLAY
  // ============================================

  function showStatus(message, state) {
    if (!els.status) return;
    els.status.hidden = false;
    els.status.setAttribute('data-state', state || 'loading');
    if (els.statusIcon) {
      var icons = { loading: '\u23F3', success: '\u2714\uFE0F', error: '\u26A0\uFE0F' };
      els.statusIcon.textContent = icons[state] || '';
    }
    if (els.statusText) {
      els.statusText.textContent = message;
    }
  }

  function hideStatus() {
    if (els.status) els.status.hidden = true;
  }

  // ============================================
  // RESULT DISPLAY
  // ============================================

  function showResult(title, text, action) {
    if (!els.result) return;
    lastResult = text;
    lastAction = action || 'replace';
    els.result.hidden = false;
    if (els.resultTitle) els.resultTitle.textContent = title;
    if (els.resultBody) els.resultBody.textContent = text;
  }

  function hideResult() {
    if (els.result) els.result.hidden = true;
    lastResult = null;
    lastAction = null;
  }

  function copyResult() {
    if (!lastResult) return;
    navigator.clipboard.writeText(lastResult).then(function () {
      if (callbacks.showToast) callbacks.showToast('Result copied to clipboard');
    }).catch(function () {
      if (callbacks.showToast) callbacks.showToast('Failed to copy');
    });
  }

  function applyResult() {
    if (!lastResult || !callbacks.onApply) return;
    callbacks.onApply(lastResult, lastAction);
    hideResult();
    hideStatus();
    if (callbacks.showToast) callbacks.showToast('AI result applied to transcript');
  }

  // ============================================
  // ACTION HANDLERS
  // ============================================

  async function handleImprove() {
    var text = callbacks.getTranscript ? callbacks.getTranscript() : '';
    if (!text.trim()) {
      if (callbacks.showToast) callbacks.showToast('No transcript to improve');
      return;
    }
    setLoading(els.improveBtn, true);
    showStatus('Improving transcript...', 'loading');

    try {
      var prompt = PromptManager.build('improveText', null, { transcript: text });
      var result = await summarizer._service
        ? summarizer._service.complete(prompt)
        : null;
      if (!result) {
        result = await callServiceViaCapability(summarizer, text, 'short');
      }
      handleResult(result, 'Improve Text', els.improveBtn);
    } catch (error) {
      handleError(error, els.improveBtn);
    }
  }

  async function handleSummarize(variant) {
    var text = callbacks.getTranscript ? callbacks.getTranscript() : '';
    if (!text.trim()) {
      if (callbacks.showToast) callbacks.showToast('No transcript to summarize');
      return;
    }
    var btnMap = { short: els.summaryShortBtn, detailed: els.summaryDetailedBtn, meeting: els.summaryMeetingBtn };
    var btn = btnMap[variant] || els.summaryShortBtn;
    setLoading(btn, true);
    showStatus('Generating summary...', 'loading');

    try {
      var result = await summarizer.summarize(text, variant);
      handleResult(result, 'Summary (' + variant + ')', btn);
    } catch (error) {
      handleError(error, btn);
    }
  }

  async function handleTranslate() {
    var text = callbacks.getTranscript ? callbacks.getTranscript() : '';
    if (!text.trim()) {
      if (callbacks.showToast) callbacks.showToast('No transcript to translate');
      return;
    }
    var targetLang = els.translateTarget ? els.translateTarget.value : 'en';
    setLoading(els.translateBtn, true);
    showStatus('Translating...', 'loading');

    try {
      var result = await translator.translate(text, targetLang);
      var langName = translator.getLanguageName(targetLang);
      handleResult(result, 'Translation to ' + langName, els.translateBtn);
    } catch (error) {
      handleError(error, els.translateBtn);
    }
  }

  async function handleAnalyze(type) {
    var text = callbacks.getTranscript ? callbacks.getTranscript() : '';
    if (!text.trim()) {
      if (callbacks.showToast) callbacks.showToast('No transcript to analyze');
      return;
    }
    var btnMap = { keyPoints: els.keypointsBtn, keywords: els.keywordsBtn };
    var btn = btnMap[type] || els.keypointsBtn;
    setLoading(btn, true);
    showStatus('Analyzing transcript...', 'loading');

    try {
      var result = await analyzer.analyze(text, type);
      var label = analyzer.getAnalysisLabel(type);
      handleResult(result, label, btn);
    } catch (error) {
      handleError(error, btn);
    }
  }

  // ============================================
  // RESULT/ERROR HANDLERS
  // ============================================

  function handleResult(result, title, button) {
    clearAllLoading();
    if (result && result.success) {
      showStatus('Complete', 'success');
      showResult(title, result.text, 'replace');
    } else {
      var msg = (result && result.error) || 'Unknown error occurred';
      showStatus(msg, 'error');
      if (callbacks.showToast) callbacks.showToast(msg);
    }
  }

  function handleError(error, button) {
    clearAllLoading();
    var msg = (error && error.message) || 'AI request failed';
    showStatus(msg, 'error');
    if (callbacks.showToast) callbacks.showToast(msg);
  }

  async function callServiceViaCapability(capability, text, variant) {
    return capability.summarize ? capability.summarize(text, variant) : null;
  }

  // ============================================
  // EVENT BINDING
  // ============================================

  function bindEvents() {
    if (els.improveBtn) {
      els.improveBtn.addEventListener('click', handleImprove);
    }
    if (els.summaryShortBtn) {
      els.summaryShortBtn.addEventListener('click', function () { handleSummarize('short'); });
    }
    if (els.summaryDetailedBtn) {
      els.summaryDetailedBtn.addEventListener('click', function () { handleSummarize('detailed'); });
    }
    if (els.summaryMeetingBtn) {
      els.summaryMeetingBtn.addEventListener('click', function () { handleSummarize('meeting'); });
    }
    if (els.translateBtn) {
      els.translateBtn.addEventListener('click', handleTranslate);
    }
    if (els.keypointsBtn) {
      els.keypointsBtn.addEventListener('click', function () { handleAnalyze('keyPoints'); });
    }
    if (els.keywordsBtn) {
      els.keywordsBtn.addEventListener('click', function () { handleAnalyze('keywords'); });
    }
    if (els.applyBtn) {
      els.applyBtn.addEventListener('click', applyResult);
    }
    if (els.copyResultBtn) {
      els.copyResultBtn.addEventListener('click', copyResult);
    }
    if (els.closeResultBtn) {
      els.closeResultBtn.addEventListener('click', hideResult);
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    init: init,
    setServices: setServices,
    updateProviderBadge: updateProviderBadge,
    setButtonsEnabled: setButtonsEnabled,
    hideResult: hideResult,
    hideStatus: hideStatus
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIUI;
}
