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
    : { rejectUnauthorized: false } // necesario para Supabase/Neon/Railway
});

// Sin este manejador, un error de conexión en un cliente inactivo del pool
// (por ejemplo, la base de datos se reinicia o hay un corte de red)
// tumba TODO el proceso de Node, no solo la petición que lo causó — el
// servidor completo deja de responder aunque el resto del código esté
// bien. Este es el arreglo documentado por la librería `pg` para eso.
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de Postgres:', err.message);
});

// ---- Códigos de acceso ----

export async function saveAccessCode(record) {
  const result = await pool.query(
    `INSERT INTO access_codes (code, course_id, email, phone, username, stripe_session_id, purchased_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [record.code, record.courseId, record.email || null, record.phone || null,
     record.username || null, record.stripeSessionId || null, record.purchasedAt, record.expiresAt]
  );
  return rowToAccessCode(result.rows[0]);
}

export async function findAccessCode(code) {
  const result = await pool.query('SELECT * FROM access_codes WHERE code = $1', [code]);
  return result.rows[0] ? rowToAccessCode(result.rows[0]) : null;
}

// Usada por webhook.js para que un mismo checkout.session de Stripe (que
// puede notificarse más de una vez por reintentos) nunca genere dos
// matrículas — ver la comprobación de idempotencia ahí.
export async function findAccessCodeByStripeSession(stripeSessionId) {
  const result = await pool.query(
    'SELECT * FROM access_codes WHERE stripe_session_id = $1',
    [stripeSessionId]
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
    expiresAt: Number(row.expires_at)
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
