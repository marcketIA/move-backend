// Acceso de alumnos por código único. La autorización existe solo en la API:
// una falla de red nunca concede acceso local.
(function () {
  var API_BASE_URL = import.meta.env.VITE_API_URL || '';
  var SESSION_KEY = 'msa_session';
  var SESSION_TOKEN_KEY = 'msa_session_token';
  var SESSION_CODE_KEY = 'msa_session_code';

  window.NexusAuth = {
    isLoggedIn: function () {
      return localStorage.getItem(SESSION_KEY) === '1' && !!localStorage.getItem(SESSION_TOKEN_KEY);
    },
    getToken: function () {
      return localStorage.getItem(SESSION_TOKEN_KEY);
    },
    login: async function (code) {
      var clean = (code || '').trim().toUpperCase();
      if (!clean || !API_BASE_URL) return false;
      try {
        var res = await fetch(API_BASE_URL + '/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: clean })
        });
        if (!res.ok) return false;
        var data = await res.json();
        localStorage.setItem(SESSION_KEY, '1');
        localStorage.setItem(SESSION_TOKEN_KEY, data.token);
        localStorage.setItem(SESSION_CODE_KEY, clean);
        return true;
      } catch (err) {
        console.warn('[NexusAuth] API no disponible.', err);
        return false;
      }
    },
    logout: function () {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_CODE_KEY);
      localStorage.removeItem('msa_account_token');
      localStorage.removeItem('msa_account_name');
    },
    requireLogin: function (loginPage) {
      if (!this.isLoggedIn()) window.location.replace(loginPage || '/src/dashboard/index.html');
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('authForm');
    if (!form) return;
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var input = document.getElementById('authCode');
      var errorEl = document.getElementById('authError');
      var submitBtn = form.querySelector('button[type=submit]');
      if (submitBtn) submitBtn.disabled = true;
      var ok = await window.NexusAuth.login(input.value);
      if (submitBtn) submitBtn.disabled = false;
      if (ok) window.location.href = 'views/clases.html';
      else if (errorEl) {
        errorEl.textContent = 'No pudimos validar tu acceso. Revisa el código o intenta de nuevo.';
        errorEl.style.display = 'block';
      }
    });
  });
})();
