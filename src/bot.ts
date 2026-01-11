import { Context, Markup, Telegraf, session } from "telegraf";
import type { TelegramEmoji } from "@telegraf/types";
import fs from "node:fs";
import path from "node:path";
import {
  addCategory,
  addFeedback,
  addIntention,
  addReflection,
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
import { CALLBACKS, CALLBACK_PATTERNS, callbackData } from "./callbacks";
import { mainMenuKeyboard } from "./keyboards/mainMenu";
import { reflectionModeKeyboard, reflectionPromptKeyboard } from "./keyboards/reflection";
import { intentionConfigKeyboard } from "./keyboards/replyMenu";

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
  intentionConfigMode?: boolean;
  feedbackDate?: string;
  categoryMode?: "attach" | "manage";
  preselectedCategoryId?: number;
  pendingIntentionText?: string;
  reflectionMode?: boolean;
  reflectionTextParts?: string[];
  reflectionPhotoFileIds?: string[];
  reflectionStartedAt?: number;
};

type BotContext = Context & { session: SessionData };

const WELCOME_IMAGE_PATH = path.resolve(__dirname, "..", "assets", "welcome.png");

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
    if (ctx.session.reflectionMode) return;
    await handleLanguageSelection(ctx, "en");
  });

  bot.hears("Українська", async (ctx) => {
    if (ctx.session.reflectionMode) return;
    await handleLanguageSelection(ctx, "uk");
  });

  bot.hears([tMainMenu("en").add, tMainMenu("uk").add], async (ctx) => {
    if (ctx.session.reflectionMode) return;
    const user = await requireUser(ctx);
    if (!user) return;
    await exitIntentionConfigMode(ctx, user.language, { sendKeyboard: false });
    await startAddIntention(ctx);
  });

  bot.hears([tMainMenu("en").show, tMainMenu("uk").show], async (ctx) => {
    if (ctx.session.reflectionMode) return;
    const user = await requireUser(ctx);
    if (!user) return;
    await exitIntentionConfigMode(ctx, user.language, { sendKeyboard: true });
    await showIntentions(ctx);
  });

  bot.hears([tMainMenu("en").categories, tMainMenu("uk").categories], async (ctx) => {
    if (ctx.session.reflectionMode) return;
    const user = await requireUser(ctx);
    if (!user) return;
    await exitIntentionConfigMode(ctx, user.language, { sendKeyboard: true });
    await showCategories(ctx);
  });
  bot.action(CALLBACKS.learnMore, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    const messages = getMessages(user.language);
    await ctx.reply(messages.optionalInfo, mainMenuKeyboard(user.language));
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
        [Markup.button.callback(messages.writeFeedback, CALLBACKS.feedbackWrite)],
        [Markup.button.callback(messages.addPhoto, CALLBACKS.feedbackPhoto)],
        [Markup.button.callback(messages.skipToday, CALLBACKS.feedbackSkip)],
      ])
    );
  });

  bot.action(CALLBACKS.feedbackSkip, async (ctx) => {
    await handleFeedbackAction(ctx, "skip");
  });

  bot.action(CALLBACKS.feedbackWrite, async (ctx) => {
    await handleFeedbackAction(ctx, "write");
  });

  bot.action(CALLBACKS.feedbackPhoto, async (ctx) => {
    await handleFeedbackAction(ctx, "photo");
  });

  bot.action(CALLBACK_PATTERNS.intentDate, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    ctx.session.step = "awaiting_date";
    ctx.session.intentionId = Number(ctx.match[1]);
    await ctx.reply(getMessages(user.language).chooseDate);
  });

  bot.action(CALLBACK_PATTERNS.intentCat, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    ctx.session.intentionId = Number(ctx.match[1]);
    ctx.session.categoryMode = "attach";
    await showCategoryPicker(ctx, user.language);
  });

  bot.action(CALLBACK_PATTERNS.intentDone, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    await finalizeIntentionConfig(ctx, user, Number(ctx.match[1]));
  });

  bot.action(CALLBACK_PATTERNS.intentSelect, async (ctx) => {
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
    const dateButtonLabel = item.date ? messages.editDate : messages.addDate;
    const buttons = [
      Markup.button.callback(dateButtonLabel, callbackData.intentAddDate(intentionId)),
      Markup.button.callback(messages.editIntention, callbackData.intentEdit(intentionId)),
      Markup.button.callback(messages.deleteIntention, callbackData.intentDelete(intentionId)),
    ];
    const body = dateLabel ? `${text}\n${dateLabel}` : text;
    await ctx.reply(body, Markup.inlineKeyboard([buttons]));
  });

  bot.action(CALLBACK_PATTERNS.intentAddDate, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    ctx.session.step = "awaiting_date";
    ctx.session.intentionId = Number(ctx.match[1]);
    await ctx.reply(getMessages(user.language).chooseDate);
  });

  bot.action(CALLBACK_PATTERNS.intentEdit, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    ctx.session.step = "awaiting_edit_text";
    ctx.session.intentionId = Number(ctx.match[1]);
    await ctx.reply(getMessages(user.language).addPrompt);
  });

  bot.action(CALLBACK_PATTERNS.intentDelete, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    await deleteIntention(user.id, Number(ctx.match[1]));
    clearSession(ctx);
    await ctx.reply(getMessages(user.language).intentionDeleted, mainMenuKeyboard(user.language));
  });

  bot.action(CALLBACK_PATTERNS.catPick, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    const intentionId = Number(ctx.match[1]);
    const categoryId = Number(ctx.match[2]);
    await setIntentionCategory(user.id, intentionId, categoryId);
    ctx.session.step = undefined;
    ctx.session.categoryMode = undefined;
  });

  bot.action(CALLBACK_PATTERNS.catNew, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    ctx.session.step = "awaiting_new_category";
    ctx.session.intentionId = Number(ctx.match[1]);
    ctx.session.categoryMode = "attach";
    await ctx.reply(getMessages(user.language).categoryPrompt);
  });

  bot.action(CALLBACKS.catAdd, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    ctx.session.step = "awaiting_new_category";
    ctx.session.categoryMode = "manage";
    await ctx.reply(getMessages(user.language).categoryPrompt);
  });

  bot.action(CALLBACK_PATTERNS.catShow, async (ctx) => {
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
          [Markup.button.callback(messages.mainMenu.add, callbackData.catAddIntention(categoryId))],
        ])
      );
      return;
    }
    const buttons = intentions.map((item) => {
      const text = safeDecrypt(item);
      const dateLabel = item.date ? formatDateForUser(item.date, user.language) : null;
      const label = dateLabel ? `${text} - ${dateLabel}` : text;
      return [Markup.button.callback(trimText(label), callbackData.intentSelect(item.id))];
    });
    const header = category?.name
      ? user.language === "uk"
        ? `Мої ${category.name} наміри`
        : `My ${category.name} intentions`
      : messages.intentionsHeader;
    await ctx.reply(header, Markup.inlineKeyboard(buttons));
  });

  bot.action(CALLBACK_PATTERNS.catAddIntention, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    await startAddIntention(ctx, Number(ctx.match[1]));
  });

  bot.action(CALLBACKS.catBack, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    await showCategories(ctx);
  });

  bot.action(CALLBACKS.startNewMonth, async (ctx) => {
    await ctx.answerCbQuery();
    await startAddIntention(ctx);
  });

  bot.action(CALLBACKS.freeTextYes, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    const text = ctx.session.pendingIntentionText?.trim();
    if (!text) {
      clearSession(ctx);
      await ctx.reply(getMessages(user.language).otherAction, mainMenuKeyboard(user.language));
      return;
    }
    const encrypted = encryptText(text);
    const intention = await addIntention(user.id, null, encrypted);
    ctx.session.step = undefined;
    ctx.session.intentionId = intention.id;
    await enterIntentionConfigMode(ctx, user.id, user.language, intention.id);
  });

  bot.action(CALLBACKS.freeTextNo, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    clearSession(ctx);
    await ctx.reply(getMessages(user.language).otherAction, mainMenuKeyboard(user.language));
  });

  bot.action(CALLBACKS.reflectNo, async (ctx) => {
    await ctx.answerCbQuery();
  });

  bot.action(CALLBACKS.reflectYes, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    await startReflectionMode(ctx, user.language);
  });

  bot.on("photo", async (ctx) => {
    if (ctx.session.reflectionMode) {
      collectReflectionPhoto(ctx);
      return;
    }
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

    if (ctx.session.reflectionMode) {
      await handleReflectionInput(ctx, user, text);
      return;
    }

    if (ctx.session.intentionConfigMode) {
      const action = getIntentionConfigAction(text, messages);
      if (action === "add_date") {
        const intentionId = ctx.session.intentionId;
        if (!intentionId) return;
        ctx.session.step = "awaiting_date";
        const keyboard = await buildIntentionConfigKeyboard(user, intentionId);
        await ctx.reply(messages.chooseDate, keyboard);
        return;
      }
      if (action === "add_category") {
        const intentionId = ctx.session.intentionId;
        if (!intentionId) return;
        ctx.session.categoryMode = "attach";
        await showCategoryPicker(ctx, user.language);
        return;
      }
      if (action === "done") {
        await finalizeIntentionConfig(ctx, user, ctx.session.intentionId);
        return;
      }
    }

    if (!ctx.session.step) {
      if (!text || text.startsWith("/")) return;
      ctx.session.step = "awaiting_free_text_confirm";
      ctx.session.pendingIntentionText = text;
      await ctx.reply(
        messages.freeTextPrompt,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(messages.confirmYes, CALLBACKS.freeTextYes),
            Markup.button.callback(messages.confirmNo, CALLBACKS.freeTextNo),
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
      await enterIntentionConfigMode(ctx, user.id, user.language, intention.id);
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
        Markup.inlineKeyboard([
          [Markup.button.callback(messages.mainMenu.add, callbackData.catAddIntention(category.id))],
        ])
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
            Markup.button.callback(messages.confirmYes, CALLBACKS.freeTextYes),
            Markup.button.callback(messages.confirmNo, CALLBACKS.freeTextNo),
          ],
        ])
      );
    }
  });

  return bot;
}

