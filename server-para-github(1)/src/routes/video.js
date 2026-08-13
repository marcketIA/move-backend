import { Router } from 'express';
import { requireSession } from '../middleware/requireSession.js';
import { findAccessCode } from '../db.js';
import { buildSignedVideoUrl } from '../utils/signedUrl.js';

const router = Router();

function readJsonSetting(name) {
  try {
    return JSON.parse(process.env[name] || '{}');
  } catch {
    return null;
  }
}

router.get('/video/:moduleId', requireSession, async (req, res) => {
  const { moduleId } = req.params;
  const moduleMap = readJsonSetting('CF_STREAM_MODULE_MAP');
  const courseModules = readJsonSetting('COURSE_MODULE_MAP');

  if (!moduleMap || !courseModules) {
    return res.status(503).json({ error: 'La configuración de acceso a módulos no es válida.' });
  }

  const videoUid = moduleMap[moduleId];
  if (!videoUid) {
    return res.status(404).json({ error: 'Este módulo no tiene un video asignado.' });
  }

  try {
    // El JWT es una sesión, no la fuente de verdad: consultamos de nuevo la
    // matrícula para que una expiración, reembolso o revocación se aplique al
    // siguiente intento de ver una clase.
    const enrollment = await findAccessCode(req.session.code);
    const now = Math.floor(Date.now() / 1000);
    if (!enrollment || enrollment.courseId !== req.session.courseId || enrollment.expiresAt <= now) {
      return res.status(403).json({ error: 'Tu acceso a este curso ya no está activo.' });
    }

    const permittedModules = courseModules[enrollment.courseId];
    if (!Array.isArray(permittedModules) || !permittedModules.includes(moduleId)) {
      return res.status(403).json({ error: 'Este módulo no está incluido en tu curso.' });
    }

    const ttl = Math.min(Math.max(parseInt(process.env.VIDEO_LINK_TTL_SECONDS, 10) || 900, 60), 3600);
    const signed = buildSignedVideoUrl(videoUid, ttl);
    return res.json({ ...signed, moduleId });
  } catch (err) {
    if (err.code === 'STREAM_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'El sistema de video todavía no está configurado.' });
    }
    console.error('Error preparando video:', err.message);
    return res.status(500).json({ error: 'No se pudo preparar el video. Intenta de nuevo.' });
  }
});

export default router;
