// countdown-launch.js — cuenta regresiva a una fecha FIJA real, leida del
// atributo data-target (ISO 8601 con zona horaria explicita). A diferencia
// de countdown/ (que recalcula el proximo martes cada semana), esta fecha
// no cambia sola — hay que actualizarla manualmente cuando termine cada
// promocion, para que nunca muestre una fecha vencida por accidente.
(function () {
  var panel = document.getElementById('cdlPanel');
  if (!panel) return;

  var target = new Date(panel.dataset.target);
  if (isNaN(target.getTime())) {
    console.warn('[countdown-launch] data-target invalido:', panel.dataset.target);
    return;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    var diffMs = target.getTime() - Date.now();

    if (diffMs <= 0) {
      panel.querySelector('.cdl-units').style.display = 'none';
      var expired = document.getElementById('cdlExpired');
      if (expired) expired.style.display = 'block';
      clearInterval(interval);
      return;
    }

    var totalSeconds = Math.floor(diffMs / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var mins = Math.floor((totalSeconds % 3600) / 60);
    var secs = totalSeconds % 60;

    document.getElementById('cdlDays').textContent = pad(days);
    document.getElementById('cdlHours').textContent = pad(hours);
    document.getElementById('cdlMins').textContent = pad(mins);
    document.getElementById('cdlSecs').textContent = pad(secs);
  }

  tick();
  var interval = setInterval(tick, 1000);
})();
