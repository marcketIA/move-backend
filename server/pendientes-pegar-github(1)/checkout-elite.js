// routes/checkout-elite.js — checkout de Stripe para el CATÁLOGO Elite
// post-curso (plantillas + en vivo entre semana + grabaciones). Archivo
// separado de checkout.js a propósito: el cupo del fin de semana nunca
// depende de este código, ni al revés.
//
// productCode se deja igual ('elite') en los 5 productos a propósito: el
// resto del sistema (premium.js, findLatestPurchaseByEmail, access_codes)
// busca por productCode/courseId 'elite' para decidir si la zona Elite está
// activa, sin importar cuál producto pagó. La diferencia real queda en
// `tier` (guardado en access_codes.tier) — eso es lo que decide qué en
// vivo y qué plantilla le corresponde a cada quien.
//
// Los 5 productos del catálogo:
//   - "full" ($1,099): la más completa. Panel Pro + Scalping + Opciones,
//     en vivo Forex Y Opciones (3 semanas), grabaciones de ambas.
//     Es la que se muestra destacada/dorada — la mejor inversión.
//   - "bridge_opciones" ($550): ya tiene las DOS plantillas de Forex
//     (Panel Pro y Scalping), le falta Opciones. Incluye la plantilla de
//     Opciones + en vivo Forex Y Opciones + grabaciones de ambas.
//   - "panelpro" ($890): plantilla Panel Pro + Scalping DE REGALO. Solo
//     en vivo de Forex (3 semanas) + grabaciones de Forex. No incluye
//     Opciones (no tiene esa plantilla).
//   - "scalping" ($576): solo plantilla Scalping (sin el regalo de Panel
//     Pro). Solo en vivo de Forex + grabaciones de Forex.
//   - "live_only" ($150): ya tiene las DOS plantillas de Forex, solo
//     quiere el en vivo (Forex y Opciones si ya las tiene) sin ninguna
//     plantilla nueva. Es la única opción sin entrega de plantilla.
//
// Todas duran 21 días (3 semanas) — no hay diferencia de duración entre
// productos, a diferencia del esquema anterior.
const ELITE_TIERS = {
  full: {
    envVar: 'STRIPE_PRICE_ELITE_FULL',
    productCode: 'elite',
    productName: 'Move IA Market — La Completa (Panel Pro + Scalping + Opciones)',
    liveScope: 'both'
  },
  bridge_opciones: {
    envVar: 'STRIPE_PRICE_ELITE_BRIDGE_OPCIONES',
    productCode: 'elite',
    productName: 'Move IA Market — Plantilla de Opciones (ya tengo las de Forex)',
    liveScope: 'both'
  },
  panelpro: {
    envVar: 'STRIPE_PRICE_ELITE_PANELPRO',
    productCode: 'elite',
    productName: 'Move IA Market — Plantilla Panel Pro (+ Scalping de regalo)',
    liveScope: 'forex'
  },
  scalping: {
    envVar: 'STRIPE_PRICE_ELITE_SCALPING',
    productCode: 'elite',
    productName: 'Move IA Market — Plantilla Scalping Pro',
    liveScope: 'forex'
  },
  live_only: {
    envVar: 'STRIPE_PRICE_ELITE_LIVE_ONLY',
    productCode: 'elite',
    productName: 'Move IA Market — Solo en vivo, $149.99/mes (ya tengo las plantillas)',
    liveScope: 'both',
    // Nadie de esta cohorte puede calificar todavía (la plantilla de
    // Opciones recién se está creando) — así que este producto se
    // muestra en el catálogo pero queda bloqueado hasta la fecha que
    // pongas en ELITE_LIVE_ONLY_UNLOCKS_AT_UNIX (normalmente el mes que
    // viene). El servidor lo rechaza aunque alguien intente pagarlo
    // directo por API, no solo lo oculta en el frontend.
    checkAvailable: () => {
      const unlocksAt = parseInt(process.env.ELITE_LIVE_ONLY_UNLOCKS_AT_UNIX, 10);
      const now = Math.floor(Date.now() / 1000);
      return Number.isFinite(unlocksAt) && now >= unlocksAt;
    }
  }
};

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
    const { phone, acceptAuthorization, acceptDigitalAccess, termsVersion, tier } = req.body;

    const cleanTier = ELITE_TIERS[tier] ? tier : 'full';
    const tierConfig = ELITE_TIERS[cleanTier];

    if (tierConfig.checkAvailable && !tierConfig.checkAvailable()) {
      return res.status(403).json({
        error: 'Esta opción todavía no está disponible — se activa el próximo mes, cuando ya tengas las dos plantillas.'
      });
    }

    if (!acceptAuthorization || !acceptDigitalAccess) {
      return res.status(400).json({ error: 'Debes marcar las dos casillas de autorización antes de continuar al pago.' });
    }
    if (termsVersion !== TERMS_VERSION) {
      return res.status(409).json({ error: 'Los términos cambiaron. Recarga la página e intenta de nuevo.' });
    }

    const priceId = process.env[tierConfig.envVar];
    if (!priceId || priceId.includes('reemplaza')) {
      return res.status(400).json({
        error: `No hay un ${tierConfig.envVar} configurado. Crea ese producto en Stripe y pon su price_id en el .env.`
      });
    }

    const price = await stripe.prices.retrieve(priceId);
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || '';
    const email = req.account.username;

    const purchaseId = newPurchaseId();
    await createCompliancePurchase({
      id: purchaseId,
      email,
      username: email,
      productCode: tierConfig.productCode,
      productName: tierConfig.productName,
      amountCents: price.unit_amount || 0,
      currency: (price.currency || 'usd').toUpperCase(),
      purchaseIp: ip,
      purchaseUserAgent: userAgent
    });

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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      metadata: { courseId: 'elite', tier: cleanTier, username: email, phone: phone || '', purchaseId },
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

router.get('/checkout-elite/terms', (req, res) => {
  res.json({ version: TERMS_VERSION, authorization: TERMS_AUTHORIZATION, digitalAccess: TERMS_DIGITAL_ACCESS });
});

// El catálogo pregunta esto para saber si ya debe dejar pagar la tarjeta
// "Solo en vivo, $149.99/mes" o mostrarla como "Próximamente".
router.get('/checkout-elite/live-only-status', (req, res) => {
  res.json({ available: ELITE_TIERS.live_only.checkAvailable() });
});

export default router;
