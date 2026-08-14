// utils/compliance.js — el "expediente electrónico" de cada compra.
// No decide nada de seguridad ni de acceso (eso lo sigue haciendo
// access_codes exactamente igual que siempre) — esto solo GUARDA prueba
// de qué se aceptó, cuándo, desde dónde, y qué se usó después. Es lo que
// se manda a Stripe/PayPal/el banco si algún día hay una disputa.

import crypto from 'crypto';

export function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

export function newPurchaseId() {
  return crypto.randomUUID();
}
