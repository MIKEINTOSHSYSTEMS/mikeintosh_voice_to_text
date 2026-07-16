/**
 * Search Module
 * Handles in-memory search functionality with navigation
 */

const SearchManager = (function () {
  'use strict';

  let textarea = null;
  let searchInput = null;
  let matchCountDisplay = null;
  let prevButton = null;
  let nextButton = null;
  let clearButton = null;

  let query = '';
  let matches = [];
  let currentIndex = -1;

  function init(elements) {
    textarea = elements.textarea;
    searchInput = elements.searchInput;
    matchCountDisplay = elements.matchCount;
    prevButton = elements.prev;
    nextButton = elements.next;
    clearButton = elements.clear;
  }

  function search(queryText) {
    query = queryText;
    matches = [];
    currentIndex = -1;

    if (!query || query.length < 2) {
      updateUI();
      return;
    }

    if (!textarea || !textarea.value) {
      updateUI();
      return;
    }

    const text = textarea.value;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        text: match[0],
      });
    }

    if (matches.length > 0) {
      currentIndex = 0;
      highlightCurrentMatch();
    }

    updateUI();
  }

  function navigate(direction) {
    if (matches.length === 0) return;

    if (direction === 'next') {
      currentIndex = (currentIndex + 1) % matches.length;
    } else {
      currentIndex = (currentIndex - 1 + matches.length) % matches.length;
    }

    highlightCurrentMatch();
    updateUI();
  }

  function highlightCurrentMatch() {
    if (currentIndex < 0 || currentIndex >= matches.length) {
      return;
    }

    const match = matches[currentIndex];

    textarea.focus();
    textarea.setSelectionRange(match.index, match.index + match.length);

    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 28;
    const linesBeforeMatch = textarea.value.substr(0, match.index).split('\n').length;
    const targetScrollTop = (linesBeforeMatch - 3) * lineHeight;
    textarea.scrollTop = Math.max(0, targetScrollTop);
  }

  function clear() {
    if (searchInput) {
      searchInput.value = '';
    }
    query = '';
    matches = [];
    currentIndex = -1;
    updateUI();
    if (textarea) {
      textarea.focus();
    }
  }

  function updateUI() {
    const hasQuery = query && query.length >= 2;
    const matchCount = matches.length;
    const hasMatches = matchCount > 0;

    if (matchCountDisplay) {
      if (!hasQuery) {
        matchCountDisplay.textContent = '';
      } else if (hasMatches) {
        matchCountDisplay.textContent = `${currentIndex + 1} of ${matchCount}`;
      } else {
        matchCountDisplay.textContent = 'No matches';
      }
    }

    if (prevButton) {
      prevButton.disabled = !hasMatches;
    }
    if (nextButton) {
      nextButton.disabled = !hasMatches;
    }
    if (clearButton) {
      clearButton.disabled = !hasQuery;
    }
  }

  function getCurrentQuery() {
    return query;
  }

  function getMatchCount() {
    return matches.length;
  }

  return {
    init,
    search,
    navigate,
    clear,
    getCurrentQuery,
    getMatchCount,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchManager;
}
