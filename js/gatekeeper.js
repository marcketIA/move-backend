// gatekeeper.js — control de expiración de video por URL
//
// Uso: enlaces del tipo  live-temporal.html?t=abc123&exp=1752800000
//   t   = token del video/clase (identifica qué contenido mostrar)
//   exp = timestamp UNIX (segundos) en el que el enlace deja de ser válido
//
// Genera enlaces con distinta duración simplemente calculando `exp`:
//   12 horas  -> Math.floor(Date.now() / 1000) + 12 * 3600
//   24 horas  -> Math.floor(Date.now() / 1000) + 24 * 3600
//   1 semana  -> Math.floor(Date.now() / 1000) + 7  * 24 * 3600
//   3 semanas -> Math.floor(Date.now() / 1000) + 21 * 24 * 3600
//
// ⚠️ Esto es una barrera del lado del cliente, fácil de saltar editando la URL
// a mano. Sirve para controlar el flujo normal de tráfico desde YouTube/TikTok
// (evita que el enlace circule indefinidamente), pero NO es seguridad real.
// Para contenido pagado que de verdad debe protegerse, el token debe
// verificarse en un servidor y el video debe servirse desde una URL firmada
// (Vimeo privado, Bunny.net Signed URLs, etc.) — no solo ocultarse con JS.

(function () {
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  window.NexusGatekeeper = {
    /**
     * Valida el enlace actual. Si expiró, redirige a error-expirado.html.
     * Si es válido, devuelve { token, exp, secondsLeft } para que la página
     * los use (p. ej. mostrar el video y una cuenta regresiva).
     */
    check: function (redirectTo) {
      redirectTo = redirectTo || 'error-expirado.html';

      var token = getParam('t');
      var expRaw = getParam('exp');

      if (!token || !expRaw) {
        window.location.replace(redirectTo);
        return null;
      }

      var exp = parseInt(expRaw, 10);
      var nowSeconds = Math.floor(Date.now() / 1000);

      if (isNaN(exp) || nowSeconds > exp) {
        window.location.replace(redirectTo);
        return null;
      }

      return { token: token, exp: exp, secondsLeft: exp - nowSeconds };
    },

    /** Genera la URL de un enlace temporal — útil para armar los links que envías por YT/TikTok/WhatsApp. */
    buildLink: function (baseUrl, token, hoursValid) {
      var exp = Math.floor(Date.now() / 1000) + Math.round(hoursValid * 3600);
      return baseUrl + '?t=' + encodeURIComponent(token) + '&exp=' + exp;
    },

    /** Cuenta regresiva legible (hh:mm:ss) a partir de segundos restantes. */
    formatCountdown: function (totalSeconds) {
      if (totalSeconds < 0) totalSeconds = 0;
      var h = Math.floor(totalSeconds / 3600);
      var m = Math.floor((totalSeconds % 3600) / 60);
      var s = Math.floor(totalSeconds % 60);
      function pad(n) { return String(n).padStart(2, '0'); }
      return pad(h) + ':' + pad(m) + ':' + pad(s);
    }
  };
})();
