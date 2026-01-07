import { Language } from "./types";

type Messages = {
  intro: string;
  privacy: string;
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
  menuLabel: string;
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
    intro: "A soft way to plan your month with intentions and gentle check-ins",
    privacy: [
      "Your intentions and reflections are encrypted",
      "In the database they look like random symbols",
      "Only you can read them here in chat",
    ].join("\n"),
    mainMenu: {
      add: "Add intention",
      show: "My intentions",
      categories: "Categories",
    },
    addPrompt: "Write your intention",
    chooseDate: "Pick a date in this format YYYY-MM-DD",
    chooseCategory: "Pick a category",
    invalidDateFormat: "Format should be YYYY-MM-DD\nexample 2026-01-05",
    invalidDateCalendar: "This date does not exist\ntry a real calendar date",
    invalidDatePast: "Choose a date after today",
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
    categoryEmpty: "This category is empty for now",
    addFirstIntention: "Want to add the first one",
    addIntentionAfterCategoryPrompt: "Add an intention",
    menuLabel: "Menu",
    addDateAction: "Add date",
    addCategoryAction: "Add category",
    doneAction: "Done",
    configPrompt: "What would you like to add",
    savedSummaryTitle: "Intention saved ✨",
    savedSummaryIntention: "intention",
    savedSummaryDate: "date",
    savedSummaryCategory: "category",
    feedbackTextPrompt: "How was your day ✨\nwrite a short reflection",
    photoPrompt: "Add a photo if you feel like it",
    writeFeedback: "Write reflection",
    addPhoto: "Add photo",
    skipToday: "Skip today",
    feedbackSaved: "Saved",
    photoSaved: "Saved",
    noIntentionsToday: "No intentions planned for today",
    tomorrowReminder: "Tomorrow",
    eveningPrompt: "How was your day ✨",
    monthlySummaryTitle: "Month wrap ✨",
    monthlyIntentionsHeader: "Intentions",
    monthlyFeedbackHeader: "Reflections",
    monthlySummaryFooter: "Ready for a new month",
    startNewMonth: "Start a new month",
    photoReflection: "Photo reflection",
    freeTextPrompt: "Save this as an intention",
    confirmYes: "Yes",
    confirmNo: "No",
  },
  uk: {
    intro: "М’який спосіб планувати місяць з намірами та короткими підсумками",
    privacy: [
      "Твої наміри та відгуки зберігаються у зашифрованому вигляді",
      "У базі даних це виглядає як набір символів",
      "Справжній текст бачиш тільки ти тут у чаті",
    ].join("\n"),
    mainMenu: {
      add: "Додати намір",
      show: "Мої наміри",
      categories: "Категорії",
    },
    addPrompt: "Напиши свій намір",
    chooseDate: "Напиши дату у цьому форматі YYYY-MM-DD",
    chooseCategory: "Обрати категорію",
    invalidDateFormat: "Формат дати YYYY-MM-DD\nприклад 2026-01-05",
    invalidDateCalendar: "Такої дати не існує\nспробуй реальну календарну дату",
    invalidDatePast: "Обери дату пізніше за сьогодні",
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
    categoryEmpty: "Ця категорія поки порожня",
    addFirstIntention: "Хочеш додати перший",
    addIntentionAfterCategoryPrompt: "Додати намір",
    menuLabel: "Меню",
    addDateAction: "Додати дату",
    addCategoryAction: "Додати категорію",
    doneAction: "Готово",
    configPrompt: "Що додамо",
    savedSummaryTitle: "Намір збережено ✨",
    savedSummaryIntention: "намір",
    savedSummaryDate: "дата",
    savedSummaryCategory: "категорія",
    feedbackTextPrompt: "Як пройшов твій день ✨\nнапиши короткий відгук",
    photoPrompt: "Додай фото якщо хочеться",
    writeFeedback: "Написати відгук",
    addPhoto: "Додати фото",
    skipToday: "Пропустити сьогодні",
    feedbackSaved: "Збережено",
    photoSaved: "Збережено",
    noIntentionsToday: "На сьогодні намірів немає",
    tomorrowReminder: "Завтра",
    eveningPrompt: "Як пройшов твій день ✨",
    monthlySummaryTitle: "Підсумок місяця ✨",
    monthlyIntentionsHeader: "Наміри",
    monthlyFeedbackHeader: "Відгуки",
    monthlySummaryFooter: "Готова почати новий місяць",
    startNewMonth: "Почати новий місяць",
    photoReflection: "Фото відгук",
    freeTextPrompt: "Зберегти це як намір",
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
