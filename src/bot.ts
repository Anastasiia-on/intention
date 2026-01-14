import { Context, Markup, Telegraf, session } from "telegraf";
import { parse } from "chrono-node";
import fs from "node:fs";
import path from "node:path";
import {
  addIntention,
  addReflection,
  deleteIntention,
  ensureAdminUser,
  getUserByTelegramId,
  getIntentionConfig,
  listReflectionsForUser,
  listIntentionsForUser,
  listUsersForBroadcast,
  setIntentionDate,
  upsertUserLanguage,
  updateIntentionText,
  updateUserProfile,
} from "./db";
import { decryptText, encryptText } from "./crypto/encryption";
import { getMessages, tMainMenu } from "./i18n";
import { formatDateForUser } from "./utils";
import { Language, User } from "./types";
import { normalizeDateText } from "./dictionary";
import { CALLBACKS, CALLBACK_PATTERNS, callbackData } from "./callbacks";
import { mainMenuKeyboard } from "./keyboards/mainMenu";
import { reflectionModeKeyboard } from "./keyboards/reflection";
import { intentionConfigKeyboard } from "./keyboards/replyMenu";
import { config } from "./config";

type Step =
  | "awaiting_intention_text"
  | "awaiting_date"
  | "awaiting_edit_text"
  | "awaiting_free_text_confirm";

type SessionData = {
  language?: Language;
  step?: Step;
  intentionId?: number;
  intentionConfigMode?: boolean;
  pendingIntentionText?: string;
  reflectionMode?: boolean;
  reflectionTextParts?: string[];
  reflectionPhotoFileIds?: string[];
  reflectionStartedAt?: number;
  reflectionIntentionId?: number;
  reflectionIntentionSetAt?: number;
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
    if (config.adminTelegramId === telegramId && !user.is_admin) {
      await ensureAdminUser(telegramId);
      user.is_admin = true;
    }
    ctx.session.language = user.language;
    await sendIntroAndMenu(ctx, user.language, user.is_admin);
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
    console.log('addd int')
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

  bot.hears([tMainMenu("en").reflections, tMainMenu("uk").reflections], async (ctx) => {
    if (ctx.session.reflectionMode) return;
    const user = await requireUser(ctx);
    if (!user) return;
    await exitIntentionConfigMode(ctx, user.language, { sendKeyboard: true });
    await showReflections(ctx);
  });
  bot.action(CALLBACKS.learnMore, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    const messages = getMessages(user.language);
    await ctx.reply(messages.optionalInfo, mainMenuKeyboard(user.language, { isAdmin: user.is_admin }));
  });

  bot.action(CALLBACK_PATTERNS.intentDate, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    ctx.session.step = "awaiting_date";
    ctx.session.intentionId = Number(ctx.match[1]);
    await ctx.reply(getMessages(user.language).chooseDate);
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
    ctx.session.intentionId = intentionId;
    ctx.session.reflectionIntentionId = intentionId;
    ctx.session.reflectionIntentionSetAt = Date.now();
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
    await ctx.reply(
      body,
      Markup.inlineKeyboard([
        buttons,
        [Markup.button.callback(messages.reflectionYes, callbackData.reflectYes(intentionId))],
      ])
    );
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
    await ctx.reply(
      getMessages(user.language).intentionDeleted,
      mainMenuKeyboard(user.language, { isAdmin: user.is_admin })
    );
  });

  bot.action(CALLBACKS.freeTextYes, async (ctx) => {
    console.log('free int')
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    const text = ctx.session.pendingIntentionText?.trim();
    if (!text) {
      clearSession(ctx);
      await ctx.reply(
        getMessages(user.language).otherAction,
        mainMenuKeyboard(user.language, { isAdmin: user.is_admin })
      );
      return;
    }
    const encrypted = encryptText(text);
    const intention = await addIntention(user.id, encrypted);
    ctx.session.step = undefined;
    ctx.session.intentionId = intention.id;
    await enterIntentionConfigMode(ctx, user.id, user.language, intention.id);
  });

  bot.action(CALLBACKS.freeTextNo, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    clearSession(ctx);
    await ctx.reply(
      getMessages(user.language).otherAction,
      mainMenuKeyboard(user.language, { isAdmin: user.is_admin })
    );
  });

  bot.action(CALLBACKS.reflectNo, async (ctx) => {
    await ctx.answerCbQuery();
  });

  bot.action(CALLBACKS.reflectYes, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    const intentionId = getRecentReflectionIntentionId(ctx);
    await startReflectionMode(ctx, user.language, intentionId);
  });

  bot.action(CALLBACK_PATTERNS.reflectYes, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    const intentionId = Number(ctx.match[1]);
    await startReflectionMode(ctx, user.language, intentionId);
  });

  bot.action(CALLBACKS.broadcastNo, async (ctx) => {
    await ctx.answerCbQuery();
  });

  bot.action(CALLBACKS.broadcastYes, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user || !user.is_admin) return;
    const messages = getMessages(user.language);
    const { sentCount, failedCount } = await broadcastToAllUsers(bot);
    await ctx.reply(
      formatBroadcastSummary(messages, sentCount, failedCount),
      mainMenuKeyboard(user.language, { isAdmin: user.is_admin })
    );
  });

  bot.action(CALLBACKS.refreshMenu, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireUser(ctx);
    if (!user) return;
    const messages = getMessages(user.language);
    await ctx.reply(messages.mainMenuTitle, mainMenuKeyboard(user.language, { isAdmin: user.is_admin }));
  });

  bot.on("photo", async (ctx) => {
    if (ctx.session.reflectionMode) {
      collectReflectionPhoto(ctx);
      return;
    }
  });

  bot.on("text", async (ctx) => {
    const user = await requireUser(ctx);
    if (!user) return;
    const messages = getMessages(user.language);
    const text = ctx.message.text.trim();
    const isAdmin = user.is_admin;
    if (isAdmin && text === messages.broadcastButton) {
      await ctx.reply(
        messages.broadcastBody,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(messages.confirmYes, CALLBACKS.broadcastYes),
            Markup.button.callback(messages.confirmNo, CALLBACKS.broadcastNo),
          ],
        ])
      );
      return;
    }
    const menuEn = tMainMenu("en");
    const menuUk = tMainMenu("uk");
    if (
      text === menuEn.add ||
      text === menuEn.show ||
      text === menuEn.reflections ||
      text === menuUk.add ||
      text === menuUk.show ||
      text === menuUk.reflections ||
      text === "English" ||
      text === "Українська"
    ) {
      return;
    }

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
        const keyboard = await buildIntentionConfigKeyboard(user);
        await ctx.reply(messages.chooseDate, keyboard);
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
      const intention = await addIntention(user.id, encrypted);
      ctx.session.step = undefined;
      ctx.session.intentionId = intention.id;
      await enterIntentionConfigMode(ctx, user.id, user.language, intention.id);
      return;
    }

    if (ctx.session.step === "awaiting_date") {
      const { normalizedDate, error } = validateDateInput(text, messages);
      if (error) {
        await ctx.reply(error);
        return;
      }
      if (!normalizedDate) return;
      const intentionId = ctx.session.intentionId;
      if (!intentionId) return;
      await setIntentionDate(user.id, intentionId, normalizedDate);
      await finalizeIntentionConfig(ctx, user, intentionId);
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
      await ctx.reply(messages.intentionUpdated, mainMenuKeyboard(user.language, { isAdmin: user.is_admin }));
      return;
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
  const user = await upsertUserLanguage(telegramId, language, {
    firstName: ctx.from?.first_name ?? null,
    lastName: ctx.from?.last_name ?? null,
    username: ctx.from?.username ?? null,
  });
  ctx.session.language = user.language;
  if (config.adminTelegramId === telegramId && !user.is_admin) {
    await ensureAdminUser(telegramId);
    user.is_admin = true;
  }
  await sendIntroAndMenu(ctx, language, user.is_admin);
}

