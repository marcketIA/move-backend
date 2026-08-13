// market-ticker.js — cinta de simbolos ilustrativa (no son cotizaciones en
// vivo reales; es un elemento visual, igual que la cinta del hero del sitio
// principal). Para cotizaciones reales, conectar una API como
// exchangerate.host o Twelve Data y reemplazar el arreglo SYMBOLS.
(function () {
  var el = document.getElementById('mktTicker');
  if (!el) return;

  var SYMBOLS = [
    { s: 'EUR/USD', v: '1.08450', up: true },
    { s: 'GBP/USD', v: '1.27321', up: true },
    { s: 'USD/JPY', v: '151.230', up: false },
    { s: 'XAU/USD', v: '3,340', up: false },
    { s: 'BTC/USD', v: '109,000', up: true },
    { s: 'US500', v: '6,240', up: true },
    { s: 'NAS100', v: '23,145', up: true },
    { s: 'US30', v: '41,980', up: false }
  ];

  function row() {
    return SYMBOLS.map(function (item) {
      return '<div class="mkt-item"><span>' + item.s + '</span><strong>' + item.v + '</strong>' +
        '<span class="' + (item.up ? 'up' : 'down') + '">' + (item.up ? '\u25B2' : '\u25BC') + '</span></div>';
    }).join('');
  }

  // Se duplica una vez para que el loop de translateX(-50%) sea continuo.
  el.innerHTML = row() + row();
})();
