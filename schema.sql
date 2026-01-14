CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  reminder_time TEXT NOT NULL DEFAULT '08:00',
  evening_time TEXT NOT NULL DEFAULT '20:00',
  monthly_time TEXT NOT NULL DEFAULT '19:00',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intentions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ciphertext_b64 TEXT NOT NULL,
  iv_b64 TEXT NOT NULL,
  auth_tag_b64 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intention_dates (
  intention_id INTEGER NOT NULL REFERENCES intentions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  PRIMARY KEY (intention_id, date)
);

CREATE TABLE IF NOT EXISTS reflections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  intention_id INTEGER REFERENCES intentions(id) ON DELETE SET NULL,
  ciphertext_b64 TEXT NOT NULL,
  iv_b64 TEXT NOT NULL,
  auth_tag_b64 TEXT NOT NULL,
  photo_file_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  intention_id INTEGER REFERENCES intentions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, type, date, intention_id)
);

CREATE INDEX IF NOT EXISTS idx_intentions_user_id ON intentions(user_id);
CREATE INDEX IF NOT EXISTS idx_intention_dates_date ON intention_dates(date);
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
