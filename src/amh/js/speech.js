/**
 * Speech Recognition Module
 * Handles Web Speech API integration and recognition lifecycle
 */

const SpeechManager = (function () {
  'use strict';

  const RECORDING_TIMER_INTERVAL = 1000;

  let recognition = null;
  let isSupported = false;
  let isRecording = false;
  let finalTranscript = '';
  let ignoreOnEnd = false;
  let startTimestamp = 0;
  let recordingDuration = 0;
  let recordingTimer = null;
  let totalSpeakingDuration = 0;
  let microphonePermission = 'unknown';
  let recognitionStatus = 'idle';

  let elements = {};
  let callbacks = {};

  function init(config) {
    elements = config.elements || {};
    callbacks = config.callbacks || {};

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      isSupported = false;
      if (callbacks.onUnsupported) {
        callbacks.onUnsupported();
      }
      return;
    }

    isSupported = true;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = config.language || 'am-ET';

    recognition.onstart = handleRecognitionStart;
    recognition.onresult = handleRecognitionResult;
    recognition.onerror = handleRecognitionError;
    recognition.onend = handleRecognitionEnd;

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

  function updateMicIndicator(state) {
    microphonePermission = state;
    if (callbacks.onMicIndicatorUpdate) {
      callbacks.onMicIndicatorUpdate(state);
    }
  }

  function updateRecognitionStatus(status) {
    recognitionStatus = status;
    if (callbacks.onRecognitionStatusUpdate) {
      callbacks.onRecognitionStatusUpdate(status);
    }
  }

  var transientRetryCount = 0;
  var MAX_TRANSIENT_RETRIES = 2;
  var TRANSIENT_ERRORS = ['network', 'aborted'];

  function handleRecognitionStart() {
    isRecording = true;
    transientRetryCount = 0;
    startRecordingTimer();
    updateRecognitionStatus('listening');
    updateMicIndicator('recording');

    if (callbacks.onRecordingStart) {
      callbacks.onRecordingStart();
    }

    if (callbacks.onAudioVisualizerStart) {
      Promise.resolve(callbacks.onAudioVisualizerStart()).catch(function () {});
    }
  }

  function handleRecognitionResult(event) {
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        const newText = transcript.trim();
        if (callbacks.onTranscriptUpdate) {
          callbacks.onTranscriptUpdate(newText, true);
        }
      } else {
        interimTranscript += transcript;
      }
    }

    if (interimTranscript && callbacks.onInterimUpdate) {
      callbacks.onInterimUpdate(interimTranscript);
    }
  }

  function handleRecognitionError(event) {
    updateRecognitionStatus('error');

    if (callbacks.onError) {
      callbacks.onError(event.error);
    }

    if (TRANSIENT_ERRORS.indexOf(event.error) !== -1 && transientRetryCount < MAX_TRANSIENT_RETRIES && isRecording) {
      transientRetryCount++;
      setTimeout(function () {
        if (recognition && isRecording) {
          try { recognition.start(); } catch (e) { ignoreOnEnd = true; }
        }
      }, 1000 * transientRetryCount);
      return;
    }

    ignoreOnEnd = true;
  }

  function handleRecognitionEnd() {
    isRecording = false;
    totalSpeakingDuration += recordingDuration;
    stopRecordingTimer();
    updateRecognitionStatus('idle');
    updateMicIndicator('granted');

    if (callbacks.onAudioVisualizerStop) {
      callbacks.onAudioVisualizerStop();
    }

    if (callbacks.onRecordingEnd) {
      callbacks.onRecordingEnd(totalSpeakingDuration);
    }

    if (ignoreOnEnd) {
      ignoreOnEnd = false;
      updateRecognitionStatus('error');
      return;
    }

    if (!finalTranscript) {
      if (callbacks.onIdle) {
        callbacks.onIdle();
      }
      return;
    }

    if (callbacks.onComplete) {
      callbacks.onComplete(totalSpeakingDuration);
    }
  }

  function startRecordingTimer() {
    recordingDuration = 0;
    updateTimerDisplay();
    if (elements.recordingTimer) {
      elements.recordingTimer.hidden = false;
    }
    recordingTimer = setInterval(() => {
      recordingDuration++;
      updateTimerDisplay();
    }, RECORDING_TIMER_INTERVAL);
  }

  function stopRecordingTimer() {
    if (recordingTimer) {
      clearInterval(recordingTimer);
      recordingTimer = null;
    }
    if (elements.recordingTimer) {
      elements.recordingTimer.hidden = true;
    }
    recordingDuration = 0;
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    const formatted = StatsManager.formatDuration(recordingDuration);
    if (elements.recordingTimer) {
      elements.recordingTimer.textContent = formatted;
    }
    if (callbacks.onTimerUpdate) {
      callbacks.onTimerUpdate(recordingDuration, formatted);
    }
  }

  async function toggle() {
    if (isRecording) {
      recognition.stop();
    } else {
      finalTranscript = '';
      updateRecognitionStatus('processing');

      if (microphonePermission === 'unknown') {
        updateMicIndicator('prompt');
      }

      try {
        recognition.start();
        startTimestamp = Date.now();
        if (callbacks.onProcessing) {
          callbacks.onProcessing();
        }
      } catch (error) {
        console.error('Failed to start recognition:', error);
        updateRecognitionStatus('error');
        if (callbacks.onError) {
          callbacks.onError('start-failed');
        }
      }
    }
  }

  function setFinalTranscript(text) {
    finalTranscript = text;
  }

  function setLanguage(lang) {
    if (recognition && typeof lang === 'string' && lang.length > 0) {
      recognition.lang = lang;
    }
  }

  function updateTranscript(newText, isAppend) {
    if (callbacks.onTranscriptUpdate) {
      callbacks.onTranscriptUpdate(newText, isAppend);
    }
  }

  function getState() {
    return {
      isRecording,
      isSupported,
      microphonePermission,
      recognitionStatus,
      totalSpeakingDuration,
      recordingDuration,
    };
  }

  function stop() {
    if (isRecording && recognition) {
      recognition.stop();
    }
    stopRecordingTimer();
  }

  function destroy() {
    stop();
    recognition = null;
  }

  return {
    init,
    toggle,
    stop,
    destroy,
    getState,
    setFinalTranscript,
    setLanguage,
    updateTranscript,
    checkMicrophonePermission,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpeechManager;
}
