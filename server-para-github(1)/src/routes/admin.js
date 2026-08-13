// routes/admin.js — SOLO para ti, no para alumnos. Dos cosas:
//   1) Ver quién pagó Elite y su contacto, para coordinar la instalación
//      de plantillas por AnyDesk manualmente.
//   2) Registrar la grabación de una sesión en vivo (después de subirla a
//      Cloudflare Stream) para que aparezca en el Replay Center.
//
// Protegido con una clave propia (ADMIN_SECRET) — nunca con el login de
// un alumno, para que ni el JWT de cuenta ni el Elite puedan entrar aquí
// por error ni a propósito.

import { Router } from 'express';
import { allAccessCodes, saveEliteSession, findCompliancePurchaseById, getComplianceConsents, getComplianceActivitySummary, searchCompliancePurchasesByEmail } from '../db.js';

const router = Router();

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_SECRET || process.env.ADMIN_SECRET.includes('reemplaza')) {
    return res.status(503).json({ error: 'ADMIN_SECRET no está configurado todavía.' });
  }
  if (key !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  next();
}

router.get('/admin/elite-contacts', requireAdmin, async (req, res) => {
  try {
    const all = await allAccessCodes();
    const now = Math.floor(Date.now() / 1000);
    const elite = all
      .filter((c) => c.courseId === 'elite')
      .map((c) => ({
        username: c.username,
        email: c.email,
        phone: c.phone,
        purchasedAt: c.purchasedAt,
        expiresAt: c.expiresAt,
        active: c.expiresAt > now
      }));
    res.json({ contacts: elite });
  } catch (err) {
    console.error('Error en /admin/elite-contacts:', err.message);
    res.status(500).json({ error: 'No se pudo cargar la lista.' });
  }
});

router.post('/admin/elite-sessions', requireAdmin, async (req, res) => {
  try {
    const { courseType, sessionDate, recordingUid } = req.body;
    if (!['forex', 'opciones'].includes(courseType)) {
      return res.status(400).json({ error: "courseType debe ser 'forex' u 'opciones'." });
    }
    const record = await saveEliteSession({
      courseType,
      sessionDate: sessionDate || Math.floor(Date.now() / 1000),
      recordingUid: recordingUid || null,
      createdAt: Math.floor(Date.now() / 1000)
    });
    res.status(201).json(record);
  } catch (err) {
    console.error('Error en /admin/elite-sessions:', err.message);
    res.status(500).json({ error: 'No se pudo guardar la sesión.' });
  }
});

// ---- Expediente de evidencia (para ti, en caso de disputa) ----

router.get('/admin/compliance/search', requireAdmin, async (req, res) => {
  try {
    const email = (req.query.email || '').trim();
    if (!email) return res.status(400).json({ error: 'Falta el correo a buscar.' });
    const purchases = await searchCompliancePurchasesByEmail(email);
    res.json({ purchases });
  } catch (err) {
    console.error('Error en /admin/compliance/search:', err.message);
    res.status(500).json({ error: 'No se pudo buscar.' });
  }
});

async function buildEvidenceData(purchaseId) {
  const purchase = await findCompliancePurchaseById(purchaseId);
  if (!purchase) return null;
  const consents = await getComplianceConsents(purchaseId);
  const activity = await getComplianceActivitySummary(purchaseId);
  return { purchase, consents, activity };
}

router.get('/admin/compliance/purchase/:purchaseId', requireAdmin, async (req, res) => {
  try {
    const data = await buildEvidenceData(req.params.purchaseId);
    if (!data) return res.status(404).json({ error: 'No existe ese expediente.' });
    res.json(data);
  } catch (err) {
    console.error('Error en /admin/compliance/purchase:', err.message);
    res.status(500).json({ error: 'No se pudo cargar el expediente.' });
  }
});

// El "1%" — el reporte ya redactado, listo para copiar y mandar a
// Stripe/PayPal/el banco en una disputa, sin tener que armar nada a mano.
router.get('/admin/compliance/purchase/:purchaseId/report', requireAdmin, async (req, res) => {
  try {
    const data = await buildEvidenceData(req.params.purchaseId);
    if (!data) return res.status(404).json({ error: 'No existe ese expediente.' });

    const { purchase, consents, activity } = data;
    const fmt = (ts) => (ts ? new Date(ts * 1000).toISOString() : 'N/D');
    const money = (cents, currency) => `${(cents / 100).toFixed(2)} ${currency}`;

    let report = `MOVE IA MARKET — REPORTE DE EVIDENCIA DE COMPRA
================================================

Producto: ${purchase.productName}
Monto: ${money(purchase.amountCents, purchase.currency)}
Cliente (correo): ${purchase.email}
Estado actual: ${purchase.status}

Stripe Checkout Session: ${purchase.stripeCheckoutSessionId || 'N/D'}
Stripe Payment Intent: ${purchase.stripePaymentIntentId || 'N/D'}

Compra iniciada: ${fmt(purchase.createdAt)}
Pago confirmado: ${fmt(purchase.purchasedAt)}
IP de compra: ${purchase.purchaseIp || 'N/D'}
Dispositivo/navegador: ${purchase.purchaseUserAgent || 'N/D'}

------------------------------------------------
CONSENTIMIENTOS ACEPTADOS ANTES DEL PAGO
------------------------------------------------
`;

    consents.forEach((c) => {
      report += `\n[${c.consentType}] "${c.termsTitle}"
  Versión: ${c.termsVersion}
  Aceptado: ${c.accepted ? 'SÍ' : 'NO'}
  Fecha/hora: ${fmt(c.acceptedAt)}
  IP: ${c.ipAddress || 'N/D'}
  Hash SHA-256 del texto exacto aceptado: ${c.termsSha256}\n`;
    });

    report += `
------------------------------------------------
ACTIVIDAD REGISTRADA DESPUÉS DE LA COMPRA
------------------------------------------------
`;
    if (Object.keys(activity).length === 0) {
      report += `\n(Sin actividad registrada todavía.)\n`;
    } else {
      Object.entries(activity).forEach(([eventType, count]) => {
        report += `${eventType}: ${count}\n`;
      });
    }

    report += `
------------------------------------------------
Este documento fue generado automáticamente por el sistema de Move IA
Market a partir de registros internos vinculados a la transacción de
Stripe indicada arriba. Generado: ${new Date().toISOString()}
------------------------------------------------
`;

    res.type('text/plain').send(report);
  } catch (err) {
    console.error('Error en /admin/compliance/report:', err.message);
    res.status(500).json({ error: 'No se pudo generar el reporte.' });
  }
});

export default router;
