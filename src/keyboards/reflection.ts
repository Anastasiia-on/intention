import { Markup } from "telegraf";
import { getMessages } from "../i18n";
import { CALLBACKS, callbackData } from "../callbacks";
import { Language } from "../types";

export function reflectionPromptKeyboard(language: Language, intentionId?: number) {
  const messages = getMessages(language);
  const callback = intentionId ? callbackData.reflectYes(intentionId) : CALLBACKS.reflectYes;
  return Markup.inlineKeyboard([
    [Markup.button.callback(messages.reflectionYes, callback)],
  ]);
}

export function reflectionModeKeyboard(language: Language) {
  const messages = getMessages(language);
  return Markup.keyboard([[messages.reflectionDone], [messages.reflectionCancel]]).resize();
}
