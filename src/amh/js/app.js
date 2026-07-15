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
    elements.micButton.setAttribute(
      'aria-label',
      isRecording ? 'Stop voice recording' : 'Start voice recording'
    );
    elements.micStatus.textContent = isRecording
      ? 'Listening... Click to stop'
      : 'Press to start recording';
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
    if (elements.micIndicator) {
      elements.micIndicator.setAttribute('data-state', permissionState);
      const labels = {
        unknown: 'Microphone status: unknown',
        granted: 'Microphone available',
        denied: 'Microphone permission denied',
        prompt: 'Microphone permission requested',
        recording: 'Microphone active',
      };
      elements.micIndicator.setAttribute('aria-label', labels[permissionState] || 'Microphone status unknown');
    }
  }

  function updateRecognitionStatusDisplay(status) {
    if (elements.recognitionStatus) {
      const labels = {
        idle: 'Idle',
        listening: 'Listening',
        processing: 'Processing',
        error: 'Error',
      };
      elements.recognitionStatus.textContent = labels[status] || status;
    }
  }

  function updateAudioLevel(level) {
    if (elements.statAudioLevel) {
      if (level > 0.01) {
        const percentage = Math.round(level * 100);
        elements.statAudioLevel.textContent = `${percentage}%`;
      } else {
        elements.statAudioLevel.textContent = '--';
      }
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
    const printWindow = window.open('', '_blank');
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
    window.open(url, '_blank');
  }

  function shareOnTwitter() {
    const text = elements.outputTextarea.value;
    if (!text) return;

    const encodedText = encodeURIComponent(text);
    const url = `https://twitter.com/intent/tweet?text=${encodedText}`;
    window.open(url, '_blank');
  }

  // ============================================
  // NEW / RESET TRANSCRIPTION
  // ============================================

  function newTranscription() {
    SpeechManager.stop();

    if (typeof AudioManager !== 'undefined') {
      AudioManager.stop();
    }

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
    showToast('New transcription started');
  }

  function resetTranscription() {
    SpeechManager.stop();

    if (typeof AudioManager !== 'undefined') {
      AudioManager.stop();
    }

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
    showToast('Transcription cleared');
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  function bindEvents() {
    elements.themeToggle.addEventListener('click', () => {
      const newTheme = ThemeManager.toggle();
      showToast(`Switched to ${newTheme} mode`);
    });

    elements.micButton.addEventListener('click', () => {
      SpeechManager.toggle();
    });

    elements.copyButton.addEventListener('click', copyToClipboard);
    elements.printButton.addEventListener('click', printTranscription);
    elements.downloadTxtButton.addEventListener('click', () =>
      saveAsFile('txt', 'text/plain')
    );
    elements.downloadDocButton.addEventListener('click', () =>
      saveAsFile('doc', 'application/msword')
    );
    elements.whatsappButton.addEventListener('click', shareOnWhatsApp);
    elements.twitterButton.addEventListener('click', shareOnTwitter);
    elements.newTranscriptionButton.addEventListener('click', newTranscription);
    elements.resetButton.addEventListener('click', resetTranscription);

    elements.outputTextarea.addEventListener('input', () => {
      saveTranscription();
      updateWordCount();
    });

    elements.transcriptTitle.addEventListener('input', saveTitle);

    elements.searchInput.addEventListener('input', (e) => {
      SearchManager.search(e.target.value);
    });
    elements.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          SearchManager.navigate('prev');
        } else {
          SearchManager.navigate('next');
        }
      }
      if (e.key === 'Escape') {
        SearchManager.clear();
      }
    });
    elements.searchPrev.addEventListener('click', () => SearchManager.navigate('prev'));
    elements.searchNext.addEventListener('click', () => SearchManager.navigate('next'));
    elements.searchClear.addEventListener('click', () => SearchManager.clear());

    elements.micButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        SpeechManager.toggle();
      }
    });

    elements.themeToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        ThemeManager.toggle();
      }
    });
  }

  // ============================================
  // CLEANUP
  // ============================================

  function cleanup() {
    SpeechManager.stop();

    if (typeof AudioManager !== 'undefined') {
      AudioManager.destroy();
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
      callbacks: {
        onRecordingStart: () => {
          setRecordingState(true);
          setStatus('status-listening');
          elements.micStatus.textContent = 'Listening... Speak now.';
        },
        onRecordingEnd: (duration) => {
          setRecordingState(false);
          updateWordCount();
        },
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
        onTranscriptUpdate: (newText, isAppend) => {
          handleTranscriptUpdate(newText, isAppend);
        },
        onInterimUpdate: (interimText) => {
          elements.micStatus.textContent = 'Processing speech...';
        },
        onError: (error) => {
          switch (error) {
            case 'no-speech':
              setStatus('status-no-speech');
              elements.micStatus.textContent = 'No speech detected. Try again.';
              break;
            case 'audio-capture':
              setStatus('status-mic-error');
              updateMicIndicator('denied');
              elements.micStatus.textContent = 'Microphone access denied.';
              break;
            case 'not-allowed':
              setStatus('status-mic-error');
              updateMicIndicator('denied');
              elements.micStatus.textContent = 'Microphone permission denied.';
              break;
            case 'network':
              showToast('Network error. Check your connection.');
              break;
            case 'start-failed':
              showToast('Failed to start recording. Please try again.');
              break;
            default:
              setStatus('status-error');
              elements.micStatus.textContent = 'An error occurred.';
          }
        },
        onIdle: () => {
          setStatus('status-ready');
          elements.micStatus.textContent = 'Press to start recording';
        },
        onComplete: (duration) => {
          setStatus('status-ready');
          elements.micStatus.textContent = 'Recording complete';
          updateWordCount();
        },
        onProcessing: () => {
          setStatus('status-processing');
        },
        onMicIndicatorUpdate: (state) => {
          updateMicIndicator(state);
        },
        onRecognitionStatusUpdate: (status) => {
          updateRecognitionStatusDisplay(status);
        },
        onTimerUpdate: (duration, formatted) => {
          if (elements.statDuration) {
            elements.statDuration.textContent = formatted;
          }
        },
        onUnsupported: () => {
          setStatus('status-browser-error');
          elements.micButton.disabled = true;
          updateMicIndicator('denied');
          updateRecognitionStatusDisplay('error');
        },
      },
    });

    bindEvents();
    loadTranscription();
    loadTitle();
    updateWordCount();
    setStatus('status-ready');

    window.addEventListener('beforeunload', cleanup);
  }

  async function init() {
    ThemeManager.init();

    try {
      await StorageManager.initDB();
      if (StorageManager.needsMigration()) {
        await StorageManager.migrate();
      }
    } catch (error) {
      console.warn('IndexedDB initialization failed, continuing with localStorage:', error);
    }

    initApp();
  }

  // Start the app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
