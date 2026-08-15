// routes/webhook-elite.js — Stripe llama aquí SOLO para confirmar pagos de
// la Plantilla Elite ($1000). Es un endpoint de Stripe totalmente separado
// del webhook del curso base (distinta URL, distinta clave de firma), así
// que un problema aquí nunca puede afectar los pagos del curso base y
// viceversa.
//
// En el Dashboard de Stripe: Developers → Webhooks → Add endpoint
//   URL: https://move-backend-2jbz.onrender.com/api/webhook-elite
//   Eventos: checkout.session.completed
// Copiar el "Signing secret" de ESE endpoint en STRIPE_WEBHOOK_SECRET_ELITE.

import { Router } from 'express';
import Stripe from 'stripe';
import { findAccessCodeByStripeSession, saveAccessCode, setCompliancePurchaseStatus, logComplianceEvent } from '../db.js';
import { generateAccessCode, accessDurationSeconds } from '../utils/accessCode.js';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Esta ruta se monta con express.raw() en index.js, igual que /api/webhook,
// por la misma razón: Stripe necesita el cuerpo sin procesar para validar
// la firma.
router.post('/webhook-elite', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET_ELITE);
  } catch (err) {
    console.error('Firma de webhook Elite inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status !== 'paid') {
      return res.json({ received: true });
    }

    if (await findAccessCodeByStripeSession(session.id)) {
      return res.json({ received: true, duplicate: true });
    }

    const username = session.metadata?.username || '';
    if (!username) {
      console.error('Webhook Elite sin username en metadata. Session:', session.id);
      return res.json({ received: true, error: 'missing_username' });
    }

    const code = generateAccessCode('elite');
    const tier = session.metadata?.tier || 'full';
    const durationSeconds = accessDurationSeconds('elite', tier);
    const now = Math.floor(Date.now() / 1000);

    await saveAccessCode({
      code,
      courseId: 'elite',
      email: session.customer_email || session.customer_details?.email || '',
      phone: session.metadata?.phone || '',
      username,
      stripeSessionId: session.id,
      purchasedAt: now,
      expiresAt: now + durationSeconds,
      tier
    });

    console.log(`✅ Pago Elite confirmado (${tier}). Código: ${code} · cuenta: ${username} · expira en ${durationSeconds / 86400} días`);

    const purchaseId = session.metadata?.purchaseId;
    if (purchaseId) {
      try {
        await setCompliancePurchaseStatus(purchaseId, 'ACTIVE', 'checkout.session.completed');
        await logComplianceEvent({ purchaseId, email: username, eventType: 'PAYMENT_CONFIRMED' });
        await logComplianceEvent({ purchaseId, email: username, eventType: 'ACCESS_GRANTED' });
      } catch (err) {
        console.error('No se pudo actualizar el expediente de evidencia:', err.message);
      }
    }
  }

  res.json({ received: true });
});

export default router;