async function sendLanguageSelection(ctx: BotContext): Promise<void> {
  await sendWelcomeImage(ctx, "Welcome to intentions bot ✨");
  await ctx.reply(
    "Do you want to change language / Бажаеш змінити мову?",
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
    messages.intro,
    mainMenuKeyboard(language)
  );
  await ctx.reply(
    messages.privacy,
    Markup.inlineKeyboard([[Markup.button.callback(messages.learnMore, CALLBACKS.learnMore)]])
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
  await ctx.reply(getMessages(user.language).addPrompt, mainMenuKeyboard(user.language));
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
      trimText(item.dateLabel ? `${item.text} - ${item.dateLabel}` : item.text),
      callbackData.intentSelect(item.id)
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
      Markup.inlineKeyboard([[Markup.button.callback(messages.addNewCategory, CALLBACKS.catAdd)]])
    );
    return;
  }
  const buttons = categories.map((category) => [
    Markup.button.callback(category.name, callbackData.catShow(category.id)),
  ]);
  buttons.push([Markup.button.callback(messages.addNewCategory, CALLBACKS.catAdd)]);
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
  if (!intentionId) return;
  const buttons = categories.map((category) => [
    Markup.button.callback(category.name, callbackData.catPick(intentionId, category.id)),
  ]);
  buttons.push([Markup.button.callback(messages.addNewCategory, callbackData.catNew(intentionId))]);
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

