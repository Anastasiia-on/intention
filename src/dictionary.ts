export const MONTHS_MAP = {
  // RU
  "января": "january",
  "январь": "january",
  "февраля": "february",
  "февраль": "february",
  "марта": "march",
  "март": "march",
  "апреля": "april",
  "апрель": "april",
  "мая": "may",
  "май": "may",
  "июня": "june",
  "июнь": "june",
  "июля": "july",
  "июль": "july",
  "августа": "august",
  "август": "august",
  "сентября": "september",
  "сентябрь": "september",
  "октября": "october",
  "октябрь": "october",
  "ноября": "november",
  "ноябрь": "november",
  "декабря": "december",
  "декабрь": "december",

  // UA
  "січня": "january",
  "січень": "january",
  "лютого": "february",
  "лютий": "february",
  "березня": "march",
  "березень": "march",
  "квітня": "april",
  "квітень": "april",
  "травня": "may",
  "травень": "may",
  "червня": "june",
  "червень": "june",
  "липня": "july",
  "липень": "july",
  "серпня": "august",
  "серпень": "august",
  "вересня": "september",
  "вересень": "september",
  "жовтня": "october",
  "жовтень": "october",
  "листопада": "november",
  "листопад": "november",
  "грудня": "december",
  "грудень": "december",
};

export const WEEKDAYS_MAP = {
  // RU
  "понедельник": "monday",
  "вторник": "tuesday",
  "среда": "wednesday",
  "четверг": "thursday",
  "пятница": "friday",
  "суббота": "saturday",
  "воскресенье": "sunday",

  // короткие RU
  "пн": "monday",
  "вт": "tuesday",
  "ср": "wednesday",
  "чт": "thursday",
  "пт": "friday",
  "сб": "saturday",
  "вс": "sunday",

  // UA
  "понеділок": "monday",
  "вівторок": "tuesday",
  "середа": "wednesday",
  "четвер": "thursday",
  "пʼятниця": "friday",
  "пятниця": "friday", // без апострофа
  "субота": "saturday",
  "неділя": "sunday",
};
export const RELATIVE_MAP = {
  // базовое
  "сегодня": "today",
  "завтра": "tomorrow",
  "послезавтра": "in 2 days",
  "вчера": "yesterday",

  "сьогодні": "today",
  "післязавтра": "in 2 days",
  "вчора": "yesterday",

  // через
  "через": "in",
  "за": "in", // UA: "за 2 дні"

  // недели
  "неделю": "week",
  "недели": "weeks",
  "недель": "weeks",
  "тиждень": "week",
  "тижні": "weeks",
  "тижнів": "weeks",

  // дни
  "день": "day",
  "дня": "days",
  "дней": "days",
  "дні": "days",
  "днів": "days",

  // часы
  "час": "hour",
  "часа": "hours",
  "часов": "hours",
  "годину": "hour",
  "години": "hours",
  "годин": "hours",
};

export function normalizeDateText(input: string): string {
  const lowered = input
    .toLowerCase()
    .replace(/['’`]/g, "'")
    .replace(/[.,!?;:()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!lowered) return "";
  const tokens = lowered.split(" ").filter(Boolean);
  const normalized: string[] = [];
  for (const token of tokens) {
    const month = MONTHS_MAP[token as keyof typeof MONTHS_MAP];
    if (month) {
      normalized.push(month);
      continue;
    }
    const weekday = WEEKDAYS_MAP[token as keyof typeof WEEKDAYS_MAP];
    if (weekday) {
      normalized.push(weekday);
      continue;
    }
    const relative = RELATIVE_MAP[token as keyof typeof RELATIVE_MAP];
    if (relative) {
      normalized.push(...relative.split(" "));
      continue;
    }
    normalized.push(token);
  }
  return normalized.join(" ");
}