async function sendIntroAndMenu(ctx: BotContext, language: Language, isAdmin = false): Promise<void> {
  const messages = getMessages(language);
  await ctx.reply(
    messages.intro,
    mainMenuKeyboard(language, { isAdmin })
  );
  await ctx.reply(
    messages.privacy,
    Markup.inlineKeyboard([[Markup.button.callback(messages.learnMore, CALLBACKS.learnMore)]])
  );
}

async function startAddIntention(ctx: BotContext): Promise<void> {
  const user = await requireUser(ctx);
  if (!user) return;
  clearSession(ctx);
  ctx.session.step = "awaiting_intention_text";
  await ctx.reply(getMessages(user.language).addPrompt, mainMenuKeyboard(user.language, { isAdmin: user.is_admin }));
}

async function showIntentions(ctx: BotContext): Promise<void> {
  const user = await requireUser(ctx);
  if (!user) return;
  const messages = getMessages(user.language);
  const intentions = await listIntentionsForUser(user.id);
  if (intentions.length === 0) {
    await ctx.reply(messages.noIntentions, mainMenuKeyboard(user.language, { isAdmin: user.is_admin }));
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

async function showReflections(ctx: BotContext): Promise<void> {
  const user = await requireUser(ctx);
  if (!user) return;
  const messages = getMessages(user.language);
  const reflections = await listReflectionsForUser(user.id);
  if (reflections.length === 0) {
    await ctx.reply(messages.noReflections, mainMenuKeyboard(user.language, { isAdmin: user.is_admin }));
    return;
  }
  await ctx.reply(messages.reflectionsHeader, mainMenuKeyboard(user.language, { isAdmin: user.is_admin }));
  for (const item of reflections) {
    const text = safeDecrypt(item);
    const hasIntentionPayload =
      !!item.intention_ciphertext_b64 &&
      !!item.intention_iv_b64 &&
      !!item.intention_auth_tag_b64;
    const intentionText = hasIntentionPayload
      ? safeDecrypt({
          ciphertext_b64: item.intention_ciphertext_b64!,
          iv_b64: item.intention_iv_b64!,
          auth_tag_b64: item.intention_auth_tag_b64!,
        })
      : "";
    const label = intentionText || text || messages.photoReflection;
    const caption = intentionText && text ? `✨${label}:\n${text}` : `✨${label}`;
    if (item.photo_file_ids && item.photo_file_ids.length > 0) {
      const [first, ...rest] = item.photo_file_ids;
      await ctx.replyWithPhoto(first, { caption });
      for (const photoId of rest) {
        await ctx.replyWithPhoto(photoId);
      }
      continue;
    }
    await ctx.reply(caption);
  }
}

async function broadcastToAllUsers(
  bot: Telegraf<BotContext>
): Promise<{ sentCount: number; failedCount: number }> {
  const users = await listUsersForBroadcast();
  let sentCount = 0;
  let failedCount = 0;
  for (const user of users) {
    if (!user.telegram_id) continue;
    try {
      const messages = getMessages(user.language);
      const refreshKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback(messages.refreshMenuButton, CALLBACKS.refreshMenu)],
      ]);
      await bot.telegram.sendMessage(user.telegram_id, messages.broadcastBody, refreshKeyboard);
      sentCount += 1;
    } catch {
      failedCount += 1;
    }
  }
  return { sentCount, failedCount };
}

