// broker-comparison.js — convierte las celdas en editables directamente en
// el navegador (contentEditable) y guarda los cambios en localStorage, para
// que el dueno del sitio pueda escribir datos reales y verificados sin
// tocar el HTML. Ningun dato de broker viene pre-cargado por nosotros.
(function () {
  var table = document.querySelector('.bc-table');
  if (!table) return;

  var STORAGE_KEY = 'msa_broker_comparison_data';

  function cellId(cell) {
    var row = cell.parentElement.rowIndex;
    var col = cell.cellIndex;
    return row + '-' + col;
  }

  function loadSaved() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      table.querySelectorAll('td[data-editable]').forEach(function (cell) {
        var id = cellId(cell);
        if (saved[id]) cell.textContent = saved[id];
      });
    } catch (e) { /* sin datos guardados todavia */ }
  }

  table.querySelectorAll('td[data-editable]').forEach(function (cell) {
    cell.contentEditable = 'true';
    cell.addEventListener('blur', function () {
      try {
        var saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        saved[cellId(cell)] = cell.textContent.trim();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch (e) { /* localStorage no disponible */ }
    });
  });

  loadSaved();
})();
