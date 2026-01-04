import { Telegraf } from "telegraf";
import { messages } from "./messages";
import {
  addIntention,
  addReflection,
  ensureUser,
  listIntentions,
  updateEveningTime,
  updateReminderTime,
} from "./db";
import { parseDate, parseDateList, parseTime } from "./utils";

export function createBot(token: string): Telegraf {
  const bot = new Telegraf(token);

  bot.use(async (ctx, next) => {
    if (ctx.from) {
      await ensureUser(ctx.from.id, ctx.from.first_name, ctx.from.username);
    }
    return next();
  });

  bot.start((ctx) => ctx.reply(messages.welcome));
  bot.command("help", (ctx) => ctx.reply(messages.help));

  bot.command("add", async (ctx) => {
    const text = ctx.message.text.replace("/add", "").trim();
    const [titlePart, datePart] = text.split("|").map((part) => part.trim());
    if (!titlePart || !datePart) {
      await ctx.reply(messages.invalidAdd);
      return;
    }
    const dates = parseDateList(datePart);
    if (dates.length === 0) {
      await ctx.reply(messages.invalidAdd);
      return;
    }
    const user = await ensureUser(ctx.from.id, ctx.from.first_name, ctx.from.username);
    await addIntention(user.id, titlePart, dates);
    await ctx.reply(messages.added);
  });

  bot.command("list", async (ctx) => {
    const user = await ensureUser(ctx.from.id, ctx.from.first_name, ctx.from.username);
    const items = await listIntentions(user.id);
    if (items.length === 0) {
      await ctx.reply(messages.noIntentions);
      return;
    }
    const lines = [messages.listHeader];
    items.forEach((item) => {
      const dates = item.dates.length > 0 ? item.dates.join(", ") : "no dates";
      lines.push(`${item.title} — ${dates}`);
    });
    await ctx.reply(lines.join("\n"));
  });

  bot.command("setreminder", async (ctx) => {
    const value = ctx.message.text.replace("/setreminder", "").trim();
    const time = parseTime(value);
    if (!time) {
      await ctx.reply(messages.invalidTime);
      return;
    }
    const user = await ensureUser(ctx.from.id, ctx.from.first_name, ctx.from.username);
    await updateReminderTime(user.id, time);
    await ctx.reply(messages.reminderSet(time));
  });

  bot.command("setevening", async (ctx) => {
    const value = ctx.message.text.replace("/setevening", "").trim();
    const time = parseTime(value);
    if (!time) {
      await ctx.reply(messages.invalidTime);
      return;
    }
    const user = await ensureUser(ctx.from.id, ctx.from.first_name, ctx.from.username);
    await updateEveningTime(user.id, time);
    await ctx.reply(messages.eveningSet(time));
  });

  bot.command("reflect", async (ctx) => {
    const value = ctx.message.text.replace("/reflect", "").trim();
    if (!value) {
      await ctx.reply(messages.reflectHelp);
      return;
    }
    const [dateInput, ...rest] = value.split(" ");
    const date = parseDate(dateInput);
    if (!date) {
      await ctx.reply(messages.reflectHelp);
      return;
    }
    const text = rest.join(" ").trim();
    const user = await ensureUser(ctx.from.id, ctx.from.first_name, ctx.from.username);
    await addReflection(user.id, date, text || null, null);
    await ctx.reply(messages.reflectSaved);
  });

  bot.on("photo", async (ctx) => {
    const caption = ctx.message.caption || "";
    const trimmed = caption.trim();
    if (!trimmed.toLowerCase().startsWith("reflect")) {
      return;
    }
    const parts = trimmed.split(" ");
    const dateInput = parts[1];
    const date = dateInput ? parseDate(dateInput) : null;
    if (!date) {
      await ctx.reply(messages.reflectHelp);
      return;
    }
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const user = await ensureUser(ctx.from.id, ctx.from.first_name, ctx.from.username);
    await addReflection(user.id, date, null, photo.file_id);
    await ctx.reply(messages.reflectSaved);
  });

  return bot;
}
