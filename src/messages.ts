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
    mainMenuTitle: "Main menu",
    mainMenu: {
      add: "Add your intention",
      show: "Show all my intentions",
      reflections: "Show all reflections",
    },
    addPrompt: "Write your intention for today",
    chooseDate:
      "Please, pick a date\n" +
      "format YYYY-MM-DD\n" +
      "example 2026-01-05",
    invalidDateFormat:
      "Format should be YYYY-MM-DD\n" +
      "example 2026-01-05",
    invalidDateCalendar:
      "This date does not exist\n" +
      "try a real calendar date",
    invalidDatePast:
      "Please choose a date after today",
    noIntentions: "No intentions yet",
    noReflections: "No reflections yet",
    intentionsHeader: "My intentions",
    reflectionsHeader: "My reflections",
    editIntention: "Edit",
    deleteIntention: "Delete",
    addDate: "Add date",
    editDate: "Edit date",
    intentionUpdated: "Updated ✨",
    intentionDeleted: "Deleted",
    otherAction:
      "What would you like to do next",
    addDateAction: "Add date",
    doneAction: "Done",
    configMenuPrompt: "Add date to this intention?",
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
      "You can send a text and or a photo\n" +
      "When you’re ready, tap Done",
    reflectionDone: "Done",
    reflectionCancel: "Not today",
    reflectionSaved: "Saved ✨",
    reflectionCancelAck: "Ok",
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
    mainMenuTitle: "Головне меню",
    mainMenu: {
      add: "Додати намір",
      show: "Мої нотатки ",
      reflections: "Мої відгуки",
    },
    addPrompt: "Напиши свій намір",
    chooseDate: "Можеш додати дату у форматі YYYY-MM-DD",
    invalidDateFormat:
      "Можеш додати дату у форматі YYYY-MM-DD" +
      "приклад 2026-01-05",
    invalidDateCalendar:
      "Такої дати не існує\n" +
      "спробуй реальну календарну дату",
    invalidDatePast:
      "Обери, будь ласка, дату пізніше за сьогодні",
    noIntentions: "Поки що немає намірів",
    noReflections: "Поки що немає відгуків",
    intentionsHeader: "Мої наміри",
    reflectionsHeader: "Мої відгуки",
    editIntention: "Редагувати",
    deleteIntention: "Видалити",
    addDate: "Додати дату",
    editDate: "Змінити дату",
    intentionUpdated: "Оновлено",
    intentionDeleted: "Видалено",
    otherAction:
      "Що хочеш зробити далі",
    addDateAction: "Додати дату",
    doneAction: "Готово",
    configMenuPrompt: "Додати дату до цього наміру?",
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
      "Можеш надіслати текст та або фото\n" +
      "Коли будеш готова - натисни \"Готово\"",
    reflectionDone: "Готово",
    reflectionCancel: "Не сьогодні",
    reflectionSaved: "Збережено ✨",
    reflectionCancelAck: "Добре",
  },
};
