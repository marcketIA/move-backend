// routes/zoom-webhook.js — Fase 1 de la seguridad de Zoom: detecta si el
// mismo correo entra a la reunión desde 2 dispositivos a la vez, y avisa
// por WhatsApp + lo guarda para el panel. NO saca a nadie automáticamente
// todavía (eso es Fase 2, depende de un permiso que Zoom tiene que
// aprobar aparte) — por ahora, Andy o Kimy lo sacan a mano desde Zoom en
// cuanto reciben el aviso.
//
// Cómo llega la información: cada alumno se une con SU link personal de
// registro (por eso activamos "Requerir registro" en la reunión de
// Zoom) — así Zoom nos manda su correo real junto con cada aviso de
// "entró" / "salió", y podemos saber que es la MISMA persona sin
// adivinar por el nombre.

import { Router } from 'express';
import crypto from 'crypto';
import { saveZoomDuplicateAlert } from '../db.js';
import { sendWhatsappAlert } from '../utils/whatsapp.js';

const router = Router();

// Quién está conectado ahorita mismo, en memoria. A propósito NO se
// guarda en la base de datos — es información que solo importa mientras
// la clase está en vivo, y se reinicia sola cuando termina. Si el
// servidor se reinicia justo a la mitad de una clase (raro, pero
// posible), esta lista se pierde y hay que esperar a que cada quien
// vuelva a entrar para que se reconstruya — riesgo aceptado en esta
// primera fase.
const activeParticipants = new Map(); // correo -> { desde, tema }

function verifyZoomSignature(req, rawBody) {
  const secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  if (!secretToken) return false;
  const timestamp = req.headers['x-zm-request-timestamp'];
  const signature = req.headers['x-zm-signature'];
  if (!timestamp || !signature) return false;
  const message = `v0:${timestamp}:${rawBody}`;
  const hash = crypto.createHmac('sha256', secretToken).update(message).digest('hex');
  const expected = `v0=${hash}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature)));
  } catch {
    return false;
  }
}

router.post('/zoom-webhook', async (req, res) => {
  const rawBody = req.body.toString('utf8');
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Cuerpo inválido.' });
  }

  // El "apretón de manos" inicial de Zoom para confirmar que esta URL es
  // real — ocurre ANTES de que exista ninguna firma que verificar, así
  // que se responde siempre, sin pedir firma.
  if (payload.event === 'endpoint.url_validation') {
    const secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
    if (!secretToken) {
      return res.status(500).json({ error: 'ZOOM_WEBHOOK_SECRET_TOKEN no está configurado todavía.' });
    }
    const plainToken = payload.payload && payload.payload.plainToken;
    const encryptedToken = crypto.createHmac('sha256', secretToken).update(plainToken).digest('hex');
    return res.json({ plainToken, encryptedToken });
  }

  // Para cualquier otro aviso (alguien entró, alguien salió), sí
  // exigimos la firma real — así nadie puede mandarnos avisos falsos
  // haciéndose pasar por Zoom.
  if (!verifyZoomSignature(req, rawBody)) {
    return res.status(401).json({ error: 'Firma inválida.' });
  }

  const eventType = payload.event;
  const obj = payload.payload && payload.payload.object;
  const participant = obj && obj.participant;
  const email = participant && participant.email ? String(participant.email).toLowerCase().trim() : '';
  const meetingTopic = (obj && obj.topic) || 'Reunión';

  if (eventType === 'meeting.participant_joined' && email) {
    if (activeParticipants.has(email)) {
      // Ya estaba conectado — esto es un segundo dispositivo con el
      // mismo correo, entrando al mismo tiempo.
      const now = Math.floor(Date.now() / 1000);
      saveZoomDuplicateAlert({ email, meetingTopic, detectedAt: now })
        .catch((e) => console.error('No se pudo guardar la alerta de Zoom:', e.message));
      sendWhatsappAlert(
        `⚠️ Move IA Market: "${email}" entró DOS VECES a "${meetingTopic}" al mismo tiempo. Revisa la lista de participantes en Zoom.`
      ).catch((e) => console.error('No se pudo mandar el WhatsApp de alerta:', e.message));
    } else {
      activeParticipants.set(email, { desde: Date.now(), tema: meetingTopic });
    }
  }

  if (eventType === 'meeting.participant_left' && email) {
    activeParticipants.delete(email);
  }

  // Zoom espera un 200 rápido — si tarda mucho, reintenta el mismo
  // aviso, y podríamos terminar mandando el WhatsApp duplicado. Por eso
  // el WhatsApp y el guardado de arriba NO se esperan (no llevan
  // "await"), solo se disparan.
  res.status(200).json({ received: true });
});

export default router;
