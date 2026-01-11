import { Markup } from "telegraf";
import { tMainMenu } from "../i18n";
import { Language } from "../types";

export function mainMenuKeyboard(language: Language) {
  const menu = tMainMenu(language);
  return Markup.keyboard([[menu.add], [menu.show], [menu.categories]]).resize();
}
