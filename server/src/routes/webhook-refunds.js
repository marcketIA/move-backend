// routes/webhook-refunds.js — endpoint de Stripe NUEVO y separado,
// dedicado solo a reembolsos y disputas. Cubre el curso base Y la
// Plantilla Elite en un mismo lugar, porque la lógica es idéntica para
// los dos: "si le devolvieron el dinero, se le corta el acceso".
//
// No modifica webhook.js ni webhook-elite.js — ese flujo de "pagó → dio
// acceso" queda exactamente igual. Esto es la otra mitad: "reembolsaron
// → quita el acceso".
//
// En el Dashboard de Stripe: Developers → Webhooks → Add endpoint
//   URL: https://move-backend-2jbz.onrender.com/api/webhook-refunds
//   Eventos: charge.refunded, charge.dispute.created
// Copiar el "Signing secret" en STRIPE_WEBHOOK_SECRET_REFUNDS.

import { Router } from 'express';
import Stripe from 'stripe';
import { revokeAccessByStripeSession, findCompliancePurchaseByStripeSession, setCompliancePurchaseStatus, logComplianceEvent } from '../db.js';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/webhook-refunds', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET_REFUNDS);
  } catch (err) {
    console.error('Firma de webhook de reembolsos inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
    try {
      const charge = event.data.object;
      const paymentIntentId = event.type === 'charge.dispute.created' ? charge.payment_intent : charge.payment_intent;

      if (!paymentIntentId) {
        console.error('Reembolso/disputa sin payment_intent:', event.id);
        return res.json({ received: true, error: 'missing_payment_intent' });
      }

      // El acceso se guardó vinculado al ID de la sesión de checkout, no
      // al payment_intent directamente — hay que encontrar esa sesión.
      const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
      const session = sessions.data[0];

      if (!session) {
        console.error('No se encontró la sesión de checkout para revocar. Payment intent:', paymentIntentId);
        return res.json({ received: true, error: 'session_not_found' });
      }

      const revoked = await revokeAccessByStripeSession(session.id);

      if (revoked) {
        console.log(`🔒 Acceso REVOCADO por ${event.type}. Cuenta: ${revoked.username} · curso: ${revoked.courseId}`);
      } else {
        console.log(`Reembolso/disputa recibido pero no se encontró ningún acceso vinculado a la sesión ${session.id}.`);
      }

      // Expediente de evidencia: se marca DISPUTED o REFUNDED, pero nunca
      // se borra — el historial completo (pago, aceptación, actividad)
      // queda intacto como prueba, exactamente como debe ser.
      const purchase = await findCompliancePurchaseByStripeSession(session.id);
      if (purchase) {
        const newStatus = event.type === 'charge.dispute.created' ? 'DISPUTED' : 'REFUNDED';
        await setCompliancePurchaseStatus(purchase.id, newStatus, event.type);
        await logComplianceEvent({
          purchaseId: purchase.id, email: purchase.email,
          eventType: event.type === 'charge.dispute.created' ? 'DISPUTE_OPENED' : 'REFUND_COMPLETED'
        });
        await logComplianceEvent({ purchaseId: purchase.id, email: purchase.email, eventType: 'ACCESS_REVOKED' });
      }
    } catch (err) {
      console.error('Error procesando reembolso/disputa:', err.message);
    }
  }

  res.json({ received: true });
});

export default router;
