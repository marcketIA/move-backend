import jwt from 'jsonwebtoken';

// ⚠️ ÚNICA EXCEPCIÓN a "no tocar middleware", y está documentada aquí a
// propósito: al agregar login de cuenta (usuario/contraseña) en account.js,
// se volvió posible que cualquiera obtenga GRATIS un JWT firmado con la
// misma SESSION_SECRET que usa el JWT de curso pagado (/api/auth/verify).
// Sin este chequeo, ese JWT de cuenta gratuita pasaría este middleware y
// entregaría una URL de video real sin haber pagado nada — exactamente lo
// que este sistema existe para evitar. Este chequeo NO cambia cómo
// auth.js emite o valida el código de acceso; solo exige que el token que
// llega aquí tenga la forma de un JWT de curso (con `code`), no de cuenta.
export function requireSession(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Falta la sesión. Inicia sesión de nuevo.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);

    if (!decoded.code || decoded.type === 'account') {
      return res.status(403).json({ error: 'Este token no da acceso a video. Se requiere una ruta activa y pagada.' });
    }

    req.session = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesión inválida o expirada. Inicia sesión de nuevo.' });
  }
}
