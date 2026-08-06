// image-fallback.js — cuando agreguen fotos reales (Kimy, Andy, alumnos),
// si una imagen no carga, se reemplaza por una inicial con el estilo del
// sitio en vez de mostrar un ícono de imagen rota. No afecta nada que ya
// funcione: solo actúa sobre <img> que fallen al cargar.
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('error', function () {
        var parent = this.parentElement;
        if (!parent) return;
        var name = this.alt || 'M';
        this.remove();
        var placeholder = document.createElement('div');
        placeholder.className = 'avatar-fallback';
        placeholder.textContent = name.charAt(0).toUpperCase();
        parent.appendChild(placeholder);
      });
    });
  });
})();
