// market-overview.js — igual que market-ticker.js, valores ilustrativos
// para fines de diseño, NO cotizaciones en vivo reales. Conectar una API
// real (exchangerate.host, Twelve Data, etc.) para datos en vivo.
(function () {
  var el = document.getElementById('moPanel');
  if (!el) return;

  var CATEGORIES = [
    { name: 'Forex', items: [['EUR/USD', '1.08450', true], ['GBP/USD', '1.27321', true], ['USD/JPY', '151.230', false]] },
    { name: 'Índices', items: [['NASDAQ', '23,145', true], ['SP500', '6,240', true], ['US30', '41,980', false]] },
    { name: 'Materias Primas', items: [['ORO', '3,340', false], ['PLATA', '38.20', true], ['PETRÓLEO', '78.15', false]] },
    { name: 'Cripto', items: [['BTC', '109,000', true], ['ETH', '4,120', true]] }
  ];

  el.innerHTML = CATEGORIES.map(function (cat) {
    var rows = cat.items.map(function (item) {
      var cls = item[2] ? 'up' : 'down';
      return '<div class="mo-row"><span class="sym">' + item[0] + '</span><span class="val ' + cls + '">' + item[1] + '</span></div>';
    }).join('');
    return '<div class="mo-cat"><h5>' + cat.name + '</h5>' + rows + '</div>';
  }).join('');
})();
