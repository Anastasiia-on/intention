import { Markup } from "telegraf";
import { getMessages, tMainMenu } from "../i18n";
import { Language } from "../types";

export function mainMenuKeyboard(language: Language, opts?: { isAdmin?: boolean }) {
  const menu = tMainMenu(language);
  const rows: string[][] = [[menu.add], [menu.show], [menu.reflections]];
  if (opts?.isAdmin) {
    rows.push([getMessages(language).broadcastButton]);
  }
  return Markup.keyboard(rows).resize();
}
