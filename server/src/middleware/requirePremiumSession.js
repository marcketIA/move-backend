import jwt from 'jsonwebtoken';

// Middleware NUEVO, exclusivo para la zona Elite ($1000). Sigue el mismo
// patrón de requireSession.js/requireAccount.js: cada tipo de acceso tiene
// su propio "type" dentro del JWT, así un token de cuenta gratuita o de
// curso base nunca puede colarse aquí, aunque esté firmado con la misma
// SESSION_SECRET.
export function requirePremiumSession(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Falta la verificación Elite. Verifica tu acceso de nuevo.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);

    if (decoded.type !== 'premium') {
      return res.status(403).json({ error: 'Este token no da acceso Elite.' });
    }

    req.premium = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Verificación Elite expirada. Verifica tu acceso de nuevo.' });
  }
}
