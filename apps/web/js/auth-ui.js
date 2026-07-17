var AuthUI = (function () {
  'use strict';

  var modal = null;
  var overlay = null;
  var isOpen = false;
  var isSignUp = false;
  var toastFn = null;

  var authButton = null;
  var authButtonText = null;
  var modalTitle = null;
  var subtitle = null;
  var emailInput = null;
  var passwordInput = null;
  var nameField = null;
  var nameInput = null;
  var errorDiv = null;
  var submitBtn = null;
  var switchText = null;
  var switchBtn = null;
  var formBody = null;
  var loggedInView = null;
  var userEmail = null;
  var logoutBtn = null;

  function init(config) {
    modal = document.getElementById('auth-modal');
    overlay = document.getElementById('auth-overlay');
    toastFn = config && config.showToast ? config.showToast : function () {};
    authButton = document.getElementById('auth-button');
    authButtonText = authButton.querySelector('.auth-button-text');
    modalTitle = document.getElementById('auth-modal-title');
    subtitle = document.getElementById('auth-subtitle');
    emailInput = document.getElementById('auth-email');
    passwordInput = document.getElementById('auth-password');
    nameField = document.getElementById('auth-name-field');
    nameInput = document.getElementById('auth-name');
    errorDiv = document.getElementById('auth-error');
    submitBtn = document.getElementById('auth-submit');
    switchText = document.getElementById('auth-switch-text');
    switchBtn = document.getElementById('auth-switch-btn');
    formBody = document.getElementById('auth-form-body');
    loggedInView = document.getElementById('auth-logged-in');
    userEmail = document.getElementById('auth-user-email');
    logoutBtn = document.getElementById('auth-logout-btn');

    authButton.addEventListener('click', toggle);
    document.getElementById('auth-close').addEventListener('click', close);
    overlay.addEventListener('click', close);
    submitBtn.addEventListener('click', handleSubmit);
    switchBtn.addEventListener('click', toggleMode);
    logoutBtn.addEventListener('click', handleLogout);

    passwordInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleSubmit();
    });

    emailInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') passwordInput.focus();
    });

    nameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleSubmit();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) close();
    });

    syncAuthState();
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
    clearError();
    emailInput.value = '';
    passwordInput.value = '';
    nameInput.value = '';

    if (ApiClient.isAuthenticated()) {
      showLoggedInView();
    } else {
      isSignUp = false;
      showLoginView();
    }

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
    }, 250);
  }

  function toggleMode() {
    isSignUp = !isSignUp;
    clearError();
    if (isSignUp) {
      showSignUpView();
    } else {
      showLoginView();
    }
  }

  function showLoginView() {
    modalTitle.textContent = 'Login';
    subtitle.textContent = 'Sign in to enable cloud AI features';
    nameField.hidden = true;
    submitBtn.textContent = 'Login';
    switchText.textContent = "Don't have an account?";
    switchBtn.textContent = 'Sign Up';
    loggedInView.hidden = true;
    formBody.hidden = false;
    emailInput.focus();
  }

  function showSignUpView() {
    modalTitle.textContent = 'Sign Up';
    subtitle.textContent = 'Create an account to enable cloud AI features';
    nameField.hidden = false;
    submitBtn.textContent = 'Create Account';
    switchText.textContent = 'Already have an account?';
    switchBtn.textContent = 'Login';
    loggedInView.hidden = true;
    emailInput.focus();
  }

  function showLoggedInView() {
    formBody.hidden = true;
    loggedInView.hidden = false;

    ApiClient.getMe().then(function (res) {
      if (res.success && res.data && res.data.user) {
        userEmail.textContent = res.data.user.email;
      } else {
        userEmail.textContent = 'Logged in';
      }
    }).catch(function () {
      userEmail.textContent = 'Logged in';
    });
  }

  function handleSubmit() {
    var email = emailInput.value.trim();
    var password = passwordInput.value;

    if (!email || !password) {
      showError('Please fill in all fields.');
      return;
    }

    if (isSignUp && password.length < 8) {
      showError('Password must be at least 8 characters.');
      return;
    }

    clearError();
    submitBtn.classList.add('loading');
    submitBtn.textContent = isSignUp ? 'Creating...' : 'Logging in...';

    var action = isSignUp
      ? ApiClient.register(email, password, nameInput.value.trim() || undefined)
      : ApiClient.login(email, password);

    action.then(function (res) {
      submitBtn.classList.remove('loading');
      if (res.success) {
        close();
        syncAuthState();
        toastFn(isSignUp ? 'Account created successfully!' : 'Welcome back!');
      } else {
        showError(res.error || 'Authentication failed. Please try again.');
        submitBtn.textContent = isSignUp ? 'Create Account' : 'Login';
      }
    }).catch(function () {
      submitBtn.classList.remove('loading');
      showError('Network error. Please check your connection.');
      submitBtn.textContent = isSignUp ? 'Create Account' : 'Login';
    });
  }

  function handleLogout() {
    ApiClient.logout();
    close();
    syncAuthState();
    toastFn('Logged out successfully.');
  }

  function syncAuthState() {
    if (ApiClient.isAuthenticated()) {
      authButton.classList.add('logged-in');
      authButton.title = 'Account (Logged in)';
      ApiClient.getMe().then(function (res) {
        if (res.success && res.data && res.data.user) {
          var email = res.data.user.email;
          var short = email.length > 12 ? email.substring(0, 12) + '...' : email;
          authButtonText.textContent = short;
        }
      }).catch(function () {
        authButtonText.textContent = 'Account';
      });
    } else {
      authButton.classList.remove('logged-in');
      authButton.title = 'Login or Sign Up';
      authButtonText.textContent = 'Login';
    }
  }

  function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.hidden = false;
  }

  function clearError() {
    errorDiv.textContent = '';
    errorDiv.hidden = true;
  }

  return {
    init: init,
    open: open,
    close: close,
    syncAuthState: syncAuthState
  };
})();
