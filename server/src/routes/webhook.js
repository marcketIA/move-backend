// routes/webhook.js — Stripe llama aquí directamente (no el navegador).
//
// Este es el punto más importante de todo el sistema de pagos: es la única
// fuente de verdad de "esta persona sí pagó". Nunca confíes en el frontend
// para eso (un usuario podría llamar a tu API diciendo "ya pagué" sin
// haberlo hecho) — por eso Stripe firma cada evento con STRIPE_WEBHOOK_SECRET
// y aquí verificamos esa firma antes de generar ningún código.
//
// Para probarlo en local necesitas la Stripe CLI:
//   stripe listen --forward-to localhost:8787/api/webhook
// (el comando ya está en package.json como `npm run stripe:listen`)

import { Router } from 'express';
import Stripe from 'stripe';
import { findAccessCodeByStripeSession, saveAccessCode } from '../db.js';
import { generateAccessCode, accessDurationSeconds } from '../utils/accessCode.js';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Nota: esta ruta se monta con express.raw() en index.js (no express.json())
// porque Stripe necesita el cuerpo de la petición sin procesar para poder
// verificar la firma correctamente.
router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Firma de webhook inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status !== 'paid') {
      return res.json({ received: true });
    }

    // Stripe puede reintentar un evento. Un pago debe generar una sola
    // matrícula, aunque la notificación llegue dos o más veces.
    if (await findAccessCodeByStripeSession(session.id)) {
      return res.json({ received: true, duplicate: true });
    }
    const courseId = session.metadata?.courseId || 'forex';
    const phone = session.metadata?.phone || '';
    const username = session.metadata?.username || '';
    const email = session.customer_email || session.customer_details?.email || '';

    const code = generateAccessCode(courseId);
    const durationSeconds = accessDurationSeconds(courseId);
    const now = Math.floor(Date.now() / 1000);

    const record = {
      code,
      courseId,
      email,
      phone,
      stripeSessionId: session.id,
      purchasedAt: now,
      expiresAt: now + durationSeconds
    };

    // Si pagó estando logueado, vinculamos el código a su cuenta de una vez
    // — así no tiene que copiar/pegar el código a mano después.
    if (username) {
      record.username = username;
    }

    await saveAccessCode(record);
    console.log(`✅ Pago confirmado. Código generado: ${code} (${courseId}) para ${email || phone}${username ? ' · cuenta: ' + username : ''}`);

    // TODO: notificar al alumno automáticamente por WhatsApp/email con su código.
    // Ejemplo con Twilio WhatsApp API:
    //   await twilioClient.messages.create({
    //     from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    //     to: `whatsapp:${phone}`,
    //     body: `¡Bienvenido a Move IA Market! Tu código de acceso es: ${code}`
    //   });
  }

  res.json({ received: true });
});

export default router;
