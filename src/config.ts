export const config = {
  botToken: process.env.BOT_TOKEN || "",
  databaseUrl: process.env.DATABASE_URL || "",
  encryptionKey: process.env.ENCRYPTION_KEY || "",
  adminTelegramId: process.env.ADMIN_TELEGRAM_ID
    ? Number(process.env.ADMIN_TELEGRAM_ID)
    : undefined,
};