// founders-story.js — animacion de entrada al hacer scroll, consistente
// con el sistema .reveal del resto del sitio (no depende de el, funciona
// solo si se usa esta pieza de forma aislada en otra pagina).
(function () {
  var story = document.querySelector('.fs-story');
  if (!story) return;

  var cols = story.querySelectorAll('.fs-col');
  cols.forEach(function (col) {
    col.style.opacity = '0';
    col.style.transform = 'translateY(16px)';
    col.style.transition = 'opacity .6s ease, transform .6s ease';
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, i) {
      if (entry.isIntersecting) {
        setTimeout(function () {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, i * 120);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  cols.forEach(function (col) { io.observe(col); });
})();
