/**
 * Transcription Engine Module
 * Unified abstraction for live mic and file-based transcription
 */

const TranscriptionEngine = (function () {
  'use strict';

  var mode = null;
  var isRunning = false;
  var callbacks = {};

  function init(config) {
    callbacks = config.callbacks || {};
  }

  function startTranscription(transcriptMode, audioPlayer) {
    if (isRunning) return;

    mode = transcriptMode;

    if (mode === 'file') {
      startFileTranscription(audioPlayer);
    } else {
      startMicTranscription();
    }
  }

  function startMicTranscription() {
    isRunning = true;
    SpeechManager.toggle();
  }

  function startFileTranscription(audioPlayer) {
    if (!audioPlayer || audioPlayer.getState() === 'idle') {
      if (callbacks.onError) {
        callbacks.onError('No audio loaded. Upload a file first.');
      }
      return;
    }

    isRunning = true;

    audioPlayer.play();

    var audio = audioPlayer.getAudio();
    if (audio) {
      audio.addEventListener('ended', handleFilePlaybackEnded);
    }

    SpeechManager.toggle();

    if (callbacks.onFileTranscriptionStart) {
      callbacks.onFileTranscriptionStart();
    }
  }

  function handleFilePlaybackEnded() {
    setTimeout(function () {
      if (isRunning && mode === 'file') {
        stopTranscription();
      }
    }, 1500);
  }

  function stopTranscription() {
    if (!isRunning) return;

    isRunning = false;

    if (mode === 'file') {
      var audio = AudioPlayerManager.getAudio();
      if (audio) {
        audio.removeEventListener('ended', handleFilePlaybackEnded);
        audio.pause();
        audio.currentTime = 0;
      }
      AudioPlayerManager.stop();
    }

    if (SpeechManager.getState().isRecording) {
      SpeechManager.toggle();
    }

    if (callbacks.onTranscriptionStop) {
      callbacks.onTranscriptionStop();
    }

    mode = null;
  }

  function getMode() {
    return mode;
  }

  function getIsRunning() {
    return isRunning;
  }

  return {
    init: init,
    start: startTranscription,
    stop: stopTranscription,
    getMode: getMode,
    getIsRunning: getIsRunning,
  };
})();
