/**
 * Storage Module
 * Handles localStorage and IndexedDB operations
 * - localStorage: theme, settings (small, synchronous)
 * - IndexedDB: transcripts (structured, multiple records, async)
 */

const StorageManager = (function () {
  'use strict';

  // ============================================
  // LOCALSTORAGE KEYS (retained for backward compatibility)
  // ============================================

  const STORAGE_KEY = 'amharic_transcription';
  const TITLE_STORAGE_KEY = 'amharic_transcript_title';
  const THEME_KEY = 'theme';
  const SETTINGS_KEY = 'amvtt_settings';
  const MIGRATED_KEY = 'amvtt_migrated';

  // ============================================
  // INDEXEDDB CONFIGURATION
  // ============================================

  const DB_NAME = 'amharic-voice-to-text';
  const DB_VERSION = 1;
  const TRANSCRIPT_STORE = 'transcripts';

  let db = null;
  let dbReady = false;
  let dbReadyCallbacks = [];

  // ============================================
  // LOCALSTORAGE OPERATIONS (existing, unchanged)
  // ============================================

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

  // ============================================
  // INDEXEDDB INITIALIZATION
  // ============================================

  function initDB() {
    return new Promise(function (resolve, reject) {
      if (dbReady && db) {
        resolve(db);
        return;
      }

      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      var request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        var database = event.target.result;

        if (!database.objectStoreNames.contains(TRANSCRIPT_STORE)) {
          var store = database.createObjectStore(TRANSCRIPT_STORE, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('title', 'title', { unique: false });
        }
      };

      request.onsuccess = function (event) {
        db = event.target.result;
        dbReady = true;

        db.onerror = function (e) {
          console.error('IndexedDB error:', e.target.error);
        };

        resolve(db);

        dbReadyCallbacks.forEach(function (cb) {
          cb(db);
        });
        dbReadyCallbacks = [];
      };

      request.onerror = function (event) {
        console.error('IndexedDB open failed:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  function onDBReady(callback) {
    if (dbReady && db) {
      callback(db);
    } else {
      dbReadyCallbacks.push(callback);
    }
  }

  function getDB() {
    return db;
  }

  // ============================================
  // TRANSCRIPT CRUD (IndexedDB)
  // ============================================

  function generateId() {
    var timestamp = Date.now();
    var random = Math.random().toString(36).substring(2, 8);
    return 'tr_' + timestamp + '_' + random;
  }

  function createTranscript(data) {
    var now = new Date().toISOString();
    var transcript = {
      id: data.id || generateId(),
      title: data.title || 'Untitled Transcript',
      content: data.content || '',
      language: data.language || 'am-ET',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      duration: data.duration || 0,
      wordCount: data.wordCount || 0,
      characterCount: data.characterCount || 0,
      metadata: data.metadata || {},
    };

    return new Promise(function (resolve, reject) {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      var transaction = db.transaction([TRANSCRIPT_STORE], 'readwrite');
      var store = transaction.objectStore(TRANSCRIPT_STORE);
      var request = store.add(transcript);

      request.onsuccess = function () {
        resolve({ success: true, transcript: transcript });
      };

      request.onerror = function (event) {
        console.error('Create transcript failed:', event.target.error);
        resolve({ success: false, error: event.target.error.message });
      };
    });
  }

  function getTranscript(id) {
    return new Promise(function (resolve, reject) {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      var transaction = db.transaction([TRANSCRIPT_STORE], 'readonly');
      var store = transaction.objectStore(TRANSCRIPT_STORE);
      var request = store.get(id);

      request.onsuccess = function (event) {
        var transcript = event.target.result;
        if (transcript) {
          resolve({ success: true, transcript: transcript });
        } else {
          resolve({ success: false, error: 'Transcript not found' });
        }
      };

      request.onerror = function (event) {
        console.error('Get transcript failed:', event.target.error);
        resolve({ success: false, error: event.target.error.message });
      };
    });
  }

  function listTranscripts() {
    return new Promise(function (resolve, reject) {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      var transaction = db.transaction([TRANSCRIPT_STORE], 'readonly');
      var store = transaction.objectStore(TRANSCRIPT_STORE);
      var request = store.getAll();

      request.onsuccess = function (event) {
        var transcripts = event.target.result || [];
        transcripts.sort(function (a, b) {
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        resolve({ success: true, transcripts: transcripts });
      };

      request.onerror = function (event) {
        console.error('List transcripts failed:', event.target.error);
        resolve({ success: false, error: event.target.error.message, transcripts: [] });
      };
    });
  }

  function updateTranscript(id, updates) {
    return new Promise(function (resolve, reject) {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      var transaction = db.transaction([TRANSCRIPT_STORE], 'readwrite');
      var store = transaction.objectStore(TRANSCRIPT_STORE);
      var getRequest = store.get(id);

      getRequest.onsuccess = function (event) {
        var transcript = event.target.result;
        if (!transcript) {
          resolve({ success: false, error: 'Transcript not found' });
          return;
        }

        Object.keys(updates).forEach(function (key) {
          if (key !== 'id' && key !== 'createdAt') {
            transcript[key] = updates[key];
          }
        });
        transcript.updatedAt = new Date().toISOString();

        var putRequest = store.put(transcript);
        putRequest.onsuccess = function () {
          resolve({ success: true, transcript: transcript });
        };
        putRequest.onerror = function (putEvent) {
          console.error('Update transcript failed:', putEvent.target.error);
          resolve({ success: false, error: putEvent.target.error.message });
        };
      };

      getRequest.onerror = function (event) {
        console.error('Update transcript get failed:', event.target.error);
        resolve({ success: false, error: event.target.error.message });
      };
    });
  }

  function deleteTranscript(id) {
    return new Promise(function (resolve, reject) {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      var transaction = db.transaction([TRANSCRIPT_STORE], 'readwrite');
      var store = transaction.objectStore(TRANSCRIPT_STORE);
      var request = store.delete(id);

      request.onsuccess = function () {
        resolve({ success: true });
      };

      request.onerror = function (event) {
        console.error('Delete transcript failed:', event.target.error);
        resolve({ success: false, error: event.target.error.message });
      };
    });
  }

  function getTranscriptCount() {
    return new Promise(function (resolve, reject) {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      var transaction = db.transaction([TRANSCRIPT_STORE], 'readonly');
      var store = transaction.objectStore(TRANSCRIPT_STORE);
      var request = store.count();

      request.onsuccess = function (event) {
        resolve({ success: true, count: event.target.result });
      };

      request.onerror = function (event) {
        resolve({ success: false, count: 0 });
      };
    });
  }

  // ============================================
  // SETTINGS PERSISTENCE (localStorage)
  // ============================================

  var defaultSettings = {
    theme: 'dark',
    speechLanguage: 'am-ET',
    autoSave: true,
  };

  function loadSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        return { success: true, settings: Object.assign({}, defaultSettings, parsed) };
      }
      return { success: true, settings: Object.assign({}, defaultSettings) };
    } catch (error) {
      console.error('Load settings failed:', error);
      return { success: true, settings: Object.assign({}, defaultSettings) };
    }
  }

  function saveSettings(settings) {
    try {
      var merged = Object.assign({}, defaultSettings, settings);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      return { success: true };
    } catch (error) {
      console.error('Save settings failed:', error);
      return { success: false, error: error.message };
    }
  }

  function resetSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // MIGRATION (localStorage -> IndexedDB)
  // ============================================

  function needsMigration() {
    var migrated = localStorage.getItem(MIGRATED_KEY);
    if (migrated === 'true') return false;

    var transcript = localStorage.getItem(STORAGE_KEY);
    var title = localStorage.getItem(TITLE_STORAGE_KEY);
    return !!(transcript || title);
  }

  function migrate() {
    return new Promise(function (resolve, reject) {
      if (!needsMigration()) {
        resolve({ migrated: false, reason: 'no_data' });
        return;
      }

      var transcriptText = localStorage.getItem(STORAGE_KEY) || '';
      var titleText = localStorage.getItem(TITLE_STORAGE_KEY) || 'Untitled Transcript';

      var wordCount = 0;
      var charCount = 0;

      try {
        if (typeof StatsManager !== 'undefined') {
          wordCount = StatsManager.countWords(transcriptText);
        } else if (transcriptText.trim()) {
          wordCount = transcriptText.trim().split(/\s+/).length;
        }
        charCount = transcriptText.length;
      } catch (e) {
        wordCount = transcriptText.trim() ? transcriptText.trim().split(/\s+/).length : 0;
        charCount = transcriptText.length;
      }

      var transcriptObj = {
        id: generateId(),
        title: titleText,
        content: transcriptText,
        language: 'am-ET',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        duration: 0,
        wordCount: wordCount,
        characterCount: charCount,
        metadata: { source: 'legacy_migration' },
      };

      var transaction = db.transaction([TRANSCRIPT_STORE], 'readwrite');
      var store = transaction.objectStore(TRANSCRIPT_STORE);
      var addRequest = store.add(transcriptObj);

      addRequest.onsuccess = function () {
        localStorage.setItem(MIGRATED_KEY, 'true');
        resolve({
          migrated: true,
          transcriptId: transcriptObj.id,
          title: transcriptObj.title,
          contentLength: transcriptObj.content.length,
        });
      };

      addRequest.onerror = function (event) {
        console.error('Migration failed:', event.target.error);
        resolve({ migrated: false, error: event.target.error.message });
      };
    });
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    // Existing API (backward compatible, synchronous)
    saveTranscription: saveTranscription,
    loadTranscription: loadTranscription,
    removeTranscription: removeTranscription,
    saveTitle: saveTitle,
    loadTitle: loadTitle,
    removeTitle: removeTitle,
    saveTheme: saveTheme,
    loadTheme: loadTheme,

    // IndexedDB initialization
    initDB: initDB,
    onDBReady: onDBReady,
    getDB: getDB,

    // Transcript CRUD (async, IndexedDB)
    createTranscript: createTranscript,
    getTranscript: getTranscript,
    listTranscripts: listTranscripts,
    updateTranscript: updateTranscript,
    deleteTranscript: deleteTranscript,
    getTranscriptCount: getTranscriptCount,
    generateId: generateId,

    // Settings (async-compatible, localStorage)
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    resetSettings: resetSettings,

    // Migration
    needsMigration: needsMigration,
    migrate: migrate,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
