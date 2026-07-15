/**
 * Settings Module
 * Manages user preferences via StorageManager persistence
 * No DOM manipulation — pure data service with change notifications
 */

const SettingsManager = (function () {
  'use strict';

  var schema = {
    theme: {
      default: 'dark',
      validate: function (v) {
        return v === 'dark' || v === 'light' || v === 'system';
      },
    },
    speechLanguage: {
      default: 'am-ET',
      validate: function (v) {
        return typeof v === 'string' && v.length > 0;
      },
    },
    autoSave: {
      default: true,
      validate: function (v) {
        return v === true || v === false;
      },
    },
  };

  var settings = {};
  var listeners = [];

  function init() {
    var result = StorageManager.loadSettings();
    settings = result.settings;
  }

  function get(key) {
    if (schema[key]) {
      return settings[key];
    }
    return undefined;
  }

  function set(key, value) {
    if (!schema[key]) {
      return { success: false, error: 'Unknown setting: ' + key };
    }

    if (!schema[key].validate(value)) {
      return { success: false, error: 'Invalid value for ' + key + ': ' + value };
    }

    var previous = settings[key];
    settings[key] = value;

    var saveResult = StorageManager.saveSettings(settings);
    if (!saveResult.success) {
      settings[key] = previous;
      return saveResult;
    }

    if (previous !== value) {
      notifyListeners(key, value, previous);
    }

    return { success: true };
  }

  function getAll() {
    var copy = {};
    Object.keys(schema).forEach(function (key) {
      copy[key] = settings[key];
    });
    return copy;
  }

  function reset() {
    var previous = getAll();

    settings = {};
    Object.keys(schema).forEach(function (key) {
      settings[key] = schema[key].default;
    });

    var saveResult = StorageManager.saveSettings(settings);
    if (!saveResult.success) {
      settings = {};
      Object.keys(previous).forEach(function (key) {
        settings[key] = previous[key];
      });
      return saveResult;
    }

    Object.keys(schema).forEach(function (key) {
      if (previous[key] !== settings[key]) {
        notifyListeners(key, settings[key], previous[key]);
      }
    });

    return { success: true };
  }

  function validate(key, value) {
    if (!schema[key]) {
      return false;
    }
    return schema[key].validate(value);
  }

  function getDefaults() {
    var defaults = {};
    Object.keys(schema).forEach(function (key) {
      defaults[key] = schema[key].default;
    });
    return defaults;
  }

  function getSchema() {
    var keys = Object.keys(schema);
    var result = {};
    keys.forEach(function (key) {
      result[key] = {
        default: schema[key].default,
        current: settings[key],
      };
    });
    return result;
  }

  function onChange(callback) {
    if (typeof callback === 'function') {
      listeners.push(callback);
    }
  }

  function removeListener(callback) {
    listeners = listeners.filter(function (fn) {
      return fn !== callback;
    });
  }

  function notifyListeners(key, newValue, oldValue) {
    listeners.forEach(function (fn) {
      try {
        fn(key, newValue, oldValue);
      } catch (e) {
        console.error('Settings listener error:', e);
      }
    });
  }

  return {
    init: init,
    get: get,
    set: set,
    getAll: getAll,
    reset: reset,
    validate: validate,
    getDefaults: getDefaults,
    getSchema: getSchema,
    onChange: onChange,
    removeListener: removeListener,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsManager;
}
