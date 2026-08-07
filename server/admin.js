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
import { allAccessCodes, saveEliteSession } from '../db.js';

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

export default router;
