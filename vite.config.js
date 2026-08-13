import { defineConfig } from 'vite';
import { resolve } from 'path';

// Move IA Market — arquitectura multipágina (MPA).
// Cada entrada aquí abajo es una página real que Vite compilará por separado
// (su propio HTML + JS + CSS optimizados), en vez de una sola SPA.
export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Landing principal
        main: resolve(__dirname, 'index.html'),

        // Landing pages de campaña (tráfico pagado / redes)
        landingYt: resolve(__dirname, 'src/views/landing-yt.html'),
        landingTiktok: resolve(__dirname, 'src/views/landing-tiktok.html'),

        // Sistema de video temporal
        liveTemporal: resolve(__dirname, 'src/views/live-temporal.html'),
        errorExpirado: resolve(__dirname, 'src/views/error-expirado.html'),

        // Dashboard de alumnos
        dashboard: resolve(__dirname, 'src/dashboard/index.html'),
        dashClases: resolve(__dirname, 'src/dashboard/views/clases.html'),
        dashMentor: resolve(__dirname, 'src/dashboard/views/mentor-premium.html'),
        dashCalc: resolve(__dirname, 'src/dashboard/views/calculadora-pro.html'),

        // Zona Elite (segunda verificación — plantillas, en vivo, grabaciones)
        premiumGate: resolve(__dirname, 'src/premium/gate.html'),
        premiumDashboard: resolve(__dirname, 'src/premium/dashboard.html'),
        premiumCheckout: resolve(__dirname, 'src/premium/checkout.html'),

        // Panel administrativo de expedientes (privado, no listado, noindex)
        adminEvidence: resolve(__dirname, 'src/admin/index.html'),

        // Páginas legales
        privacidad: resolve(__dirname, 'src/legal/privacidad.html'),
        terminos: resolve(__dirname, 'src/legal/terminos.html')
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
});
