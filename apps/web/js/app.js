/**
 * Amharic Voice-to-Text Application
 * Application coordinator - wires modules together
 */

(function () {
  'use strict';

  // ============================================
  // DOM REFERENCES
  // ============================================

  const elements = {
    themeToggle: document.getElementById('theme-toggle'),
    micButton: document.getElementById('mic-button'),
    micAnimated: document.getElementById('mic-animated'),
    micStatus: document.getElementById('mic-status'),
    recordingTimer: document.getElementById('recording-timer'),
    outputTextarea: document.getElementById('transcription-output'),
    copyButton: document.getElementById('copy-button'),
    printButton: document.getElementById('print-button'),
    downloadTxtButton: document.getElementById('download-txt-button'),
    downloadDocButton: document.getElementById('download-doc-button'),
    whatsappButton: document.getElementById('whatsapp-button'),
    twitterButton: document.getElementById('twitter-button'),
    newTranscriptionButton: document.getElementById('new-transcription-button'),
    resetButton: document.getElementById('reset-button'),
    statusMessages: document.getElementById('status-messages'),
    toastContainer: document.getElementById('toast-container'),
    micIndicator: document.getElementById('mic-indicator'),
    recognitionStatus: document.getElementById('recognition-status'),
    statDuration: document.getElementById('stat-duration'),
    statAudioLevel: document.getElementById('stat-audio-level'),
    audioVisualizer: document.getElementById('audio-visualizer'),
    audioVisualizerContainer: document.getElementById('audio-visualizer-container'),
    transcriptTitle: document.getElementById('transcript-title'),
    searchInput: document.getElementById('search-input'),
    searchPrev: document.getElementById('search-prev'),
    searchNext: document.getElementById('search-next'),
    searchClear: document.getElementById('search-clear'),
    searchMatchCount: document.getElementById('search-match-count'),
    emptyState: document.getElementById('empty-state'),
    charCount: document.getElementById('char-count'),
    wordCountValue: document.getElementById('word-count-value'),
    readingTime: document.getElementById('reading-time'),
    speechDuration: document.getElementById('speech-duration'),
    uploadDropZone: document.getElementById('upload-drop-zone'),
    uploadFileInput: document.getElementById('upload-file-input'),
    uploadStatus: document.getElementById('upload-status'),
    uploadStatusIcon: document.getElementById('upload-status-icon'),
    uploadStatusText: document.getElementById('upload-status-text'),
    uploadFileInfo: document.getElementById('upload-file-info'),
    uploadFileName: document.getElementById('upload-file-name'),
    uploadFormat: document.getElementById('upload-format'),
    uploadSize: document.getElementById('upload-size'),
    uploadDuration: document.getElementById('upload-duration'),
    uploadClear: document.getElementById('upload-clear'),
    uploadExperimental: document.getElementById('upload-experimental'),
    playerContainer: document.getElementById('player-container'),
    playerFileName: document.getElementById('player-file-name'),
    playerPlayPause: document.getElementById('player-play-pause'),
    playerStop: document.getElementById('player-stop'),
    playerProgressBar: document.getElementById('player-progress-bar'),
    playerProgressFill: document.getElementById('player-progress-fill'),
    playerCurrentTime: document.getElementById('player-current-time'),
    playerTotalDuration: document.getElementById('player-total-duration'),
    playerSpeedSelect: document.getElementById('player-speed-select'),
    playerMuteBtn: document.getElementById('player-mute-btn'),
    playerVolumeSlider: document.getElementById('player-volume-slider'),
    aiProviderBadge: document.getElementById('ai-provider-badge'),
    aiImproveBtn: document.getElementById('ai-improve-btn'),
    aiSummaryShortBtn: document.getElementById('ai-summary-short-btn'),
    aiSummaryDetailedBtn: document.getElementById('ai-summary-detailed-btn'),
    aiSummaryMeetingBtn: document.getElementById('ai-summary-meeting-btn'),
    aiTranslateTarget: document.getElementById('ai-translate-target'),
    aiTranslateBtn: document.getElementById('ai-translate-btn'),
    aiKeypointsBtn: document.getElementById('ai-keypoints-btn'),
    aiKeywordsBtn: document.getElementById('ai-keywords-btn'),
    aiStatus: document.getElementById('ai-status'),
    aiStatusIcon: document.getElementById('ai-status-icon'),
    aiStatusText: document.getElementById('ai-status-text'),
    aiResult: document.getElementById('ai-result'),
    aiResultTitle: document.getElementById('ai-result-title'),
    aiResultBody: document.getElementById('ai-result-body'),
    aiApplyBtn: document.getElementById('ai-apply-btn'),
    aiCopyResultBtn: document.getElementById('ai-copy-result-btn'),
    aiCloseResultBtn: document.getElementById('ai-close-result-btn'),
  };

  let transcriptTitle = 'Untitled Transcript';

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function debounce(fn, ms) {
    var timer;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // ============================================
  // UI UPDATE FUNCTIONS
  // ============================================

  function setStatus(statusId) {
    const messages = elements.statusMessages.querySelectorAll('.status-message');
    messages.forEach((msg) => {
      msg.hidden = true;
    });

    const targetMessage = document.getElementById(statusId);
    if (targetMessage) {
      targetMessage.hidden = false;
    }
  }

  function setRecordingState(isRecording) {
    elements.micButton.setAttribute('aria-pressed', isRecording.toString());
    elements.micButton.setAttribute('aria-label', isRecording ? 'Stop voice recording' : 'Start voice recording');
    elements.micStatus.textContent = isRecording ? 'Listening... Click to stop' : 'Press to start recording';
  }

  function updateButtonStates() {
    const hasText = elements.outputTextarea.value.trim().length > 0;
    elements.copyButton.disabled = !hasText;
    elements.printButton.disabled = !hasText;
    elements.downloadTxtButton.disabled = !hasText;
    elements.downloadDocButton.disabled = !hasText;
    elements.whatsappButton.disabled = !hasText;
    elements.twitterButton.disabled = !hasText;
    elements.resetButton.disabled = !hasText;
  }

  function updateMicIndicator(permissionState) {
    if (!elements.micIndicator) return;
    elements.micIndicator.setAttribute('data-state', permissionState);
    var labels = { unknown: 'Microphone status: unknown', granted: 'Microphone available', denied: 'Microphone permission denied', prompt: 'Microphone permission requested', recording: 'Microphone active' };
    elements.micIndicator.setAttribute('aria-label', labels[permissionState] || 'Microphone status unknown');
  }

  function updateRecognitionStatusDisplay(status) {
    if (!elements.recognitionStatus) return;
    var labels = { idle: 'Idle', listening: 'Listening', processing: 'Processing', error: 'Error' };
    elements.recognitionStatus.textContent = labels[status] || status;
  }

  function updateAudioLevel(level) {
    if (elements.statAudioLevel) {
      elements.statAudioLevel.textContent = level > 0.01 ? Math.round(level * 100) + '%' : '--';
    }
  }

  function showAudioVisualizer() {
    if (elements.audioVisualizerContainer) {
      elements.audioVisualizerContainer.hidden = false;
    }
  }

  function hideAudioVisualizer() {
    if (elements.audioVisualizerContainer) {
      elements.audioVisualizerContainer.hidden = true;
    }
  }

  function setupAudioVisualizer() {
    if (!elements.audioVisualizer || typeof AudioManager === 'undefined') return;

    const canvas = elements.audioVisualizer;
    const container = elements.audioVisualizerContainer;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    AudioManager.init(canvas, updateAudioLevel);
  }

  function updateWordCount() {
    const text = elements.outputTextarea.value;
    const duration = SpeechManager.getState().totalSpeakingDuration;
    const stats = StatsManager.getStats(text, duration);

    if (elements.charCount) {
      elements.charCount.textContent = stats.charCount.toLocaleString();
    }
    if (elements.wordCountValue) {
      elements.wordCountValue.textContent = stats.wordCount.toLocaleString();
    }
    if (elements.readingTime) {
      elements.readingTime.textContent = stats.readingTime;
    }
    if (elements.speechDuration) {
      elements.speechDuration.textContent = stats.duration;
    }

    updateEmptyState();
  }

  function updateEmptyState() {
    if (elements.emptyState) {
      const hasText = elements.outputTextarea.value.trim().length > 0;
      elements.emptyState.classList.toggle('hidden', hasText);
    }
  }

  // ============================================
  // TRANSCRIPT OPERATIONS
  // ============================================

  function saveTranscription() {
    const text = elements.outputTextarea.value;
    StorageManager.saveTranscription(text);
  }

  function loadTranscription() {
    const saved = StorageManager.loadTranscription();
    if (saved) {
      elements.outputTextarea.value = saved;
      updateWordCount();
      updateButtonStates();
    }
  }

  function saveTitle() {
    const title = elements.transcriptTitle.value.trim() || 'Untitled Transcript';
    transcriptTitle = title;
    StorageManager.saveTitle(title);
  }

  function loadTitle() {
    transcriptTitle = StorageManager.loadTitle();
    if (elements.transcriptTitle) {
      elements.transcriptTitle.value = transcriptTitle;
    }
  }

  function handleTranscriptUpdate(newText, isAppend) {
    if (isAppend) {
      const existingText = elements.outputTextarea.value;
      if (existingText.trim()) {
        elements.outputTextarea.value = existingText + '\n' + newText;
      } else {
        elements.outputTextarea.value = newText;
      }
    } else {
      elements.outputTextarea.value = newText;
    }

    SpeechManager.setFinalTranscript(elements.outputTextarea.value);
    saveTranscription();
    updateWordCount();
    updateButtonStates();
  }

  // ============================================
  // FILE OPERATIONS
  // ============================================

  function saveAsFile(extension, mimeType) {
    const text = elements.outputTextarea.value;
    if (!text) return;

    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const filename = `${transcriptTitle.replace(/[^a-zA-Z0-9\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF\uAB00-\uAB2F\u13A0-\u13FF\u2D30-\u2D7F\uA6A0-\uA6FF\uA900-\uA97F\uAA00-\uAA5F\uAA60-\uAA7F\u10A0-\u10FF]/g, '_') || 'amharic_transcription'}.${extension}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    showToast(`Downloaded as ${extension.toUpperCase()}`);
  }

  function printTranscription() {
    const text = elements.outputTextarea.value;
    if (!text) return;

    const safeText = escapeHTML(text);
    const safeTitle = escapeHTML(transcriptTitle);
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${safeTitle}</title>
        <style>
          body { font-family: 'Noto Sans Ethiopic', sans-serif; padding: 2rem; line-height: 1.8; }
          h1 { font-size: 1.5rem; margin-bottom: 1rem; }
          .content { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>${safeTitle}</h1>
        <div class="content">${safeText}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  }

  async function copyToClipboard() {
    const text = elements.outputTextarea.value;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast('Copied to clipboard!');
      } catch (err) {
        showToast('Failed to copy. Please try again.');
      }
      document.body.removeChild(textarea);
    }
  }

  function shareOnWhatsApp() {
    const text = elements.outputTextarea.value;
    if (!text) return;

    const encodedText = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function shareOnTwitter() {
    const text = elements.outputTextarea.value;
    if (!text) return;

    const encodedText = encodeURIComponent(text);
    const url = `https://twitter.com/intent/tweet?text=${encodedText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // ============================================
  // NEW / RESET TRANSCRIPTION
  // ============================================

  function clearUploadAndPlayerState() {
    AudioUploadManager.clear();
    AudioPlayerManager.unload();
  }

  function resetTranscriptCore() {
    SpeechManager.stop();
    TranscriptionEngine.stop();
    if (typeof AudioManager !== 'undefined') AudioManager.stop();
    clearUploadAndPlayerState();
    saveCurrentToHistory();
    hideAudioVisualizer();
    updateAudioLevel(0);
    elements.outputTextarea.value = '';
    StorageManager.removeTranscription();
    elements.micStatus.textContent = 'Press to start recording';
    updateRecognitionStatusDisplay('idle');
    transcriptTitle = 'Untitled Transcript';
    StorageManager.removeTitle();
    elements.transcriptTitle.value = 'Untitled Transcript';
    SpeechManager.setFinalTranscript('');
    SearchManager.clear();
    updateWordCount();
    updateButtonStates();
    setStatus('status-ready');
  }

  function newTranscription() {
    resetTranscriptCore();
    showToast('New transcription started');
  }

  function resetTranscription() {
    resetTranscriptCore();
    showToast('Transcription cleared');
  }

  // ============================================
  // HISTORY & SETTINGS INTEGRATION
  // ============================================

  function openTranscriptFromHistory(id) {
    HistoryManager.get(id).then(function (result) {
      if (result.success && result.transcript) {
        var t = result.transcript;
        elements.outputTextarea.value = t.content || '';
        elements.transcriptTitle.value = t.title || 'Untitled Transcript';
        transcriptTitle = t.title || 'Untitled Transcript';
        SpeechManager.setFinalTranscript(t.content || '');
        SearchManager.clear();
        updateWordCount();
        updateButtonStates();
        HistoryManager.setCurrent(id);
        HistoryUI.setCurrentId(id);
        StorageManager.saveTranscription(t.content || '');
        StorageManager.saveTitle(t.title || 'Untitled Transcript');
        showToast('Opened: ' + (t.title || 'Untitled'));
      }
    }).catch(function () {
      showToast('Failed to load transcript');
    });
  }

  function saveCurrentToHistory() {
    var text = elements.outputTextarea.value;
    if (!text.trim()) return;

    var title = elements.transcriptTitle.value.trim() || 'Untitled Transcript';
    var duration = SpeechManager.getState().totalSpeakingDuration;
    var existingId = HistoryManager.getCurrentId();

    if (existingId) {
      HistoryManager.update(existingId, {
        title: title,
        content: text,
        duration: duration,
      });
    } else {
      HistoryManager.create({
        title: title,
        content: text,
        duration: duration,
      }).then(function (result) {
        if (result.success && result.transcript) {
          HistoryManager.setCurrent(result.transcript.id);
          HistoryUI.setCurrentId(result.transcript.id);
        }
      }).catch(function () {
        showToast('Failed to save to history');
      });
    }
  }

  function initHistoryAndSettings() {
    HistoryUI.init({ showToast: showToast });
    SettingsUI.init({ showToast: showToast });

    HistoryUI.onOpenTranscript(openTranscriptFromHistory);

    SettingsManager.onChange(function (key, newValue) {
      if (key === 'theme') {
        ThemeManager.setTheme(newValue);
      }
      if (key === 'speechLanguage') {
        SpeechManager.setLanguage(newValue);
      }
    });
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  function bindEvents() {
    elements.themeToggle.addEventListener('click', function () {
      var newTheme = ThemeManager.toggle();
      if (typeof SettingsManager !== 'undefined') {
        SettingsManager.set('theme', newTheme);
      }
      showToast('Switched to ' + newTheme + ' mode');
    });

    elements.micButton.addEventListener('click', () => {
      if (TranscriptionEngine.getIsRunning()) {
        TranscriptionEngine.stop();
        setRecordingState(false);
        setStatus('status-ready');
      } else if (AudioUploadManager.getState() === 'loaded') {
        TranscriptionEngine.start('file');
        setRecordingState(true);
        setStatus('status-listening');
      } else {
        SpeechManager.toggle();
      }
    });

    elements.copyButton.addEventListener('click', copyToClipboard);
    elements.printButton.addEventListener('click', printTranscription);
    elements.downloadTxtButton.addEventListener('click', () => saveAsFile('txt', 'text/plain'));
    elements.downloadDocButton.addEventListener('click', () => saveAsFile('doc', 'application/msword'));
    elements.whatsappButton.addEventListener('click', shareOnWhatsApp);
    elements.twitterButton.addEventListener('click', shareOnTwitter);
    elements.newTranscriptionButton.addEventListener('click', newTranscription);
    elements.resetButton.addEventListener('click', resetTranscription);

    var debouncedSave = debounce(function () {
      if (typeof SettingsUI !== 'undefined' && SettingsUI.isAutoSave()) saveTranscription();
    }, 300);
    var debouncedWordCount = debounce(updateWordCount, 150);

    elements.outputTextarea.addEventListener('input', function () {
      debouncedSave();
      debouncedWordCount();
    });

    elements.transcriptTitle.addEventListener('input', saveTitle);

    var debouncedSearch = debounce(function (val) { SearchManager.search(val); }, 150);
    elements.searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
    elements.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? SearchManager.navigate('prev') : SearchManager.navigate('next'); }
      if (e.key === 'Escape') SearchManager.clear();
    });
    elements.searchPrev.addEventListener('click', () => SearchManager.navigate('prev'));
    elements.searchNext.addEventListener('click', () => SearchManager.navigate('next'));
    elements.searchClear.addEventListener('click', () => SearchManager.clear());

    elements.micButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        elements.micButton.click();
      }
    });

    elements.themeToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ThemeManager.toggle(); }
    });
  }

  // ============================================
  // CLEANUP
  // ============================================

  function cleanup() {
    SpeechManager.stop();
    TranscriptionEngine.stop();
    AudioUploadManager.clear();
    AudioPlayerManager.unload();

    if (typeof AudioManager !== 'undefined') {
      AudioManager.destroy();
    }
  }

  // ============================================
  // AI FEATURES INITIALIZATION
  // ============================================

  function initAIFeatures() {
    var aiService = null;

    function getOrCreateAIService() {
      if (aiService) return aiService;
      try {
        aiService = AIService.create({ provider: 'openai', apiKey: '', model: 'gpt-4o-mini', timeout: 30000 });
        return aiService;
      } catch (e) {
        return null;
      }
    }

    AIUI.init({
      elements: {
        badge: elements.aiProviderBadge,
        improveBtn: elements.aiImproveBtn,
        summaryShortBtn: elements.aiSummaryShortBtn,
        summaryDetailedBtn: elements.aiSummaryDetailedBtn,
        summaryMeetingBtn: elements.aiSummaryMeetingBtn,
        translateTarget: elements.aiTranslateTarget,
        translateBtn: elements.aiTranslateBtn,
        keypointsBtn: elements.aiKeypointsBtn,
        keywordsBtn: elements.aiKeywordsBtn,
        status: elements.aiStatus,
        statusIcon: elements.aiStatusIcon,
        statusText: elements.aiStatusText,
        result: elements.aiResult,
        resultTitle: elements.aiResultTitle,
        resultBody: elements.aiResultBody,
        applyBtn: elements.aiApplyBtn,
        copyResultBtn: elements.aiCopyResultBtn,
        closeResultBtn: elements.aiCloseResultBtn,
      },
      callbacks: {
        getTranscript: function () { return elements.outputTextarea.value; },
        onApply: function (text) {
          elements.outputTextarea.value = text;
          SpeechManager.setFinalTranscript(text);
          saveTranscription();
          updateWordCount();
          updateButtonStates();
        },
        showToast: showToast,
      },
    });

    SettingsManager.onChange(function (key, value) {
      if (key === 'aiProvider' || key === 'aiModel') {
        refreshAIServices();
      }
    });

    window.addEventListener('aiApiKeySet', function () { refreshAIServices(); });
  }

  function setAIApiKey(apiKey) {
    StorageManager.setSecureSetting('aiApiKey', apiKey);
    refreshAIServices();
    window.dispatchEvent(new CustomEvent('aiApiKeySet'));
  }

  function refreshAIServices() {
    var provider = SettingsManager.get('aiProvider') || 'openai';
    var apiKey = StorageManager.getSecureSetting('aiApiKey') || '';
    var model = SettingsManager.get('aiModel') || 'gpt-4o-mini';
    var useCloud = ApiClient.isAuthenticated();

    if (useCloud) {
      provider = 'cloud';
    }

    if (!useCloud && !apiKey) {
      AIUI.updateProviderBadge(false);
      AIUI.setButtonsEnabled(false);
      return;
    }

    try {
      var serviceConfig = { provider: provider, apiKey: apiKey, model: model, timeout: 30000 };
      var service = AIService.create(serviceConfig);
      var summarizerInst = AISummarizer.create({ aiService: service });
      var translatorInst = AITranslator.create({ aiService: service });
      var analyzerInst = AIAnalyzer.create({ aiService: service });

      AIUI.setServices(summarizerInst, translatorInst, analyzerInst);
      AIUI.updateProviderBadge(true);
      AIUI.setButtonsEnabled(true);
    } catch (e) {
      AIUI.updateProviderBadge(false);
      AIUI.setButtonsEnabled(false);
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function initApp() {
    SearchManager.init({
      textarea: elements.outputTextarea,
      searchInput: elements.searchInput,
      matchCount: elements.searchMatchCount,
      prev: elements.searchPrev,
      next: elements.searchNext,
      clear: elements.searchClear,
    });

    SpeechManager.init({
      elements: {
        recordingTimer: elements.recordingTimer,
      },
      language: SettingsUI.getSpeechLanguage(),
      callbacks: {
        onRecordingStart: () => { setRecordingState(true); setStatus('status-listening'); elements.micStatus.textContent = 'Listening... Speak now.'; },
        onRecordingEnd: () => { setRecordingState(false); updateWordCount(); },
        onAudioVisualizerStart: async () => {
          showAudioVisualizer();
          setupAudioVisualizer();
          if (typeof AudioManager !== 'undefined') {
            const result = await AudioManager.start();
            if (result.success) {
              AudioManager.startVisualization();
            } else {
              console.warn('Audio visualization not available:', result.error);
            }
          }
        },
        onAudioVisualizerStop: () => {
          hideAudioVisualizer();
          updateAudioLevel(0);
          if (typeof AudioManager !== 'undefined') {
            AudioManager.stop();
          }
        },
        onTranscriptUpdate: (newText, isAppend) => { handleTranscriptUpdate(newText, isAppend); },
        onInterimUpdate: () => { elements.micStatus.textContent = 'Processing speech...'; },
        onError: (error) => {
          var msgs = {
            'no-speech': ['status-no-speech', 'No speech detected. Try again.'],
            'audio-capture': ['status-mic-error', 'Microphone access denied.'],
            'not-allowed': ['status-mic-error', 'Microphone permission denied.'],
          };
          if (msgs[error]) {
            setStatus(msgs[error][0]);
            if (error !== 'no-speech') updateMicIndicator('denied');
            elements.micStatus.textContent = msgs[error][1];
          } else if (error === 'network') {
            showToast('Network error. Check your connection.');
          } else if (error === 'start-failed') {
            showToast('Failed to start recording. Please try again.');
          } else {
            setStatus('status-error');
            elements.micStatus.textContent = 'An error occurred.';
          }
        },
        onIdle: () => { setStatus('status-ready'); elements.micStatus.textContent = 'Press to start recording'; },
        onComplete: () => { setStatus('status-ready'); elements.micStatus.textContent = 'Recording complete'; updateWordCount(); },
        onProcessing: () => setStatus('status-processing'),
        onMicIndicatorUpdate: (state) => updateMicIndicator(state),
        onRecognitionStatusUpdate: (status) => updateRecognitionStatusDisplay(status),
        onTimerUpdate: (duration, formatted) => { if (elements.statDuration) elements.statDuration.textContent = formatted; },
        onUnsupported: () => { setStatus('status-browser-error'); elements.micButton.disabled = true; updateMicIndicator('denied'); updateRecognitionStatusDisplay('error'); },
      },
    });

    bindEvents();
    initHistoryAndSettings();
    loadTranscription();
    loadTitle();
    updateWordCount();
    setStatus('status-ready');

    window.addEventListener('beforeunload', cleanup);
  }

  async function init() {
    ErrorHandler.init({ showToast: showToast });
    ThemeManager.init();

    try {
      await StorageManager.initDB();
      SettingsManager.init();
      if (StorageManager.needsMigration()) {
        await StorageManager.migrate();
      }
    } catch (error) {
      console.warn('IndexedDB initialization failed, continuing with localStorage:', error);
    }

    ApiClient.init({
      onAuthChange: function (isAuthenticated) {
        refreshAIServices();
        AuthUI.syncAuthState();
      }
    });

    AuthUI.init({ showToast: showToast });

    initApp();

    PwaManager.init();
    initAIFeatures();

    AudioUploadManager.init({
      elements: { dropZone: elements.uploadDropZone, fileInput: elements.uploadFileInput },
      callbacks: {
        onStateChange: function (state) {
          var isError = state === 'error', isLoading = state === 'loading', isIdle = state === 'idle';
          elements.uploadStatus.hidden = isIdle;
          elements.uploadFileInfo.hidden = !(isIdle || isError);
          if (isLoading) { elements.uploadStatus.setAttribute('data-state', 'loading'); elements.uploadStatusIcon.textContent = '\u23F3'; elements.uploadStatusText.textContent = 'Loading audio file...'; }
          else if (isError) { elements.uploadStatus.setAttribute('data-state', 'error'); elements.uploadStatusIcon.textContent = '\u26A0\uFE0F'; }
        },
        onFileLoaded: function (data) {
          elements.uploadStatus.hidden = true; elements.uploadFileInfo.hidden = false; elements.uploadExperimental.hidden = false;
          elements.uploadFileName.textContent = data.metadata.name; elements.uploadFormat.textContent = data.metadata.format;
          elements.uploadSize.textContent = data.metadata.sizeFormatted; elements.uploadDuration.textContent = data.metadata.durationFormatted;
          AudioPlayerManager.load(data.metadata.objectUrl, data.metadata);
        },
        onError: function (message) {
          elements.uploadStatus.hidden = false; elements.uploadStatus.setAttribute('data-state', 'error');
          elements.uploadStatusIcon.textContent = '\u26A0\uFE0F'; elements.uploadStatusText.textContent = message;
          elements.uploadFileInfo.hidden = true;
        },
      },
    });

    elements.uploadClear.addEventListener('click', function () {
      TranscriptionEngine.stop();
      AudioUploadManager.clear();
      AudioPlayerManager.unload();
    });

    AudioPlayerManager.init({
      elements: {
        playerContainer: elements.playerContainer, fileName: elements.playerFileName,
        playPauseBtn: elements.playerPlayPause, stopBtn: elements.playerStop,
        progressBar: elements.playerProgressBar, progressFill: elements.playerProgressFill,
        currentTime: elements.playerCurrentTime, totalDuration: elements.playerTotalDuration,
        speedSelect: elements.playerSpeedSelect, muteBtn: elements.playerMuteBtn, volumeSlider: elements.playerVolumeSlider,
      },
      callbacks: { onError: function (msg) { showToast(msg); } },
    });

    TranscriptionEngine.init({
      speechManager: SpeechManager,
      audioPlayer: AudioPlayerManager,
      callbacks: {
        onError: function (msg) { showToast(msg); },
        onFileTranscriptionStart: function () { setRecordingState(true); setStatus('status-listening'); },
        onTranscriptionStop: function () { setRecordingState(false); setStatus('status-ready'); },
      },
    });
  }

  // Start the app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