function clearSession(ctx: BotContext): void {
  ctx.session.step = undefined;
  ctx.session.intentionId = undefined;
  ctx.session.intentionConfigMode = undefined;
  ctx.session.feedbackDate = undefined;
  ctx.session.categoryMode = undefined;
  ctx.session.pendingIntentionText = undefined;
  ctx.session.preselectedCategoryId = undefined;
}

function clearReflectionSession(ctx: BotContext): void {
  ctx.session.reflectionMode = undefined;
  ctx.session.reflectionTextParts = undefined;
  ctx.session.reflectionPhotoFileIds = undefined;
  ctx.session.reflectionStartedAt = undefined;
}

async function handleFeedbackAction(
  ctx: BotContext,
  action: "write" | "photo" | "skip"
): Promise<void> {
  await ctx.answerCbQuery();
  const user = await requireUser(ctx);
  if (!user) return;
  const messages = getMessages(user.language);
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
}

async function startReflectionMode(ctx: BotContext, language: Language): Promise<void> {
  clearSession(ctx);
  ctx.session.reflectionMode = true;
  ctx.session.reflectionTextParts = [];
  ctx.session.reflectionPhotoFileIds = [];
  ctx.session.reflectionStartedAt = Date.now();
  await ctx.reply(getMessages(language).reflectionInstructions, reflectionModeKeyboard(language));
}

function collectReflectionPhoto(ctx: BotContext): void {
  const message = ctx.message;
  if (!message || !("photo" in message)) return;
  const photo = message.photo[message.photo.length - 1];
  if (!photo) return;
  if (!ctx.session.reflectionPhotoFileIds) {
    ctx.session.reflectionPhotoFileIds = [];
  }
  ctx.session.reflectionPhotoFileIds.push(photo.file_id);
}

