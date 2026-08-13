// routes/checkout-status.js — archivo nuevo, separado por completo de
// checkout.js/webhook.js. Su único trabajo es responder "¿ya está listo
// el acceso de esta compra?" para que la pantalla de bienvenida sepa
// cuándo meter al alumno a su curso. No crea acceso, no decide nada —
// solo LEE lo que el webhook (la única fuente de verdad real) ya guardó.

import { Router } from 'express';
import { findAccessCodeByStripeSession } from '../db.js';

const router = Router();

router.get('/checkout/status', async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId) return res.status(400).json({ error: 'Falta session_id.' });

    const record = await findAccessCodeByStripeSession(sessionId);
    if (!record) {
      // Normal justo después de pagar: Stripe redirige al navegador antes
      // de que el webhook (servidor a servidor) termine de procesar. La
      // pantalla debe reintentar unos segundos, no es un error.
      return res.json({ ready: false });
    }

    res.json({ ready: true, code: record.code, courseId: record.courseId, expiresAt: record.expiresAt });
  } catch (err) {
    console.error('Error en /checkout/status:', err.message);
    res.status(500).json({ error: 'No se pudo confirmar el pago.' });
  }
});

export default router;
