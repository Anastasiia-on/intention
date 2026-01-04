export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function parseTime(input: string): string | null {
  const trimmed = input.trim();
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function parseDate(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === "today") return formatDate(new Date());
  if (trimmed === "tomorrow") return formatDate(addDays(new Date(), 1));
  const match = /^\d{4}-\d{2}-\d{2}$/.exec(trimmed);
  if (!match) return null;
  return trimmed;
}

export function parseDateList(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => parseDate(value))
    .filter((value): value is string => Boolean(value));
}

export function isLastDayOfMonth(date: Date): boolean {
  const tomorrow = addDays(date, 1);
  return date.getMonth() !== tomorrow.getMonth();
}

export function getMonthRange(date: Date): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start: formatDate(start), end: formatDate(end) };
}
