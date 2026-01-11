import { Markup } from "telegraf";
import { getMessages } from "../i18n";
import { Language } from "../types";

export function intentionConfigKeyboard(language: Language, includeCategory: boolean) {
  const messages = getMessages(language);
  const rows: string[][] = [[messages.addDateAction]];
  if (includeCategory) {
    rows.push([messages.addCategoryAction]);
  }
  rows.push([messages.doneAction]);
  return Markup.keyboard(rows).resize();
}
