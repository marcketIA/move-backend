// routes/premium.js — la "segunda comprobación" para la zona Elite
// ($1000: plantillas, en vivo entre semana, grabaciones). No reemplaza el
// login normal — el alumno ya tiene su cuenta y su sesión del curso base
// intactas. Esto es una puerta adicional que se abre SOLO si:
//   1) vuelve a confirmar su contraseña (más estricto a propósito, porque
//      es la parte más valiosa de la plataforma), Y
//   2) su cuenta tiene un pago Elite activo (no vencido) en access_codes, Y
//   3) no supera el límite de 2 dispositivos para la zona Elite.

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { findUserByUsername, findAccessCodesByUsername, upsertDevice, countDevicesByUsername, listDevicesByUsername, listActiveEliteRecordings, findLatestPurchaseByEmail, logComplianceEvent } from '../db.js';
import { requirePremiumSession } from '../middleware/requirePremiumSession.js';
import { requireAccount } from '../middleware/requireAccount.js';
import { buildSignedVideoUrl } from '../utils/signedUrl.js';

const router = Router();

// Más estricto que el login normal (8 en 15 min) porque esto protege el
// producto de mayor valor — 5 intentos en 15 minutos.
const premiumVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de verificación Elite. Espera unos minutos e intenta de nuevo.' }
});

// Máximo 2 dispositivos para la zona Elite (ej. 1 computadora + 1 celular),
// más estricto que el curso base a propósito, por el valor del producto.
const MAX_ELITE_DEVICES = 2;

function readJsonSetting(name) {
  try {
    return JSON.parse(process.env[name] || '{}');
  } catch {
    return null;
  }
}

