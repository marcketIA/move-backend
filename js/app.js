// script.js — main behaviors: FAQ accordion, ledger rail, market strip loop
document.addEventListener('DOMContentLoaded', () => {

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((el) => el.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ---- Ledger rail: generates a running list of simulated price rows ---- */
  const rail = document.getElementById('ledger-rail');
  if (rail) {
    const symbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'BTC/USD', 'US500', 'NAS100', 'USD/CHF', 'AUD/USD', 'GBP/JPY', 'OIL', 'US30'];
    const rows = [];
    for (let i = 0; i < 26; i++) {
      const sym = symbols[i % symbols.length];
      const up = Math.random() > 0.45;
      const pct = (Math.random() * 1.4).toFixed(2);
      rows.push(`<div class="row ${up ? 'up' : 'down'}"><span>${sym}</span><span>${up ? '+' : '-'}${pct}%</span></div>`);
    }
    rail.innerHTML = rows.join('');
  }

  /* ---- Market strip: duplicate content for seamless infinite scroll ---- */
  const markets = document.querySelector('.markets');
  if (markets) {
    markets.innerHTML += markets.innerHTML;
  }

  /* ---- CTA buttons: route to enrollment section (placeholder action) ---- */
  document.querySelectorAll('.btn-primary').forEach((btn) => {
    if (!btn.getAttribute('href')) {
      btn.addEventListener('click', () => {
        const target = document.getElementById('cursos');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  });

  /* ---- Glass card: follows the cursor with a soft radial glow ---- */
  document.querySelectorAll(".glass-card").forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.background =
        `radial-gradient(circle at ${x}px ${y}px,
        rgba(212,169,79,.20),
        rgba(255,255,255,.03))`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.background = "rgba(255,255,255,.04)";
    });
  });

});

//======================================
// MENSAJE DE BIENVENIDA
//======================================
window.onload = () => {
  setTimeout(() => {
    console.log("Bienvenido a NEXUS TRADING");
  }, 1000);
};
