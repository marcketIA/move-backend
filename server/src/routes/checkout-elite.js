// routes/checkout-elite.js — checkout de Stripe SOLO para la Plantilla
// Elite ($1000). Es un archivo nuevo y separado de checkout.js a propósito:
// el curso base nunca debe depender de este código, ni al revés.
//
// Solo se puede comprar estando logueado (requiere cuenta) porque la
// licencia Elite se vincula a esa cuenta desde el primer momento — no hay
// "código suelto" que copiar y pegar como en el curso base.

import { Router } from 'express';
import Stripe from 'stripe';
import { requireAccount } from '../middleware/requireAccount.js';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/checkout-elite', requireAccount, async (req, res) => {
  try {
    const { phone } = req.body;
    const priceId = process.env.STRIPE_PRICE_ELITE;
    if (!priceId || priceId.includes('reemplaza')) {
      return res.status(400).json({
        error: 'No hay un STRIPE_PRICE_ELITE configurado. Crea el producto de $1000 en Stripe y pon su price_id en el .env.'
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: req.account.username || undefined,
      // El teléfono viaja en metadata porque el equipo necesita coordinar
      // manualmente (AnyDesk) la instalación de las plantillas — ver
      // GET /admin/elite-contacts.
      metadata: { courseId: 'elite', username: req.account.username, phone: phone || '' },
      success_url: process.env.CHECKOUT_ELITE_SUCCESS_URL || process.env.CHECKOUT_SUCCESS_URL,
      cancel_url: process.env.CHECKOUT_ELITE_CANCEL_URL || process.env.CHECKOUT_CANCEL_URL
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creando checkout Elite:', err.message);
    res.status(500).json({ error: 'No se pudo iniciar el pago Elite. Intenta de nuevo.' });
  }
});

export default router;
