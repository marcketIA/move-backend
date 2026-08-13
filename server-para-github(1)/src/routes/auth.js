// routes/auth.js — valida el código de acceso contra lo que el webhook
// de Stripe realmente guardó (no una lista fija en el navegador).

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { findAccessCode } from '../db.js';

const router = Router();

router.post('/auth/verify', async (req, res) => {
  const { code } = req.body;
  const clean = (code || '').trim().toUpperCase();

  try {
    const record = await findAccessCode(clean);
    if (!record) {
      return res.status(401).json({ error: 'Código no válido.' });
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds > record.expiresAt) {
      return res.status(401).json({ error: 'Tu acceso expiró. Contáctanos para renovarlo.' });
    }

    // El JWT nunca dura más que el acceso real que pagó el alumno.
    const expiresInSeconds = record.expiresAt - nowSeconds;
    const token = jwt.sign(
      { code: record.code, courseId: record.courseId },
      process.env.SESSION_SECRET,
      { expiresIn: expiresInSeconds }
    );

    res.json({ token, courseId: record.courseId, expiresAt: record.expiresAt });
  } catch (err) {
    console.error('Error en /auth/verify:', err.message);
    res.status(500).json({ error: 'No se pudo verificar tu código. Intenta de nuevo.' });
  }
});

export default router;
