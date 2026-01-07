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
    intro:
      "Plan your month with gentle intentions and a few mindful check-ins along the way.",
    privacy: [
      "Your intentions and reflections are stored encrypted",
      "In the database it looks like random symbols",
      "Only you can see the real text here in chat",
    ].join("\n"),
    mainMenu: {
      add: "Add intention",
      show: "Show my intentions",
      categories: "Show categories",
    },
    addPrompt: "Type your intention text.",
    chooseDate: "Choose date",
    chooseCategory: "Choose category",
    invalidDateFormat: "Please use date format YYYY-MM-DD.",
    invalidDateCalendar: "That date does not exist. Please enter a real calendar date.",
    invalidDatePast: "Please choose a date after today (Europe/Madrid).",
    categoryPrompt: "Type a category name.",
    noIntentions: "No intentions yet.",
    noCategories: "No categories yet.",
    intentionsHeader: "My intentions",
    editIntention: "Edit intention",
    deleteIntention: "Delete intention",
    addDate: "Add date",
    intentionUpdated: "Intention updated.",
    intentionDeleted: "Intention deleted.",
    categoriesHeader: "My categories",
    addNewCategory: "Add new category",
    categoryEmpty: "This category is empty for now",
    addFirstIntention: "Would you like to add your first intention?",
    addIntentionAfterCategoryPrompt: "Add an intention?",
    menuLabel: "Menu",
    addDateAction: "Add date",
    addCategoryAction: "Add category",
    doneAction: "Done",
    configPrompt: "What would you like to add",
    savedSummaryTitle: "Saved",
    savedSummaryIntention: "intention",
    savedSummaryDate: "date",
    savedSummaryCategory: "category",
    feedbackTextPrompt: "Write your reflection text.",
    photoPrompt: "Send a photo for your reflection.",
    writeFeedback: "Write feedback",
    addPhoto: "Add photo",
    skipToday: "Skip for today",
    feedbackSaved: "Reflection saved.",
    photoSaved: "Photo saved.",
    noIntentionsToday: "No intentions planned for today.",
    tomorrowReminder: "Tomorrow intentions",
    eveningPrompt: "How was your day? Would you like to leave a reflection or a photo?",
    monthlySummaryTitle: "Month wrap",
    monthlyIntentionsHeader: "Intentions",
    monthlyFeedbackHeader: "Reflections",
    monthlySummaryFooter: "Ready to start a new month?",
    startNewMonth: "Start new month",
    photoReflection: "Photo reflection",
    freeTextPrompt: "Do you want to save this as an intention?",
    confirmYes: "Yes",
    confirmNo: "No",
  },
  uk: {
    intro:
      "Плануй місяць м'яко й усвідомлено — з намірами та короткими підсумками.",
    privacy: [
      "Твої наміри та відгуки зберігаються у зашифрованому вигляді",
      "У базі даних це виглядає як набір символів",
      "Справжній текст бачиш тільки ти тут у чаті",
    ].join("\n"),
    mainMenu: {
      add: "Додати намір",
      show: "Показати мої наміри",
      categories: "Показати категорії",
    },
    addPrompt: "Напиши текст наміру.",
    chooseDate: "Обрати дату",
    chooseCategory: "Обрати категорію",
    invalidDateFormat: "Будь ласка, формат дати YYYY-MM-DD.",
    invalidDateCalendar: "Такої дати не існує. Введи коректну календарну дату.",
    invalidDatePast: "Обери дату пізніше за сьогодні (Europe/Madrid).",
    categoryPrompt: "Напиши назву категорії.",
    noIntentions: "Поки що немає намірів.",
    noCategories: "Поки що немає категорій.",
    intentionsHeader: "Мої наміри",
    editIntention: "Редагувати намір",
    deleteIntention: "Видалити намір",
    addDate: "Додати дату",
    intentionUpdated: "Намір оновлено.",
    intentionDeleted: "Намір видалено.",
    categoriesHeader: "Мої категорії",
    addNewCategory: "Додати нову категорию",
    categoryEmpty: "Ця категорія поки порожня",
    addFirstIntention: "Хочеш додати перший намір?",
    addIntentionAfterCategoryPrompt: "Додати намір?",
    menuLabel: "Меню",
    addDateAction: "Додати дату",
    addCategoryAction: "Додати категорію",
    doneAction: "Готово",
    configPrompt: "що додамо до цього наміру",
    savedSummaryTitle: "збережено",
    savedSummaryIntention: "намір",
    savedSummaryDate: "дата",
    savedSummaryCategory: "категорія",
    feedbackTextPrompt: "Напиши текст відгуку.",
    photoPrompt: "Надішли фото для відгуку.",
    writeFeedback: "Написати відгук",
    addPhoto: "Додати фото",
    skipToday: "Пропустити сьогодні",
    feedbackSaved: "Відгук збережено.",
    photoSaved: "Фото збережено.",
    noIntentionsToday: "На сьогодні немає запланованих намірів.",
    tomorrowReminder: "Наміри на завтра",
    eveningPrompt: "Як пройшов твій день? Хочеш залишити відгук або фото?",
    monthlySummaryTitle: "Підсумок місяця",
    monthlyIntentionsHeader: "Наміри",
    monthlyFeedbackHeader: "Відгуки",
    monthlySummaryFooter: "Готовий(а) почати новий місяць?",
    startNewMonth: "Почати новий місяць",
    photoReflection: "Фото-відгук",
    freeTextPrompt: "Зберегти це як намір?",
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
