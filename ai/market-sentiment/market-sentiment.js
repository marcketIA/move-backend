// market-sentiment.js — mueve el marcador a una posicion ILUSTRATIVA para
// mostrar el formato del widget. No calcula sentimiento real de mercado
// (eso requeriria una API de datos real). Para conectar datos reales,
// reemplazar VALUE (rango -1 a 1) por el resultado de tu fuente de datos.
(function () {
  var fill = document.getElementById('misGaugeFill');
  if (!fill) return;

  var VALUE = 0.15; // ilustrativo: ligeramente hacia "alcista"
  var marker = document.getElementById('misGaugeMarker');
  var label = document.getElementById('misStateLabel');

  var pct = ((VALUE + 1) / 2) * 100;
  marker.style.left = pct + '%';

  if (VALUE > 0.2) label.textContent = 'Alcista';
  else if (VALUE < -0.2) label.textContent = 'Bajista';
  else label.textContent = 'Neutral';
})();
