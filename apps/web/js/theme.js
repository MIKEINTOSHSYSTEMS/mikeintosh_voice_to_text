/**
 * Theme Module
 * Manages theme initialization, switching, and persistence
 */

const ThemeManager = (function () {
  'use strict';

  let currentTheme = 'dark';
  let onThemeChange = null;

  function init(callback) {
    onThemeChange = callback || null;
    
    const savedTheme = StorageManager.loadTheme();
    if (savedTheme) {
      currentTheme = savedTheme;
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      currentTheme = prefersDark ? 'dark' : 'light';
    }
    applyTheme(currentTheme);
  }

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    StorageManager.saveTheme(theme);
  }

  function toggle() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    return newTheme;
  }

  function getCurrent() {
    return currentTheme;
  }

  function setTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      applyTheme(theme);
    }
    return currentTheme;
  }

  return {
    init,
    toggle,
    setTheme,
    getCurrent,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
