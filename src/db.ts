import { Pool } from "pg";
import { config } from "./config";
import {
  Category,
  EncryptedPayload,
  Feedback,
  Intention,
  IntentionConfig,
  Language,
  Reflection,
  User,
} from "./types";

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false },
});

export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  const result = await pool.query<User>(
    `SELECT id, telegram_id, language, reminder_time, evening_time, monthly_time, created_at FROM users WHERE telegram_id = $1`,
    [telegramId]
  );
  return result.rows[0] || null;
}

export async function upsertUserLanguage(
  telegramId: number,
  language: Language
): Promise<User> {
  const result = await pool.query<User>(
    `
    INSERT INTO users (telegram_id, language)
    VALUES ($1, $2)
    ON CONFLICT (telegram_id)
    DO UPDATE SET language = EXCLUDED.language
    RETURNING id, telegram_id, language, reminder_time, evening_time, monthly_time, created_at
    `,
    [telegramId, language]
  );
  return result.rows[0];
}

export async function getUsersByReminderTime(time: string): Promise<User[]> {
  const result = await pool.query<User>(
    `
    SELECT id, telegram_id, language, reminder_time, evening_time, monthly_time, created_at
    FROM users
    WHERE reminder_time = $1
    `,
    [time]
  );
  return result.rows;
}

export async function getUsersByEveningTime(time: string): Promise<User[]> {
  const result = await pool.query<User>(
    `
    SELECT id, telegram_id, language, reminder_time, evening_time, monthly_time, created_at
    FROM users
    WHERE evening_time = $1
    `,
    [time]
  );
  return result.rows;
}

export async function getUsersByMonthlyTime(time: string): Promise<User[]> {
  const result = await pool.query<User>(
    `
    SELECT id, telegram_id, language, reminder_time, evening_time, monthly_time, created_at
    FROM users
    WHERE monthly_time = $1
    `,
    [time]
  );
  return result.rows;
}

export async function listReflectionsForUser(userId: number): Promise<Reflection[]> {
  const result = await pool.query<Reflection>(
    `
    SELECT id, user_id, date, ciphertext_b64, iv_b64, auth_tag_b64, photo_file_ids, created_at
    FROM reflections
    WHERE user_id = $1
    ORDER BY date DESC, id DESC
    `,
    [userId]
  );
  return result.rows;
}

export async function addCategory(userId: number, name: string): Promise<Category> {
  const result = await pool.query<Category>(
    `
    INSERT INTO categories (user_id, name)
    VALUES ($1, $2)
    ON CONFLICT (user_id, name)
    DO UPDATE SET name = EXCLUDED.name
    RETURNING id, user_id, name, created_at
    `,
    [userId, name]
  );
  return result.rows[0];
}

export async function listCategories(userId: number): Promise<Category[]> {
  const result = await pool.query<Category>(
    `SELECT id, user_id, name, created_at FROM categories WHERE user_id = $1 ORDER BY name`,
    [userId]
  );
  return result.rows;
}

export async function addIntention(
  userId: number,
  categoryId: number | null,
  encrypted: EncryptedPayload
): Promise<Intention> {
  const result = await pool.query<Intention>(
    `
    INSERT INTO intentions (user_id, category_id, ciphertext_b64, iv_b64, auth_tag_b64)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, category_id, ciphertext_b64, iv_b64, auth_tag_b64, created_at
    `,
    [userId, categoryId, encrypted.ciphertext_b64, encrypted.iv_b64, encrypted.auth_tag_b64]
  );
  return result.rows[0];
}

export async function updateIntentionText(
  userId: number,
  intentionId: number,
  encrypted: EncryptedPayload
): Promise<void> {
  await pool.query(
    `
    UPDATE intentions
    SET ciphertext_b64 = $1, iv_b64 = $2, auth_tag_b64 = $3
    WHERE id = $4 AND user_id = $5
    `,
    [encrypted.ciphertext_b64, encrypted.iv_b64, encrypted.auth_tag_b64, intentionId, userId]
  );
}

export async function setIntentionCategory(
  userId: number,
  intentionId: number,
  categoryId: number | null
): Promise<void> {
  await pool.query(
    `UPDATE intentions SET category_id = $1 WHERE id = $2 AND user_id = $3`,
    [categoryId, intentionId, userId]
  );
}

