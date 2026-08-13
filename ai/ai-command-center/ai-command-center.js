// ai-command-center.js — logica de los 4 paneles, autocontenida (no
// depende de los otros archivos de src/components/ai/*) para que este
// componente sea 100% independiente si se usa solo, en cualquier pagina.
//
// IMPORTANTE: el panel "Trade Checklist Score" es una AUTOEVALUACION del
// alumno contra un checklist de disciplina — a proposito NO genera ningun
// veredicto de compra/venta ni puntuacion de confianza sobre un mercado.
// "Market Sentiment", "Today's Focus" y "Liquidity Radar" muestran datos
// ILUSTRATIVOS para mostrar el formato del panel, no datos de mercado en
// vivo — conectar una API real antes de presentarlos como datos reales.
(function () {
  var root = document.querySelector('.acc-wrap');
  if (!root) return;

  // ---- Market Sentiment (ilustrativo) ----
  var gaugeMarker = document.getElementById('misGaugeMarker');
  if (gaugeMarker) {
    var SENTIMENT_VALUE = 0.15; // -1 a 1, ilustrativo
    var pct = ((SENTIMENT_VALUE + 1) / 2) * 100;
    gaugeMarker.style.left = pct + '%';
    var stateLabel = document.getElementById('misStateLabel');
    if (stateLabel) {
      if (SENTIMENT_VALUE > 0.2) stateLabel.textContent = 'Alcista';
      else if (SENTIMENT_VALUE < -0.2) stateLabel.textContent = 'Bajista';
      else stateLabel.textContent = 'Neutral';
    }
  }

  // ---- Today's Focus / Smart Watchlist ----
  var watchlistEl = document.getElementById('sw2List');
  if (watchlistEl) {
    var SYMBOLS = ['EURUSD', 'GBPUSD', 'XAUUSD', 'SPY', 'QQQ', 'NQ', 'ES'];
    watchlistEl.innerHTML = SYMBOLS.map(function (s) {
      return '<div class="sw2-chip"><span class="sw2-dot"></span>' + s + '</div>';
    }).join('');
  }

  // ---- Trade Checklist Score (autoevaluacion del alumno) ----
  var checklist = document.getElementById('ascChecklist');
  if (checklist) {
    var checkboxes = checklist.querySelectorAll('input[type=checkbox]');
    var scoreEl = document.getElementById('ascScore');
    var labelEl = document.getElementById('ascResultLabel');

    function updateChecklist() {
      var checked = 0;
      checkboxes.forEach(function (cb) { if (cb.checked) checked++; });
      var total = checkboxes.length;
      if (scoreEl) scoreEl.textContent = checked + '/' + total;
      if (labelEl) {
        if (checked === total) labelEl.textContent = 'Checklist completo — tu proceso está bien documentado';
        else if (checked >= total - 2) labelEl.textContent = 'Casi completo — revisa los criterios que faltan antes de ejecutar';
        else labelEl.textContent = 'Faltan varios criterios por revisar';
      }
    }
    checkboxes.forEach(function (cb) { cb.addEventListener('change', updateChecklist); });
    updateChecklist();
  }

  // ---- Liquidity Radar (ilustrativo) ----
  var radarEl = document.getElementById('irBars');
  if (radarEl) {
    var RADAR_DATA = [
      { s: 'USD', v: 78 }, { s: 'EUR', v: 61 }, { s: 'JPY', v: 34 },
      { s: 'GBP', v: 52 }, { s: 'Gold', v: 70 }
    ];
    radarEl.innerHTML = RADAR_DATA.map(function (d) {
      return '<div class="ir-row"><span class="sym">' + d.s + '</span>' +
        '<div class="ir-track"><div class="ir-fill" style="width:' + d.v + '%"></div></div>' +
        '<span class="val">' + d.v + '</span></div>';
    }).join('');
  }
})();
