// operations-timeline.js — resalta progresivamente cada nodo del recorrido
// a medida que entra en pantalla, para reforzar la sensacion de proceso
// paso a paso (en vez de mostrar los 4 nodos ya "activos" de una vez).
(function () {
  var nodes = document.querySelectorAll('.ot-timeline .ot-node');
  if (!nodes.length) return;

  nodes.forEach(function (node) {
    node.style.opacity = '0.35';
    node.style.transition = 'opacity .5s ease, border-color .5s ease';
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.borderColor = 'var(--gold-dim, #8A7133)';
      }
    });
  }, { threshold: 0.6 });

  nodes.forEach(function (node) { io.observe(node); });
})();
