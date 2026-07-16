/**
 * PWA Module
 * Manages service worker registration, offline banner, and update notification
 */

const PwaManager = (function () {
  'use strict';

  var offlineBanner = null;
  var updateBanner = null;
  var updateRefresh = null;
  var waitingWorker = null;

  function init() {
    offlineBanner = document.getElementById('offline-banner');
    updateBanner = document.getElementById('update-banner');
    updateRefresh = document.getElementById('update-refresh');

    registerServiceWorker();
    bindEvents();
    checkInitialStatus();
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('./service-worker.js').then(function (reg) {
      if (reg.waiting) {
        showUpdateBanner(reg.waiting);
      }
      reg.addEventListener('updatefound', function () {
        var newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner(newWorker);
            }
          });
        }
      });
    }).catch(function (err) {
      console.warn('Service worker registration failed:', err);
    });

    navigator.serviceWorker.addEventListener('controllerchange', function () {
      window.location.reload();
    });
  }

  function showUpdateBanner(worker) {
    waitingWorker = worker;
    if (updateBanner) updateBanner.hidden = false;
  }

  function hideUpdateBanner() {
    waitingWorker = null;
    if (updateBanner) updateBanner.hidden = true;
  }

  function bindEvents() {
    if (updateRefresh) {
      updateRefresh.addEventListener('click', function () {
        if (waitingWorker) {
          waitingWorker.postMessage({ type: 'skipWaiting' });
        }
        hideUpdateBanner();
      });
    }

    window.addEventListener('online', function () {
      if (offlineBanner) offlineBanner.hidden = true;
    });

    window.addEventListener('offline', function () {
      if (offlineBanner) offlineBanner.hidden = false;
    });
  }

  function checkInitialStatus() {
    if (!navigator.onLine) {
      if (offlineBanner) offlineBanner.hidden = false;
    }
  }

  return {
    init: init,
  };
})();
