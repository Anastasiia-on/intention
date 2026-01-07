import { Context, Markup, Telegraf, session } from "telegraf";
import type { TelegramEmoji } from "@telegraf/types";
import {
  addCategory,
  addFeedback,
  addIntention,
  deleteIntention,
  getUserByTelegramId,
  getIntentionConfig,
  listCategories,
  listIntentionsByCategory,
  listIntentionsByDate,
  listIntentionsForUser,
  setIntentionCategory,
  setIntentionDate,
  upsertUserLanguage,
  updateIntentionText,
} from "./db";
import { decryptText, encryptText } from "./crypto/encryption";
import { getMessages, tMainMenu } from "./i18n";
import { formatDate, formatDateForUser } from "./utils";
import { Language } from "./types";

type Step =
  | "awaiting_intention_text"
  | "awaiting_date"
  | "awaiting_new_category"
  | "awaiting_edit_text"
  | "awaiting_feedback_text"
  | "awaiting_feedback_photo"
  | "awaiting_free_text_confirm";

type SessionData = {
  language?: Language;
  step?: Step;
  intentionId?: number;
  feedbackDate?: string;
  categoryMode?: "attach" | "manage";
  preselectedCategoryId?: number;
  pendingIntentionText?: string;
};

type BotContext = Context & { session: SessionData };

const WELCOME_IMAGE_URL = "https://www.ccl.org/wp-content/uploads/2020/11/3-ways-to-live-with-intention-center-for-creative-leadership.png.webp";

