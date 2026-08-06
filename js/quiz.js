// quiz.js — "¿Cuál es tu perfil de trader?" diagnostic quiz (3 perfiles)
(function () {

  /* ---- TRADER PROFILES DATA ---- */
  var TRADER_PROFILES = {
    conservador: {
      titulo: "Trader de Confluencia Institucional (Conservador)",
      descripcion: "Tu enfoque principal es la preservación de capital. Prefieres esperar escenarios de alta probabilidad con múltiples confluencias en marcos de tiempo mayores (H4/D1). Tienes una disciplina sólida para evitar el sobre-operar.",
      badge: "Riesgo Controlado",
      color: "#10b981", // Verde Esmeralda
      sugerencia: "Tu ruta ideal comienza con el Nivel 2: Análisis Técnico y Nivel 6: Gestión del Riesgo Avanzada."
    },
    moderado: {
      titulo: "Trader de Tendencias & Price Action (Moderado)",
      descripcion: "Buscas un equilibrio óptimo entre rentabilidad y exposición. Te especializas en la lectura del flujo de órdenes en temporalidades como M15/H1, buscando retrocesos y mitigaciones de Order Blocks.",
      badge: "Equilibrio Estadístico",
      color: "#00f0ff", // Cyber Cyan
      sugerencia: "Tu ruta recomendada es Nivel 3: Price Action Puro y Nivel 4: Especialización en Forex."
    },
    agresivo: {
      titulo: "Scalper de Opciones de Alta Volatilidad (Agresivo)",
      descripcion: "Te atrae la velocidad del mercado y buscas capturar movimientos rápidos en la apertura de Nueva York (0 DTE, opciones financieras o scalping en Forex). Tienes gran agilidad mental pero debes blindar tu gestión emocional.",
      badge: "Operativa de Alta Frecuencia",
      color: "#f43f5e", // Rojo Neón
      sugerencia: "Tu ruta obligatoria es el Nivel 5: Opciones Financieras y el Nivel 7: Psicología del Trader Profesional."
    }
  };

  /* ---- Quiz Helper Functions ---- */
  function getSelectedRadioValue(groupName) {
    var radios = document.getElementsByName(groupName);
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) return radios[i].value;
    }
    return null;
  }
  function updateProgress() {
    var totalQuestions = 3; // Ajusta según la cantidad de preguntas de tu HTML
    var answered = 0;

    // Lista de nombres de tus grupos de radio buttons del formulario
    var groups = ['perfil', 'objetivo', 'riesgo'];
    groups.forEach(function(group) {
      if (getSelectedRadioValue(group)) answered++;
    });
    var percent = Math.round((answered / totalQuestions) * 100);
    var progressBar = document.getElementById('quizProgressBar');
    if (progressBar) {
      progressBar.style.width = percent + '%';
      progressBar.textContent = percent + '%';
    }
  }
  // Listener para actualizar el progreso cada vez que el usuario selecciona una respuesta
  var form = document.getElementById('quizForm'); // Asegúrate de que tu tag <form> tenga este id
  if (form) {
    form.addEventListener('change', function() {
      updateProgress();
    });
  }

  /* ---- Calcular el perfil a partir de las 3 respuestas ----
     Cada opción ya viene etiquetada como 'conservador' / 'moderado' /
     'agresivo'; el perfil final es el que más se repite entre las 3. */
  function calcProfile(perfil, objetivo, riesgo) {
    var tally = { conservador: 0, moderado: 0, agresivo: 0 };
    [perfil, objetivo, riesgo].forEach(function (v) {
      if (tally.hasOwnProperty(v)) tally[v]++;
    });
    var best = 'moderado';
    var bestCount = -1;
    Object.keys(tally).forEach(function (key) {
      if (tally[key] > bestCount) { bestCount = tally[key]; best = key; }
    });
    return best;
  }

  /* ---- Renderizar Resultados del Quiz ---- */
  window.fillResult = function (nombre, profileKey) {
    var profile = TRADER_PROFILES[profileKey] || TRADER_PROFILES['moderado'];
    var cleanName = nombre ? nombre : "Trader";
    // Modificar el DOM de la tarjeta de resultados con los datos calculados
    var resTitleEl = document.getElementById('resTitle');
    var resDescEl = document.getElementById('resDesc');
    var resBadgeEl = document.getElementById('resBadge');
    var resSuggEl = document.getElementById('resSugg');
    var resGreetingEl = document.getElementById('resGreeting');
    if (resGreetingEl) resGreetingEl.textContent = "Felicidades, " + cleanName + ". Tu perfil ha sido procesado:";
    if (resTitleEl) resTitleEl.textContent = profile.titulo;
    if (resDescEl) resDescEl.textContent = profile.descripcion;
    if (resSuggEl) resSuggEl.textContent = profile.sugerencia;

    if (resBadgeEl) {
      resBadgeEl.textContent = profile.badge;
      resBadgeEl.style.backgroundColor = profile.color + '22'; // Opacidad de fondo
      resBadgeEl.style.borderColor = profile.color;
      resBadgeEl.style.color = profile.color;
    }

    // Botón hacia el modal de contacto: usa el color y el nombre del perfil
    var ctaBtn = document.getElementById('rCtaBtn');
    if (ctaBtn) {
      ctaBtn.style.background = profile.color;
      ctaBtn.dataset.course = profile.titulo;
      ctaBtn.dataset.price = '';
      ctaBtn.dataset.accent = profile.color;
    }

    // Guardar una plantilla de mensaje personalizada para cuando abran el modal de WhatsApp
    window._nxQuizMsg = 'Hola! Soy ' + cleanName + '. Mi perfil de trader es: ' + profile.titulo +
      '. ' + profile.sugerencia + ' Quiero más información.';
  };

  /* ---- Enviar el quiz ---- */
  window.submitQuiz = function () {
    var nombreInput = document.getElementById('quizNombre');
    var nombre = nombreInput ? nombreInput.value.trim() : '';

    var perfil = getSelectedRadioValue('perfil');
    var objetivo = getSelectedRadioValue('objetivo');
    var riesgo = getSelectedRadioValue('riesgo');
    if (!perfil || !objetivo || !riesgo) {
      alert('Por favor responde las 3 preguntas.');
      return;
    }

    var profileKey = calcProfile(perfil, objetivo, riesgo);

    var quizCard = document.getElementById('quizForm');
    var resultBox = document.getElementById('quizResult');
    var loading = document.getElementById('resultLoading');

    if (quizCard) quizCard.style.display = 'none';
    if (loading) loading.style.display = 'block';
    if (resultBox) resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(function () {
      if (loading) loading.style.display = 'none';
      fillResult(nombre, profileKey);
      if (resultBox) resultBox.style.display = 'block';
    }, 1100);
  };

  window.retryQuiz = function () {
    var nombreInput = document.getElementById('quizNombre');
    if (nombreInput) nombreInput.value = '';
    document.querySelectorAll('#quizForm input[type=radio]').forEach(function (r) { r.checked = false; });
    updateProgress();
    var quizCard = document.getElementById('quizForm');
    var resultBox = document.getElementById('quizResult');
    if (quizCard) quizCard.style.display = 'block';
    if (resultBox) resultBox.style.display = 'none';
    var section = document.getElementById('evaluacion');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ---- Contact modal ---- */
  var overlay = document.getElementById('nxModal');

  window.openNxModal = function (btn) {
    var course = btn.dataset.course || 'Nexus Trading';
    var price = btn.dataset.price || '';
    var accent = btn.dataset.accent || 'var(--gold)';

    document.getElementById('nxModalPkgName').textContent = course;
    var priceEl = document.getElementById('nxModalPkgPrice');
    priceEl.textContent = price;
    priceEl.style.display = price ? 'block' : 'none';
    document.getElementById('nxModalAccent').style.color = accent;
    overlay.classList.add('open');
  };

  window.closeNxModal = function () {
    overlay.classList.remove('open');
  };

  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeNxModal();
    });
  }

  window.formatPhone = function (input) {
    var v = input.value.replace(/\D/g, '').slice(0, 10);
    var out = v;
    if (v.length > 6) out = '(' + v.slice(0, 3) + ') ' + v.slice(3, 6) + '-' + v.slice(6);
    else if (v.length > 3) out = '(' + v.slice(0, 3) + ') ' + v.slice(3);
    input.value = out;
  };

  window.submitNxModal = function () {
    var name = document.getElementById('nxModalName').value.trim();
    var phone = document.getElementById('nxModalPhone').value.trim();
    if (!phone) { alert('Por favor ingresa tu número de teléfono.'); return; }

    var msg = window._nxQuizMsg || 'Hola! Quiero más información sobre los cursos de Nexus Trading.';
    if (name) msg = 'Hola! Soy ' + name + '. ' + msg;
    msg += ' Mi teléfono: ' + phone;

    // Reemplaza este número por el WhatsApp Business real antes de publicar.
    var waNumber = '10000000000';
    window.open('https://wa.me/' + waNumber + '?text=' + encodeURIComponent(msg), '_blank');
    closeNxModal();
  };

})();
