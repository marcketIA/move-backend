// faq-premium.js — mismo comportamiento de acordeon que el FAQ del sitio
// principal (script.js), aislado para funcionar en cualquier pagina.
(function () {
  document.querySelectorAll('#fpList .fp-item').forEach(function (item) {
    var question = item.querySelector('.fp-question');
    question.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('#fpList .fp-item.open').forEach(function (el) { el.classList.remove('open'); });
      if (!isOpen) item.classList.add('open');
    });
  });
})();
