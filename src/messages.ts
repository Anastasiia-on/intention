import { Language } from "./types";

export type Messages = {
  intro: string;
  privacy: string;
  optionalInfo: string;
  learnMore: string;
  mainMenuTitle: string;
  mainMenu: {
    add: string;
    show: string;
    reflections: string;
  };
  addPrompt: string;
  chooseDate: string;
  invalidDateFormat: string;
  invalidDateCalendar: string;
  invalidDatePast: string;
  noIntentions: string;
  noReflections: string;
  intentionsHeader: string;
  reflectionsHeader: string;
  editIntention: string;
  deleteIntention: string;
  addDate: string;
  editDate: string;
  intentionUpdated: string;
  intentionDeleted: string;
  otherAction: string;
  addDateAction: string;
  doneAction: string;
  configMenuPrompt: string;
  configPrompt: string;
  savedSummaryTitle: string;
  savedSummaryIntention: string;
  savedSummaryDate: string;
  tomorrowReminder: string;
  eveningPrompt: string;
  photoReflection: string;
  freeTextPrompt: string;
  confirmYes: string;
  confirmNo: string;
  reflectionPrompt: string;
  reflectionYes: string;
  reflectionNo: string;
  reflectionInstructions: string;
  reflectionDone: string;
  reflectionCancel: string;
  reflectionSaved: string;
  reflectionCancelAck: string;
  broadcastButton: string;
  broadcastBody: string;
  refreshMenuButton: string;
  broadcastSummary: string;
};