function formatBroadcastSummary(
  messages: ReturnType<typeof getMessages>,
  sentCount: number,
  failedCount: number
): string {
  return messages.broadcastSummary
    .replace("{sent}", String(sentCount))
    .replace("{failed}", String(failedCount));
}

async function requireUser(ctx: BotContext): Promise<User | null> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return null;
  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    await sendLanguageSelection(ctx);
    return null;
  }
  if (config.adminTelegramId === telegramId && !user.is_admin) {
    await ensureAdminUser(telegramId);
    user.is_admin = true;
  }
  await updateUserProfile(telegramId, {
    firstName: ctx.from?.first_name ?? null,
    lastName: ctx.from?.last_name ?? null,
    username: ctx.from?.username ?? null,
  });
  ctx.session.language = user.language;
  return user;
}

function clearSession(ctx: BotContext): void {
  ctx.session.step = undefined;
  ctx.session.intentionId = undefined;
  ctx.session.intentionConfigMode = undefined;
  ctx.session.pendingIntentionText = undefined;
}

function clearReflectionSession(ctx: BotContext): void {
  ctx.session.reflectionMode = undefined;
  ctx.session.reflectionTextParts = undefined;
  ctx.session.reflectionPhotoFileIds = undefined;
  ctx.session.reflectionStartedAt = undefined;
  ctx.session.reflectionIntentionId = undefined;
  ctx.session.reflectionIntentionSetAt = undefined;
}

