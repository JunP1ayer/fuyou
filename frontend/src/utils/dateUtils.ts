// Simple date utility functions to replace date-fns
export function format(date: Date, formatStr: string): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Simple format string replacements
  return formatStr
    .replace('yyyy', year.toString())
    .replace('MM', month.toString().padStart(2, '0'))
    .replace('M', month.toString())
    .replace('dd', day.toString().padStart(2, '0'))
    .replace('d', day.toString())
    .replace('HH', hours.toString().padStart(2, '0'))
    .replace('mm', minutes.toString().padStart(2, '0'));
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function eachDayOfInterval(options: { start: Date; end: Date }): Date[] {
  const days: Date[] = [];
  const current = new Date(options.start);

  while (current <= options.end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function addMonths(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + amount);
  return result;
}

export function subMonths(date: Date, amount: number): Date {
  return addMonths(date, -amount);
}

export function parseISO(dateString: string): Date {
  return new Date(dateString);
}

export function isValid(date: Date): boolean {
  return !isNaN(date.getTime());
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day;
  result.setDate(diff);
  return result;
}

export function endOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() + (6 - day);
  result.setDate(diff);
  return result;
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function subDays(date: Date, amount: number): Date {
  return addDays(date, -amount);
}

export function setHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(hours);
  return result;
}

export function setMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(minutes);
  return result;
}

export function getHours(date: Date): number {
  return date.getHours();
}

export function getMinutes(date: Date): number {
  return date.getMinutes();
}

export function parse(
  dateString: string,
  formatStr: string,
  referenceDate: Date
): Date {
  // Simple time parser for HH:mm format
  if (formatStr === 'HH:mm') {
    const [hours, minutes] = dateString.split(':').map(Number);
    const result = new Date(referenceDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  // Default to Date constructor
  return new Date(dateString);
}

// Japanese locale placeholder
export const ja = {
  // This is a placeholder, actual locale data would be more complex
  name: 'ja',
};
