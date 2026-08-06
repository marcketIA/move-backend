// calculator.js — position size & risk calculator (educational tool)
(function () {
  const form = document.getElementById('calc-form');
  if (!form) return;

  const balanceInput = document.getElementById('calc-balance');
  const riskInput = document.getElementById('calc-risk');
  const slInput = document.getElementById('calc-sl');
  const pairSelect = document.getElementById('calc-pair');

  const outRiskAmount = document.getElementById('out-risk-amount');
  const outLots = document.getElementById('out-lots');
  const outUnits = document.getElementById('out-units');
  const outPipValue = document.getElementById('out-pip-value');

  // Approximate pip value per standard lot (100,000 units), quote currency = USD
  const PIP_VALUE_PER_LOT = {
    'EURUSD': 10,
    'GBPUSD': 10,
    'USDJPY': 9.1,
    'XAUUSD': 10,
    'GBPJPY': 9.1
  };

  function format(n, decimals) {
    return n.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function calculate() {
    const balance = parseFloat(balanceInput.value) || 0;
    const riskPct = parseFloat(riskInput.value) || 0;
    const slPips = parseFloat(slInput.value) || 0;
    const pair = pairSelect.value;
    const pipValue = PIP_VALUE_PER_LOT[pair] || 10;

    const riskAmount = balance * (riskPct / 100);
    const lots = slPips > 0 ? riskAmount / (slPips * pipValue) : 0;
    const units = lots * 100000;

    outRiskAmount.textContent = '$' + format(riskAmount, 2);
    outLots.textContent = format(lots, 2) + ' lotes';
    outUnits.textContent = format(units, 0) + ' unidades';
    outPipValue.textContent = '$' + format(pipValue, 2) + ' / pip / lote';

    outRiskAmount.classList.toggle('danger', riskPct > 3);
  }

  form.addEventListener('input', calculate);
  calculate();
})();
