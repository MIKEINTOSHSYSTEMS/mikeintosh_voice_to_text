/**
 * Storage Module
 * Handles localStorage operations for transcript and title persistence
 */

const StorageManager = (function () {
  'use strict';

  const STORAGE_KEY = 'amharic_transcription';
  const TITLE_STORAGE_KEY = 'amharic_transcript_title';
  const THEME_KEY = 'theme';

  function saveTranscription(text) {
    if (text) {
      localStorage.setItem(STORAGE_KEY, text);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function loadTranscription() {
    return localStorage.getItem(STORAGE_KEY) || '';
  }

  function removeTranscription() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function saveTitle(title) {
    const safeTitle = title && title.trim() ? title.trim() : 'Untitled Transcript';
    localStorage.setItem(TITLE_STORAGE_KEY, safeTitle);
    return safeTitle;
  }

  function loadTitle() {
    return localStorage.getItem(TITLE_STORAGE_KEY) || 'Untitled Transcript';
  }

  function removeTitle() {
    localStorage.removeItem(TITLE_STORAGE_KEY);
  }

  function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  function loadTheme() {
    return localStorage.getItem(THEME_KEY);
  }

  return {
    saveTranscription,
    loadTranscription,
    removeTranscription,
    saveTitle,
    loadTitle,
    removeTitle,
    saveTheme,
    loadTheme,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
