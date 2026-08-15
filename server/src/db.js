// db.js — Postgres real (Supabase/Neon/Railway, cualquiera sirve).
// Reemplaza al archivo data/db.json que usábamos para arrancar rápido.
// Las funciones exportadas tienen EXACTAMENTE los mismos nombres y forma
// de antes — solo que ahora son async, porque una consulta a una base de
// datos real no es instantánea. Las rutas que las llaman ya tienen sus
// `await` puestos.

import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de Postgres:', err.message);
});

// ---- Códigos de acceso ----

export async function saveAccessCode(record) {
  const result = await pool.query(
    `INSERT INTO access_codes (code, course_id, email, phone, username, stripe_session_id, purchased_at, expires_at, tier)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [record.code, record.courseId, record.email || null, record.phone || null,
     record.username || null, record.stripeSessionId || null, record.purchasedAt, record.expiresAt,
     record.tier || null]
  );
  return rowToAccessCode(result.rows[0]);
}

export async function findAccessCode(code) {
  const result = await pool.query('SELECT * FROM access_codes WHERE code = $1', [code]);
  return result.rows[0] ? rowToAccessCode(result.rows[0]) : null;
}

export async function findAccessCodeByStripeSession(stripeSessionId) {
  const result = await pool.query(
    'SELECT * FROM access_codes WHERE stripe_session_id = $1',
    [stripeSessionId]
  );
  return result.rows[0] ? rowToAccessCode(result.rows[0]) : null;
}

export async function revokeAccessByStripeSession(stripeSessionId) {
  const now = Math.floor(Date.now() / 1000);
  const result = await pool.query(
    'UPDATE access_codes SET expires_at = $1 WHERE stripe_session_id = $2 RETURNING *',
    [now, stripeSessionId]
  );
  return result.rows[0] ? rowToAccessCode(result.rows[0]) : null;
}

export async function allAccessCodes() {
  const result = await pool.query('SELECT * FROM access_codes ORDER BY purchased_at DESC');
  return result.rows.map(rowToAccessCode);
}

function rowToAccessCode(row) {
  return {
    code: row.code,
    courseId: row.course_id,
    email: row.email,
    phone: row.phone,
    username: row.username,
    stripeSessionId: row.stripe_session_id,
    purchasedAt: Number(row.purchased_at),
    expiresAt: Number(row.expires_at),
    tier: row.tier
  };
}

// ---- Usuarios ----

export async function saveUser(record) {
  const result = await pool.query(
    `INSERT INTO users (name, username, password_hash, created_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [record.name, record.username, record.passwordHash, record.createdAt]
  );
  return rowToUser(result.rows[0]);
}

export async function findUserByUsername(username) {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] ? rowToUser(result.rows[0]) : null;
}

function rowToUser(row) {
  return {
    name: row.name,
    username: row.username,
    passwordHash: row.password_hash,
    createdAt: Number(row.created_at)
  };
}

// ---- Vínculo cuenta ↔ código de acceso ----

export async function linkAccessCodeToUser(code, username) {
  const existing = await pool.query('SELECT * FROM access_codes WHERE code = $1', [code]);
  if (!existing.rows[0]) return { ok: false, reason: 'not_found' };

  const row = existing.rows[0];
  if (row.username && row.username !== username) {
    return { ok: false, reason: 'already_linked_to_other' };
  }

  const updated = await pool.query(
    'UPDATE access_codes SET username = $1 WHERE code = $2 RETURNING *',
    [username, code]
  );
  return { ok: true, record: rowToAccessCode(updated.rows[0]) };
}

export async function findAccessCodesByUsername(username) {
  const result = await pool.query('SELECT * FROM access_codes WHERE username = $1', [username]);
  return result.rows.map(rowToAccessCode);
}

// ---- Dispositivos conocidos (ver device-list.js) ----

export async function upsertDevice(username, deviceLabel, userAgent) {
  const now = Math.floor(Date.now() / 1000);
  const existing = await pool.query(
    'SELECT * FROM devices WHERE username = $1 AND device_label = $2',
    [username, deviceLabel]
  );

  if (existing.rows[0]) {
    const updated = await pool.query(
      'UPDATE devices SET last_seen = $1 WHERE id = $2 RETURNING *',
      [now, existing.rows[0].id]
    );
    return rowToDevice(updated.rows[0]);
  }

  const inserted = await pool.query(
    `INSERT INTO devices (username, device_label, user_agent, first_seen, last_seen)
     VALUES ($1, $2, $3, $4, $4) RETURNING *`,
    [username, deviceLabel, userAgent || null, now]
  );
  return rowToDevice(inserted.rows[0]);
}