export function createBot(token: string): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(token);

  bot.use(
    session({
      defaultSession: () => ({}),
    })
  );

  bot.start(async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    const user = await getUserByTelegramId(telegramId);
    if (!user) {
      await sendLanguageSelection(ctx);
      return;
    }
    ctx.session.language = user.language;
    await sendIntroAndMenu(ctx, user.language);
  });

  bot.hears("English", async (ctx) => {
    await handleLanguageSelection(ctx, "en");
  });

  bot.hears("Українська", async (ctx) => {
    await handleLanguageSelection(ctx, "uk");
  });

  bot.hears([tMainMenu("en").add, tMainMenu("uk").add], async (ctx) => {
    await startAddIntention(ctx);
  });

  bot.hears([tMainMenu("en").show, tMainMenu("uk").show], async (ctx) => {
    await showIntentions(ctx);
  });

  bot.hears([tMainMenu("en").categories, tMainMenu("uk").categories], async (ctx) => {
    await showCategories(ctx);
  });

  bot.command("test_evening", async (ctx) => {
    const user = await requireUser(ctx);
    if (!user) return;
    const today = formatDate(new Date());
    const intentions = await listIntentionsByDate(user.id, today);
    const messages = getMessages(user.language);
    if (intentions.length === 0) {
      await ctx.reply(messages.noIntentionsToday, mainMenuKeyboard(user.language));
      return;
    }
    ctx.session.feedbackDate = today;
    await ctx.reply(
      messages.eveningPrompt,
      Markup.inlineKeyboard([
        [Markup.button.callback(messages.writeFeedback, "feedback_write")],
        [Markup.button.callback(messages.addPhoto, "feedback_photo")],
        [Markup.button.callback(messages.skipToday, "feedback_skip")],
      ])
    );
  });

  bot.action(/^feedback_(write|photo|skip)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    const messages = getMessages(user.language);
    const action = ctx.match[1];
    if (action === "skip") {
      clearSession(ctx);
      await ctx.reply(messages.skipToday, mainMenuKeyboard(user.language));
      return;
    }
    if (action === "write") {
      ctx.session.step = "awaiting_feedback_text";
      await ctx.reply(messages.feedbackTextPrompt);
      return;
    }
    ctx.session.step = "awaiting_feedback_photo";
    await ctx.reply(messages.photoPrompt);
  });

  bot.action(/^intent_date:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    ctx.session.step = "awaiting_date";
    ctx.session.intentionId = Number(ctx.match[1]);
    await ctx.reply(getMessages(user.language).chooseDate);
  });

  bot.action(/^intent_cat:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    ctx.session.intentionId = Number(ctx.match[1]);
    ctx.session.categoryMode = "attach";
    await showCategoryPicker(ctx, user.language);
  });

  bot.action(/^intent_done:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    const intentionId = Number(ctx.match[1]);
    const config = await getIntentionConfig(user.id, intentionId);
    if (!config) {
      clearSession(ctx);
      await ctx.reply(getMessages(user.language).noIntentions, mainMenuKeyboard(user.language));
      return;
    }
    const messages = getMessages(user.language);
    clearSession(ctx);
    await ctx.reply(
      messages.savedSummaryTitle,
      mainMenuKeyboard(user.language)
    );
  });

  bot.action(/^intent_select:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    const intentionId = Number(ctx.match[1]);
    const items = await listIntentionsForUser(user.id);
    const item = items.find((row) => row.id === intentionId);
    if (!item) return;
    const text = safeDecrypt(item);
    const messages = getMessages(user.language);
    const dateLabel = item.date ? formatDateForUser(item.date, user.language) : null;
    const buttons = [];
    const dateButtonLabel = item.date ? messages.editDate : messages.addDate;
    buttons.push([Markup.button.callback(dateButtonLabel, `intent_add_date:${intentionId}`)]);
    buttons.push([Markup.button.callback(messages.editIntention, `intent_edit:${intentionId}`)]);
    buttons.push([Markup.button.callback(messages.deleteIntention, `intent_delete:${intentionId}`)]);
    const body = dateLabel ? `${text}\n${dateLabel}` : text;
    await ctx.reply(body, Markup.inlineKeyboard(buttons));
  });

  bot.action(/^intent_add_date:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    ctx.session.step = "awaiting_date";
    ctx.session.intentionId = Number(ctx.match[1]);
    await ctx.reply(getMessages(user.language).chooseDate);
  });

  bot.action(/^intent_edit:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    ctx.session.step = "awaiting_edit_text";
    ctx.session.intentionId = Number(ctx.match[1]);
    await ctx.reply(getMessages(user.language).addPrompt);
  });

  bot.action(/^intent_delete:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    await deleteIntention(user.id, Number(ctx.match[1]));
    clearSession(ctx);
    await ctx.reply(getMessages(user.language).intentionDeleted, mainMenuKeyboard(user.language));
  });

  bot.action(/^cat_pick:(\d+):(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    const intentionId = Number(ctx.match[1]);
    const categoryId = Number(ctx.match[2]);
    await setIntentionCategory(user.id, intentionId, categoryId);
    ctx.session.step = undefined;
    ctx.session.categoryMode = undefined;
  });

  bot.action(/^cat_new:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    ctx.session.step = "awaiting_new_category";
    ctx.session.intentionId = Number(ctx.match[1]);
    ctx.session.categoryMode = "attach";
    await ctx.reply(getMessages(user.language).categoryPrompt);
  });

  bot.action("cat_add", async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    ctx.session.step = "awaiting_new_category";
    ctx.session.categoryMode = "manage";
    await ctx.reply(getMessages(user.language).categoryPrompt);
  });

  bot.action(/^cat_show:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    const categoryId = Number(ctx.match[1]);
    const messages = getMessages(user.language);
    const categories = await listCategories(user.id);
    const category = categories.find((item) => item.id === categoryId);
    const intentions = await listIntentionsByCategory(user.id, categoryId);
    if (intentions.length === 0) {
      await ctx.reply(
        `${messages.categoryEmpty}\n${messages.addFirstIntention}`,
        Markup.inlineKeyboard([
          [Markup.button.callback(messages.mainMenu.add, `cat_add_intention:${categoryId}`)],
        ])
      );
      return;
    }
    const buttons = intentions.map((item) => {
      const text = safeDecrypt(item);
      const dateLabel = item.date ? formatDateForUser(item.date, user.language) : null;
      const label = dateLabel ? `${text} — ${dateLabel}` : text;
      return [Markup.button.callback(trimText(label), `intent_select:${item.id}`)];
    });
    const header = category?.name
      ? user.language === "uk"
        ? `Мої ${category.name} наміри`
        : `My ${category.name} intentions`
      : messages.intentionsHeader;
    await ctx.reply(header, Markup.inlineKeyboard(buttons));
  });

  bot.action(/^cat_add_intention:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    await startAddIntention(ctx, Number(ctx.match[1]));
  });

  bot.action("cat_back", async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    await showCategories(ctx);
  });

  bot.action("start_new_month", async (ctx) => {
    await ctx.answerCbQuery();
    await startAddIntention(ctx);
  });

  bot.action("free_text_yes", async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    const text = ctx.session.pendingIntentionText?.trim();
    if (!text) {
      clearSession(ctx);
      await ctx.reply(getMessages(user.language).menuLabel, mainMenuKeyboard(user.language));
      return;
    }
    const encrypted = encryptText(text);
    const intention = await addIntention(user.id, null, encrypted);
    ctx.session.step = undefined;
    ctx.session.intentionId = intention.id;
    await sendOrUpdateConfig(ctx, user.id, intention.id);
  });

  bot.action("free_text_no", async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    clearSession(ctx);
    await ctx.reply(getMessages(user.language).menuLabel, mainMenuKeyboard(user.language));
  });

  bot.on("photo", async (ctx) => {
    if (ctx.session.step !== "awaiting_feedback_photo") return;
    const user = await requireUser(ctx);
    if (!user) return;
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const encrypted = encryptText("");
    const date = ctx.session.feedbackDate || formatDate(new Date());
    await addFeedback(user.id, date, encrypted, photo.file_id, null);
    clearSession(ctx);
    await ctx.reply(getMessages(user.language).photoSaved, mainMenuKeyboard(user.language));
  });

  bot.on("text", async (ctx) => {
    const user = await requireUser(ctx);
    if (!user) return;
    const messages = getMessages(user.language);
    const text = ctx.message.text.trim();

    if (!ctx.session.step) {
      if (!text || text.startsWith("/")) return;
      ctx.session.step = "awaiting_free_text_confirm";
      ctx.session.pendingIntentionText = text;
      await ctx.reply(
        messages.freeTextPrompt,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(messages.confirmYes, "free_text_yes"),
            Markup.button.callback(messages.confirmNo, "free_text_no"),
          ],
        ])
      );
      return;
    }

    if (ctx.session.step === "awaiting_intention_text") {
      if (!text || text.startsWith("/")) {
        await ctx.reply(messages.addPrompt);
        return;
      }
      const encrypted = encryptText(text);
      const categoryId = ctx.session.preselectedCategoryId ?? null;
      const intention = await addIntention(user.id, categoryId, encrypted);
      ctx.session.preselectedCategoryId = undefined;
      ctx.session.step = undefined;
      ctx.session.intentionId = intention.id;
      await sendOrUpdateConfig(ctx, user.id, intention.id);
      return;
    }

    if (ctx.session.step === "awaiting_date") {
      const dateError = validateDateInput(text, messages);
      if (dateError) {
        await ctx.reply(dateError);
        return;
      }
      const intentionId = ctx.session.intentionId;
      if (!intentionId) return;
      await setIntentionDate(user.id, intentionId, text);
      ctx.session.step = undefined;
      await tryReact(ctx, "👍");
      return;
    }

    if (ctx.session.step === "awaiting_new_category") {
      if (!text) {
        await ctx.reply(messages.categoryPrompt);
        return;
      }
      const category = await addCategory(user.id, text);
      if (ctx.session.categoryMode === "attach" && ctx.session.intentionId) {
        await setIntentionCategory(user.id, ctx.session.intentionId, category.id);
        ctx.session.step = undefined;
        ctx.session.categoryMode = undefined;
        await tryReact(ctx, "👍");
        return;
      }
      clearSession(ctx);
      await ctx.reply(
        messages.addIntentionAfterCategoryPrompt,
        Markup.inlineKeyboard([[Markup.button.callback(messages.mainMenu.add, `cat_add_intention:${category.id}`)]])
      );
      return;
    }

    if (ctx.session.step === "awaiting_edit_text") {
      if (!text || text.startsWith("/")) {
        await ctx.reply(messages.addPrompt);
        return;
      }
      const intentionId = ctx.session.intentionId;
      if (!intentionId) return;
      await updateIntentionText(user.id, intentionId, encryptText(text));
      clearSession(ctx);
      await ctx.reply(messages.intentionUpdated, mainMenuKeyboard(user.language));
      return;
    }

    if (ctx.session.step === "awaiting_feedback_text") {
      if (!text || text.startsWith("/")) {
        await ctx.reply(messages.feedbackTextPrompt);
        return;
      }
      const encrypted = encryptText(text);
      const date = ctx.session.feedbackDate || formatDate(new Date());
      await addFeedback(user.id, date, encrypted, null, null);
      clearSession(ctx);
      await ctx.reply(messages.feedbackSaved, mainMenuKeyboard(user.language));
    }

    if (ctx.session.step === "awaiting_free_text_confirm") {
      await ctx.reply(
        messages.freeTextPrompt,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(messages.confirmYes, "free_text_yes"),
            Markup.button.callback(messages.confirmNo, "free_text_no"),
          ],
        ])
      );
    }
  });

  return bot;
}

