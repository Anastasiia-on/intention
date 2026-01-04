import { Pool } from "pg";
import { config } from "./config";

export type UserRecord = {
  id: number;
  telegram_id: number;
  first_name: string | null;
  username: string | null;
  reminder_time: string;
  evening_time: string;
};

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({ connectionString: config.databaseUrl });

export async function ensureUser(
  telegramId: number,
  firstName?: string,
  username?: string
): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    `
    INSERT INTO users (telegram_id, first_name, username)
    VALUES ($1, $2, $3)
    ON CONFLICT (telegram_id)
    DO UPDATE SET first_name = EXCLUDED.first_name, username = EXCLUDED.username
    RETURNING id, telegram_id, first_name, username, reminder_time, evening_time
    `,
    [telegramId, firstName || null, username || null]
  );
  return result.rows[0];
}

export async function updateReminderTime(userId: number, time: string): Promise<void> {
  await pool.query(`UPDATE users SET reminder_time = $1 WHERE id = $2`, [time, userId]);
}

export async function updateEveningTime(userId: number, time: string): Promise<void> {
  await pool.query(`UPDATE users SET evening_time = $1 WHERE id = $2`, [time, userId]);
}

export async function addIntention(userId: number, title: string, dates: string[]): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const insert = await client.query<{ id: number }>(
      `INSERT INTO intentions (user_id, title) VALUES ($1, $2) RETURNING id`,
      [userId, title.trim()]
    );
    const intentionId = insert.rows[0].id;
    for (const date of dates) {
      await client.query(
        `INSERT INTO intention_dates (intention_id, date) VALUES ($1, $2)`,
        [intentionId, date]
      );
    }
    await client.query("COMMIT");
    return intentionId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listIntentions(
  userId: number
): Promise<Array<{ title: string; dates: string[] }>> {
  const result = await pool.query<{ title: string; dates: string[] | null }>(
    `
    SELECT i.title, ARRAY_REMOVE(ARRAY_AGG(d.date ORDER BY d.date), NULL) AS dates
    FROM intentions i
    LEFT JOIN intention_dates d ON d.intention_id = i.id
    WHERE i.user_id = $1
    GROUP BY i.id
    ORDER BY MIN(d.date) IS NULL, MIN(d.date), i.id
    `,
    [userId]
  );
  return result.rows.map((row) => ({
    title: row.title,
    dates: row.dates || [],
  }));
}

export async function getIntentionsForUserByDate(userId: number, date: string): Promise<string[]> {
  const result = await pool.query<{ title: string }>(
    `
    SELECT i.title
    FROM intention_dates d
    JOIN intentions i ON i.id = d.intention_id
    WHERE i.user_id = $1 AND d.date = $2
    ORDER BY i.id
    `,
    [userId, date]
  );
  return result.rows.map((row) => row.title);
}

export async function getUsersByReminderTime(time: string): Promise<UserRecord[]> {
  const result = await pool.query<UserRecord>(
    `SELECT id, telegram_id, first_name, username, reminder_time, evening_time FROM users WHERE reminder_time = $1`,
    [time]
  );
  return result.rows;
}

export async function getUsersByEveningTime(time: string): Promise<UserRecord[]> {
  const result = await pool.query<UserRecord>(
    `SELECT id, telegram_id, first_name, username, reminder_time, evening_time FROM users WHERE evening_time = $1`,
    [time]
  );
  return result.rows;
}

export async function addReflection(
  userId: number,
  date: string,
  text?: string | null,
  photoFileId?: string | null
): Promise<void> {
  await pool.query(
    `INSERT INTO reflections (user_id, date, text, photo_file_id) VALUES ($1, $2, $3, $4)`,
    [userId, date, text || null, photoFileId || null]
  );
}

export async function recordNotification(
  userId: number,
  type: string,
  date: string
): Promise<boolean> {
  const result = await pool.query(
    `
    INSERT INTO notifications (user_id, type, date)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, type, date) DO NOTHING
    `,
    [userId, type, date]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getMonthlySummary(
  userId: number,
  start: string,
  end: string
): Promise<{ intentions: number; plannedDates: number; reflections: number }> {
  const plannedDates = await pool.query<{ count: string; intentions: string }>(
    `
    SELECT COUNT(*) as count, COUNT(DISTINCT d.intention_id) as intentions
    FROM intention_dates d
    JOIN intentions i ON i.id = d.intention_id
    WHERE i.user_id = $1 AND d.date BETWEEN $2 AND $3
    `,
    [userId, start, end]
  );

  const reflections = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM reflections WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
    [userId, start, end]
  );

  return {
    intentions: Number(plannedDates.rows[0]?.intentions || 0),
    plannedDates: Number(plannedDates.rows[0]?.count || 0),
    reflections: Number(reflections.rows[0]?.count || 0),
  };
}
