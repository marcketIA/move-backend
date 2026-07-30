import jwt from 'jsonwebtoken';

// Complemento de requireSession: aquí es al revés — SOLO acepta tokens de
// cuenta (type: 'account'), nunca un token de curso. Se usa para acciones
// de cuenta como vincular un código de pago a tu perfil. Un token de curso
// no debería poder hacer esto tampoco, aunque el riesgo es menor.
export function requireAccount(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Inicia sesión para continuar.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    if (decoded.type !== 'account') {
      return res.status(403).json({ error: 'Esta acción requiere una sesión de cuenta.' });
    }
    req.account = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesión inválida o expirada. Inicia sesión de nuevo.' });
  }
}