async function sendLanguageSelection(ctx: BotContext): Promise<void> {
  await ctx.replyWithPhoto(
    { url: WELCOME_IMAGE_URL },
    { caption: "Intentions bot" }
  );
  await ctx.reply(
    "Choose a language / Обери мову",
    Markup.keyboard([["English", "Українська"]]).resize()
  );
}

async function handleLanguageSelection(ctx: BotContext, language: Language): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;
  const user = await upsertUserLanguage(telegramId, language);
  ctx.session.language = user.language;
  await sendIntroAndMenu(ctx, language);
}

async function sendIntroAndMenu(ctx: BotContext, language: Language): Promise<void> {
  const messages = getMessages(language);
  await ctx.reply(
    [messages.intro, "", messages.privacy].join("\n"),
    mainMenuKeyboard(language)
  );
}

async function startAddIntention(ctx: BotContext, preselectedCategoryId?: number): Promise<void> {
  const user = await requireUser(ctx);
  if (!user) return;
  clearSession(ctx);
  if (preselectedCategoryId) {
    ctx.session.preselectedCategoryId = preselectedCategoryId;
  }
  ctx.session.step = "awaiting_intention_text";
  await ctx.reply(getMessages(user.language).addPrompt);
}

async function showIntentions(ctx: BotContext): Promise<void> {
  const user = await requireUser(ctx);
  if (!user) return;
  const messages = getMessages(user.language);
  const intentions = await listIntentionsForUser(user.id);
  if (intentions.length === 0) {
    await ctx.reply(messages.noIntentions, mainMenuKeyboard(user.language));
    return;
  }
  const items = intentions.map((item) => {
    const text = safeDecrypt(item);
    const dateLabel = item.date ? formatDateForUser(item.date, user.language) : null;
    return { id: item.id, text, dateLabel };
  });
  const buttons = items.map((item) => [
    Markup.button.callback(
      trimText(item.dateLabel ? `${item.text} — ${item.dateLabel}` : item.text),
      `intent_select:${item.id}`
    ),
  ]);
  await ctx.reply(messages.intentionsHeader, Markup.inlineKeyboard(buttons));
}

