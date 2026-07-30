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
  expires_at        BIGINT NOT NULL
);

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
