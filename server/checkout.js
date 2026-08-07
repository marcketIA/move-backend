// routes/checkout.js — crea una sesión de pago real en Stripe.
// El frontend llama esto y redirige al usuario a session.url.

import { Router } from 'express';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_BY_COURSE = {
  forex: process.env.STRIPE_PRICE_FOREX,
  opciones: process.env.STRIPE_PRICE_OPCIONES
};

router.post('/checkout', async (req, res) => {
  try {
    const { courseId, email, phone, username } = req.body;

    const priceId = PRICE_BY_COURSE[courseId];
    if (!priceId || priceId.includes('reemplaza')) {
      return res.status(400).json({
        error: `No hay un STRIPE_PRICE configurado para "${courseId}". Crea el producto en tu Dashboard de Stripe y pon su price_id en el .env.`
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      // El teléfono y el usuario (si estaba logueado al pagar) viajan en
      // metadata para poder generar el código, avisar por WhatsApp, y
      // vincular el código a su cuenta automáticamente cuando el webhook
      // confirme el pago.
      metadata: { courseId, phone: phone || '', username: username || '' },
      success_url: process.env.CHECKOUT_SUCCESS_URL,
      cancel_url: process.env.CHECKOUT_CANCEL_URL
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creando checkout session:', err.message);
    res.status(500).json({ error: 'No se pudo iniciar el pago. Intenta de nuevo.' });
  }
});

export default router;
