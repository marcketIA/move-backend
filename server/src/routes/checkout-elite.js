// routes/checkout-elite.js — checkout de Stripe SOLO para la Plantilla
// Elite ($1000). Archivo separado de checkout.js a propósito: el curso
// base nunca depende de este código, ni al revés.
//
// Ahora exige los DOS consentimientos (autorización de compra + entrega
// digital inmediata / sin reembolso) ANTES de crear la sesión de pago —
// si no vienen aceptados, no se genera el link de Stripe. Queda guardado
// exactamente qué aceptó, cuándo, y desde qué IP, para poder mostrarlo
// si algún día hay una disputa con el banco, Stripe o PayPal.

import { Router } from 'express';
import Stripe from 'stripe';
import { requireAccount } from '../middleware/requireAccount.js';
import { createCompliancePurchase, saveComplianceConsent, attachStripeIdsToPurchase, logComplianceEvent } from '../db.js';
import { sha256, newPurchaseId } from '../utils/compliance.js';
import { TERMS_VERSION, TERMS_AUTHORIZATION, TERMS_DIGITAL_ACCESS } from '../utils/terms.js';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/checkout-elite', requireAccount, async (req, res) => {
  try {
    const { phone, acceptAuthorization, acceptDigitalAccess, termsVersion } = req.body;

    if (!acceptAuthorization || !acceptDigitalAccess) {
      return res.status(400).json({ error: 'Debes marcar las dos casillas de autorización antes de continuar al pago.' });
    }
    if (termsVersion !== TERMS_VERSION) {
      return res.status(409).json({ error: 'Los términos cambiaron. Recarga la página e intenta de nuevo.' });
    }

    const priceId = process.env.STRIPE_PRICE_ELITE;
    if (!priceId || priceId.includes('reemplaza')) {
      return res.status(400).json({
        error: 'No hay un STRIPE_PRICE_ELITE configurado. Crea el producto de $1000 en Stripe y pon su price_id en el .env.'
      });
    }

    const price = await stripe.prices.retrieve(priceId);
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || '';
    const email = req.account.username;

    // 1) Se abre el expediente de esta compra ANTES de tocar Stripe.
    const purchaseId = newPurchaseId();
    await createCompliancePurchase({
      id: purchaseId,
      email,
      username: email,
      productCode: 'elite',
      productName: 'Move IA Market — Plantilla Elite',
      amountCents: price.unit_amount || 0,
      currency: (price.currency || 'usd').toUpperCase(),
      purchaseIp: ip,
      purchaseUserAgent: userAgent
    });

    // 2) Se guardan los DOS consentimientos, con el texto completo y su hash.
    await saveComplianceConsent({
      purchaseId, consentType: TERMS_AUTHORIZATION.type, termsVersion: TERMS_VERSION,
      termsTitle: TERMS_AUTHORIZATION.title, termsText: TERMS_AUTHORIZATION.text,
      termsSha256: sha256(TERMS_AUTHORIZATION.text), accepted: true, ipAddress: ip, userAgent
    });
    await saveComplianceConsent({
      purchaseId, consentType: TERMS_DIGITAL_ACCESS.type, termsVersion: TERMS_VERSION,
      termsTitle: TERMS_DIGITAL_ACCESS.title, termsText: TERMS_DIGITAL_ACCESS.text,
      termsSha256: sha256(TERMS_DIGITAL_ACCESS.text), accepted: true, ipAddress: ip, userAgent
    });
    await logComplianceEvent({ purchaseId, email, eventType: 'TERMS_ACCEPTED', ipAddress: ip, userAgent });
    await logComplianceEvent({ purchaseId, email, eventType: 'PURCHASE_CREATED', ipAddress: ip, userAgent });

    // 3) Recién ahora se crea la sesión de pago, con el purchaseId viajando
    // en metadata para que webhook-elite.js sepa qué expediente actualizar.
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      metadata: { courseId: 'elite', username: email, phone: phone || '', purchaseId },
      success_url: process.env.CHECKOUT_ELITE_SUCCESS_URL || process.env.CHECKOUT_SUCCESS_URL,
      cancel_url: process.env.CHECKOUT_ELITE_CANCEL_URL || process.env.CHECKOUT_CANCEL_URL
    });

    await attachStripeIdsToPurchase(purchaseId, { stripeCheckoutSessionId: session.id });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creando checkout Elite:', err.message);
    res.status(500).json({ error: 'No se pudo iniciar el pago Elite. Intenta de nuevo.' });
  }
});

// El frontend pide este texto para mostrarlo COMPLETO antes de pagar
// (no solo un link) — así el consentimiento es defendible como evidencia.
router.get('/checkout-elite/terms', (req, res) => {
  res.json({ version: TERMS_VERSION, authorization: TERMS_AUTHORIZATION, digitalAccess: TERMS_DIGITAL_ACCESS });
});

export default router;
