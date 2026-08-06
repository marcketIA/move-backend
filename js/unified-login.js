// Inicio de sesión de cuenta. Sin credenciales de prueba ni modo local:
// la autorización existe solo en la API, una falla de red nunca concede acceso.
(function () {
  var API_BASE_URL = import.meta.env.VITE_API_URL || '';

  function markStep(index, percent) {
    var fill = document.getElementById('ldsBarFill');
    if (fill) fill.style.width = percent + '%';
    document.querySelectorAll('#ldsChecklist li').forEach(function (item) {
      if (parseInt(item.dataset.step, 10) <= index) {
        item.classList.add('done');
        item.querySelector('.lds-check').textContent = '✓';
      }
    });
  }

  window.submitUnifiedLogin = async function () {
    var username = document.getElementById('loginUsername').value.trim();
    var password = document.getElementById('loginPassword').value;
    var errorEl = document.getElementById('unifiedLoginError');
    var submitBtn = document.querySelector('#unifiedLoginForm .lgp-submit');
    var overlay = document.getElementById('loadingScreenOverlay');

    if (errorEl) { errorEl.style.display = 'none'; errorEl.style.color = ''; }
    if (!username || !password || !API_BASE_URL) {
      if (errorEl) {
        errorEl.textContent = API_BASE_URL ? 'Completa usuario y contraseña.' : 'El acceso todavía no está configurado.';
        errorEl.style.display = 'block';
      }
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (overlay) overlay.classList.add('active');
    document.querySelectorAll('#ldsChecklist li').forEach(function (item) {
      item.classList.remove('done');
      item.querySelector('.lds-check').textContent = '○';
    });

    function fail(message) {
      if (overlay) overlay.classList.remove('active');
      if (submitBtn) submitBtn.disabled = false;
      if (errorEl) { errorEl.textContent = message; errorEl.style.display = 'block'; }
    }

    try {
      markStep(0, 25);
      var response = await fetch(API_BASE_URL + '/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
      });
      var data = await response.json();
      if (!response.ok) return fail(data.error || 'Usuario o contraseña incorrectos.');

      // Cuenta válida. Guardamos su token de cuenta por separado del token
      // de curso (auth.js maneja el de curso, nunca los mezclamos).
      localStorage.setItem('msa_account_token', data.token);
      localStorage.setItem('msa_account_name', data.name);

      // Aviso informativo si ya hay más dispositivos que el límite sugerido
      // — nunca bloqueamos el acceso por esto, solo informamos para que el
      // alumno mismo revise su lista en el dashboard (ver device-panel en
      // clases.html). Esto no reemplaza ningún chequeo de seguridad.
      if (data.deviceLimitReached && errorEl) {
        errorEl.style.color = 'var(--amber, #E8934A)';
        errorEl.textContent = 'Tienes más de ' + data.maxDevices + ' dispositivos con sesión activa. Puedes revisarlos desde tu dashboard.';
        errorEl.style.display = 'block';
      }

      markStep(1, 50);
      var activeCourse = (data.courses || []).find(function (course) { return course.active; });
      if (!activeCourse) {
        markStep(3, 100);
        return setTimeout(function () { window.location.href = '/index.html#cursos'; }, 300);
      }
      markStep(2, 75);

      // Reutilizamos la función YA EXISTENTE y YA PROBADA de auth.js — no se
      // reimplementa la verificación del código en ningún otro lugar.
      var ok = await window.NexusAuth.login(activeCourse.code);
      markStep(3, 100);
      if (ok) return setTimeout(function () { window.location.href = 'views/clases.html'; }, 300);
      fail('Tu cuenta está vinculada a un código que ya no es válido. Contáctanos por WhatsApp.');
    } catch (err) {
      fail('No se pudo conectar con el servidor. Intenta de nuevo.');
    }
  };
})();
