import { Pool } from "pg";
import { config } from "./config";
import {
  EncryptedPayload,
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
    `SELECT id, telegram_id, language, first_name, last_name, username, reminder_time, evening_time, monthly_time, is_admin, created_at FROM users WHERE telegram_id = $1`,
    [telegramId]
  );
  return result.rows[0] || null;
}

export async function upsertUserLanguage(
  telegramId: number,
  language: Language,
  profile: { firstName?: string | null; lastName?: string | null; username?: string | null }
): Promise<User> {
  const result = await pool.query<User>(
    `
    INSERT INTO users (telegram_id, language, first_name, last_name, username)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (telegram_id)
    DO UPDATE SET
      language = EXCLUDED.language,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      username = EXCLUDED.username
    RETURNING id, telegram_id, language, first_name, last_name, username, reminder_time, evening_time, monthly_time, is_admin, created_at
    `,
    [telegramId, language, profile.firstName ?? null, profile.lastName ?? null, profile.username ?? null]
  );
  return result.rows[0];
}

export async function updateUserProfile(
  telegramId: number,
  profile: { firstName?: string | null; lastName?: string | null; username?: string | null }
): Promise<void> {
  await pool.query(
    `
    UPDATE users
    SET first_name = $2,
        last_name = $3,
        username = $4
    WHERE telegram_id = $1
    `,
    [telegramId, profile.firstName ?? null, profile.lastName ?? null, profile.username ?? null]
  );
}

export async function getUsersByReminderTime(time: string): Promise<User[]> {
  const result = await pool.query<User>(
    `
    SELECT id, telegram_id, language, first_name, last_name, username, reminder_time, evening_time, monthly_time, is_admin, created_at
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
    SELECT id, telegram_id, language, first_name, last_name, username, reminder_time, evening_time, monthly_time, is_admin, created_at
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
    SELECT id, telegram_id, language, first_name, last_name, username, reminder_time, evening_time, monthly_time, is_admin, created_at
    FROM users
    WHERE monthly_time = $1
    `,
    [time]
  );
  return result.rows;
}

export async function ensureAdminUser(telegramId: number): Promise<void> {
  await pool.query(
    `
    UPDATE users
    SET is_admin = true
    WHERE telegram_id = $1 AND is_admin = false
    `,
    [telegramId]
  );
}

export async function listUsersForBroadcast(): Promise<Array<{ id: number; telegram_id: number; language: Language }>> {
  const result = await pool.query<{ id: number; telegram_id: number; language: Language }>(
    `
    SELECT id, telegram_id, language
    FROM users
    `
  );
  return result.rows;
}

export async function listReflectionsForUser(
  userId: number
): Promise<Array<Reflection & {
  intention_ciphertext_b64: string | null;
  intention_iv_b64: string | null;
  intention_auth_tag_b64: string | null;
}>> {
  const result = await pool.query<
    Reflection & {
      intention_ciphertext_b64: string | null;
      intention_iv_b64: string | null;
      intention_auth_tag_b64: string | null;
    }
  >(
    `
    SELECT
      r.id,
      r.user_id,
      r.date,
      r.intention_id,
      r.ciphertext_b64,
      r.iv_b64,
      r.auth_tag_b64,
      r.photo_file_ids,
      r.created_at,
      i.ciphertext_b64 AS intention_ciphertext_b64,
      i.iv_b64 AS intention_iv_b64,
      i.auth_tag_b64 AS intention_auth_tag_b64
    FROM reflections r
    LEFT JOIN intentions i ON i.id = r.intention_id
    WHERE r.user_id = $1
    ORDER BY r.date DESC, r.id DESC
    `,
    [userId]
  );
  return result.rows;
}

export async function addIntention(
  userId: number,
  encrypted: EncryptedPayload
): Promise<Intention> {
  const result = await pool.query<Intention>(
    `
    INSERT INTO intentions (user_id, ciphertext_b64, iv_b64, auth_tag_b64)
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, ciphertext_b64, iv_b64, auth_tag_b64, created_at
    `,
    [userId, encrypted.ciphertext_b64, encrypted.iv_b64, encrypted.auth_tag_b64]
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

export async function listIntentionsByDate(
  userId: number,
  date: string
): Promise<Intention[]> {
  const result = await pool.query<Intention>(
    `
    SELECT i.id, i.user_id, i.ciphertext_b64, i.iv_b64, i.auth_tag_b64, i.created_at
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
      i.ciphertext_b64,
      i.iv_b64,
      i.auth_tag_b64,
      i.created_at,
      MIN(d.date) AS date
    FROM intentions i
    LEFT JOIN intention_dates d ON d.intention_id = i.id
    WHERE i.user_id = $1 AND i.id = $2
    GROUP BY i.id
    `,
    [userId, intentionId]
  );
  return result.rows[0] || null;
}

export async function deleteIntention(userId: number, intentionId: number): Promise<void> {
  await pool.query(`DELETE FROM intentions WHERE id = $1 AND user_id = $2`, [intentionId, userId]);
}

export async function addReflection(
  userId: number,
  date: string,
  encrypted: EncryptedPayload,
  photoFileIds: string[],
  intentionId?: number | null
): Promise<Reflection> {
  const result = await pool.query<Reflection>(
    `
    INSERT INTO reflections (user_id, date, intention_id, ciphertext_b64, iv_b64, auth_tag_b64, photo_file_ids)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, user_id, date, intention_id, ciphertext_b64, iv_b64, auth_tag_b64, photo_file_ids, created_at
    `,
    [
      userId,
      date,
      intentionId ?? null,
      encrypted.ciphertext_b64,
      encrypted.iv_b64,
      encrypted.auth_tag_b64,
      JSON.stringify(photoFileIds),
    ]
  );
  return result.rows[0];
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
