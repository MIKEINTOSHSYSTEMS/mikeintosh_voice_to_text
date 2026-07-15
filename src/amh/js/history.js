/**
 * History Module
 * Manages transcript collection via StorageManager IndexedDB APIs
 * No DOM manipulation — pure data service
 */

const HistoryManager = (function () {
  'use strict';

  var currentTranscriptId = null;
  var cache = [];

  function computeStats(content) {
    var wordCount = 0;
    var characterCount = content ? content.length : 0;

    if (content && content.trim()) {
      try {
        if (typeof StatsManager !== 'undefined') {
          wordCount = StatsManager.countWords(content);
        } else {
          wordCount = content.trim().split(/\s+/).length;
        }
      } catch (e) {
        wordCount = content.trim().split(/\s+/).length;
      }
    }

    return { wordCount: wordCount, characterCount: characterCount };
  }

  function create(data) {
    var content = data.content || '';
    var stats = computeStats(content);

    var transcriptData = {
      title: data.title || 'Untitled Transcript',
      content: content,
      language: data.language || 'am-ET',
      duration: data.duration || 0,
      wordCount: stats.wordCount,
      characterCount: stats.characterCount,
      metadata: data.metadata || {},
    };

    return StorageManager.createTranscript(transcriptData).then(function (result) {
      if (result.success) {
        cache.push(result.transcript);
        cache.sort(function (a, b) {
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
      }
      return result;
    });
  }

  function list() {
    return StorageManager.listTranscripts().then(function (result) {
      if (result.success) {
        cache = result.transcripts;
      }
      return result;
    });
  }

  function get(id) {
    var cached = cache.find(function (t) {
      return t.id === id;
    });
    if (cached) {
      return Promise.resolve({ success: true, transcript: cached });
    }

    return StorageManager.getTranscript(id).then(function (result) {
      if (result.success) {
        var exists = cache.find(function (t) {
          return t.id === id;
        });
        if (!exists) {
          cache.push(result.transcript);
        }
      }
      return result;
    });
  }

  function update(id, updates) {
    return StorageManager.updateTranscript(id, updates).then(function (result) {
      if (result.success) {
        var index = cache.findIndex(function (t) {
          return t.id === id;
        });
        if (index !== -1) {
          cache[index] = result.transcript;
        } else {
          cache.push(result.transcript);
        }
        cache.sort(function (a, b) {
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
      }
      return result;
    });
  }

  function remove(id) {
    return StorageManager.deleteTranscript(id).then(function (result) {
      if (result.success) {
        cache = cache.filter(function (t) {
          return t.id !== id;
        });
        if (currentTranscriptId === id) {
          currentTranscriptId = null;
        }
      }
      return result;
    });
  }

  function setCurrent(id) {
    currentTranscriptId = id;
  }

  function getCurrentId() {
    return currentTranscriptId;
  }

  function getCache() {
    return cache.slice();
  }

  function getCacheSize() {
    return cache.length;
  }

  function clearCache() {
    cache = [];
    currentTranscriptId = null;
  }

  return {
    create: create,
    list: list,
    get: get,
    update: update,
    remove: remove,
    setCurrent: setCurrent,
    getCurrentId: getCurrentId,
    getCache: getCache,
    getCacheSize: getCacheSize,
    clearCache: clearCache,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HistoryManager;
}