export const messages: Record<Language, Messages> = {
  en: {
    intro:
      "Welcome to this space ✨\n" +
      "Here you can gently plan your month\n" +
      "through intentions and short reflections",
    privacy: [
      "Here you can calmly capture what matters to you\n" +
      "at your own pace and without pressure",
      "I care deeply about your privacy\n" +
      "so all intentions and reflections are stored securely",
      "Only you can see the real text\n" +
      "right here in this chat",
    ].join("\n\n"),
    optionalInfo: [
      "With me, you can",
      "",
      "- create intentions at your own pace",
      "- add a date if you want a reminder",
      "- change or rephrase them anytime",
      "",
      "I’ll gently remind you in the morning\n" +
      "about your intention for the day",
      "",
      "And at the end of the month",
      "I’ll help you wrap things up with care ✨",
    ].join("\n"),
    learnMore: "Learn more",
    mainMenuTitle: "Lets continue 🤍",
    mainMenu: {
      add: "Add intention ✨",
      show: "My intentions 🤍",
      reflections: "My reflections 📝",
    },
    addPrompt: "Please, write down your intention",
    chooseDate:
      "You can add a date in any comfortable format\n" +
      "(e.g. January 20 or 20.01.2026)\",",
    invalidDateFormat:
      "Let's try in this format 01.01.2026",
    invalidDateCalendar:
      "This date does not exist\n" +
      "try a real calendar date",
    invalidDatePast:
      "Please choose today or a future date",
    noIntentions: "No intentions yet,\n" +
      "but you can always add them 🤍",
    noReflections: "No reflections yet,\n" +
      "but you can always add them from your intentions menu 🤍",
    intentionsHeader: "Here are your intentions 🤍\n" +
      "You can tap on any of them to edit it\n" +
      "and add a reflection right there",
    reflectionsHeader: "My reflections",
    editIntention: "Edit intention",
    deleteIntention: "Delete",
    addDate: "Add date",
    editDate: "Edit date",
    intentionUpdated: "Updated ✨",
    intentionDeleted: "Deleted",
    otherAction: "What would you like to do next",
    addDateAction: "Add date",
    doneAction: "Save without date",
    configMenuPrompt: "What do you want to do next?",
    configPrompt:
      "What would you like to add",
    savedSummaryTitle:
      "Your intention is saved ✨",
    savedSummaryIntention: "intention",
    savedSummaryDate: "date",
    tomorrowReminder: "Intention for today ✨",
    eveningPrompt:
      "How was your day with today’s intention ✨\n" +
      "Would you like to leave a short reflection or a photo?",
    photoReflection: "Photo reflection",
    freeTextPrompt:
      "Save this as an intention",
    confirmYes: "Yes",
    confirmNo: "No",
    reflectionPrompt:
      "How was your day with today’s intention ✨\n" +
      "Would you like to leave a short reflection or a photo?",
    reflectionYes: "Leave reflection",
    reflectionNo: "Not today",
    reflectionInstructions:
      "You can write a text or send a photo 🤍\n" +
      "When you’re ready, tap Done in the main menu\n" +
      "Or choose Not today if you’d like to skip",
    reflectionDone: "Done",
    reflectionCancel: "Not today",
    reflectionSaved: "Saved ✨",
    reflectionCancelAck: "You can always add a note later from your intentions menu 🤍",
    broadcastButton: "📣 Broadcast",
    broadcastBody: "Hey 🤍\n\n" +
      "The bot got a small update\n" +
      "You can now edit intentions, leave reflections under them,\n" +
      "and write dates in any format that feels right for you\n\n" +
      "Thank you for being here 🤍\n" +
      "If you notice anything that could be made better or more comfortable, feel free to share it with me anytime @an_anastasiya",
    refreshMenuButton: "Refresh the bot 🤍",
    broadcastSummary: "Broadcast sent.\nSent: {sent}\nFailed: {failed}",
  },
  uk: {
    intro:
      "Вітаю в цьому просторі ✨\n" +
      "Тут можна м’яко формувати свій місяць через наміри та короткі підсумки",
    privacy: [
      "Тут можна спокійно фіксувати те, що для тебе важливо — у власному ритмі і без тиску",
      "Я дбайливо ставлюся до твоєї приватності\n" +
      "усі наміри та відгуки зберігаються у зашифрованому вигляді\n" +
      "і бачиш їх тільки ти у цьому чаті",
    ].join("\n\n"),
    optionalInfo: [
      "Зі мною ти можеш",
      "",
      "- створювати наміри у своєму ритмі",
      "- додавати дату, якщо хочеш нагадування",
      "- змінювати або переформульовувати їх у будь-який момент",
      "",
      "Я м’яко нагадаю тобі зранку про намір на сьогодні",
      "",
      "А наприкінці місяця допоможу підсумувати пройдений шлях ✨",
    ].join("\n"),
    learnMore: "Дізнатись більше",
    mainMenuTitle: "Давай продовжимо 🤍",
    mainMenu: {
      add: "Додати намір ✨",
      show: "Мої наміри 🤍",
      reflections: "Мої нотатки 📝",
    },
    addPrompt: "Напиши свій намір 🤍",
    chooseDate: "Можеш додати дату у більш зручному для тебе форматі\n" +
      "(наприклад 20 січня або 20.01.2026)",
    invalidDateFormat:
      "Можеш додати дату у зручному для тебе форматі\n" +
      "(наприклад: 20 січня або 20.01.2026)",
    invalidDateCalendar:
      "Такої дати не існує\n" +
      "спробуй реальну календарну дату",
    invalidDatePast:
      "Обери, будь ласка, сьогоднішню або майбутню дату",
    noIntentions: "Поки що немає намірів\n" +
      "Але ти завжди можеш додати запис з головного меню 🤍",
    noReflections: "Поки що немає записів\n" +
      "Але ти завжди можеш додати запис з головного меню намірів 🤍",
    intentionsHeader: "Ось твої наміри 🤍\n" +
      "Ти можеш натиснути на будь-який з них,\n" +
      "щоб відредагувати його та залишити нотатки прямо там",
    reflectionsHeader: "Ось твої записи ✨",
    editIntention: "Редагувати",
    deleteIntention: "Видалити",
    addDate: "Додати дату",
    editDate: "Змінити дату",
    intentionUpdated: "Оновлено",
    intentionDeleted: "Видалено",
    otherAction: "Що зробимо далі?",
    addDateAction: "Додати дату",
    doneAction: "Зберегти без дати",
    configMenuPrompt: "Що хочеш зробити далі?",
    configPrompt:
      "Що додамо до цього наміру",
    savedSummaryTitle:
      "Твій намір збережено ✨",
    savedSummaryIntention: "намір",
    savedSummaryDate: "дата",
    tomorrowReminder: "Намір на сьогодні ✨",
    eveningPrompt:
      "Як пройшов день із твоїм сьогоднішнім наміром ✨\n" +
      "Хочеш залишити короткий відгук або фото?",
    photoReflection: "Фото відгук",
    freeTextPrompt:
      "Зберегти це як намір",
    confirmYes: "Так",
    confirmNo: "Ні",
    reflectionPrompt:
      "Як пройшов день із твоїм сьогоднішнім наміром ✨\n" +
      "Хочеш залишити короткий відгук або фото?",
   /* reflectionPrompt:
      "Як пройшов день із твоїм сьогоднішнім наміром ✨" +
      "Хочеш залишити короткий відгук або фото?",*/
    reflectionYes: "Залишити відгук",
    reflectionNo: "Не сьогодні",
    reflectionInstructions:
      "Ти можеш написати текст або надіслати фото 🤍\n" +
      "Коли будеш готовий/готова натисни Готово у головному меню\n" +
      "Або обери Не сьогодні, якщо хочеш пропустити",
    reflectionDone: "Готово",
    reflectionCancel: "Не сьогодні",
    reflectionSaved: "Збережено ✨",
    reflectionCancelAck: "Ти завжди можеш додати запис пізніше з меню своїх намірень 🤍",
    broadcastButton: "📣 Broadcast",
    broadcastBody: "Привіт 🤍\n\n" +
      "Бот отримав невелике оновлення:\n" +
      "•тепер можна редагувати наміри\n" +
      "•залишати під ними нотатки\n" +
      "•та писати дату в більш зручному форматі\n\n" +
      "Дякую, що ти тут 🤍\n" +
      "Якщо помітиш щось, що можна зробити краще або зручніше завжди можеш поділитися зі мною  @an_anastasiya",
    refreshMenuButton: "Підтягнути оновлення 🤍",
    broadcastSummary: "Розсилка надіслана.\nНадіслано: {sent}\nПомилок: {failed}",
  },
};
