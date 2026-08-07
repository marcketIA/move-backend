// routes/account.js — registro y login con usuario/contraseña, con
// limite de intentos y proteccion basica anti-bots. Esto NO toca
// /api/auth/verify, /api/checkout, /api/webhook ni /api/video — son
// endpoints completamente separados.

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { saveUser, findUserByUsername, linkAccessCodeToUser, findAccessCodesByUsername, upsertDevice, listDevicesByUsername, removeDevice, countDevicesByUsername } from '../db.js';
import { requireAccount } from '../middleware/requireAccount.js';
import { labelFromUserAgent } from '../utils/deviceLabel.js';

const MAX_DEVICES = parseInt(process.env.MAX_DEVICES_PER_ACCOUNT, 10) || 2;

const router = Router();
const SALT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---- Límite de intentos ----
// En memoria: suficiente para un solo servidor. Si más adelante corren
// varias instancias detrás de un balanceador, esto debe moverse a Redis
// o similar — en memoria no se comparte entre procesos.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Espera unos minutos e intenta de nuevo.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados registros desde esta conexión. Espera un momento e intenta de nuevo.' }
});

function publicCourseView(record) {
  return {
    code: record.code,
    courseId: record.courseId,
    expiresAt: record.expiresAt,
    active: Math.floor(Date.now() / 1000) < record.expiresAt
  };
}

router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { name, username, password, website } = req.body;

    // Honeypot: campo invisible que un humano nunca llena porque no lo ve,
    // pero un bot que rellena formularios automáticamente sí. Si viene con
    // contenido, tratamos la petición como spam sin decírselo al bot.
    if (website) {
      return res.status(201).json({ token: 'invalid', name: '', courses: [] });
    }

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanName = (name || '').trim();

    if (!cleanName || !cleanUsername || !password) {
      return res.status(400).json({ error: 'Nombre, usuario y contraseña son obligatorios.' });
    }
    if (!EMAIL_RE.test(cleanUsername)) {
      return res.status(400).json({ error: 'Escribe un correo válido (ejemplo: tu@correo.com).' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }
    if (await findUserByUsername(cleanUsername)) {
      return res.status(409).json({ error: 'Ese usuario ya está registrado.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await saveUser({
      name: cleanName,
      username: cleanUsername,
      passwordHash,
      createdAt: Math.floor(Date.now() / 1000)
    });

    const token = jwt.sign(
      { username: cleanUsername, name: cleanName, type: 'account' },
      process.env.SESSION_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({ token, name: cleanName, courses: [] });
  } catch (err) {
    console.error('Error en /register:', err.message);
    res.status(500).json({ error: 'No se pudo crear la cuenta. Intenta de nuevo.' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUsername = (username || '').trim().toLowerCase();

    const user = await findUserByUsername(cleanUsername);
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const match = await bcrypt.compare(password || '', user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const token = jwt.sign(
      { username: user.username, name: user.name, type: 'account' },
      process.env.SESSION_SECRET,
      { expiresIn: '30d' }
    );

    const courses = (await findAccessCodesByUsername(user.username)).map(publicCourseView);

    // Registramos el dispositivo SOLO como información — nunca bloqueamos
    // el login por esto. Si ya tiene MAX_DEVICES dispositivos y este es
    // nuevo, avisamos en la respuesta para que el propio alumno decida
    // desde su cuenta cuál cerrar, en vez de que el sistema decida por él
    // y lo deje afuera sin explicación.
    const userAgent = req.headers['user-agent'] || '';
    const deviceLabel = labelFromUserAgent(userAgent);
    await upsertDevice(user.username, deviceLabel, userAgent);

    const deviceCount = await countDevicesByUsername(user.username);
    const deviceLimitReached = deviceCount > MAX_DEVICES;

    res.json({ token, name: user.name, courses, deviceLimitReached, maxDevices: MAX_DEVICES });
  } catch (err) {
    console.error('Error en /login:', err.message);
    res.status(500).json({ error: 'No se pudo iniciar sesión. Intenta de nuevo.' });
  }
});

router.post('/account/link-code', requireAccount, async (req, res) => {
  const { code } = req.body;
  const cleanCode = (code || '').trim().toUpperCase();

  if (!cleanCode) {
    return res.status(400).json({ error: 'Escribe el código que recibiste al pagar.' });
  }

  try {
    const result = await linkAccessCodeToUser(cleanCode, req.account.username);

    if (!result.ok) {
      if (result.reason === 'not_found') {
        return res.status(404).json({ error: 'Ese código no existe. Verifica que esté bien escrito.' });
      }
      return res.status(409).json({ error: 'Ese código ya está vinculado a otra cuenta.' });
    }

    const courses = (await findAccessCodesByUsername(req.account.username)).map(publicCourseView);
    res.json({ ok: true, courses });
  } catch (err) {
    console.error('Error en /account/link-code:', err.message);
    res.status(500).json({ error: 'No se pudo vincular el código. Intenta de nuevo.' });
  }
});

// GET /api/account/devices — lista los dispositivos conocidos de la
// cuenta, para que el alumno vea dónde tiene sesión activa.
router.get('/account/devices', requireAccount, async (req, res) => {
  try {
    const devices = await listDevicesByUsername(req.account.username);
    res.json({ devices, maxDevices: MAX_DEVICES });
  } catch (err) {
    console.error('Error en /account/devices:', err.message);
    res.status(500).json({ error: 'No se pudo cargar la lista de dispositivos.' });
  }
});

// DELETE /api/account/devices/:id — el alumno cierra manualmente un
// dispositivo desde su lista. Esto NUNCA lo hace el sistema solo — la
// decisión es siempre del alumno, evitando el patrón de "te cerramos la
// sesión automáticamente porque cambiaste de red" que genera más
// problemas de soporte que seguridad real.
router.delete('/account/devices/:id', requireAccount, async (req, res) => {
  try {
    const removed = await removeDevice(req.account.username, parseInt(req.params.id, 10));
    if (!removed) {
      return res.status(404).json({ error: 'Ese dispositivo ya no existe.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Error en /account/devices delete:', err.message);
    res.status(500).json({ error: 'No se pudo cerrar ese dispositivo. Intenta de nuevo.' });
  }
});

export default router;
