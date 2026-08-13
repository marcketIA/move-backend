// countdown.js — cuenta regresiva real a la proxima clase en vivo.
// Lee data-weekday (0=domingo...2=martes) y data-hour (formato 24h) del
// panel, y calcula el proximo horario en la zona horaria de Nueva York
// (America/New_York), que es la que el sitio anuncia para las clases en vivo.
//
// Nota: usa un metodo pragmatico para trabajar en hora de Nueva York sin
// una libreria de fechas. Es preciso para el proposito de marketing de este
// widget; no lo uses para programar algo que dependa de precision exacta
// alrededor del cambio de horario de verano.
(function () {
  var panel = document.getElementById('cdPanel');
  if (!panel) return;

  var targetWeekday = parseInt(panel.dataset.weekday, 10);
  var targetHour = parseInt(panel.dataset.hour, 10);

  function nowInNewYork() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  }

  function nextClassDate() {
    var ny = nowInNewYork();
    var daysUntil = (targetWeekday - ny.getDay() + 7) % 7;

    var target = new Date(ny);
    target.setDate(ny.getDate() + daysUntil);
    target.setHours(targetHour, 0, 0, 0);

    // Si hoy es el dia correcto pero ya paso la hora, saltar a la semana siguiente.
    if (daysUntil === 0 && ny.getTime() > target.getTime()) {
      target.setDate(target.getDate() + 7);
    }
    return target;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    var ny = nowInNewYork();
    var diffMs = nextClassDate().getTime() - ny.getTime();
    if (diffMs < 0) diffMs = 0;

    var totalSeconds = Math.floor(diffMs / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var mins = Math.floor((totalSeconds % 3600) / 60);
    var secs = totalSeconds % 60;

    var elDays = document.getElementById('cdDays');
    var elHours = document.getElementById('cdHours');
    var elMins = document.getElementById('cdMins');
    var elSecs = document.getElementById('cdSecs');
    if (elDays) elDays.textContent = pad(days);
    if (elHours) elHours.textContent = pad(hours);
    if (elMins) elMins.textContent = pad(mins);
    if (elSecs) elSecs.textContent = pad(secs);
  }

  tick();
  setInterval(tick, 1000);
})();
