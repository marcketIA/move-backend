import jwt from 'jsonwebtoken';

function decodePrivateKey(value) {
  const normalized = value.replace(/\\n/g, '\n').trim();

  // Cloudflare entrega `pem` codificado en base64. Permitimos también un PEM
  // normal para que la configuración sea cómoda en proveedores de hosting.
  if (normalized.includes('BEGIN')) return normalized;
  return Buffer.from(normalized, 'base64').toString('utf8');
}

/**
 * Genera un token de Cloudflare Stream para un ÚNICO video. El token ocupa el
 * lugar del UID en la URL de reproducción; no se expone ninguna clave privada.
 */
export function buildSignedVideoUrl(videoUid, ttlSeconds) {
  const keyId = process.env.CF_STREAM_KEY_ID;
  const privateKey = process.env.CF_STREAM_PRIVATE_KEY;
  const customerCode = process.env.CF_STREAM_CUSTOMER_CODE;

  if (!keyId || !privateKey || !customerCode || keyId.includes('reemplaza')) {
    const error = new Error('Cloudflare Stream no está configurado todavía.');
    error.code = 'STREAM_NOT_CONFIGURED';
    throw error;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + ttlSeconds;
  const token = jwt.sign(
    {
      // `sub` es el UID que Cloudflare autoriza. Sin él, el token no queda
      // ligado al video solicitado.
      sub: videoUid,
      kid: keyId,
      exp: expiresAt,
      nbf: now - 5,
      // No habilitamos descargas: solo reproducción temporal.
      downloadable: false
    },
    decodePrivateKey(privateKey),
    { algorithm: 'RS256', header: { kid: keyId }, noTimestamp: true }
  );

  const base = `https://customer-${customerCode}.cloudflarestream.com/${token}`;
  return {
    url: `${base}/iframe`,
    manifestUrl: `${base}/manifest/video.m3u8`,
    expiresAt,
    configured: true
  };
}
