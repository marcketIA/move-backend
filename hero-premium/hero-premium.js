// hero-premium.js — rota la palabra final del titulo (Forex / Opciones /
// Bolsa) para reforzar visualmente los tres mercados que cubre la academia.
(function () {
  var word = document.getElementById('hpRotatorWord');
  if (!word) return;

  var WORDS = ['Forex', 'Opciones', 'Bolsa de Valores'];
  var i = 0;

  setInterval(function () {
    i = (i + 1) % WORDS.length;
    word.style.opacity = '0';
    setTimeout(function () {
      word.textContent = WORDS[i];
      word.style.opacity = '1';
    }, 300);
  }, 2600);
})();
