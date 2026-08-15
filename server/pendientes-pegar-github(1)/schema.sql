-- schema.sql — estructura real en Postgres, reemplaza a data/db.json.
-- Correr esto una vez contra tu base de datos (Supabase/Neon/Railway,
-- todos tienen un editor SQL en su panel donde pegar esto directo).

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS access_codes (
  id                SERIAL PRIMARY KEY,
  code              TEXT NOT NULL UNIQUE,
  course_id         TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  username          TEXT REFERENCES users(username),
  stripe_session_id TEXT UNIQUE,
  purchased_at      BIGINT NOT NULL,
  expires_at        BIGINT NOT NULL,
  tier              TEXT
);

-- Migración segura para bases de datos que ya existían antes del catálogo
-- de 5 productos Elite (agosto 2026) — no borra ni toca ninguna fila.
-- Se puede correr las veces que sea, no falla si la columna ya existe.
ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS tier TEXT;

-- Dispositivos conocidos por cuenta — ver device-list.js. El alumno los ve
-- y los puede cerrar manualmente; el sistema nunca cierra sesión solo por
-- un cambio de IP, a propósito (ver la explicación en el chat).
CREATE TABLE IF NOT EXISTS devices (
  id           SERIAL PRIMARY KEY,
  username     TEXT NOT NULL REFERENCES users(username),
  device_label TEXT NOT NULL,
  user_agent   TEXT,
  first_seen   BIGINT NOT NULL,
  last_seen    BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_access_codes_username ON access_codes(username);
CREATE INDEX IF NOT EXISTS idx_devices_username ON devices(username);

-- ---- Zona Elite: en vivo por Zoom y grabaciones (ver routes/premium.js) ----
-- Cada fila es UNA sesión (un día de Forex o de Opciones). Mientras no
-- tenga recording_uid, es la sesión "de hoy" en vivo (usa zoom_link).
-- Cuando ya se subió la grabación a Cloudflare Stream, se le pone el UID
-- y queda disponible como replay durante 14 días desde session_date.
CREATE TABLE IF NOT EXISTS elite_sessions (
  id             SERIAL PRIMARY KEY,
  course_type    TEXT NOT NULL,           -- 'forex' u 'opciones'
  session_date   BIGINT NOT NULL,         -- fecha/hora programada (epoch)
  zoom_link      TEXT,                    -- link de Zoom para el en vivo
  recording_uid  TEXT,                    -- UID en Cloudflare Stream, una vez grabado
  created_at     BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_elite_sessions_date ON elite_sessions(session_date);

-- ---- Expediente de evidencia (compras, consentimientos, actividad) ----
-- Capa completamente independiente. No modifica access_codes, users ni
-- devices — solo las complementa, guardando la prueba de que cada
-- comprador supo exactamente qué compraba, aceptó la política, y usó
-- el contenido. Pensado sobre todo para defender la Plantilla Elite
-- ($700-1000) ante una disputa de banco/Stripe/PayPal.
CREATE TABLE IF NOT EXISTS compliance_purchases (
  id                          TEXT PRIMARY KEY,
  email                       TEXT NOT NULL,
  username                    TEXT,
  product_code                TEXT NOT NULL,
  product_name                TEXT NOT NULL,
  amount_cents                INTEGER NOT NULL,
  currency                    TEXT NOT NULL DEFAULT 'USD',
  stripe_checkout_session_id  TEXT UNIQUE,
  stripe_payment_intent_id    TEXT,
  status                      TEXT NOT NULL DEFAULT 'PENDING',
  purchase_ip                 TEXT,
  purchase_user_agent         TEXT,
  purchased_at                BIGINT,
  created_at                  BIGINT NOT NULL,
  updated_at                  BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_compliance_purchases_email ON compliance_purchases(email);
CREATE INDEX IF NOT EXISTS idx_compliance_purchases_status ON compliance_purchases(status);

CREATE TABLE IF NOT EXISTS compliance_consents (
  id             SERIAL PRIMARY KEY,
  purchase_id    TEXT NOT NULL REFERENCES compliance_purchases(id),
  consent_type   TEXT NOT NULL,
  terms_version  TEXT NOT NULL,
  terms_title    TEXT NOT NULL,
  terms_text     TEXT NOT NULL,
  terms_sha256   TEXT NOT NULL,
  accepted       BOOLEAN NOT NULL,
  accepted_at    BIGINT NOT NULL,
  ip_address     TEXT,
  user_agent     TEXT
);

CREATE INDEX IF NOT EXISTS idx_compliance_consents_purchase ON compliance_consents(purchase_id);

CREATE TABLE IF NOT EXISTS compliance_access_events (
  id            SERIAL PRIMARY KEY,
  purchase_id   TEXT REFERENCES compliance_purchases(id),
  email         TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address    TEXT,
  user_agent    TEXT,
  occurred_at   BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_compliance_access_purchase ON compliance_access_events(purchase_id);
CREATE INDEX IF NOT EXISTS idx_compliance_access_email ON compliance_access_events(email);

CREATE TABLE IF NOT EXISTS compliance_status_events (
  id           SERIAL PRIMARY KEY,
  purchase_id  TEXT NOT NULL REFERENCES compliance_purchases(id),
  old_status   TEXT,
  new_status   TEXT NOT NULL,
  reason       TEXT,
  occurred_at  BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_compliance_status_purchase ON compliance_status_events(purchase_id);

