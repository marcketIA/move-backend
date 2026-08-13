// floating-cta.js — arma el link de WhatsApp con un mensaje segun la pagina actual.
// Cambia WA_NUMBER por el numero real antes de publicar (mismo placeholder
// que el resto del sitio: 10000000000).
(function () {
  var bubble = document.getElementById('fcBubble');
  if (!bubble) return;

  var WA_NUMBER = '10000000000';
  var message = 'Hola! Vengo de ' + (document.title || 'Move IA Market') + ' y quiero mas informacion.';
  bubble.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
})();
