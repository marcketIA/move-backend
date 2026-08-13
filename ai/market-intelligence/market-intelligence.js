// market-intelligence.js — titulares de EJEMPLO, no noticias reales.
(function () {
  var el = document.getElementById('miList');
  if (!el) return;

  var HEADLINES = [
    '(Ejemplo) El dólar se mantiene estable antes de datos clave de empleo.',
    '(Ejemplo) El oro extiende su rango ante expectativas de tasas.',
    '(Ejemplo) Los índices tecnológicos abren con volumen por encima del promedio.'
  ];

  el.innerHTML = HEADLINES.map(function (h) { return '<li>' + h + '</li>'; }).join('');
})();
