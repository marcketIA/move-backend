// routes/live-weekend.js — los 2 en vivo (sábado y domingo) del curso
// base ($70-100). Es la única forma de acceso que tienen esos dos días;
// después de eso, sin pagar Elite, no vuelven a entrar a nada nuevo.
//
// Archivo nuevo, separado de video.js a propósito: esto no es un módulo
// grabado con UID de Cloudflare, es un link de Zoom en vivo. Reutiliza el
// mismo requireSession (el JWT del curso pagado) para no inventar una
// seguridad paralela — si ya pagaste el curso, tienes acceso a esto.

import { Router } from 'express';
import { requireSession } from '../middleware/requireSession.js';
import { findAccessCode } from '../db.js';

const router = Router();

router.get('/live-weekend', requireSession, async (req, res) => {
  try {
    // Misma verificación de siempre contra la base de datos, no solo el
    // JWT — si el curso expiró o se revocó, esto deja de funcionar al
    // instante, igual que los videos grabados.
    const enrollment = await findAccessCode(req.session.code);
    const now = Math.floor(Date.now() / 1000);
    if (!enrollment || enrollment.courseId !== req.session.courseId || enrollment.expiresAt <= now) {
      return res.status(403).json({ error: 'Tu acceso a este curso ya no está activo.' });
    }

    res.json({
      dia1: {
        label: 'Sábado',
        zoomLink: process.env.ZOOM_LINK_ESCUELA_DIA1 || null,
        schedule: process.env.ESCUELA_SCHEDULE_DIA1 || 'Sábado, hora por confirmar'
      },
      dia2: {
        label: 'Domingo',
        zoomLink: process.env.ZOOM_LINK_ESCUELA_DIA2 || null,
        schedule: process.env.ESCUELA_SCHEDULE_DIA2 || 'Domingo, hora por confirmar'
      }
    });
  } catch (err) {
    console.error('Error en /live-weekend:', err.message);
    res.status(500).json({ error: 'No se pudo cargar el en vivo. Intenta de nuevo.' });
  }
});

export default router;
