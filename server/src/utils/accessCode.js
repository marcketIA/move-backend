import crypto from 'crypto';

const COURSE_ACCESS_DAYS = {
  weekend: 21, // Cupo al seminario en vivo de sábado y domingo ($70 preventa / $100 normal).
  forex: 21,   // Se conserva por compatibilidad con códigos viejos ya emitidos.
  opciones: 21,
  elite: 21 // Plantillas + en vivo + grabaciones — mismo criterio de 21 días.
};

export function generateAccessCode(prefix) {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MOVE-${prefix.toUpperCase()}-${random}`;
}

export function accessDurationSeconds(courseId) {
  const days = COURSE_ACCESS_DAYS[courseId] || 21;
  return days * 24 * 60 * 60;
}
