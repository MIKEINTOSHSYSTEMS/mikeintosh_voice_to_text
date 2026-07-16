/**
 * Audio Upload Module
 * Handles file selection, drag-and-drop, validation, and metadata extraction
 * Does NOT handle playback or transcription
 */

const AudioUploadManager = (function () {
  'use strict';

  var ALLOWED_TYPES = [
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4',
    'audio/m4a',
    'audio/ogg',
    'audio/webm',
  ];

  var ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.webm'];
  var MAX_FILE_SIZE_MB = 100;
  var MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

  var state = 'idle';
  var currentFile = null;
  var currentMetadata = null;
  var callbacks = {};

  var elements = {};

  function init(config) {
    elements = config.elements || {};
    callbacks = config.callbacks || {};

    bindDropZone();
    bindFileInput();
  }

  function bindDropZone() {
    var dropZone = elements.dropZone;
    if (!dropZone) return;

    dropZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');

      var files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    });

    dropZone.addEventListener('click', function () {
      if (elements.fileInput) {
        elements.fileInput.click();
      }
    });

    dropZone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (elements.fileInput) {
          elements.fileInput.click();
        }
      }
    });
  }

  function bindFileInput() {
    if (!elements.fileInput) return;

    elements.fileInput.addEventListener('change', function (e) {
      var files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
      e.target.value = '';
    });
  }

  function handleFile(file) {
    var validation = validateFile(file);
    if (!validation.valid) {
      setState('error');
      if (callbacks.onError) {
        callbacks.onError(validation.error);
      }
      return;
    }

    setState('loading');
    currentFile = file;

    extractMetadata(file, function (err, metadata) {
      if (err) {
        setState('error');
        currentFile = null;
        currentMetadata = null;
        if (callbacks.onError) {
          callbacks.onError('Unable to read audio file. The file may be corrupted.');
        }
        return;
      }

      currentMetadata = metadata;
      setState('loaded');

      if (callbacks.onFileLoaded) {
        callbacks.onFileLoaded({
          file: currentFile,
          metadata: currentMetadata,
        });
      }
    });
  }

  function validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No file selected.' };
    }

    var ext = '.' + file.name.split('.').pop().toLowerCase();
    var typeOk = ALLOWED_TYPES.indexOf(file.type) !== -1;
    var extOk = ALLOWED_EXTENSIONS.indexOf(ext) !== -1;

    if (!typeOk && !extOk) {
      return {
        valid: false,
        error: 'Unsupported format. Please upload MP3, WAV, M4A, OGG, or WEBM.',
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      var sizeMB = Math.round(file.size / (1024 * 1024));
      return {
        valid: false,
        error: 'File too large (' + sizeMB + ' MB). Maximum size is ' + MAX_FILE_SIZE_MB + ' MB.',
      };
    }

    if (file.size === 0) {
      return { valid: false, error: 'File is empty.' };
    }

    return { valid: true };
  }

  function extractMetadata(file, callback) {
    var audio = new Audio();
    var objectUrl = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', function () {
      var duration = audio.duration;
      var metadata = {
        name: file.name,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        type: file.type || getExtension(file.name),
        format: getExtension(file.name).toUpperCase().replace('.', ''),
        duration: duration,
        durationFormatted: formatDuration(duration),
        objectUrl: objectUrl,
      };
      callback(null, metadata);
    });

    audio.addEventListener('error', function () {
      URL.revokeObjectURL(objectUrl);
      callback(new Error('Failed to load audio metadata'));
    });

    audio.src = objectUrl;
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function formatDuration(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function getExtension(filename) {
    var parts = filename.split('.');
    return parts.length > 1 ? '.' + parts.pop().toLowerCase() : '';
  }

  function setState(newState) {
    state = newState;
    if (callbacks.onStateChange) {
      callbacks.onStateChange(state);
    }
  }

  function clear() {
    currentFile = null;
    currentMetadata = null;
    setState('idle');
  }

  function getState() {
    return state;
  }

  function getFile() {
    return currentFile;
  }

  function getMetadata() {
    return currentMetadata;
  }

  return {
    init: init,
    clear: clear,
    getState: getState,
    getFile: getFile,
    getMetadata: getMetadata,
  };
})();
