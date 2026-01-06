import { Language } from "./types";

type Messages = {
  welcome: string;
  intro: string;
  privacy: string;
  askLanguage: string;
  mainMenuTitle: string;
  mainMenu: {
    add: string;
    show: string;
    categories: string;
  };
  addPrompt: string;
  savedIntention: string;
  chooseNext: string;
  chooseDate: string;
  chooseCategory: string;
  skipForNow: string;
  invalidDateFormat: string;
  invalidDateCalendar: string;
  invalidDatePast: string;
  dateSaved: string;
  categoryPrompt: string;
  categoryAdded: string;
  noIntentions: string;
  noCategories: string;
  intentionsHeader: string;
  noDate: string;
  editIntention: string;
  deleteIntention: string;
  addDate: string;
  intentionUpdated: string;
  intentionDeleted: string;
  categoriesHeader: string;
  addNewCategory: string;
  categoryEmpty: string;
  addFirstIntention: string;
  backToCategories: string;
  reflectionsPrompt: string;
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
    welcome: "Welcome to Intentions bot",
    intro:
      "Plan your month with gentle intentions and a few mindful check-ins along the way.",
    privacy: [
      "Your intentions and reflections are stored encrypted",
      "In the database it looks like random symbols",
      "Only you can see the real text here in chat",
    ].join("\n"),
    askLanguage: "Choose a language to continue",
    mainMenuTitle: "Main menu",
    mainMenu: {
      add: "Add intention",
      show: "Show my intentions",
      categories: "Show categories",
    },
    addPrompt: "Type your intention text.",
    savedIntention: "Intention saved.",
    chooseNext: "What would you like to do next?",
    chooseDate: "Choose date",
    chooseCategory: "Choose category",
    skipForNow: "Skip for now",
    invalidDateFormat: "Please use date format YYYY-MM-DD.",
    invalidDateCalendar: "That date does not exist. Please enter a real calendar date.",
    invalidDatePast: "Please choose a date after today (Europe/Madrid).",
    dateSaved: "Date saved.",
    categoryPrompt: "Type a category name.",
    categoryAdded: "Category saved.",
    noIntentions: "No intentions yet.",
    noCategories: "No categories yet.",
    intentionsHeader: "Your intentions",
    noDate: "no date yet",
    editIntention: "Edit intention",
    deleteIntention: "Delete intention",
    addDate: "Add date",
    intentionUpdated: "Intention updated.",
    intentionDeleted: "Intention deleted.",
    categoriesHeader: "Your categories",
    addNewCategory: "Add new category",
    categoryEmpty: "This category is empty for now",
    addFirstIntention: "Would you like to add your first intention?",
    backToCategories: "Back to categories",
    reflectionsPrompt: "How was your day? Would you like to leave a reflection or a photo?",
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
    welcome: "Вітаю в Intentions bot",
    intro:
      "Плануй місяць м'яко й усвідомлено — з намірами та короткими підсумками.",
    privacy: [
      "Твої наміри та відгуки зберігаються у зашифрованому вигляді",
      "У базі даних це виглядає як набір символів",
      "Справжній текст бачиш тільки ти тут у чаті",
    ].join("\n"),
    askLanguage: "Обери мову, щоб продовжити",
    mainMenuTitle: "Головне меню",
    mainMenu: {
      add: "Додати намір",
      show: "Показати мої наміри",
      categories: "Показати категорії",
    },
    addPrompt: "Напиши текст наміру.",
    savedIntention: "Намір збережено.",
    chooseNext: "Що зробимо далі?",
    chooseDate: "Обрати дату",
    chooseCategory: "Обрати категорію",
    skipForNow: "Поки що пропустити",
    invalidDateFormat: "Будь ласка, формат дати YYYY-MM-DD.",
    invalidDateCalendar: "Такої дати не існує. Введи коректну календарну дату.",
    invalidDatePast: "Обери дату пізніше за сьогодні (Europe/Madrid).",
    dateSaved: "Дату збережено.",
    categoryPrompt: "Напиши назву категорії.",
    categoryAdded: "Категорію збережено.",
    noIntentions: "Поки що немає намірів.",
    noCategories: "Поки що немає категорій.",
    intentionsHeader: "Твої наміри",
    noDate: "ще без дати",
    editIntention: "Редагувати намір",
    deleteIntention: "Видалити намір",
    addDate: "Додати дату",
    intentionUpdated: "Намір оновлено.",
    intentionDeleted: "Намір видалено.",
    categoriesHeader: "Твої категорії",
    addNewCategory: "Додати категорію",
    categoryEmpty: "Ця категорія поки порожня",
    addFirstIntention: "Хочеш додати перший намір?",
    backToCategories: "Назад до категорій",
    reflectionsPrompt: "Як пройшов твій день? Хочеш залишити відгук або фото?",
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
