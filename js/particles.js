// particles.js — ambient drifting gold/green particles inside #background-animation
(function () {
  const bg = document.getElementById('background-animation');
  if (!bg) return;

  const COUNT = window.innerWidth < 700 ? 14 : 28;

  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const left = Math.random() * 100;
    const size = 1.5 + Math.random() * 2.5;
    const duration = 14 + Math.random() * 18;
    const delay = Math.random() * -30;

    p.style.left = left + 'vw';
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.animationDuration = duration + 's';
    p.style.animationDelay = delay + 's';
    p.style.opacity = (0.2 + Math.random() * 0.4).toFixed(2);
    // una de cada cuatro particulas es verde, para mas profundidad visual
    if (i % 4 === 0) p.style.background = 'var(--long, #22B57B)';

    bg.appendChild(p);
  }
})();
