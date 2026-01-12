ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_time TEXT NOT NULL DEFAULT '08:00';
ALTER TABLE users ALTER COLUMN reminder_time SET DEFAULT '08:00';
UPDATE users SET reminder_time = '08:00' WHERE reminder_time IS NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS evening_time TEXT NOT NULL DEFAULT '20:00';
ALTER TABLE users ALTER COLUMN evening_time SET DEFAULT '20:00';
UPDATE users SET evening_time = '20:00' WHERE evening_time IS NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_time TEXT NOT NULL DEFAULT '19:00';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  intention_id INTEGER REFERENCES intentions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, type, date, intention_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

ALTER TABLE intentions ADD COLUMN IF NOT EXISTS ciphertext_b64 TEXT;
ALTER TABLE intentions ADD COLUMN IF NOT EXISTS iv_b64 TEXT;
ALTER TABLE intentions ADD COLUMN IF NOT EXISTS auth_tag_b64 TEXT;
ALTER TABLE intentions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS reflections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  ciphertext_b64 TEXT NOT NULL,
  iv_b64 TEXT NOT NULL,
  auth_tag_b64 TEXT NOT NULL,
  photo_file_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intentions_user_id ON intentions(user_id);
CREATE INDEX IF NOT EXISTS idx_intention_dates_date ON intention_dates(date);
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'notifications'
      AND column_name = 'date'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE notifications
      ALTER COLUMN date TYPE TEXT USING date::text;
  END IF;
END $$;
