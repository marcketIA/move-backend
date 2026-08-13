// pricing-premium.js — conecta el boton "Inscribirme via Stripe" con el
// backend REAL de checkout (server/src/routes/checkout.js), el mismo que
// ya probamos de punta a punta. Si el backend no esta configurado todavia
// (sin price_id de Stripe), muestra el mensaje de error real del servidor
// en vez de fingir que funciona.
(function () {
  var API_BASE_URL = import.meta.env.VITE_API_URL || '';

  document.querySelectorAll('.pp-card').forEach(function (card) {
    var courseId = card.dataset.course;
    var ctaBtn = card.querySelector('.pp-cta');
    var waLink = card.querySelector('.pp-wa');

    if (waLink) {
      var waNumber = '10000000000'; // mismo placeholder que el resto del sitio
      var courseName = waLink.dataset.waCourse || 'Move IA Market';
      var msg = 'Hola! Quiero mas informacion sobre ' + courseName + '.';
      waLink.href = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(msg);
    }

    if (!ctaBtn) return;
    ctaBtn.addEventListener('click', async function () {
      var original = ctaBtn.textContent;
      ctaBtn.textContent = 'Conectando con Stripe…';
      ctaBtn.disabled = true;

      // Si hay una cuenta logueada, mandamos su usuario para que el pago
      // se vincule solo (ver checkout.js/webhook.js) — si no hay cuenta,
      // el pago sigue funcionando igual, como invitado.
      var accountToken = localStorage.getItem('msa_account_token');
      var accountUsername = '';
      if (accountToken) {
        try {
          accountUsername = JSON.parse(atob(accountToken.split('.')[1])).username || '';
        } catch (e) { /* token invalido, seguimos como invitado */ }
      }

      try {
        var res = await fetch(API_BASE_URL + '/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: courseId, username: accountUsername })
        });
        var data = await res.json();

        if (res.ok && data.url) {
          window.location.href = data.url;
        } else {
          alert(data.error || 'No se pudo iniciar el pago. Intenta por WhatsApp mientras tanto.');
        }
      } catch (err) {
        alert('No se pudo conectar con el servidor de pagos. Usa el enlace de WhatsApp mientras tanto.');
      } finally {
        ctaBtn.textContent = original;
        ctaBtn.disabled = false;
      }
    });
  });
})();