router.post('/premium/verify', premiumVerifyLimiter, async (req, res) => {
  try {
    const { username, password, deviceLabel } = req.body;
    const cleanUsername = (username || '').trim().toLowerCase();

    const user = await findUserByUsername(cleanUsername);
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const match = await bcrypt.compare(password || '', user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const codes = await findAccessCodesByUsername(cleanUsername);
    const now = Math.floor(Date.now() / 1000);
    const activeElite = codes.find((c) => c.courseId === 'elite' && c.expiresAt > now);

    if (!activeElite) {
      return res.status(403).json({ error: 'Esta cuenta no tiene la Plantilla Elite activa.' });
    }

    // Control de dispositivos: si este dispositivo ya es conocido, lo
    // actualiza sin contar como uno nuevo. Si es distinto y ya hay 2,
    // se bloquea — mismo criterio que el curso base, pero con límite
    // numérico explícito porque aquí sí importa mucho más.
    const label = (deviceLabel || req.headers['user-agent'] || 'dispositivo').slice(0, 200);
    const currentCount = await countDevicesByUsername(cleanUsername);
    const knownDevices = await listDevicesByUsername(cleanUsername);
    const isKnownDevice = knownDevices.some((d) => d.deviceLabel === label);

    if (!isKnownDevice && currentCount >= MAX_ELITE_DEVICES) {
      return res.status(403).json({
        error: `Ya alcanzaste el máximo de ${MAX_ELITE_DEVICES} dispositivos para el acceso Elite. Cierra uno desde tu cuenta para continuar.`
      });
    }

    await upsertDevice(cleanUsername, label, req.headers['user-agent'] || null);

    const token = jwt.sign(
      { username: cleanUsername, type: 'premium' },
      process.env.SESSION_SECRET,
      { expiresIn: '2h' } // sesión corta a propósito — es la zona más valiosa.
    );

    res.json({ token, expiresAt: activeElite.expiresAt });

    // Evidencia: se registra DESPUÉS de responder, para no demorar el
    // login por esto. Si falla, no afecta el acceso — solo se pierde
    // ese registro puntual de actividad.
    findLatestPurchaseByEmail(cleanUsername, 'elite').then((purchase) => {
      if (purchase) {
        logComplianceEvent({
          purchaseId: purchase.id, email: cleanUsername, eventType: 'LOGIN_SUCCESS',
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress, userAgent: req.headers['user-agent']
        }).catch((e) => console.error('No se pudo registrar LOGIN_SUCCESS:', e.message));
      }
    }).catch(() => {});
  } catch (err) {
    console.error('Error en /premium/verify:', err.message);
    res.status(500).json({ error: 'No se pudo verificar el acceso Elite. Intenta de nuevo.' });
  }
});

router.get('/premium/video/:moduleId', requirePremiumSession, async (req, res) => {
  const { moduleId } = req.params;
  const moduleMap = readJsonSetting('CF_STREAM_ELITE_MODULE_MAP');

  if (!moduleMap) {
    return res.status(503).json({ error: 'La configuración de videos Elite no es válida.' });
  }

  const videoUid = moduleMap[moduleId];
  if (!videoUid) {
    return res.status(404).json({ error: 'Este módulo Elite no tiene un video asignado.' });
  }

  try {
    // Igual que en video.js: el JWT es solo la sesión, se vuelve a
    // consultar la base de datos para que una expiración se aplique al
    // siguiente intento de ver una clase, no solo al momento de verificar.
    const codes = await findAccessCodesByUsername(req.premium.username);
    const now = Math.floor(Date.now() / 1000);
    const activeElite = codes.find((c) => c.courseId === 'elite' && c.expiresAt > now);

    if (!activeElite) {
      return res.status(403).json({ error: 'Tu acceso Elite ya no está activo.' });
    }

    const ttl = Math.min(Math.max(parseInt(process.env.VIDEO_LINK_TTL_SECONDS, 10) || 900, 60), 3600);
    const signed = buildSignedVideoUrl(videoUid, ttl);
    findLatestPurchaseByEmail(req.premium.username, 'elite').then((purchase) => {
      if (purchase) {
        logComplianceEvent({
          purchaseId: purchase.id, email: req.premium.username, eventType: 'VIDEO_PLAY_STARTED',
          resourceType: 'video', resourceId: moduleId
        }).catch(() => {});
      }
    }).catch(() => {});

    return res.json({ ...signed, moduleId });
  } catch (err) {
    if (err.code === 'STREAM_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'El sistema de video todavía no está configurado.' });
    }
    console.error('Error preparando video Elite:', err.message);
    return res.status(500).json({ error: 'No se pudo preparar el video. Intenta de nuevo.' });
  }
});

// El link de Zoom es un salón fijo que se reutiliza cada día (no hace
// falta crear una fila nueva en la base de datos cada mañana). Si algún
// día lo quieres cambiar, solo se actualiza la variable de entorno en
// Render, sin tocar código.
router.get('/premium/live', requirePremiumSession, async (req, res) => {
  res.json({
    forex: {
      zoomLink: process.env.ZOOM_LINK_FOREX || null,
      schedule: process.env.ELITE_SCHEDULE_FOREX || 'Lunes a Viernes, 8:00 PM'
    },
    opciones: {
      zoomLink: process.env.ZOOM_LINK_OPCIONES || null,
      schedule: process.env.ELITE_SCHEDULE_OPCIONES || 'Lunes a Viernes, 9:30 AM - 12:00 PM'
    }
  });
});

// Grabaciones de los últimos 14 días — cada una se sube manualmente a
// Cloudflare Stream y se registra con POST /admin/elite-sessions.
router.get('/premium/replays', requirePremiumSession, async (req, res) => {
  try {
    const fourteenDaysAgo = Math.floor(Date.now() / 1000) - 14 * 24 * 60 * 60;
    const recordings = await listActiveEliteRecordings(fourteenDaysAgo);

    const withUrls = recordings.map((r) => {
      try {
        const ttl = Math.min(Math.max(parseInt(process.env.VIDEO_LINK_TTL_SECONDS, 10) || 900, 60), 3600);
        const signed = buildSignedVideoUrl(r.recordingUid, ttl);
        return { id: r.id, courseType: r.courseType, sessionDate: r.sessionDate, ...signed };
      } catch {
        return null; // Cloudflare Stream no configurado todavía — se omite en vez de romper la lista completa.
      }
    }).filter(Boolean);

    res.json({ recordings: withUrls });
  } catch (err) {
    console.error('Error listando grabaciones Elite:', err.message);
    res.status(500).json({ error: 'No se pudieron cargar las grabaciones. Intenta de nuevo.' });
  }
});

// Solo lectura: para que el catálogo del curso base sepa si mostrar la
// tarjeta Elite como "bloqueada" o "activa". Usa la sesión de cuenta
// normal (la misma del curso base), NO abre la zona Elite — eso sigue
// exigiendo la segunda verificación en /premium/verify, exactamente
// igual que siempre. Esto solo consulta el estado real en la base de
// datos, nunca decide nada por sí mismo.
router.get('/premium/status', requireAccount, async (req, res) => {
  try {
    const codes = await findAccessCodesByUsername(req.account.username);
    const now = Math.floor(Date.now() / 1000);
    const activeElite = codes.find((c) => c.courseId === 'elite' && c.expiresAt > now);
    res.json({ active: !!activeElite, expiresAt: activeElite ? activeElite.expiresAt : null });
  } catch (err) {
    console.error('Error en /premium/status:', err.message);
    res.status(500).json({ error: 'No se pudo consultar el estado.' });
  }
});

export default router;
