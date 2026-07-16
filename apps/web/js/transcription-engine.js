/**
 * Transcription Engine Module
 * Unified abstraction for mic and file-based transcription
 *
 * Mic mode: delegates directly to SpeechManager
 * File mode: EXPERIMENTAL — plays audio through speakers, captured via mic
 */

const TranscriptionEngine = (function () {
  'use strict';

  var mode = null;
  var isRunning = false;
  var callbacks = {};
  var speechRef = null;
  var playerRef = null;
  var trailingTimer = null;
  var fileEndedHandler = null;

  function init(config) {
    callbacks = config.callbacks || {};
    speechRef = config.speechManager || null;
    playerRef = config.audioPlayer || null;
  }

  function startTranscription(transcriptMode) {
    if (isRunning) return;

    if (!speechRef) {
      if (callbacks.onError) callbacks.onError('Speech engine not initialized.');
      return;
    }

    mode = transcriptMode;

    if (mode === 'file') {
      startFileTranscription();
    } else {
      startMicTranscription();
    }
  }

  function startMicTranscription() {
    isRunning = true;
    speechRef.toggle();
  }

  function startFileTranscription() {
    if (!playerRef || playerRef.getState() === 'idle') {
      if (callbacks.onError) {
        callbacks.onError('No audio loaded. Upload a file first.');
      }
      mode = null;
      return;
    }

    isRunning = true;

    playerRef.play();

    var audio = playerRef.getAudio();
    if (audio) {
      fileEndedHandler = handleFilePlaybackEnded;
      audio.addEventListener('ended', fileEndedHandler);
    }

    speechRef.toggle();

    if (callbacks.onFileTranscriptionStart) {
      callbacks.onFileTranscriptionStart();
    }
  }

  function handleFilePlaybackEnded() {
    trailingTimer = setTimeout(function () {
      trailingTimer = null;
      if (isRunning && mode === 'file') {
        stopTranscription();
      }
    }, 1500);
  }

  function stopTranscription() {
    if (!isRunning) return;

    isRunning = false;

    if (trailingTimer) {
      clearTimeout(trailingTimer);
      trailingTimer = null;
    }

    if (mode === 'file') {
      var audio = playerRef ? playerRef.getAudio() : null;
      if (audio && fileEndedHandler) {
        audio.removeEventListener('ended', fileEndedHandler);
      }
      fileEndedHandler = null;
      if (playerRef) playerRef.stop();
    }

    if (speechRef && speechRef.getState().isRecording) {
      speechRef.toggle();
    }

    if (callbacks.onTranscriptionStop) {
      callbacks.onTranscriptionStop();
    }

    mode = null;
  }

  function resetOnError() {
    isRunning = false;
    mode = null;
    if (trailingTimer) {
      clearTimeout(trailingTimer);
      trailingTimer = null;
    }
    fileEndedHandler = null;
  }

  function getMode() { return mode; }
  function getIsRunning() { return isRunning; }

  return {
    init: init,
    start: startTranscription,
    stop: stopTranscription,
    resetOnError: resetOnError,
    getMode: getMode,
    getIsRunning: getIsRunning,
  };
})();
