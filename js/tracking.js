// tracking.js — Facebook Pixel / TikTok Pixel / Google Analytics
//
// Estas funciones NO cargan los píxeles por ti — cada uno requiere su propio
// script de inicialización con tu ID real, pegado en el <head> de cada
// página (Meta Events Manager / TikTok Events Manager / Google Analytics).
// Estas funciones solo envían eventos de forma segura: si el script del
// píxel no está cargado todavía, no rompen la página con un error.

(function () {
  window.NexusTracking = {
    // Meta / Facebook Pixel — requiere el snippet oficial de fbevents.js en el <head>
    fbEvent: function (eventName, params) {
      if (typeof window.fbq === 'function') {
        window.fbq('track', eventName, params || {});
      }
    },

    // TikTok Pixel — requiere el snippet oficial de ttq en el <head>
    ttEvent: function (eventName, params) {
      if (typeof window.ttq !== 'undefined' && window.ttq.track) {
        window.ttq.track(eventName, params || {});
      }
    },

    // Google Analytics 4 — requiere gtag.js en el <head>
    gaEvent: function (eventName, params) {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params || {});
      }
    },

    // Dispara los tres a la vez para eventos clave del embudo
    trackLead: function (source) {
      this.fbEvent('Lead', { content_name: source });
      this.ttEvent('SubmitForm', { content_name: source });
      this.gaEvent('generate_lead', { source: source });
    },

    trackPurchaseIntent: function (courseName, value) {
      this.fbEvent('InitiateCheckout', { content_name: courseName, value: value, currency: 'USD' });
      this.ttEvent('InitiateCheckout', { content_name: courseName, value: value, currency: 'USD' });
      this.gaEvent('begin_checkout', { items: [{ item_name: courseName }], value: value, currency: 'USD' });
    }
  };
})();
