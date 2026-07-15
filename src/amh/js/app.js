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
  const THEME_KEY = 'theme';

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
    ignoreOnEnd: false,
    theme: localStorage.getItem(THEME_KEY) || 'dark',
  };

  // ============================================
  // DOM REFERENCES
  // ============================================

  const elements = {
    themeToggle: document.getElementById('theme-toggle'),
    micButton: document.getElementById('mic-button'),
    micAnimated: document.getElementById('mic-animated'),
    micStatus: document.getElementById('mic-status'),
    outputTextarea: document.getElementById('transcription-output'),
    copyButton: document.getElementById('copy-button'),
    printButton: document.getElementById('print-button'),
    downloadTxtButton: document.getElementById('download-txt-button'),
    downloadDocButton: document.getElementById('download-doc-button'),
    whatsappButton: document.getElementById('whatsapp-button'),
    twitterButton: document.getElementById('twitter-button'),
    newTranscriptionButton: document.getElementById('new-transcription-button'),
    resetButton: document.getElementById('reset-button'),
    charCount: document.getElementById('char-count'),
    wordCountValue: document.getElementById('word-count-value'),
    statusMessages: document.getElementById('status-messages'),
    toastContainer: document.getElementById('toast-container'),
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
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    elements.charCount.textContent = charCount;
    elements.wordCountValue.textContent = wordCount;
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
  }

  function handleRecognitionStart() {
    setRecordingState(true);
    setStatus('status-listening');
    elements.micStatus.textContent = 'Listening... Speak now.';
  }

  function handleRecognitionResult(event) {
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        // Append new text on TOP (prepend) of existing text
        const existingText = elements.outputTextarea.value;
        const newText = transcript.trim();
        
        if (existingText.trim()) {
          elements.outputTextarea.value = newText + '\n' + existingText;
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

    switch (event.error) {
      case 'no-speech':
        setStatus('status-no-speech');
        elements.micStatus.textContent = 'No speech detected. Try again.';
        break;
      case 'audio-capture':
        setStatus('status-mic-error');
        elements.micStatus.textContent = 'Microphone access denied.';
        break;
      case 'not-allowed':
        setStatus('status-mic-error');
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

    if (state.ignoreOnEnd) {
      state.ignoreOnEnd = false;
      return;
    }

    if (!state.finalTranscript) {
      setStatus('status-ready');
      elements.micStatus.textContent = 'Press to start recording';
      return;
    }

    setStatus('status-ready');
    elements.micStatus.textContent = 'Recording complete';
  }

  function toggleRecording() {
    if (state.isRecording) {
      state.recognition.stop();
    } else {
      state.finalTranscript = '';
      // Do NOT clear the textarea - keep existing text
      
      try {
        state.recognition.start();
        state.startTimestamp = Date.now();
        setStatus('status-processing');
      } catch (error) {
        console.error('Failed to start recognition:', error);
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
    const filename = `amharic_transcription.${extension}`;

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

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Amharic Transcription</title>
        <style>
          body { font-family: 'Noto Sans Ethiopic', sans-serif; padding: 2rem; line-height: 1.8; }
          h1 { font-size: 1.5rem; margin-bottom: 1rem; }
          .content { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>Amharic Voice-to-Text Transcription</h1>
        <div class="content">${text}</div>
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

    state.finalTranscript = '';
    state.interimTranscript = '';
    elements.outputTextarea.value = '';
    localStorage.removeItem(STORAGE_KEY);
    elements.micStatus.textContent = 'Press to start recording';

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

    state.finalTranscript = '';
    state.interimTranscript = '';
    elements.outputTextarea.value = '';
    localStorage.removeItem(STORAGE_KEY);
    elements.micStatus.textContent = 'Press to start recording';

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

    // Save on textarea change (manual edits)
    elements.outputTextarea.addEventListener('input', saveTranscription);

    // Keyboard accessibility
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
  // INITIALIZATION
  // ============================================

  function init() {
    initTheme();
    initSpeechRecognition();
    bindEvents();
    loadTranscription();
    setStatus('status-ready');
  }

  // Start the app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
