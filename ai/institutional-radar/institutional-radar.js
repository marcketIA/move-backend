// institutional-radar.js — valores ILUSTRATIVOS de fuerza relativa (0-100),
// no datos institucionales reales. Conectar una API real para datos en vivo.
(function () {
  var el = document.getElementById('irBars');
  if (!el) return;

  var DATA = [
    { s: 'USD', v: 78 }, { s: 'EUR', v: 61 }, { s: 'JPY', v: 34 },
    { s: 'GBP', v: 52 }, { s: 'Gold', v: 70 }
  ];

  el.innerHTML = DATA.map(function (d) {
    return '<div class="ir-row"><span class="sym">' + d.s + '</span>' +
      '<div class="ir-track"><div class="ir-fill" style="width:' + d.v + '%"></div></div>' +
      '<span class="val">' + d.v + '</span></div>';
  }).join('');
})();
