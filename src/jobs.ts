import cron from "node-cron";
import { Telegraf } from "telegraf";
import {
  getUsersByEveningTime,
  getUsersByMonthlyTime,
  getUsersByReminderTime,
  listFeedbackInRange,
  listIntentionsByDate,
  listIntentionsInRange,
  recordNotification,
} from "./db";
import { decryptText } from "./crypto/encryption";
import { getMessages } from "./i18n";
import { formatDateForUser } from "./utils";
import { monthlySummaryKeyboard } from "./keyboards/monthlySummary";
const TIMEZONE = "Europe/Madrid";

export function startCronJobs(bot: Telegraf<any>): void {
  cron.schedule(
    "* * * * *",
    () => {
      const now = new Date();
      const time = getZonedTimeString(now);
      void runTomorrowReminders(bot, now, time);
      void runEveningPrompts(bot, now, time);
      void runWeeklySummary(bot, now, time);
      void runMonthlySummary(bot, now, time);
    },
    { timezone: TIMEZONE }
  );
}

async function runTomorrowReminders(bot: Telegraf, now: Date, time: string): Promise<void> {
  const users = await getUsersByReminderTime(time);
  if (users.length === 0) return;
  const today = getZonedDateString(now);
  const tomorrow = addDaysToDateString(today, 1);
  for (const user of users) {
    const intentions = await listIntentionsByDate(user.id, tomorrow);
    if (intentions.length === 0) continue;
    const shouldSend = await recordNotification(user.id, "tomorrow", tomorrow, null);
    if (!shouldSend) continue;
    const messages = getMessages(user.language);
    const lines = intentions.map((item) => `- ${safeDecrypt(item)}`);
    await bot.telegram.sendMessage(user.telegram_id, [messages.tomorrowReminder, ...lines].join("\n"));
  }
}

async function runEveningPrompts(bot: Telegraf, now: Date, time: string): Promise<void> {
  const users = await getUsersByEveningTime(time);
  if (users.length === 0) return;
  const today = getZonedDateString(now);
  for (const user of users) {
    const intentions = await listIntentionsByDate(user.id, today);
    if (intentions.length === 0) continue;
    const messages = getMessages(user.language);
    for (const intention of intentions) {
      const shouldSend = await recordNotification(user.id, "evening", today, intention.id);
      if (!shouldSend) continue;
      const line = safeDecrypt(intention);
      await bot.telegram.sendMessage(
        user.telegram_id,
        [messages.eveningPrompt, `- ${line}`].join("\n")
      );
    }
  }
}

async function runMonthlySummary(bot: Telegraf, now: Date, time: string): Promise<void> {
  const today = getZonedDateString(now);
  // todo if (!isLastDayOfMonthFromDateString(today)) return;
  const users = await getUsersByMonthlyTime(time);
  if (users.length === 0) return;
  const { start, end } = getMonthRangeForDateString(today);
  const monthKey = start.slice(0, 7);
  for (const user of users) {
    const shouldSend = await recordNotification(user.id, "monthly", monthKey, null);
    if (!shouldSend) continue;
    const messages = getMessages(user.language);
    const intentions = await listIntentionsInRange(user.id, start, end);
    const feedback = await listFeedbackInRange(user.id, start, end);
    const intentionLines = intentions.map((item) => {
      if (item.dates.length === 0) return `- ${safeDecrypt(item)}`;
      const dates = item.dates
        .map((date) => formatDateForUser(date, user.language))
        .filter((date) => date.length > 0)
        .join(", ");
      return dates.length > 0 ? `- ${safeDecrypt(item)} (${dates})` : `- ${safeDecrypt(item)}`;
    });
    const feedbackLines = feedback.map((item) => {
      const text = safeDecrypt(item);
      const label = text ? text : messages.photoReflection;
      const dateLabel = formatDateForUser(item.date, user.language);
      return `- ${dateLabel}: ${label}`;
    });
    const body = [
      messages.monthlySummaryTitle,
      "",
      messages.monthlyIntentionsHeader,
      ...(intentionLines.length > 0 ? intentionLines : ["-"]),
      "",
      messages.monthlyFeedbackHeader,
      ...(feedbackLines.length > 0 ? feedbackLines : ["-"]),
      "",
      messages.monthlySummaryFooter,
    ].join("\n");
    await bot.telegram.sendMessage(user.telegram_id, body, monthlySummaryKeyboard(user.language));
  }
}

async function runWeeklySummary(bot: Telegraf, now: Date, time: string): Promise<void> {
  const today = getZonedDateString(now);
  if (!isSundayFromDateString(today)) return;
  const users = await getUsersByMonthlyTime(time);
  if (users.length === 0) return;
  const { start, end } = getWeekRangeForDateString(today);
  for (const user of users) {
    const shouldSend = await recordNotification(user.id, "weekly", start, null);
    if (!shouldSend) continue;
    const messages = getMessages(user.language);
    const intentions = await listIntentionsInRange(user.id, start, end);
    const feedback = await listFeedbackInRange(user.id, start, end);
    const intentionLines = intentions.map((item) => {
      if (item.dates.length === 0) return `- ${safeDecrypt(item)}`;
      const dates = item.dates
        .map((date) => formatDateForUser(date, user.language))
        .filter((date) => date.length > 0)
        .join(", ");
      return dates.length > 0 ? `- ${safeDecrypt(item)} (${dates})` : `- ${safeDecrypt(item)}`;
    });
    const feedbackLines = feedback.map((item) => {
      const text = safeDecrypt(item);
      const label = text ? text : messages.photoReflection;
      const dateLabel = formatDateForUser(item.date, user.language);
      return `- ${dateLabel}: ${label}`;
    });
    const body = [
      messages.weeklySummaryTitle,
      "",
      messages.weeklyIntentionsHeader,
      ...(intentionLines.length > 0 ? intentionLines : ["-"]),
      "",
      messages.weeklyFeedbackHeader,
      ...(feedbackLines.length > 0 ? feedbackLines : ["-"]),
      "",
      messages.weeklySummaryFooter,
    ].join("\n");
    await bot.telegram.sendMessage(user.telegram_id, body);
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

function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function isLastDayOfMonthFromDateString(dateStr: string): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day === lastDay;
}

function getMonthRangeForDateString(dateStr: string): { start: string; end: string } {
  const [year, month] = dateStr.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function isSundayFromDateString(dateStr: string): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCDay() === 0;
}

function getWeekRangeForDateString(dateStr: string): { start: string; end: string } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = date.getUTCDay();
  const offsetFromMonday = (dayOfWeek + 6) % 7;
  const start = new Date(Date.UTC(year, month - 1, day - offsetFromMonday));
  const end = new Date(Date.UTC(year, month - 1, day - offsetFromMonday + 6));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function safeDecrypt(payload: { ciphertext_b64: string; iv_b64: string; auth_tag_b64: string }): string {
  try {
    return decryptText(payload);
  } catch {
    return "[unable to decrypt]";
  }
}
