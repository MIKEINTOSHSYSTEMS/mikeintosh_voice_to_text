/**
 * History UI Module
 * Handles history panel rendering and user interactions
 * DOM manipulation for transcript history sidebar
 */

const HistoryUI = (function () {
  'use strict';

  var panel = null;
  var overlay = null;
  var list = null;
  var emptyState = null;
  var isOpen = false;
  var currentId = null;
  var toastFn = null;

  function init(config) {
    panel = document.getElementById('history-panel');
    overlay = document.getElementById('history-overlay');
    list = document.getElementById('history-list');
    emptyState = document.getElementById('empty-history');
    toastFn = config.showToast;

    document.getElementById('history-button').addEventListener('click', toggle);
    document.getElementById('history-close').addEventListener('click', close);
    overlay.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    });
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
    panel.hidden = false;
    overlay.hidden = false;
    requestAnimationFrame(function () {
      panel.classList.add('open');
      overlay.classList.add('visible');
    });
    refresh();
    panel.focus();
  }

  function close() {
    isOpen = false;
    panel.classList.remove('open');
    overlay.classList.remove('visible');
    setTimeout(function () {
      panel.hidden = true;
      overlay.hidden = true;
    }, 400);
  }

  function refresh() {
    HistoryManager.list().then(function (result) {
      if (result.success) {
        renderList(result.transcripts);
      }
    }).catch(function () {
      if (toastFn) toastFn('Failed to load history');
    });
  }

  function renderList(transcripts) {
    var items = list.querySelectorAll('.history-item');
    items.forEach(function (item) {
      item.remove();
    });

    if (!transcripts || transcripts.length === 0) {
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    transcripts.forEach(function (t) {
      var item = document.createElement('div');
      item.className = 'history-item' + (t.id === currentId ? ' active' : '');
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', 'Open transcript: ' + (t.title || 'Untitled'));

      var title = document.createElement('h3');
      title.className = 'history-item-title';
      title.textContent = t.title || 'Untitled Transcript';

      var preview = document.createElement('p');
      preview.className = 'history-item-preview';
      preview.textContent = t.content ? t.content.substring(0, 120) : 'Empty transcript';

      var meta = document.createElement('div');
      meta.className = 'history-item-meta';

      var date = document.createElement('span');
      date.className = 'history-item-date';
      date.textContent = formatDate(t.updatedAt || t.createdAt);

      var stats = document.createElement('span');
      stats.className = 'history-item-stats';
      stats.textContent = (t.wordCount || 0) + ' words';

      var actions = document.createElement('div');
      actions.className = 'history-item-actions';

      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'history-action-btn delete-btn';
      deleteBtn.innerHTML = '&#128465;';
      deleteBtn.setAttribute('aria-label', 'Delete transcript');
      deleteBtn.setAttribute('title', 'Delete');

      meta.appendChild(date);
      meta.appendChild(stats);
      meta.appendChild(actions);
      actions.appendChild(deleteBtn);

      item.appendChild(title);
      item.appendChild(preview);
      item.appendChild(meta);

      item.addEventListener('click', function (e) {
        if (e.target === deleteBtn || e.target.parentNode === deleteBtn) {
          handleDelete(t.id, t.title);
          return;
        }
        handleOpen(t.id);
      });

      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen(t.id);
        }
      });

      deleteBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        handleDelete(t.id, t.title);
      });

      list.appendChild(item);
    });
  }

  function handleOpen(id) {
    if (typeof onOpenTranscript === 'function') {
      onOpenTranscript(id);
    }
    currentId = id;
    HistoryManager.setCurrent(id);
    close();
  }

  function handleDelete(id, title) {
    var confirmed = window.confirm('Delete "' + (title || 'Untitled') + '"?');
    if (!confirmed) return;

    HistoryManager.remove(id).then(function (result) {
      if (result.success) {
        if (toastFn) toastFn('Transcript deleted');
        if (currentId === id) currentId = null;
        refresh();
      } else {
        if (toastFn) toastFn('Failed to delete transcript');
      }
    }).catch(function () {
      if (toastFn) toastFn('Failed to delete transcript');
    });
  }

  function setCurrentId(id) {
    currentId = id;
    var items = list.querySelectorAll('.history-item');
    items.forEach(function (item) {
      item.classList.remove('active');
    });
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    var d = new Date(isoString);
    var now = new Date();
    var diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  var onOpenTranscript = null;

  return {
    init: init,
    open: open,
    close: close,
    toggle: toggle,
    refresh: refresh,
    setCurrentId: setCurrentId,
    onOpenTranscript: function (fn) {
      onOpenTranscript = fn;
    },
  };
})();
