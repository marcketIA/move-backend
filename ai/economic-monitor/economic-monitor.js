// economic-monitor.js — eventos de EJEMPLO para mostrar el formato.
// Un calendario economico real necesita conectarse a una fuente de datos
// verificada (ForexFactory API, Investing.com, Trading Economics, etc.)
// antes de publicar esto con fechas/horarios reales.
(function () {
  var el = document.getElementById('emList');
  if (!el) return;

  var EVENTS = [
    { name: 'Decisión de tasas (ejemplo)', time: '10:00 ET', impact: 'high' },
    { name: 'Nóminas no agrícolas (ejemplo)', time: '08:30 ET', impact: 'high' },
    { name: 'Índice PMI (ejemplo)', time: '09:45 ET', impact: 'med' },
    { name: 'Inventarios de petróleo (ejemplo)', time: '10:30 ET', impact: 'low' }
  ];

  el.innerHTML = EVENTS.map(function (e) {
    return '<div class="em-row"><span class="em-impact ' + e.impact + '"></span>' +
      '<span class="name">' + e.name + '</span><span class="time">' + e.time + '</span></div>';
  }).join('');
})();
