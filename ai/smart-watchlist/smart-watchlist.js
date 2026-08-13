// smart-watchlist.js — lista de simbolos que se cubren en las clases en
// vivo de la semana. Edita SYMBOLS para reflejar la agenda real de cada
// semana antes de publicar.
(function () {
  var el = document.getElementById('sw2List');
  if (!el) return;

  var SYMBOLS = ['EURUSD', 'GBPUSD', 'XAUUSD', 'SPY', 'QQQ', 'NQ', 'ES'];

  el.innerHTML = SYMBOLS.map(function (s) {
    return '<div class="sw2-chip"><span class="sw2-dot"></span>' + s + '</div>';
  }).join('');
})();
