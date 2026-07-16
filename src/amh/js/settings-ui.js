/**
 * Settings UI Module
 * Handles settings modal rendering and user interactions
 * DOM manipulation for application settings
 */

const SettingsUI = (function () {
  'use strict';

  var modal = null;
  var overlay = null;
  var isOpen = false;
  var toastFn = null;

  var themeSelect = null;
  var languageSelect = null;
  var autoSaveToggle = null;

  function init(config) {
    modal = document.getElementById('settings-modal');
    overlay = document.getElementById('settings-overlay');
    toastFn = config.showToast;

    themeSelect = document.getElementById('setting-theme');
    languageSelect = document.getElementById('setting-language');
    autoSaveToggle = document.getElementById('setting-autosave');

    document.getElementById('settings-button').addEventListener('click', toggle);
    document.getElementById('settings-close').addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.getElementById('settings-reset').addEventListener('click', handleReset);

    themeSelect.addEventListener('change', handleThemeChange);
    languageSelect.addEventListener('change', handleLanguageChange);
    autoSaveToggle.addEventListener('change', handleAutoSaveChange);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    });

    loadCurrentValues();
  }

  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  function open() {
    isOpen = true;
    loadCurrentValues();
    modal.hidden = false;
    overlay.hidden = false;
    requestAnimationFrame(function () {
      modal.classList.add('open');
      overlay.classList.add('visible');
    });
  }

  function close() {
    isOpen = false;
    modal.classList.remove('open');
    overlay.classList.remove('visible');
    setTimeout(function () {
      modal.hidden = true;
      overlay.hidden = true;
    }, 300);
  }

  function loadCurrentValues() {
    var current = SettingsManager.getAll();
    themeSelect.value = current.theme || 'dark';
    languageSelect.value = current.speechLanguage || 'am-ET';
    autoSaveToggle.checked = current.autoSave !== false;
  }

  function handleThemeChange() {
    var value = themeSelect.value;
    var result = SettingsManager.set('theme', value);
    if (result.success) {
      ThemeManager.setTheme(value);
      if (toastFn) toastFn('Theme changed to ' + value);
    }
  }

  function handleLanguageChange() {
    var value = languageSelect.value;
    var result = SettingsManager.set('speechLanguage', value);
    if (result.success && toastFn) {
      toastFn('Language set to ' + value);
    }
  }

  function handleAutoSaveChange() {
    var value = autoSaveToggle.checked;
    SettingsManager.set('autoSave', value);
  }

  function handleReset() {
    var confirmed = window.confirm('Reset all settings to defaults?');
    if (!confirmed) return;

    var result = SettingsManager.reset();
    if (result.success) {
      loadCurrentValues();
      ThemeManager.setTheme(SettingsManager.get('theme'));
      if (toastFn) toastFn('Settings reset to defaults');
    }
  }

  function getSpeechLanguage() {
    return SettingsManager.get('speechLanguage') || 'am-ET';
  }

  function isAutoSave() {
    return SettingsManager.get('autoSave') !== false;
  }

  return {
    init: init,
    open: open,
    close: close,
    toggle: toggle,
    getSpeechLanguage: getSpeechLanguage,
    isAutoSave: isAutoSave,
  };
})();
