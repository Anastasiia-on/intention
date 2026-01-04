CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  first_name TEXT,
  username TEXT,
  reminder_time TEXT NOT NULL DEFAULT '09:00',
  evening_time TEXT NOT NULL DEFAULT '20:30'
);

CREATE TABLE IF NOT EXISTS intentions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL
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
  text TEXT,
  photo_file_id TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  UNIQUE (user_id, type, date)
);
