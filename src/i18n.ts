import { Language } from "./types";
import { messages } from "./messages";
import type { Messages } from "./messages";
export function tMainMenu(lang: Language) {
  return messages[lang].mainMenu;
}
export function getMessages(lang: Language): Messages {
  return messages[lang];
}
