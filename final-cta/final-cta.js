// final-cta.js — registra el clic en tracking.js (si esta cargado) antes de
// seguir el enlace normal. No reemplaza la navegacion, solo la acompaña.
(function () {
  var primary = document.querySelector('.fc2-primary');
  if (primary) {
    primary.addEventListener('click', function () {
      if (window.NexusTracking) window.NexusTracking.trackLead('final-cta:comenzar-gratis');
    });
  }
  var outline = document.querySelector('.fc2-outline');
  if (outline) {
    outline.addEventListener('click', function () {
      if (window.NexusTracking) window.NexusTracking.trackLead('final-cta:hablar-mentor');
    });
  }
})();
