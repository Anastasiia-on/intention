import { Markup } from "telegraf";
import { getMessages } from "../i18n";
import { CALLBACKS } from "../callbacks";
import { Language } from "../types";

export function monthlySummaryKeyboard(language: Language) {
  const messages = getMessages(language);
  return Markup.inlineKeyboard([
    [Markup.button.callback(messages.startNewMonth, CALLBACKS.startNewMonth)],
  ]);
}
