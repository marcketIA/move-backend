// premium-footer.js — mantiene el año del copyright siempre correcto,
// para que este footer nunca quede desactualizado por accidente.
(function () {
  var yearEl = document.getElementById('pfYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