async function handleReflectionInput(
  ctx: BotContext,
  user: { id: number; language: Language },
  text: string
): Promise<void> {
  const messages = getMessages(user.language);
  if (text === messages.reflectionDone) {
    await finishReflection(ctx, user);
    return;
  }
  if (text === messages.reflectionCancel) {
    await cancelReflection(ctx, user.language);
    return;
  }
  if (!text || text.startsWith("/")) return;
  if (!ctx.session.reflectionTextParts) {
    ctx.session.reflectionTextParts = [];
  }
  ctx.session.reflectionTextParts.push(text);
}

async function finishReflection(
  ctx: BotContext,
  user: { id: number; language: Language }
): Promise<void> {
  const text = ctx.session.reflectionTextParts?.join("\n") ?? "";
  const photoFileIds = ctx.session.reflectionPhotoFileIds ?? [];
  const encrypted = encryptText(text);
  const date = getMadridToday();
  await addReflection(user.id, date, encrypted, photoFileIds);
  clearReflectionSession(ctx);
  await ctx.reply(getMessages(user.language).reflectionSaved, mainMenuKeyboard(user.language));
}

async function cancelReflection(ctx: BotContext, language: Language): Promise<void> {
  clearReflectionSession(ctx);
  await ctx.reply(getMessages(language).reflectionCancelAck, mainMenuKeyboard(language));
}

function scheduleReflectionPrompt(ctx: BotContext, language: Language): void {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const telegram = ctx.telegram;
  const messages = getMessages(language);
  setTimeout(() => {
    telegram
      .sendMessage(chatId, messages.reflectionPrompt, reflectionPromptKeyboard(language))
      .catch(() => {
        // Ignore delivery failures for delayed prompts.
      });
  }, 10_000);
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

async function sendWelcomeImage(ctx: BotContext, caption?: string): Promise<void> {
  const source = fs.createReadStream(WELCOME_IMAGE_PATH);
  await ctx.replyWithPhoto({ source }, caption ? { caption } : undefined);
}

async function tryReact(ctx: BotContext, emoji: TelegramEmoji): Promise<void> {
  try {
    await ctx.react(emoji);
  } catch {
    // Ignore reaction failures (e.g., unsupported by client or bot API).
  }
}

async function enterIntentionConfigMode(
  ctx: BotContext,
  userId: number,
  language: Language,
  intentionId: number
): Promise<void> {
  const config = await getIntentionConfig(userId, intentionId);
  if (!config) return;
  ctx.session.intentionConfigMode = true;
  ctx.session.intentionId = intentionId;
  const keyboard = intentionConfigKeyboard(language, !config.category_id);
  await ctx.reply(getMessages(language).configMenuPrompt, keyboard);
}

async function buildIntentionConfigKeyboard(
  user: { id: number; language: Language },
  intentionId: number
) {
  const config = await getIntentionConfig(user.id, intentionId);
  return intentionConfigKeyboard(user.language, !config?.category_id);
}

function getIntentionConfigAction(
  text: string,
  messages: ReturnType<typeof getMessages>
): "add_date" | "add_category" | "done" | null {
  if (text === messages.addDateAction) return "add_date";
  if (text === messages.addCategoryAction) return "add_category";
  if (text === messages.doneAction) return "done";
  return null;
}

async function finalizeIntentionConfig(
  ctx: BotContext,
  user: { id: number; language: Language },
  intentionId?: number
): Promise<void> {
  if (!intentionId) return;
  const config = await getIntentionConfig(user.id, intentionId);
  if (!config) {
    clearSession(ctx);
    await ctx.reply(getMessages(user.language).noIntentions, mainMenuKeyboard(user.language));
    return;
  }
  const messages = getMessages(user.language);
  clearSession(ctx);
  await ctx.reply(messages.savedSummaryTitle, mainMenuKeyboard(user.language));
  scheduleReflectionPrompt(ctx, user.language);
}

async function exitIntentionConfigMode(
  ctx: BotContext,
  language: Language,
  options: { sendKeyboard: boolean }
): Promise<void> {
  if (!ctx.session.intentionConfigMode) return;
  ctx.session.intentionConfigMode = undefined;
  ctx.session.intentionId = undefined;
  ctx.session.step = undefined;
  ctx.session.categoryMode = undefined;
  if (options.sendKeyboard) {
    await ctx.reply("show", mainMenuKeyboard(language));
  }
}
