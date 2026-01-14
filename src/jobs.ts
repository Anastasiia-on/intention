import cron from "node-cron";
import { Telegraf } from "telegraf";
import {
  getUsersByEveningTime,
  getUsersByReminderTime,
  listIntentionsByDate,
  recordNotification,
} from "./db";
import { decryptText } from "./crypto/encryption";
import { getMessages } from "./i18n";
import { reflectionPromptKeyboard } from "./keyboards/reflection";
const TIMEZONE = "Europe/Madrid";

export function startCronJobs(bot: Telegraf<any>): void {
  cron.schedule(
    "* * * * *",
    () => {
      const now = new Date();
      const time = getZonedTimeString(now);
      void runMorningReminders(bot, now, time);
      void runEveningPrompts(bot, now, time);
    },
    { timezone: TIMEZONE }
  );
}

async function runMorningReminders(bot: Telegraf, now: Date, time: string): Promise<void> {
  const users = await getUsersByReminderTime(time);
  if (users.length === 0) return;
  const today = getZonedDateString(now);
  for (const user of users) {
    const intentions = await listIntentionsByDate(user.id, today);
    if (intentions.length === 0) continue;
    const shouldSend = await recordNotification(user.id, "morning", today, null);
    if (!shouldSend) continue;
    const messages = getMessages(user.language);
    const lines = intentions.map((item) => `- ${safeDecrypt(item)}`);
    await bot.telegram.sendMessage(user.telegram_id, [messages.tomorrowReminder, ...lines].join("\n"));
  }
}

async function runEveningPrompts(bot: Telegraf, now: Date, time: string): Promise<void> {
  const users = await getUsersByEveningTime(time);
  console.log("users")
  console.log(users)
  const today2 = getZonedDateString(now);
  console.log(today2)
  if (users.length === 0) return;
  const today = getZonedDateString(now);
  for (const user of users) {
    const intentions = await listIntentionsByDate(user.id, today);
    console.log(intentions)
    if (intentions.length === 0) continue;
    console.log('messages')
    const messages = getMessages(user.language);
    console.log(messages)
    for (const intention of intentions) {
      const shouldSend = await recordNotification(user.id, "evening", today, intention.id);
      console.log('shouldSend')
      console.log(shouldSend)
      console.log(user)
      if (!shouldSend) continue;
      console.log('shouldSend2')
      const line = safeDecrypt(intention);
      await bot.telegram.sendMessage(
        user.telegram_id,
        [messages.eveningPrompt, `- ${line}`].join("\n"),
        reflectionPromptKeyboard(user.language, intention.id)
      );
    }
  }
}

function getZonedDateString(date: Date): string {
  const parts = getZonedParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getZonedTimeString(date: Date): string {
  const parts = getZonedParts(date);
  return `${parts.hour}:${parts.minute}`;
}

function getZonedParts(date: Date): {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
} {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  return {
    year: partValue(parts, "year"),
    month: partValue(parts, "month"),
    day: partValue(parts, "day"),
    hour: partValue(parts, "hour"),
    minute: partValue(parts, "minute"),
  };
}

function partValue(parts: Intl.DateTimeFormatPart[], type: string): string {
  const value = parts.find((part) => part.type === type)?.value;
  return value ? value.padStart(2, "0") : "00";
}

function safeDecrypt(payload: { ciphertext_b64: string; iv_b64: string; auth_tag_b64: string }): string {
  try {
    return decryptText(payload);
  } catch {
    return "[unable to decrypt]";
  }
}
