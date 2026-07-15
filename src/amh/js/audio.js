/**
 * Audio Visualization Module
 * Handles Web Audio API for microphone input level analysis
 * Does NOT record, store, upload, or persist audio
 */

const AudioManager = (function () {
  'use strict';

  let audioContext = null;
  let mediaStream = null;
  let analyser = null;
  let sourceNode = null;
  let animationFrameId = null;
  let canvas = null;
  let canvasContext = null;
  let isInitialized = false;
  let onLevelChange = null;

  const FFT_SIZE = 256;
  const SMOOTHING_TIME_CONSTANT = 0.8;

  function init(canvasElement, levelCallback) {
    if (isInitialized) return;

    canvas = canvasElement;
    canvasContext = canvas.getContext('2d');
    onLevelChange = levelCallback;

    isInitialized = true;
  }

  async function start() {
    if (!isInitialized) {
      console.error('AudioManager not initialized. Call init() first.');
      return { success: false, error: 'not_initialized' };
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;

      sourceNode = audioContext.createMediaStreamSource(mediaStream);
      sourceNode.connect(analyser);

      return { success: true };
    } catch (error) {
      console.error('Audio initialization failed:', error);
      cleanup();
      return { success: false, error: error.name };
    }
  }

  function stop() {
    stopVisualization();
    cleanup();
  }

  function cleanup() {
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode = null;
    }

    if (analyser) {
      analyser.disconnect();
      analyser = null;
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }

    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch(() => {});
      audioContext = null;
    }
  }

  function startVisualization() {
    if (!analyser || !canvas) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      animationFrameId = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const normalizedLevel = Math.min(average / 128, 1);

      if (onLevelChange) {
        onLevelChange(normalizedLevel);
      }

      renderVisualization(dataArray, bufferLength);
    }

    draw();
  }

  function stopVisualization() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    if (canvasContext && canvas) {
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function renderVisualization(dataArray, bufferLength) {
    const width = canvas.width;
    const height = canvas.height;
    const barCount = 7;
    const gap = 4;
    const barWidth = (width - gap * (barCount - 1)) / barCount;

    canvasContext.clearRect(0, 0, width, height);

    const step = Math.floor(bufferLength / barCount);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * step;
      const value = dataArray[dataIndex] / 255;
      const barHeight = Math.max(4, value * height * 0.9);

      const x = i * (barWidth + gap);
      const y = (height - barHeight) / 2;

      const gradient = canvasContext.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, 'rgba(20, 184, 166, 0.9)');
      gradient.addColorStop(0.5, 'rgba(14, 165, 233, 0.9)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.9)');

      canvasContext.fillStyle = gradient;
      canvasContext.beginPath();
      canvasContext.roundRect(x, y, barWidth, barHeight, 2);
      canvasContext.fill();
    }
  }

  function getAudioContext() {
    return audioContext;
  }

  function getMediaStream() {
    return mediaStream;
  }

  function isActive() {
    return audioContext !== null && mediaStream !== null;
  }

  function destroy() {
    stop();
    isInitialized = false;
    canvas = null;
    canvasContext = null;
    onLevelChange = null;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      destroy();
    });
  }

  return {
    init,
    start,
    stop,
    cleanup,
    startVisualization,
    stopVisualization,
    getAudioContext,
    getMediaStream,
    isActive,
    destroy,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioManager;
}
