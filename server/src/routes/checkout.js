// routes/checkout.js — crea la sesión de pago de Stripe para el CUPO al
// seminario de fin de semana (sábado y domingo). Es un solo producto, sin
// separar Forex/Opciones en esta etapa — eso ahora vive en checkout-elite.js
// como la oferta post-curso.
//
// El precio (preventa $70 vs normal $100) lo decide el SERVIDOR según la
// fecha límite configurada en PRESALE_ENDS_AT_UNIX (variable de entorno en
// Render) — así se cambia la fecha o se apaga la preventa sin tocar código
// ni volver a desplegar el frontend.

import { Router } from 'express';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function resolveWeekendPrice() {
  const presalePriceId = process.env.STRIPE_PRICE_WEEKEND_PRESALE;
  const regularPriceId = process.env.STRIPE_PRICE_WEEKEND_REGULAR;
  const presaleEndsAt = parseInt(process.env.PRESALE_ENDS_AT_UNIX, 10);
  const now = Math.floor(Date.now() / 1000);
  const inPresale = Number.isFinite(presaleEndsAt) && now < presaleEndsAt;

  return {
    inPresale,
    priceId: inPresale ? presalePriceId : regularPriceId
  };
}

router.post('/checkout', async (req, res) => {
  try {
    const { email, phone, username } = req.body;
    const { priceId, inPresale } = resolveWeekendPrice();

    if (!priceId || priceId.includes('reemplaza')) {
      return res.status(400).json({
        error: `No hay un STRIPE_PRICE configurado para el cupo del fin de semana (${inPresale ? 'preventa' : 'precio normal'}). Crea el producto en tu Dashboard de Stripe y pon su price_id en el .env.`
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      metadata: { courseId: 'weekend', phone: phone || '', username: username || '' },
      success_url: process.env.CHECKOUT_SUCCESS_URL,
      cancel_url: process.env.CHECKOUT_CANCEL_URL
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creando checkout session:', err.message);
    res.status(500).json({ error: 'No se pudo iniciar el pago. Intenta de nuevo.' });
  }
});

router.get('/checkout/pricing', (req, res) => {
  const { inPresale } = resolveWeekendPrice();
  res.json({
    inPresale,
    label: inPresale ? 'Preventa' : 'Precio normal',
    displayAmount: inPresale
      ? (process.env.WEEKEND_PRESALE_DISPLAY_AMOUNT || '$70')
      : (process.env.WEEKEND_REGULAR_DISPLAY_AMOUNT || '$100')
  });
});

export default router;
