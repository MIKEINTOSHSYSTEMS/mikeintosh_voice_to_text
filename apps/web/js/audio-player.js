/**
 * Audio Player Module
 * Provides playback controls for uploaded audio files
 */

const AudioPlayerManager = (function () {
  'use strict';

  var audio = null;
  var state = 'idle';
  var callbacks = {};
  var elements = {};
  var animationFrame = null;
  var currentObjectUrl = null;
  var loadId = 0;

  var SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  function init(config) {
    elements = config.elements || {};
    callbacks = config.callbacks || {};
    bindEvents();
  }

  function bindEvents() {
    if (elements.playPauseBtn) {
      elements.playPauseBtn.addEventListener('click', togglePlayPause);
    }
    if (elements.stopBtn) {
      elements.stopBtn.addEventListener('click', stop);
    }
    if (elements.progressBar) {
      elements.progressBar.addEventListener('click', seek);
    }
    if (elements.speedSelect) {
      elements.speedSelect.addEventListener('change', changeSpeed);
    }
    if (elements.muteBtn) {
      elements.muteBtn.addEventListener('click', toggleMute);
    }
    if (elements.volumeSlider) {
      elements.volumeSlider.addEventListener('input', changeVolume);
    }
  }

  function load(objectUrl, metadata) {
    unload();
    currentObjectUrl = objectUrl;
    var thisLoadId = ++loadId;

    audio = new Audio();
    audio.preload = 'metadata';

    audio.addEventListener('loadedmetadata', function () {
      if (thisLoadId !== loadId) return;
      updateDuration(audio.duration);
      if (elements.progressFill) elements.progressFill.style.width = '0%';
      if (elements.currentTime) elements.currentTime.textContent = '0:00';
      setState('ready');
    });

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', function () {
      if (thisLoadId !== loadId) return;
      setState('ended');
      cancelAnimationFrame(animationFrame);
    });
    audio.addEventListener('error', function () {
      if (thisLoadId !== loadId) return;
      setState('error');
      if (callbacks.onError) callbacks.onError('Failed to load audio for playback');
    });

    audio.src = objectUrl;

    if (elements.playerContainer) {
      elements.playerContainer.hidden = false;
    }
    if (elements.fileName) {
      elements.fileName.textContent = metadata ? metadata.name : '';
    }
    if (elements.speedSelect) {
      elements.speedSelect.value = '1';
    }
  }

  function unload() {
    stop();
    if (audio) {
      audio.removeAttribute('src');
      audio.load();
      audio = null;
    }
    currentObjectUrl = null;
    setState('idle');
    if (elements.playerContainer) {
      elements.playerContainer.hidden = true;
    }
  }

  function togglePlayPause() {
    if (!audio) return;
    if (state === 'playing') {
      pause();
    } else {
      play();
    }
  }

  function play() {
    if (!audio) return;
    audio.play().then(function () {
      setState('playing');
      startProgressUpdate();
    }).catch(function () {
      setState('ready');
      if (callbacks.onError) callbacks.onError('Playback failed. Check your audio settings.');
    });
  }

  function pause() {
    if (!audio) return;
    audio.pause();
    setState('ready');
    cancelAnimationFrame(animationFrame);
  }

  function stop() {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setState('ready');
    cancelAnimationFrame(animationFrame);
    updateProgress();
  }

  function seek(e) {
    if (!audio || !elements.progressBar) return;
    if (!isFinite(audio.duration)) return;
    var rect = elements.progressBar.getBoundingClientRect();
    var fraction = (e.clientX - rect.left) / rect.width;
    fraction = Math.max(0, Math.min(1, fraction));
    audio.currentTime = fraction * audio.duration;
  }

  function changeSpeed() {
    if (!audio || !elements.speedSelect) return;
    var speed = parseFloat(elements.speedSelect.value);
    audio.playbackRate = speed;
  }

  function toggleMute() {
    if (!audio) return;
    audio.muted = !audio.muted;
    updateMuteState();
  }

  function changeVolume() {
    if (!audio || !elements.volumeSlider) return;
    audio.volume = parseFloat(elements.volumeSlider.value);
    updateMuteState();
  }

  function updateMuteState() {
    if (!audio || !elements.muteBtn) return;
    if (audio.muted || audio.volume === 0) {
      elements.muteBtn.textContent = '\uD83D\uDD07';
      elements.muteBtn.setAttribute('aria-label', 'Unmute');
    } else {
      elements.muteBtn.textContent = '\uD83D\uDD0A';
      elements.muteBtn.setAttribute('aria-label', 'Mute');
    }
  }

  function updateDuration(seconds) {
    if (!elements.totalDuration) return;
    elements.totalDuration.textContent = formatTime(seconds);
  }

  function updateProgress() {
    if (!audio) return;
    var current = audio.currentTime || 0;
    var duration = audio.duration || 0;
    var pct = duration > 0 ? (current / duration) * 100 : 0;

    if (elements.progressFill) {
      elements.progressFill.style.width = pct + '%';
    }
    if (elements.currentTime) {
      elements.currentTime.textContent = formatTime(current);
    }
  }

  function startProgressUpdate() {
    cancelAnimationFrame(animationFrame);
    function loop() {
      updateProgress();
      animationFrame = requestAnimationFrame(loop);
    }
    animationFrame = requestAnimationFrame(loop);
  }

  function setState(newState) {
    state = newState;
    updatePlayPauseButton();
    if (callbacks.onStateChange) {
      callbacks.onStateChange(state);
    }
  }

  function updatePlayPauseButton() {
    if (!elements.playPauseBtn) return;
    if (state === 'playing') {
      elements.playPauseBtn.textContent = '\u23F8';
      elements.playPauseBtn.setAttribute('aria-label', 'Pause');
    } else {
      elements.playPauseBtn.textContent = '\u25B6';
      elements.playPauseBtn.setAttribute('aria-label', 'Play');
    }
  }

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function getState() {
    return state;
  }

  function getAudio() {
    return audio;
  }

  return {
    init: init,
    load: load,
    unload: unload,
    play: play,
    pause: pause,
    stop: stop,
    getState: getState,
    getAudio: getAudio,
  };
})();