async function startReflectionMode(
  ctx: BotContext,
  language: Language,
  intentionId?: number
): Promise<void> {
  clearSession(ctx);
  ctx.session.reflectionMode = true;
  ctx.session.reflectionTextParts = [];
  ctx.session.reflectionPhotoFileIds = [];
  ctx.session.reflectionStartedAt = Date.now();
  ctx.session.reflectionIntentionId = intentionId;
  ctx.session.reflectionIntentionSetAt = intentionId ? Date.now() : undefined;
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
  user: User,
  text: string
): Promise<void> {
  const messages = getMessages(user.language);
  if (text === messages.reflectionDone) {
    await finishReflection(ctx, user);
    return;
  }
  if (text === messages.reflectionCancel) {
    await cancelReflection(ctx, user);
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
  user: User
): Promise<void> {
  const text = ctx.session.reflectionTextParts?.join("\n") ?? "";
  const photoFileIds = ctx.session.reflectionPhotoFileIds ?? [];
  const encrypted = encryptText(text);
  const date = getMadridToday();
  await addReflection(user.id, date, encrypted, photoFileIds, ctx.session.reflectionIntentionId);
  clearReflectionSession(ctx);
  await ctx.reply(
    getMessages(user.language).reflectionSaved,
    mainMenuKeyboard(user.language, { isAdmin: user.is_admin })
  );
}

async function cancelReflection(ctx: BotContext, user: User): Promise<void> {
  clearReflectionSession(ctx);
  await ctx.reply(
    getMessages(user.language).reflectionCancelAck,
    mainMenuKeyboard(user.language, { isAdmin: user.is_admin })
  );
}

function validateDateInput(
  input: string,
  messages: ReturnType<typeof getMessages>
): { normalizedDate: string | null; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { normalizedDate: null, error: messages.invalidDateFormat };
  }
  const isIsoFormat = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  if (isIsoFormat) {
    const [year, month, day] = trimmed.split("-").map((value) => Number(value));
    if (!isValidCalendarDate(year, month, day)) {
      return { normalizedDate: null, error: messages.invalidDateCalendar };
    }
    const today = getMadridToday();
    if (trimmed < today) {
      return { normalizedDate: null, error: messages.invalidDatePast };
    }
    return { normalizedDate: trimmed, error: null };
  }
  const dotted = parseDottedDate(trimmed);
  if (dotted) {
    const today = getMadridToday();
    if (dotted < today) {
      return { normalizedDate: null, error: messages.invalidDatePast };
    }
    return { normalizedDate: dotted, error: null };
  }
  const normalizedText = normalizeDateText(trimmed);
  if (normalizedText === "today") {
    return { normalizedDate: getMadridToday(), error: null };
  }
  if (normalizedText === "tomorrow") {
    return { normalizedDate: getMadridDatePlusDays(1), error: null };
  }
  if (normalizedText === "yesterday") {
    return { normalizedDate: null, error: messages.invalidDatePast };
  }
  const parsedResults = parse(normalizedText ?? trimmed, getMadridReferenceDate(), { forwardDate: true });
  const parsedResult = parsedResults[0];
  if (!parsedResult) {
    return { normalizedDate: null, error: messages.invalidDateFormat };
  }
  const parsedStart = parsedResult.start;
  if (
    parsedStart.isCertain("year") &&
    parsedStart.isCertain("month") &&
    parsedStart.isCertain("day")
  ) {
    const year = parsedStart.get("year");
    const month = parsedStart.get("month");
    const day = parsedStart.get("day");
    if (
      year == null ||
      month == null ||
      day == null ||
      !isValidCalendarDate(year, month, day)
    ) {
      return { normalizedDate: null, error: messages.invalidDateCalendar };
    }
  }
  const parsed = parsedResult.start.date();
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return { normalizedDate: null, error: messages.invalidDateFormat };
  }
  const normalizedDate = formatMadridDate(parsed);
  const today = getMadridToday();
  if (normalizedDate < today) {
    return { normalizedDate: null, error: messages.invalidDatePast };
  }
  return { normalizedDate, error: null };
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

function getMadridReferenceDate(): Date {
  const [year, month, day] = getMadridToday().split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function getMadridDatePlusDays(days: number): string {
  const [year, month, day] = getMadridToday().split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);
  return formatMadridDate(base);
}

function formatMadridDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

function parseDottedDate(input: string): string | null {
  const match = input.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!isValidCalendarDate(year, month, day)) return null;
  const monthStr = `${month}`.padStart(2, "0");
  const dayStr = `${day}`.padStart(2, "0");
  return `${year}-${monthStr}-${dayStr}`;
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

function getRecentReflectionIntentionId(ctx: BotContext): number | undefined {
  const intentionId = ctx.session.reflectionIntentionId;
  const setAt = ctx.session.reflectionIntentionSetAt ?? 0;
  if (!intentionId) return undefined;
  if (Date.now() - setAt > 10 * 60 * 1000) return undefined;
  return intentionId;
}

async function sendWelcomeImage(ctx: BotContext, caption?: string): Promise<void> {
  const source = fs.createReadStream(WELCOME_IMAGE_PATH);
  await ctx.replyWithPhoto({ source }, caption ? { caption } : undefined);
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
  const keyboard = intentionConfigKeyboard(language);
  await ctx.reply(getMessages(language).configMenuPrompt, keyboard);
}

async function buildIntentionConfigKeyboard(
  user: User,
) {
  return intentionConfigKeyboard(user.language);
}

function getIntentionConfigAction(
  text: string,
  messages: ReturnType<typeof getMessages>
): "add_date" | "done" | null {
  if (text === messages.addDateAction) return "add_date";
  if (text === messages.doneAction) return "done";
  return null;
}

async function finalizeIntentionConfig(
  ctx: BotContext,
  user: User,
  intentionId?: number
): Promise<void> {
  if (!intentionId) return;
  const config = await getIntentionConfig(user.id, intentionId);
  if (!config) {
    clearSession(ctx);
    await ctx.reply(getMessages(user.language).noIntentions, mainMenuKeyboard(user.language, { isAdmin: user.is_admin }));
    return;
  }
  const messages = getMessages(user.language);
  clearSession(ctx);
  await ctx.reply(messages.savedSummaryTitle, mainMenuKeyboard(user.language, { isAdmin: user.is_admin }));
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
  if (options.sendKeyboard) {
    await ctx.reply(getMessages(language).mainMenuTitle, mainMenuKeyboard(language));
  }
}
