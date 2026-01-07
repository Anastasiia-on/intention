import { Language } from "./types";
type Messages = {
  intro: string;
  privacy: string;
  optionalInfo: string;
  learnMore: string;
  mainMenu: {
    add: string;
    show: string;
    categories: string;
  };
  addPrompt: string;
  chooseDate: string;
  chooseCategory: string;
  invalidDateFormat: string;
  invalidDateCalendar: string;
  invalidDatePast: string;
  categoryPrompt: string;
  noIntentions: string;
  noCategories: string;
  intentionsHeader: string;
  editIntention: string;
  deleteIntention: string;
  addDate: string;
  editDate: string;
  intentionUpdated: string;
  intentionDeleted: string;
  categoriesHeader: string;
  addNewCategory: string;
  categoryEmpty: string;
  addFirstIntention: string;
  addIntentionAfterCategoryPrompt: string;
  otherAction: string;
  addDateAction: string;
  addCategoryAction: string;
  doneAction: string;
  configPrompt: string;
  savedSummaryTitle: string;
  savedSummaryIntention: string;
  savedSummaryDate: string;
  savedSummaryCategory: string;
  feedbackTextPrompt: string;
  photoPrompt: string;
  writeFeedback: string;
  addPhoto: string;
  skipToday: string;
  feedbackSaved: string;
  photoSaved: string;
  noIntentionsToday: string;
  tomorrowReminder: string;
  eveningPrompt: string;
  monthlySummaryTitle: string;
  monthlyIntentionsHeader: string;
  monthlyFeedbackHeader: string;
  monthlySummaryFooter: string;
  startNewMonth: string;
  photoReflection: string;
  freeTextPrompt: string;
  confirmYes: string;
  confirmNo: string;
};
const messages: Record<Language, Messages> = {
  en: {
    intro:
      "Welcome to this space ✨\n" +
      "Here you can gently plan your month\n" +
      "through intentions and short reflections",
    privacy: [
      "Here you can calmly capture what matters to you\n" +
      "at your own pace and without pressure",
      "I care deeply about your privacy\n" +
      "so all intentions and reflections are stored encrypted",
      "Only you can see the real text\n" +
      "right here in this chat",
    ].join("\n\n"),
    optionalInfo: [
      "With me, you can",
      "",
      "— create intentions at your own pace",
      "— group them into categories",
      "— add a date if you want a reminder",
      "— change or rephrase them anytime",
      "",
      "I’ll gently remind you in the evening",
      "or a day before an important date",
      "",
      "And at the end of the month",
      "I’ll help you wrap things up with care ✨",
    ].join("\n"),
    learnMore: "Learn more",
    mainMenu: {
      add: "Add intention",
      show: "My intentions",
      categories: "Categories",
    },
    addPrompt: "Write your intention",
    chooseDate:
      "Pick a date\n" +
      "format YYYY-MM-DD\n" +
      "example 2026-01-05",
    chooseCategory: "Pick a category",
    invalidDateFormat:
      "Format should be YYYY-MM-DD\n" +
      "example 2026-01-05",
    invalidDateCalendar:
      "This date does not exist\n" +
      "try a real calendar date",
    invalidDatePast:
      "Choose a date after today",
    categoryPrompt: "Type a category name",
    noIntentions: "No intentions yet",
    noCategories: "No categories yet",
    intentionsHeader: "My intentions",
    editIntention: "Edit",
    deleteIntention: "Delete",
    addDate: "Add date",
    editDate: "Edit date",
    intentionUpdated: "Updated",
    intentionDeleted: "Deleted",
    categoriesHeader: "Categories",
    addNewCategory: "Add category",
    categoryEmpty:
      "This category is empty for now",
    addFirstIntention:
      "Want to add the first one",
    addIntentionAfterCategoryPrompt:
      "Add an intention",
    otherAction:
      "What would you like to do next",
    addDateAction: "Add date",
    addCategoryAction: "Add category",
    doneAction: "Done",
    configPrompt:
      "What would you like to add",
    savedSummaryTitle:
      "Your intention is saved ✨",
    savedSummaryIntention: "intention",
    savedSummaryDate: "date",
    savedSummaryCategory: "category",
    feedbackTextPrompt:
      "How was your day ✨\n" +
      "write a short reflection",
    photoPrompt:
      "Add a photo if you feel like it",
    writeFeedback: "Write reflection",
    addPhoto: "Add photo",
    skipToday: "Skip today",
    feedbackSaved: "Saved",
    photoSaved: "Saved",
    noIntentionsToday:
      "No intentions planned for today",
    tomorrowReminder: "Tomorrow",
    eveningPrompt:
      "How was your day ✨",
    monthlySummaryTitle:
      "Month wrap ✨",
    monthlyIntentionsHeader: "Intentions",
    monthlyFeedbackHeader: "Reflections",
    monthlySummaryFooter:
      "Ready to start a new month",
    startNewMonth: "Start a new month",
    photoReflection: "Photo reflection",
    freeTextPrompt:
      "Save this as an intention",
    confirmYes: "Yes",
    confirmNo: "No",
  },
  uk: {
    intro:
      "Вітаю в цьому просторі ✨\n" +
      "Тут можна м’яко планувати свій місяць через наміри та короткі підсумки",
    privacy: [
      "Тут можна спокійно фіксувати те, що для тебе важливо у власному ритмі і без тиску\n",
      "Я дбайливо ставлюся до твоєї приватності тому всі наміри та відгуки зберігаються у зашифрованому вигляді та справжній текст бачиш тільки ти у чаті",
    ].join("\n\n"),
    optionalInfo: [
      "Зі мною ти можеш",
      "",
      "- створювати наміри у своєму ритмі",
      "- об’єднувати їх у категорії",
      "- додавати дату, якщо хочеш нагадування",
      "- змінювати або переформульовувати їх у будь-який момент",
      "",
      "Я м’яко нагадаю тобі ввечері про намір наступного дня",
      "",
      "А наприкінці місяця допоможу підсумувати пройдений шлях ✨",
    ].join("\n"),
    learnMore: "Дізнатись більше",
    mainMenu: {
      add: "Додати намір",
      show: "Мої наміри",
      categories: "Категорії",
    },
    addPrompt: "Напиши свій намір",
    chooseDate: "Додай дату у формат YYYY-MM-DD",
    chooseCategory: "Обрати категорію",
    invalidDateFormat:
      "Формат дати YYYY-MM-DD\n" +
      "приклад 2026-01-05",
    invalidDateCalendar:
      "Такої дати не існує\n" +
      "спробуй реальну календарну дату",
    invalidDatePast:
      "Обери дату пізніше за сьогодні",
    categoryPrompt: "Напиши назву категорії",
    noIntentions: "Поки що немає намірів",
    noCategories: "Поки що немає категорій",
    intentionsHeader: "Мої наміри",
    editIntention: "Редагувати",
    deleteIntention: "Видалити",
    addDate: "Додати дату",
    editDate: "Змінити дату",
    intentionUpdated: "Оновлено",
    intentionDeleted: "Видалено",
    categoriesHeader: "Категорії",
    addNewCategory: "Додати категорію",
    categoryEmpty:
      "Ця категорія поки порожня",
    addFirstIntention:
      "Хочеш додати перший намір",
    addIntentionAfterCategoryPrompt:
      "Додати намір",
    otherAction:
      "Що хочеш зробити далі",
    addDateAction: "Додати дату",
    addCategoryAction: "Додати категорію",
    doneAction: "Готово",
    configPrompt:
      "Що додамо до цього наміру",
    savedSummaryTitle:
      "Твій намір збережено ✨",
    savedSummaryIntention: "намір",
    savedSummaryDate: "дата",
    savedSummaryCategory: "категорія",
    feedbackTextPrompt:
      "Як пройшов твій день ✨\n" +
      "напиши короткий відгук",
    photoPrompt:
      "Додай фото, якщо хочеться",
    writeFeedback: "Написати відгук",
    addPhoto: "Додати фото",
    skipToday: "Пропустити сьогодні",
    feedbackSaved: "Збережено",
    photoSaved: "Збережено",
    noIntentionsToday:
      "На сьогодні намірів немає",
    tomorrowReminder: "Завтра",
    eveningPrompt:
      "Як пройшов твій день ✨",
    monthlySummaryTitle:
      "Підсумок місяця ✨",
    monthlyIntentionsHeader: "Наміри",
    monthlyFeedbackHeader: "Відгуки",
    monthlySummaryFooter:
      "Готова почати новий місяць",
    startNewMonth: "Почати новий місяць",
    photoReflection: "Фото відгук",
    freeTextPrompt:
      "Зберегти це як намір",
    confirmYes: "Так",
    confirmNo: "Ні",
  },
};
export function tMainMenu(lang: Language) {
  return messages[lang].mainMenu;
}
export function getMessages(lang: Language): Messages {
  return messages[lang];
}
