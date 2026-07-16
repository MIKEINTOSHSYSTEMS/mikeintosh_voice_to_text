/**
 * Statistics Module
 * Handles word counting, character counting, and reading time calculation
 * Optimized for Amharic/Ethiopic text
 */

const StatsManager = (function () {
  'use strict';

  const READING_SPEED_WPM = 200;

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

  function getStats(text, duration) {
    const charCount = text.length;
    const wordCount = countWords(text);
    const readingTime = calculateReadingTime(wordCount);

    return {
      charCount,
      wordCount,
      readingTime,
      duration: formatDuration(duration || 0),
    };
  }

  function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return {
    countWords,
    calculateReadingTime,
    getStats,
    formatDuration,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StatsManager;
}
