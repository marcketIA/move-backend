// ai-score.js — cuenta cuantos criterios del checklist marco el propio
// alumno. A proposito NO calcula ni muestra ningun veredicto BUY/SELL,
// ningun simbolo recomendado, ni una puntuacion de "confianza en el
// mercado" — solo refleja que tan completo esta el checklist de SU
// disciplina operativa personal.
(function () {
  var checklist = document.getElementById('ascChecklist');
  if (!checklist) return;

  var checkboxes = checklist.querySelectorAll('input[type=checkbox]');
  var scoreEl = document.getElementById('ascScore');
  var labelEl = document.getElementById('ascResultLabel');

  function update() {
    var checked = 0;
    checkboxes.forEach(function (cb) { if (cb.checked) checked++; });
    var total = checkboxes.length;
    scoreEl.textContent = checked + '/' + total;

    if (checked === total) labelEl.textContent = 'Checklist completo — tu proceso está bien documentado';
    else if (checked >= total - 2) labelEl.textContent = 'Casi completo — revisa los criterios que faltan antes de ejecutar';
    else labelEl.textContent = 'Faltan varios criterios por revisar';
  }

  checkboxes.forEach(function (cb) { cb.addEventListener('change', update); });
  update();
})();
