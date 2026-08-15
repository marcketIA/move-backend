import crypto from 'crypto';

const COURSE_ACCESS_DAYS = {
  weekend: 21,
  forex: 21,
  opciones: 21,
  elite: 21 // default para el catálogo Elite — "live_only" usa 30 (ver abajo)
};

const ELITE_TIER_ACCESS_DAYS = {
  live_only: 30 // $149.99/mes — un mes completo, no las 3 semanas de las demás.
};

export function generateAccessCode(prefix) {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MOVE-${prefix.toUpperCase()}-${random}`;
}

export function accessDurationSeconds(courseId, tier) {
  if (courseId === 'elite' && tier && ELITE_TIER_ACCESS_DAYS[tier] !== undefined) {
    return ELITE_TIER_ACCESS_DAYS[tier] * 24 * 60 * 60;
  }
  const days = COURSE_ACCESS_DAYS[courseId] || 21;
  return days * 24 * 60 * 60;
}
