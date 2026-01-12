import { Markup } from "telegraf";
import { getMessages } from "../i18n";
import { CALLBACKS } from "../callbacks";
import { Language } from "../types";

export function reflectionPromptKeyboard(language: Language) {
  const messages = getMessages(language);
  return Markup.inlineKeyboard([
    [Markup.button.callback(messages.reflectionYes, CALLBACKS.reflectYes)],
  ]);
}

export function reflectionModeKeyboard(language: Language) {
  const messages = getMessages(language);
  return Markup.keyboard([[messages.reflectionDone], [messages.reflectionCancel]]).resize();
}
