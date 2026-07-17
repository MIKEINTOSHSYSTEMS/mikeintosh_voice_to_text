var ApiClient = (function () {
  'use strict';

  var _baseUrl = '';
  var _token = null;
  var _refreshToken = null;
  var _onAuthChange = null;

  function _headers() {
    var h = { 'Content-Type': 'application/json' };
    if (_token) h['Authorization'] = 'Bearer ' + _token;
    return h;
  }

  function _handleError(response) {
    return response.json().then(function (body) {
      var msg = (body && body.error && body.error.message) || 'Request failed';
      return { success: false, error: msg, status: response.status };
    }).catch(function () {
      return { success: false, error: 'Request failed', status: response.status };
    });
  }

  function _storeTokens(token, refreshToken) {
    _token = token;
    _refreshToken = refreshToken;
    if (token) sessionStorage.setItem('vt_token', token);
    if (refreshToken) sessionStorage.setItem('vt_refresh_token', refreshToken);
  }

  function _clearTokens() {
    _token = null;
    _refreshToken = null;
    sessionStorage.removeItem('vt_token');
    sessionStorage.removeItem('vt_refresh_token');
  }

  function _tryRefresh() {
    if (!_refreshToken) return Promise.resolve(false);
    return fetch(_baseUrl + '/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: _refreshToken })
    }).then(function (res) {
      if (!res.ok) return false;
      return res.json().then(function (data) {
        _storeTokens(data.token, data.refreshToken);
        return true;
      });
    }).catch(function () {
      return false;
    });
  }

  function _request(method, path, body) {
    var opts = { method: method, headers: _headers() };
    if (body) opts.body = JSON.stringify(body);

    return fetch(_baseUrl + path, opts).then(function (response) {
      if (response.status === 401 && _refreshToken) {
        return _tryRefresh().then(function (refreshed) {
          if (refreshed) {
            opts.headers = _headers();
            return fetch(_baseUrl + path, opts).then(function (retryRes) {
              if (!retryRes.ok) return _handleError(retryRes);
              if (retryRes.status === 204) return { success: true };
              return retryRes.json().then(function (d) { return { success: true, data: d }; });
            });
          }
          _clearTokens();
          if (_onAuthChange) _onAuthChange(false);
          return { success: false, error: 'Session expired', status: 401 };
        });
      }
      if (!response.ok) return _handleError(response);
      if (response.status === 204) return { success: true };
      return response.json().then(function (d) { return { success: true, data: d }; });
    }).catch(function (err) {
      return { success: false, error: err.message || 'Network error' };
    });
  }

  return {
    init: function (config) {
      _baseUrl = (config && config.baseUrl) || '';
      _onAuthChange = (config && config.onAuthChange) || null;
      _token = sessionStorage.getItem('vt_token');
      _refreshToken = sessionStorage.getItem('vt_refresh_token');
    },

    register: function (email, password, name) {
      return _request('POST', '/api/auth/register', {
        email: email, password: password, name: name
      }).then(function (res) {
        if (res.success && res.data) {
          _storeTokens(res.data.token, res.data.refreshToken);
          if (_onAuthChange) _onAuthChange(true);
        }
        return res;
      });
    },

    login: function (email, password) {
      return _request('POST', '/api/auth/login', {
        email: email, password: password
      }).then(function (res) {
        if (res.success && res.data) {
          _storeTokens(res.data.token, res.data.refreshToken);
          if (_onAuthChange) _onAuthChange(true);
        }
        return res;
      });
    },

    logout: function () {
      _clearTokens();
      if (_onAuthChange) _onAuthChange(false);
    },

    getMe: function () {
      return _request('GET', '/api/auth/me');
    },

    isAuthenticated: function () {
      return !!_token;
    },

    listTranscripts: function (params) {
      var qs = [];
      if (params) {
        if (params.page) qs.push('page=' + params.page);
        if (params.limit) qs.push('limit=' + params.limit);
        if (params.search) qs.push('search=' + encodeURIComponent(params.search));
        if (params.sort) qs.push('sort=' + params.sort);
        if (params.order) qs.push('order=' + params.order);
      }
      var query = qs.length ? '?' + qs.join('&') : '';
      return _request('GET', '/api/transcripts' + query);
    },

    createTranscript: function (data) {
      return _request('POST', '/api/transcripts', data);
    },

    getTranscript: function (id) {
      return _request('GET', '/api/transcripts/' + id);
    },

    updateTranscript: function (id, data) {
      return _request('PUT', '/api/transcripts/' + id, data);
    },

    deleteTranscript: function (id) {
      return _request('DELETE', '/api/transcripts/' + id);
    },

    getBaseUrl: function () { return _baseUrl; },
    setBaseUrl: function (url) { _baseUrl = url; },

    uploadAudio: function (file) {
      var formData = new FormData();
      formData.append('file', file);
      return fetch(_baseUrl + '/api/audio/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + _token },
        body: formData
      }).then(function (response) {
        if (!response.ok) return _handleError(response);
        return response.json().then(function (d) { return { success: true, data: d }; });
      }).catch(function (err) {
        return { success: false, error: err.message || 'Upload failed' };
      });
    },

    listAudio: function (params) {
      var qs = [];
      if (params) {
        if (params.page) qs.push('page=' + params.page);
        if (params.limit) qs.push('limit=' + params.limit);
      }
      var query = qs.length ? '?' + qs.join('&') : '';
      return _request('GET', '/api/audio' + query);
    },

    getAudio: function (id) {
      return _request('GET', '/api/audio/' + id);
    },

    deleteAudio: function (id) {
      return _request('DELETE', '/api/audio/' + id);
    },

    startTranscription: function (id) {
      return _request('POST', '/api/audio/' + id + '/transcribe', {});
    },

    getAudioStatus: function (id) {
      return _request('GET', '/api/audio/' + id + '/status');
    },

    getJob: function (id) {
      return _request('GET', '/api/jobs/' + id);
    },

    listJobs: function (params) {
      var qs = [];
      if (params) {
        if (params.page) qs.push('page=' + params.page);
        if (params.limit) qs.push('limit=' + params.limit);
        if (params.status) qs.push('status=' + params.status);
        if (params.type) qs.push('type=' + params.type);
      }
      var query = qs.length ? '?' + qs.join('&') : '';
      return _request('GET', '/api/jobs' + query);
    },

    streamJobProgress: function (jobId, callbacks) {
      var url = _baseUrl + '/api/jobs/' + jobId + '/stream?token=' + encodeURIComponent(_token);
      var es = new EventSource(url);

      es.onmessage = function (event) {
        try {
          var data = JSON.parse(event.data);
          if (data.type === 'snapshot' && callbacks.onSnapshot) callbacks.onSnapshot(data);
          else if (data.type === 'done' && callbacks.onDone) callbacks.onDone(data);
          else if (callbacks.onProgress) callbacks.onProgress(data);
        } catch (e) { /* ignore parse errors */ }
      };

      es.onerror = function () {
        if (callbacks.onError) callbacks.onError('SSE connection error');
        es.close();
      };

      return {
        close: function () { es.close(); }
      };
    },

    summarize: function (transcriptId, maxLength) {
      return _request('POST', '/api/ai/summarize', { transcriptId: transcriptId, maxLength: maxLength });
    },

    translate: function (transcriptId, targetLanguage) {
      return _request('POST', '/api/ai/translate', { transcriptId: transcriptId, targetLanguage: targetLanguage });
    },

    analyze: function (transcriptId) {
      return _request('POST', '/api/ai/analyze', { transcriptId: transcriptId });
    },

    getUsage: function () {
      return _request('GET', '/api/ai/usage');
    }
  };
})();
