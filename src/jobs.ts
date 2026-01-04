import cron from "node-cron";
import { Telegraf } from "telegraf";
import {
  getIntentionsForUserByDate,
  getMonthlySummary,
  getUsersByEveningTime,
  getUsersByReminderTime,
  recordNotification,
} from "./db";
import { messages } from "./messages";
import { addDays, formatDate, getMonthRange, isLastDayOfMonth } from "./utils";

export function startCronJobs(bot: Telegraf): void {
  cron.schedule("* * * * *", () => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    runMorningReminders(bot, now, time);
    runEveningPrompts(bot, now, time);
    runMonthlySummary(bot, now, time);
  });
}

async function runMorningReminders(bot: Telegraf, now: Date, time: string): Promise<void> {
  const users = await getUsersByReminderTime(time);
  if (users.length === 0) return;
  const tomorrow = formatDate(addDays(now, 1));
  for (const user of users) {
    const titles = await getIntentionsForUserByDate(user.id, tomorrow);
    if (titles.length === 0) continue;
    const shouldSend = await recordNotification(user.id, "morning", tomorrow);
    if (!shouldSend) continue;
    await bot.telegram.sendMessage(user.telegram_id, messages.reminder(titles));
  }
}

async function runEveningPrompts(bot: Telegraf, now: Date, time: string): Promise<void> {
  const users = await getUsersByEveningTime(time);
  if (users.length === 0) return;
  const today = formatDate(now);
  for (const user of users) {
    const titles = await getIntentionsForUserByDate(user.id, today);
    if (titles.length === 0) continue;
    const shouldSend = await recordNotification(user.id, "evening", today);
    if (!shouldSend) continue;
    await bot.telegram.sendMessage(user.telegram_id, messages.eveningPrompt(titles));
  }
}

async function runMonthlySummary(bot: Telegraf, now: Date, time: string): Promise<void> {
  if (!isLastDayOfMonth(now)) return;
  const users = await getUsersByEveningTime(time);
  if (users.length === 0) return;
  const { start, end } = getMonthRange(now);
  const monthKey = start.slice(0, 7);
  for (const user of users) {
    const shouldSend = await recordNotification(user.id, "monthly", monthKey);
    if (!shouldSend) continue;
    const summary = await getMonthlySummary(user.id, start, end);
    await bot.telegram.sendMessage(
      user.telegram_id,
      messages.monthlySummary(summary.intentions, summary.plannedDates, summary.reflections)
    );
  }
}