export async function setIntentionDate(
  userId: number,
  intentionId: number,
  date: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ownership = await client.query(
      `SELECT 1 FROM intentions WHERE id = $1 AND user_id = $2`,
      [intentionId, userId]
    );
    if (ownership.rowCount === 0) {
      await client.query("ROLLBACK");
      return;
    }
    await client.query(`DELETE FROM intention_dates WHERE intention_id = $1`, [intentionId]);
    await client.query(
      `INSERT INTO intention_dates (intention_id, date) VALUES ($1, $2)`,
      [intentionId, date]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listIntentionsForUser(
  userId: number
): Promise<Array<Intention & { date: string | null }>> {
  const result = await pool.query<Intention & { date: string | null }>(
    `
    SELECT
      i.id,
      i.user_id,
      i.category_id,
      i.ciphertext_b64,
      i.iv_b64,
      i.auth_tag_b64,
      i.created_at,
      MIN(d.date) AS date
    FROM intentions i
    LEFT JOIN intention_dates d ON d.intention_id = i.id
    WHERE i.user_id = $1
    GROUP BY i.id
    ORDER BY i.id DESC
    `,
    [userId]
  );
  return result.rows;
}

export async function listIntentionsByCategory(
  userId: number,
  categoryId: number
): Promise<Array<Intention & { date: string | null }>> {
  const result = await pool.query<Intention & { date: string | null }>(
    `
    SELECT
      i.id,
      i.user_id,
      i.category_id,
      i.ciphertext_b64,
      i.iv_b64,
      i.auth_tag_b64,
      i.created_at,
      MIN(d.date) AS date
    FROM intentions i
    LEFT JOIN intention_dates d ON d.intention_id = i.id
    WHERE i.user_id = $1 AND i.category_id = $2
    GROUP BY i.id
    ORDER BY i.id DESC
    `,
    [userId, categoryId]
  );
  return result.rows;
}

export async function listIntentionsByDate(
  userId: number,
  date: string
): Promise<Intention[]> {
  const result = await pool.query<Intention>(
    `
    SELECT i.id, i.user_id, i.category_id, i.ciphertext_b64, i.iv_b64, i.auth_tag_b64, i.created_at
    FROM intentions i
    JOIN intention_dates d ON d.intention_id = i.id
    WHERE i.user_id = $1 AND d.date = $2
    ORDER BY i.id DESC
    `,
    [userId, date]
  );
  return result.rows;
}

export async function getIntentionConfig(
  userId: number,
  intentionId: number
): Promise<IntentionConfig | null> {
  const result = await pool.query<IntentionConfig>(
    `
    SELECT
      i.id,
      i.user_id,
      i.category_id,
      i.ciphertext_b64,
      i.iv_b64,
      i.auth_tag_b64,
      i.created_at,
      MIN(d.date) AS date,
      c.name AS category_name
    FROM intentions i
    LEFT JOIN intention_dates d ON d.intention_id = i.id
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE i.user_id = $1 AND i.id = $2
    GROUP BY i.id, c.name
    `,
    [userId, intentionId]
  );
  return result.rows[0] || null;
}

export async function listIntentionsInRange(
  userId: number,
  start: string,
  end: string
): Promise<Array<Intention & { dates: string[] }>> {
  const result = await pool.query<Intention & { dates: string[] | null }>(
    `
    SELECT
      i.id,
      i.user_id,
      i.category_id,
      i.ciphertext_b64,
      i.iv_b64,
      i.auth_tag_b64,
      i.created_at,
      ARRAY_REMOVE(ARRAY_AGG(d.date ORDER BY d.date), NULL) AS dates
    FROM intentions i
    JOIN intention_dates d ON d.intention_id = i.id
    WHERE i.user_id = $1 AND d.date BETWEEN $2 AND $3
    GROUP BY i.id
    ORDER BY MIN(d.date), i.id
    `,
    [userId, start, end]
  );
  return result.rows.map((row) => ({ ...row, dates: row.dates || [] }));
}

export async function deleteIntention(userId: number, intentionId: number): Promise<void> {
  await pool.query(`DELETE FROM intentions WHERE id = $1 AND user_id = $2`, [intentionId, userId]);
}

export async function addFeedback(
  userId: number,
  date: string,
  encrypted: EncryptedPayload,
  photoFileId: string | null,
  intentionId?: number | null
): Promise<Feedback> {
  const result = await pool.query<Feedback>(
    `
    INSERT INTO feedback (user_id, intention_id, date, ciphertext_b64, iv_b64, auth_tag_b64, photo_file_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, user_id, intention_id, date, ciphertext_b64, iv_b64, auth_tag_b64, photo_file_id, created_at
    `,
    [
      userId,
      intentionId ?? null,
      date,
      encrypted.ciphertext_b64,
      encrypted.iv_b64,
      encrypted.auth_tag_b64,
      photoFileId,
    ]
  );
  return result.rows[0];
}

export async function addReflection(
  userId: number,
  date: string,
  encrypted: EncryptedPayload,
  photoFileIds: string[]
): Promise<Reflection> {
  const result = await pool.query<Reflection>(
    `
    INSERT INTO reflections (user_id, date, ciphertext_b64, iv_b64, auth_tag_b64, photo_file_ids)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, user_id, date, ciphertext_b64, iv_b64, auth_tag_b64, photo_file_ids, created_at
    `,
    [
      userId,
      date,
      encrypted.ciphertext_b64,
      encrypted.iv_b64,
      encrypted.auth_tag_b64,
      JSON.stringify(photoFileIds),
    ]
  );
  return result.rows[0];
}

export async function listFeedbackInRange(
  userId: number,
  start: string,
  end: string
): Promise<Feedback[]> {
  const result = await pool.query<Feedback>(
    `
    SELECT id, user_id, intention_id, date, ciphertext_b64, iv_b64, auth_tag_b64, photo_file_id, created_at
    FROM feedback
    WHERE user_id = $1 AND date BETWEEN $2 AND $3
    ORDER BY date, id
    `,
    [userId, start, end]
  );
  return result.rows;
}

export async function recordNotification(
  userId: number,
  type: string,
  date: string,
  intentionId?: number | null
): Promise<boolean> {
  const result = await pool.query(
    `
    INSERT INTO notifications (user_id, type, date, intention_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, type, date, intention_id) DO NOTHING
    `,
    [userId, type, date, intentionId ?? null]
  );
  return (result.rowCount ?? 0) > 0;
}
