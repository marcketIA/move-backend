// deviceLabel.js — genera una etiqueta legible del dispositivo a partir
// del User-Agent (ej: "Chrome en Windows", "Safari en iPhone"). No usa
// huellas invasivas (canvas fingerprinting, etc.) — solo lo que el
// navegador ya envía en cada petición.

export function labelFromUserAgent(userAgent) {
  if (!userAgent) return 'Dispositivo desconocido';

  var browser = 'Navegador';
  if (/edg/i.test(userAgent)) browser = 'Edge';
  else if (/chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent)) browser = 'Safari';

  var os = 'dispositivo';
  if (/iphone/i.test(userAgent)) os = 'iPhone';
  else if (/ipad/i.test(userAgent)) os = 'iPad';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/mac os/i.test(userAgent)) os = 'Mac';
  else if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/linux/i.test(userAgent)) os = 'Linux';

  return browser + ' en ' + os;
}