export async function listDevicesByUsername(username) {
  const result = await pool.query(
    'SELECT * FROM devices WHERE username = $1 ORDER BY last_seen DESC',
    [username]
  );
  return result.rows.map(rowToDevice);
}

export async function removeDevice(username, deviceId) {
  const result = await pool.query(
    'DELETE FROM devices WHERE username = $1 AND id = $2 RETURNING id',
    [username, deviceId]
  );
  return result.rows.length > 0;
}

export async function countDevicesByUsername(username) {
  const result = await pool.query(
    'SELECT COUNT(*) FROM devices WHERE username = $1',
    [username]
  );
  return Number(result.rows[0].count);
}

// ---- Zona Elite: en vivo por Zoom y grabaciones ----

export async function saveEliteSession(record) {
  const result = await pool.query(
    `INSERT INTO elite_sessions (course_type, session_date, zoom_link, recording_uid, created_at)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [record.courseType, record.sessionDate, record.zoomLink || null, record.recordingUid || null, record.createdAt]
  );
  return rowToEliteSession(result.rows[0]);
}

export async function findTodaysEliteSession(courseType, dayStart, dayEnd) {
  const result = await pool.query(
    `SELECT * FROM elite_sessions
     WHERE course_type = $1 AND session_date >= $2 AND session_date < $3
     ORDER BY session_date DESC LIMIT 1`,
    [courseType, dayStart, dayEnd]
  );
  return result.rows[0] ? rowToEliteSession(result.rows[0]) : null;
}

export async function listActiveEliteRecordings(sinceEpoch) {
  const result = await pool.query(
    `SELECT * FROM elite_sessions
     WHERE recording_uid IS NOT NULL AND session_date >= $1
     ORDER BY session_date DESC`,
    [sinceEpoch]
  );
  return result.rows.map(rowToEliteSession);
}

export async function attachRecordingToSession(sessionId, recordingUid) {
  const result = await pool.query(
    'UPDATE elite_sessions SET recording_uid = $1 WHERE id = $2 RETURNING *',
    [recordingUid, sessionId]
  );
  return result.rows[0] ? rowToEliteSession(result.rows[0]) : null;
}

function rowToEliteSession(row) {
  return {
    id: row.id,
    courseType: row.course_type,
    sessionDate: Number(row.session_date),
    zoomLink: row.zoom_link,
    recordingUid: row.recording_uid,
    createdAt: Number(row.created_at)
  };
}

function rowToDevice(row) {
  return {
    id: row.id,
    username: row.username,
    deviceLabel: row.device_label,
    userAgent: row.user_agent,
    firstSeen: Number(row.first_seen),
    lastSeen: Number(row.last_seen)
  };
}

// ---- Expediente de evidencia (compras, consentimientos, actividad) ----

export async function createCompliancePurchase(record) {
  const now = Math.floor(Date.now() / 1000);
  const result = await pool.query(
    `INSERT INTO compliance_purchases
       (id, email, username, product_code, product_name, amount_cents, currency,
        status, purchase_ip, purchase_user_agent, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDING',$8,$9,$10,$10) RETURNING *`,
    [record.id, record.email, record.username || null, record.productCode, record.productName,
      record.amountCents, record.currency || 'USD', record.purchaseIp || null,
      record.purchaseUserAgent || null, now]
  );
  return rowToCompliancePurchase(result.rows[0]);
}

export async function saveComplianceConsent(record) {
  const now = Math.floor(Date.now() / 1000);
  await pool.query(
    `INSERT INTO compliance_consents
       (purchase_id, consent_type, terms_version, terms_title, terms_text,
        terms_sha256, accepted, accepted_at, ip_address, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [record.purchaseId, record.consentType, record.termsVersion, record.termsTitle,
      record.termsText, record.termsSha256, record.accepted, now,
      record.ipAddress || null, record.userAgent || null]
  );
}

export async function attachStripeIdsToPurchase(purchaseId, { stripeCheckoutSessionId, stripePaymentIntentId }) {
  const now = Math.floor(Date.now() / 1000);
  await pool.query(
    `UPDATE compliance_purchases
     SET stripe_checkout_session_id = $1, stripe_payment_intent_id = $2, updated_at = $3
     WHERE id = $4`,
    [stripeCheckoutSessionId || null, stripePaymentIntentId || null, now, purchaseId]
  );
}

export async function setCompliancePurchaseStatus(purchaseId, newStatus, reason) {
  const now = Math.floor(Date.now() / 1000);
  const current = await pool.query('SELECT status FROM compliance_purchases WHERE id = $1', [purchaseId]);
  const oldStatus = current.rows[0]?.status || null;

  await pool.query(
    `UPDATE compliance_purchases SET status = $1, purchased_at = COALESCE(purchased_at, $2), updated_at = $2 WHERE id = $3`,
    [newStatus, now, purchaseId]
  );
  await pool.query(
    `INSERT INTO compliance_status_events (purchase_id, old_status, new_status, reason, occurred_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [purchaseId, oldStatus, newStatus, reason || null, now]
  );
}

export async function findCompliancePurchaseByStripeSession(stripeCheckoutSessionId) {
  const result = await pool.query(
    'SELECT * FROM compliance_purchases WHERE stripe_checkout_session_id = $1',
    [stripeCheckoutSessionId]
  );
  return result.rows[0] ? rowToCompliancePurchase(result.rows[0]) : null;
}

export async function findCompliancePurchaseByPaymentIntent(paymentIntentId) {
  const result = await pool.query(
    'SELECT * FROM compliance_purchases WHERE stripe_payment_intent_id = $1',
    [paymentIntentId]
  );
  return result.rows[0] ? rowToCompliancePurchase(result.rows[0]) : null;
}

export async function findCompliancePurchaseById(purchaseId) {
  const result = await pool.query('SELECT * FROM compliance_purchases WHERE id = $1', [purchaseId]);
  return result.rows[0] ? rowToCompliancePurchase(result.rows[0]) : null;
}

export async function findLatestPurchaseByEmail(email, productCode) {
  const result = await pool.query(
    `SELECT * FROM compliance_purchases WHERE email = $1 AND product_code = $2
     ORDER BY created_at DESC LIMIT 1`,
    [email, productCode]
  );
  return result.rows[0] ? rowToCompliancePurchase(result.rows[0]) : null;
}

export async function searchCompliancePurchasesByEmail(email) {
  const result = await pool.query(
    `SELECT * FROM compliance_purchases WHERE email ILIKE $1 ORDER BY created_at DESC`,
    [`%${email}%`]
  );
  return result.rows.map(rowToCompliancePurchase);
}

export async function logComplianceEvent(record) {
  const now = Math.floor(Date.now() / 1000);
  await pool.query(
    `INSERT INTO compliance_access_events
       (purchase_id, email, event_type, resource_type, resource_id, metadata, ip_address, user_agent, occurred_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [record.purchaseId || null, record.email, record.eventType, record.resourceType || null,
      record.resourceId || null, JSON.stringify(record.metadata || {}),
      record.ipAddress || null, record.userAgent || null, now]
  );
}

export async function getComplianceConsents(purchaseId) {
  const result = await pool.query(
    'SELECT * FROM compliance_consents WHERE purchase_id = $1 ORDER BY accepted_at ASC',
    [purchaseId]
  );
  return result.rows.map(rowToComplianceConsent);
}

export async function getComplianceActivitySummary(purchaseId) {
  const result = await pool.query(
    `SELECT event_type, COUNT(*) AS count FROM compliance_access_events
     WHERE purchase_id = $1 GROUP BY event_type`,
    [purchaseId]
  );
  const summary = {};
  result.rows.forEach((r) => { summary[r.event_type] = Number(r.count); });
  return summary;
}

function rowToCompliancePurchase(row) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    productCode: row.product_code,
    productName: row.product_name,
    amountCents: row.amount_cents,
    currency: row.currency,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    status: row.status,
    purchaseIp: row.purchase_ip,
    purchaseUserAgent: row.purchase_user_agent,
    purchasedAt: row.purchased_at ? Number(row.purchased_at) : null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at)
  };
}

function rowToComplianceConsent(row) {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    consentType: row.consent_type,
    termsVersion: row.terms_version,
    termsTitle: row.terms_title,
    termsSha256: row.terms_sha256,
    accepted: row.accepted,
    acceptedAt: Number(row.accepted_at),
    ipAddress: row.ip_address,
    userAgent: row.user_agent
  };
}
