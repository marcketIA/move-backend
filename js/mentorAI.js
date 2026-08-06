// mentorAI.js — Mentor Inteligente (placeholder)
//
// ⚠️ Este módulo es un STUB. Un chat con IA real necesita una API key que
// nunca debe vivir en JS del navegador (cualquiera podría robarla e
// inflarte la factura). El flujo correcto es:
//
//   navegador → tu backend (Node/Vercel Function/Cloudflare Worker) → API de IA
//
// Aquí dejamos la interfaz ya definida (la función que la UI llama) para
// que cuando tengan el backend listo, solo haya que cambiar el `fetch`
// interno — el resto del dashboard no necesita tocarse.

(function () {
  window.MentorAI = {
    /**
     * @param {string} message - Pregunta del alumno
     * @returns {Promise<string>} - Respuesta del mentor
     */
    ask: async function (message) {
      // TODO: reemplazar por una llamada real, por ejemplo:
      // const res = await fetch('/api/mentor', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message })
      // });
      // const data = await res.json();
      // return data.reply;

      return 'El Mentor IA todavía no está conectado a un backend real. ' +
        'Esta es una respuesta de demostración para probar la interfaz del chat.';
    }
  };
})();
