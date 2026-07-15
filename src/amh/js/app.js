/**
 * Amharic Voice-to-Text Application
 * Modern speech recognition with state management and persistence
 */

(function () {
  'use strict';

  // ============================================
  // CONSTANTS
  // ============================================

  const STORAGE_KEY = 'amharic_transcription';
  const TITLE_STORAGE_KEY = 'amharic_transcript_title';
  const THEME_KEY = 'theme';
  const RECORDING_TIMER_INTERVAL = 1000;
  const READING_SPEED_WPM = 200;

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const state = {
    isRecording: false,
    isSupported: false,
    finalTranscript: '',
    interimTranscript: '',
    recognition: null,
    startTimestamp: 0,
    recordingDuration: 0,
    recordingTimer: null,
    ignoreOnEnd: false,
    theme: localStorage.getItem(THEME_KEY) || 'dark',
    microphonePermission: 'unknown',
    recognitionStatus: 'idle',
    transcriptTitle: localStorage.getItem(TITLE_STORAGE_KEY) || 'Untitled Transcript',
    searchQuery: '',
    searchMatches: [],
    currentMatchIndex: -1,
    totalSpeakingDuration: 0,
  };

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

  // ============================================
  // THEME MANAGEMENT
  // ============================================

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  function toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    showToast(`Switched to ${newTheme} mode`);
  }

  function initTheme() {
    if (!localStorage.getItem(THEME_KEY)) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      state.theme = prefersDark ? 'dark' : 'light';
    }
    setTheme(state.theme);
  }

  // ============================================
  // PERSISTENCE
  // ============================================

  function saveTranscription() {
    const text = elements.outputTextarea.value;
    if (text) {
      localStorage.setItem(STORAGE_KEY, text);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function loadTranscription() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      elements.outputTextarea.value = saved;
      updateWordCount();
      updateButtonStates();
    }
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  function updateWordCount() {
    const text = elements.outputTextarea.value;
    const charCount = text.length;
    const wordCount = countWords(text);
    const readTime = calculateReadingTime(wordCount);

    if (elements.charCount) {
      elements.charCount.textContent = charCount.toLocaleString();
    }
    if (elements.wordCountValue) {
      elements.wordCountValue.textContent = wordCount.toLocaleString();
    }
    if (elements.readingTime) {
      elements.readingTime.textContent = readTime;
    }
    if (elements.speechDuration) {
      elements.speechDuration.textContent = formatDuration(state.totalSpeakingDuration);
    }

    updateEmptyState();
  }

  function countWords(text) {
    if (!text || text.trim() === '') return 0;
    
    const trimmed = text.trim();
    
    const ethiopicWordCount = trimmed.match(/[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF\uAB00-\uAB2F\u1300-\u137F\u2D80-\u2DDF\u13A0-\u13FF\u2000-\u206F\u2D30-\u2D7F\uA6A0-\uA6FF\uA900-\uA97F\uAA00-\uAA5F\uAA60-\uAA7F\u10A0-\u10FF\u2010-\u2027\u2030-\u205E\u20A0-\u20CF]+/g);
    
    const latinWordCount = trimmed.match(/[a-zA-Z0-9]+/g);
    
    let count = 0;
    if (ethiopicWordCount) count += ethiopicWordCount.length;
    if (latinWordCount) count += latinWordCount.length;
    
    if (count === 0 && trimmed.length > 0) {
      count = trimmed.split(/\s+/).length;
    }
    
    return count;
  }

  function calculateReadingTime(wordCount) {
    const minutes = Math.ceil(wordCount / READING_SPEED_WPM);
    if (minutes < 1) return '< 1 min';
    if (minutes === 1) return '1 min';
    return `${minutes} min`;
  }

  function updateEmptyState() {
    if (elements.emptyState) {
      const hasText = elements.outputTextarea.value.trim().length > 0;
      elements.emptyState.classList.toggle('hidden', hasText);
    }
  }

  // ============================================
  // TITLE MANAGEMENT
  // ============================================

  function saveTitle() {
    const title = elements.transcriptTitle.value.trim() || 'Untitled Transcript';
    state.transcriptTitle = title;
    localStorage.setItem(TITLE_STORAGE_KEY, title);
  }

  function loadTitle() {
    const saved = localStorage.getItem(TITLE_STORAGE_KEY);
    if (saved) {
      state.transcriptTitle = saved;
      if (elements.transcriptTitle) {
        elements.transcriptTitle.value = saved;
      }
    }
  }

  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================

  function performSearch(query) {
    state.searchQuery = query;
    state.searchMatches = [];
    state.currentMatchIndex = -1;

    if (!query || query.length < 2) {
      updateSearchUI();
      return;
    }

    const text = elements.outputTextarea.value;
    if (!text) {
      updateSearchUI();
      return;
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
      state.searchMatches.push({
        index: match.index,
        length: match[0].length,
        text: match[0],
      });
    }

    if (state.searchMatches.length > 0) {
      state.currentMatchIndex = 0;
      highlightCurrentMatch();
    }

    updateSearchUI();
  }

  function navigateSearch(direction) {
    if (state.searchMatches.length === 0) return;

    if (direction === 'next') {
      state.currentMatchIndex = (state.currentMatchIndex + 1) % state.searchMatches.length;
    } else {
      state.currentMatchIndex = (state.currentMatchIndex - 1 + state.searchMatches.length) % state.searchMatches.length;
    }

    highlightCurrentMatch();
    updateSearchUI();
  }

  function highlightCurrentMatch() {
    if (state.currentMatchIndex < 0 || state.currentMatchIndex >= state.searchMatches.length) {
      return;
    }

    const match = state.searchMatches[state.currentMatchIndex];
    const textarea = elements.outputTextarea;

    textarea.focus();
    textarea.setSelectionRange(match.index, match.index + match.length);

    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 28;
    const linesBeforeMatch = textarea.value.substr(0, match.index).split('\n').length;
    const targetScrollTop = (linesBeforeMatch - 3) * lineHeight;
    textarea.scrollTop = Math.max(0, targetScrollTop);
  }

  function clearSearch() {
    elements.searchInput.value = '';
    state.searchQuery = '';
    state.searchMatches = [];
    state.currentMatchIndex = -1;
    updateSearchUI();
    elements.outputTextarea.focus();
  }

  function updateSearchUI() {
    const hasQuery = state.searchQuery && state.searchQuery.length >= 2;
    const matchCount = state.searchMatches.length;
    const hasMatches = matchCount > 0;

    if (elements.searchMatchCount) {
      if (!hasQuery) {
        elements.searchMatchCount.textContent = '';
      } else if (hasMatches) {
        elements.searchMatchCount.textContent = `${state.currentMatchIndex + 1} of ${matchCount}`;
      } else {
        elements.searchMatchCount.textContent = 'No matches';
      }
    }

    if (elements.searchPrev) {
      elements.searchPrev.disabled = !hasMatches;
    }
    if (elements.searchNext) {
      elements.searchNext.disabled = !hasMatches;
    }
    if (elements.searchClear) {
      elements.searchClear.disabled = !hasQuery;
    }
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
    state.isRecording = isRecording;
    elements.micButton.setAttribute('aria-pressed', isRecording.toString());
    elements.micButton.setAttribute(
      'aria-label',
      isRecording ? 'Stop voice recording' : 'Start voice recording'
    );
    elements.micStatus.textContent = isRecording
      ? 'Listening... Click to stop'
      : 'Press to start recording';
  }

  function startRecordingTimer() {
    state.recordingDuration = 0;
    updateTimerDisplay();
    elements.recordingTimer.hidden = false;
    state.recordingTimer = setInterval(() => {
      state.recordingDuration++;
      updateTimerDisplay();
    }, RECORDING_TIMER_INTERVAL);
  }

  function stopRecordingTimer() {
    if (state.recordingTimer) {
      clearInterval(state.recordingTimer);
      state.recordingTimer = null;
    }
    elements.recordingTimer.hidden = true;
    state.recordingDuration = 0;
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    if (elements.recordingTimer) {
      elements.recordingTimer.textContent = formatDuration(state.recordingDuration);
    }
    if (elements.statDuration) {
      elements.statDuration.textContent = formatDuration(state.recordingDuration);
    }
  }

  // ============================================
  // DASHBOARD MANAGEMENT
  // ============================================

  function updateMicIndicator(permissionState) {
    state.microphonePermission = permissionState;
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

  function updateRecognitionStatus(status) {
    state.recognitionStatus = status;
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

  // ============================================
  // SPEECH RECOGNITION
  // ============================================

  function initSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      state.isSupported = false;
      setStatus('status-browser-error');
      elements.micButton.disabled = true;
      updateMicIndicator('denied');
      updateRecognitionStatus('error');
      return;
    }

    state.isSupported = true;
    state.recognition = new SpeechRecognition();
    state.recognition.continuous = true;
    state.recognition.interimResults = true;
    state.recognition.lang = 'am-ET';

    state.recognition.onstart = handleRecognitionStart;
    state.recognition.onresult = handleRecognitionResult;
    state.recognition.onerror = handleRecognitionError;
    state.recognition.onend = handleRecognitionEnd;

    checkMicrophonePermission();
  }

  async function checkMicrophonePermission() {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' });
        updateMicIndicator(result.state);

        result.addEventListener('change', () => {
          updateMicIndicator(result.state);
        });
      } else {
        updateMicIndicator('granted');
      }
    } catch (error) {
      updateMicIndicator('granted');
    }
  }

  async function handleRecognitionStart() {
    setRecordingState(true);
    startRecordingTimer();
    setStatus('status-listening');
    updateRecognitionStatus('listening');
    updateMicIndicator('recording');
    elements.micStatus.textContent = 'Listening... Speak now.';

    if (typeof AudioManager !== 'undefined') {
      showAudioVisualizer();
      setupAudioVisualizer();
      const result = await AudioManager.start();
      if (result.success) {
        AudioManager.startVisualization();
      } else {
        console.warn('Audio visualization not available:', result.error);
      }
    }
  }

  function handleRecognitionResult(event) {
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        const existingText = elements.outputTextarea.value;
        const newText = transcript.trim();
        
        if (existingText.trim()) {
          elements.outputTextarea.value = existingText + '\n' + newText;
        } else {
          elements.outputTextarea.value = newText;
        }
        
        state.finalTranscript = elements.outputTextarea.value;
        saveTranscription();
      } else {
        interimTranscript += transcript;
      }
    }

    if (interimTranscript) {
      elements.micStatus.textContent = 'Processing speech...';
    }

    updateWordCount();
    updateButtonStates();
  }

  function handleRecognitionError(event) {
    console.error('Speech recognition error:', event.error);
    updateRecognitionStatus('error');

    switch (event.error) {
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
      default:
        setStatus('status-error');
        elements.micStatus.textContent = 'An error occurred.';
    }

    state.ignoreOnEnd = true;
  }

  function handleRecognitionEnd() {
    setRecordingState(false);
    state.totalSpeakingDuration += state.recordingDuration;
    stopRecordingTimer();
    updateRecognitionStatus('idle');
    updateMicIndicator('granted');
    hideAudioVisualizer();
    updateAudioLevel(0);

    if (typeof AudioManager !== 'undefined') {
      AudioManager.stop();
    }

    if (state.ignoreOnEnd) {
      state.ignoreOnEnd = false;
      updateRecognitionStatus('error');
      return;
    }

    if (!state.finalTranscript) {
      setStatus('status-ready');
      elements.micStatus.textContent = 'Press to start recording';
      return;
    }

    setStatus('status-ready');
    elements.micStatus.textContent = 'Recording complete';
    updateWordCount();
  }

  async function toggleRecording() {
    if (state.isRecording) {
      state.recognition.stop();
    } else {
      state.finalTranscript = '';
      updateRecognitionStatus('processing');
      
      if (state.microphonePermission === 'unknown') {
        updateMicIndicator('prompt');
      }
      
      try {
        state.recognition.start();
        state.startTimestamp = Date.now();
        setStatus('status-processing');
      } catch (error) {
        console.error('Failed to start recognition:', error);
        updateRecognitionStatus('error');
        showToast('Failed to start recording. Please try again.');
      }
    }
  }

  // ============================================
  // CLIPBOARD
  // ============================================

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

  // ============================================
  // FILE OPERATIONS
  // ============================================

  function saveAsFile(extension, mimeType) {
    const text = elements.outputTextarea.value;
    if (!text) return;

    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const filename = `${state.transcriptTitle.replace(/[^a-zA-Z0-9\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF\uAB00-\uAB2F\u13A0-\u13FF\u2D30-\u2D7F\uA6A0-\uA6FF\uA900-\uA97F\uAA00-\uAA5F\uAA60-\uAA7F\u10A0-\u10FF]/g, '_') || 'amharic_transcription'}.${extension}`;

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
    const safeTitle = escapeHTML(state.transcriptTitle);
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

  // ============================================
  // SOCIAL SHARING
  // ============================================

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
  // NEW TRANSCRIPTION
  // ============================================

  function newTranscription() {
    if (state.isRecording) {
      state.recognition.stop();
    }
    stopRecordingTimer();
    hideAudioVisualizer();
    updateAudioLevel(0);

    if (typeof AudioManager !== 'undefined') {
      AudioManager.stop();
    }

    state.finalTranscript = '';
    state.interimTranscript = '';
    state.totalSpeakingDuration = 0;
    elements.outputTextarea.value = '';
    localStorage.removeItem(STORAGE_KEY);
    elements.micStatus.textContent = 'Press to start recording';
    updateRecognitionStatus('idle');

    state.transcriptTitle = 'Untitled Transcript';
    localStorage.removeItem(TITLE_STORAGE_KEY);
    elements.transcriptTitle.value = 'Untitled Transcript';

    clearSearch();

    updateWordCount();
    updateButtonStates();
    setStatus('status-ready');
    showToast('New transcription started');
  }

  // ============================================
  // RESET (Clear all text)
  // ============================================

  function resetTranscription() {
    if (state.isRecording) {
      state.recognition.stop();
    }
    stopRecordingTimer();
    hideAudioVisualizer();
    updateAudioLevel(0);

    if (typeof AudioManager !== 'undefined') {
      AudioManager.stop();
    }

    state.finalTranscript = '';
    state.interimTranscript = '';
    state.totalSpeakingDuration = 0;
    elements.outputTextarea.value = '';
    localStorage.removeItem(STORAGE_KEY);
    elements.micStatus.textContent = 'Press to start recording';
    updateRecognitionStatus('idle');

    state.transcriptTitle = 'Untitled Transcript';
    localStorage.removeItem(TITLE_STORAGE_KEY);
    elements.transcriptTitle.value = 'Untitled Transcript';

    clearSearch();

    updateWordCount();
    updateButtonStates();
    setStatus('status-ready');
    showToast('Transcription cleared');
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  function bindEvents() {
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.micButton.addEventListener('click', toggleRecording);
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
      performSearch(e.target.value);
    });
    elements.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          navigateSearch('prev');
        } else {
          navigateSearch('next');
        }
      }
      if (e.key === 'Escape') {
        clearSearch();
      }
    });
    elements.searchPrev.addEventListener('click', () => navigateSearch('prev'));
    elements.searchNext.addEventListener('click', () => navigateSearch('next'));
    elements.searchClear.addEventListener('click', clearSearch);

    elements.micButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleRecording();
      }
    });

    elements.themeToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleTheme();
      }
    });
  }

  // ============================================
  // CLEANUP
  // ============================================

  function cleanup() {
    if (state.isRecording && state.recognition) {
      state.recognition.stop();
    }

    stopRecordingTimer();

    if (typeof AudioManager !== 'undefined') {
      AudioManager.destroy();
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    initTheme();
    initSpeechRecognition();
    bindEvents();
    loadTranscription();
    loadTitle();
    updateWordCount();
    setStatus('status-ready');

    window.addEventListener('beforeunload', cleanup);
  }

  // Start the app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
