// account-modal.js — modal de registro/login con usuario y contraseña.
// Sistema NUEVO y separado de auth.js (que sigue siendo el login por
// código de acceso del dashboard de alumnos que ya pagaron). Este modal
// es para la cuenta gratuita que cualquier visitante puede crear.

(function () {
  var API_BASE_URL = import.meta.env.VITE_API_URL || '';
  var isLoginMode = false;

  window.openSignupModal = function () {
    var modal = document.getElementById('signupModal');
    if (modal) modal.classList.add('open');
  };

  window.closeSignupModal = function () {
    var modal = document.getElementById('signupModal');
    if (modal) modal.classList.remove('open');
    var errorEl = document.getElementById('signupError');
    if (errorEl) errorEl.style.display = 'none';
  };

  window.toggleSignupMode = function () {
    isLoginMode = !isLoginMode;

    var title = document.querySelector('#signupModal h3');
    var desc = document.querySelector('#signupModal > p');
    var nameField = document.getElementById('signupName').closest('.field');
    var confirmField = document.getElementById('signupPasswordConfirm').closest('.field');
    var submitBtn = document.querySelector('#signupModal .quiz-submit');
    var switchLink = document.querySelector('#signupFormView .quiz-note');

    if (isLoginMode) {
      title.textContent = 'Inicia sesión';
      desc.textContent = 'Entra con tu usuario y contraseña.';
      nameField.style.display = 'none';
      confirmField.style.display = 'none';
      document.getElementById('signupStrengthBar').style.display = 'none';
      document.getElementById('signupEmailHint').style.display = 'none';
      submitBtn.textContent = 'Iniciar sesión →';
      switchLink.innerHTML = '¿No tienes cuenta? <a href="#" onclick="toggleSignupMode(); return false;" style="color:var(--gold);">Regístrate</a>';
    } else {
      title.textContent = 'Inscríbete gratis';
      desc.textContent = 'Crea tu cuenta para guardar tu progreso, tu resultado del quiz y tu historial de la calculadora.';
      nameField.style.display = 'block';
      confirmField.style.display = 'block';
      submitBtn.textContent = 'Crear mi cuenta →';
      switchLink.innerHTML = '¿Ya tienes cuenta? <a href="#" onclick="toggleSignupMode(); return false;" style="color:var(--gold);">Inicia sesión</a>';
    }
  };

  function showError(msg) {
    var errorEl = document.getElementById('signupError');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  window.validateSignupEmail = function () {
    var input = document.getElementById('signupUsername');
    var hint = document.getElementById('signupEmailHint');
    if (!input || !hint) return;
    var value = input.value.trim();

    if (!value) { hint.style.display = 'none'; return; }

    if (EMAIL_RE.test(value)) {
      hint.textContent = '✓ Correo válido';
      hint.className = 'vfd-hint ok';
    } else {
      hint.textContent = 'Escribe un correo válido, ej: tu@correo.com';
      hint.className = 'vfd-hint bad';
    }
    hint.style.display = 'block';
  };

  window.updatePasswordStrength = function () {
    var input = document.getElementById('signupPassword');
    var bar = document.getElementById('signupStrengthBar');
    var fill = document.getElementById('signupStrengthFill');
    var label = document.getElementById('signupStrengthLabel');
    if (!input || !bar) return;
    var value = input.value;

    if (!value) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';

    var score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^a-zA-Z0-9]/.test(value)) score++;

    var levels = [
      { pct: 20, color: 'var(--short, #E24C5B)', text: 'Muy débil' },
      { pct: 40, color: 'var(--short, #E24C5B)', text: 'Débil' },
      { pct: 60, color: 'var(--amber, #E8934A)', text: 'Aceptable' },
      { pct: 80, color: 'var(--long, #22B57B)', text: 'Buena' },
      { pct: 100, color: 'var(--long, #22B57B)', text: 'Fuerte' }
    ];
    var level = levels[Math.min(score, levels.length - 1)];
    fill.style.width = level.pct + '%';
    fill.style.background = level.color;
    label.textContent = level.text;

    validatePasswordMatch();
  };

  window.validatePasswordMatch = function () {
    var pass = document.getElementById('signupPassword');
    var confirm = document.getElementById('signupPasswordConfirm');
    var hint = document.getElementById('signupMatchHint');
    if (!pass || !confirm || !hint) return;

    if (!confirm.value) { hint.style.display = 'none'; return; }

    if (pass.value === confirm.value) {
      hint.textContent = '✓ Las contraseñas coinciden';
      hint.className = 'vfd-hint ok';
    } else {
      hint.textContent = 'Las contraseñas no coinciden';
      hint.className = 'vfd-hint bad';
    }
    hint.style.display = 'block';
  };

  window.submitSignup = async function () {
    var name = document.getElementById('signupName').value.trim();
    var username = document.getElementById('signupUsername').value.trim();
    var password = document.getElementById('signupPassword').value;
    var website = document.getElementById('signupWebsite') ? document.getElementById('signupWebsite').value : '';
    var submitBtn = document.querySelector('#signupModal .quiz-submit');

    if (!username || !password) {
      showError('Completa usuario y contraseña.');
      return;
    }
    if (!isLoginMode) {
      if (!name) {
        showError('Completa tu nombre.');
        return;
      }
      if (!EMAIL_RE.test(username)) {
        showError('Escribe un correo válido, ej: tu@correo.com.');
        return;
      }
      if (password.length < 8) {
        showError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      var confirmPassword = document.getElementById('signupPasswordConfirm').value;
      if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden.');
        return;
      }
    }

    var endpoint = isLoginMode ? '/api/login' : '/api/register';
    var body = isLoginMode ? { username, password } : { name, username, password, website };

    var originalText = submitBtn.textContent;
    submitBtn.textContent = 'Un momento…';
    submitBtn.disabled = true;

    try {
      var res = await fetch(API_BASE_URL + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      var data = await res.json();

      if (!res.ok) {
        showError(data.error || 'Algo salió mal. Intenta de nuevo.');
        return;
      }

      localStorage.setItem('msa_account_token', data.token);
      localStorage.setItem('msa_account_name', data.name);
      closeSignupModal();

      if (isLoginMode) {
        alert('¡Bienvenido de nuevo, ' + data.name + '!');
        if (data.courses && data.courses.some(function (c) { return c.active; })) {
          window.location.href = '/src/dashboard/index.html';
        }
      } else {
        alert('¡Listo, ' + data.name + '! Tu cuenta quedó creada. Ahora elige tu ruta para activar el acceso a las clases.');
        document.getElementById('cursos').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      showError('No se pudo conectar con el servidor. Intenta de nuevo en un momento.');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var modal = document.getElementById('signupModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeSignupModal();
      });
    }
  });
})();
