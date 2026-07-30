import crypto from 'crypto';

const COURSE_ACCESS_DAYS = {
  forex: 21,
  opciones: 21
};

export function generateAccessCode(prefix) {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MOVE-${prefix.toUpperCase()}-${random}`;
}

export function accessDurationSeconds(courseId) {
  const days = COURSE_ACCESS_DAYS[courseId] || 21;
  return days * 24 * 60 * 60;
}