async function showCategories(ctx: BotContext): Promise<void> {
  const user = await requireUser(ctx);
  if (!user) return;
  const messages = getMessages(user.language);
  const categories = await listCategories(user.id);
  if (categories.length === 0) {
    await ctx.reply(
      messages.noCategories,
      Markup.inlineKeyboard([[Markup.button.callback(messages.addNewCategory, "cat_add")]])
    );
    return;
  }
  const buttons = categories.map((category) => [
    Markup.button.callback(category.name, `cat_show:${category.id}`),
  ]);
  buttons.push([Markup.button.callback(messages.addNewCategory, "cat_add")]);
  await ctx.reply(messages.categoriesHeader, Markup.inlineKeyboard(buttons));
}

async function showCategoryPicker(ctx: BotContext, language: Language): Promise<void> {
  const messages = getMessages(language);
  const user = await requireUser(ctx);
  if (!user) return;
  const categories = await listCategories(user.id);
  if (categories.length === 0) {
    await ctx.reply(messages.categoryPrompt);
    ctx.session.step = "awaiting_new_category";
    ctx.session.categoryMode = "attach";
    return;
  }
  const intentionId = ctx.session.intentionId;
  const buttons = categories.map((category) => [
    Markup.button.callback(category.name, `cat_pick:${intentionId}:${category.id}`),
  ]);
  buttons.push([Markup.button.callback(messages.addNewCategory, `cat_new:${intentionId}`)]);
  await ctx.reply(messages.chooseCategory, Markup.inlineKeyboard(buttons));
}

