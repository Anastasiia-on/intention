import { Markup } from "telegraf";
import { getMessages } from "../i18n";
import { Language } from "../types";

export function intentionConfigKeyboard(language: Language) {
  const messages = getMessages(language);
  const rows: string[][] = [[messages.addDateAction], [messages.doneAction]];
  return Markup.keyboard(rows).resize();
}