async function requireUser(ctx: BotContext): Promise<{ id: number; language: Language } | null> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return null;
  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    await sendLanguageSelection(ctx);
    return null;
  }
  ctx.session.language = user.language;
  return user;
}

function mainMenuKeyboard(language: Language) {
  const menu = tMainMenu(language);
  return Markup.keyboard([[menu.add], [menu.show], [menu.categories]]).resize();
}

function clearSession(ctx: BotContext): void {
  ctx.session.step = undefined;
  ctx.session.intentionId = undefined;
  ctx.session.feedbackDate = undefined;
  ctx.session.categoryMode = undefined;
  ctx.session.pendingIntentionText = undefined;
  ctx.session.preselectedCategoryId = undefined;
}

function validateDateInput(input: string, messages: ReturnType<typeof getMessages>): string | null {
  const trimmed = input.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return messages.invalidDateFormat;
  }
  const [year, month, day] = trimmed.split("-").map((value) => Number(value));
  if (!isValidCalendarDate(year, month, day)) {
    return messages.invalidDateCalendar;
  }
  const today = getMadridToday();
  if (trimmed <= today) {
    return messages.invalidDatePast;
  }
  return null;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function getMadridToday(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

function trimText(text: string, max = 32): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

function safeDecrypt(payload: { ciphertext_b64: string; iv_b64: string; auth_tag_b64: string }): string {
  try {
    return decryptText(payload);
  } catch {
    return "[unable to decrypt]";
  }
}

async function tryReact(ctx: BotContext, emoji: TelegramEmoji): Promise<void> {
  try {
    await ctx.react(emoji);
  } catch {
    // Ignore reaction failures (e.g., unsupported by client or bot API).
  }
}

async function sendOrUpdateConfig(
  ctx: BotContext,
  userId: number,
  intentionId: number
): Promise<void> {
  const config = await getIntentionConfig(userId, intentionId);
  if (!config) return;
  const messages = getMessages(ctx.session.language || "en");
  const text = messages.configPrompt;
  const dateButton = messages.addDateAction;
  const buttons = [[Markup.button.callback(dateButton, `intent_date:${intentionId}`)]];
  if (!config.category_id) {
    const categoryButton = messages.addCategoryAction;
    buttons.push([Markup.button.callback(categoryButton, `intent_cat:${intentionId}`)]);
  }
  buttons.push([Markup.button.callback(messages.doneAction, `intent_done:${intentionId}`)]);
  const keyboard = Markup.inlineKeyboard(buttons);
  await ctx.reply(text, keyboard);
}
