// 🗓️ 日付ユーティリティ関数

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isToday,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
  formatISO,
} from 'date-fns';
import { ja, enGB, de } from 'date-fns/locale';
import useI18nStore from '../store/i18nStore';

/**
 * 日付を YYYY-MM-DD 形式の文字列に変換
 */
export const formatDateString = (date: Date): string => {
  return formatISO(date, { representation: 'date' });
};

/**
 * YYYY-MM-DD 文字列を Date オブジェクトに変換
 */
export const parseDateString = (dateString: string): Date => {
  return parseISO(dateString);
};

/**
 * 日付を日本語形式でフォーマット
 */
export const formatLocalizedDate = (date: Date, patternJa = 'M月d日', patternDefault = 'MMM d'): string => {
  const { language } = useI18nStore.getState();
  const locale = language === 'ja' ? ja : language === 'de' ? de : enGB;
  const pattern = language === 'ja' ? patternJa : patternDefault;
  return format(date, pattern, { locale });
};

/**
 * 月間カレンダー用の日付配列を生成
 */
export const generateCalendarDays = (year: number, month: number, weekStartsOn: 0 | 1 = 0): Date[] => {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = endOfMonth(firstDayOfMonth);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn });
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn });

  return eachDayOfInterval({ start: startDate, end: endDate });
};

/**
 * 時間文字列（HH:MM）を分に変換
 */
export const timeStringToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * 分を時間文字列（HH:MM）に変換
 */
export const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
};

/**
 * 勤務時間を計算（分単位）
 */
export const calculateWorkMinutes = (
  startTime: string,
  endTime: string,
  breakMinutes = 0,
  options?: { startDate?: string; endDate?: string; timeZone?: string }
): number => {
  // 高精度: 実日付＋TZ指定があればDateで差分を取る
  if (options?.startDate && options?.endDate) {
    const tz = options.timeZone;
    const startIso = `${options.startDate}T${startTime}:00${tz ? '' : ''}`;
    const endIso = `${options.endDate}T${endTime}:00${tz ? '' : ''}`;
    const start = new Date(startIso);
    const end = new Date(endIso);
    let diff = Math.max(0, (end.getTime() - start.getTime()) / 60000);
    diff -= breakMinutes;
    return Math.max(0, Math.floor(diff));
  }

  // 従来ロジック（同一日、跨日を分ロジックで補正）
  const start = timeStringToMinutes(startTime);
  let end = timeStringToMinutes(endTime);
  if (end < start) end += 24 * 60;
  return Math.max(0, end - start - breakMinutes);
};

/**
 * 時間を人間が読みやすい形式に変換
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}分`;
  } else if (remainingMinutes === 0) {
    return `${hours}時間`;
  } else {
    return `${hours}時間${remainingMinutes}分`;
  }
};

/**
 * 今日かどうかを判定
 */
export const isDateToday = (date: Date): boolean => {
  return isToday(date);
};

/**
 * 同じ日かどうかを判定
 */
export const isSameDateDay = (date1: Date, date2: Date): boolean => {
  return isSameDay(date1, date2);
};

/**
 * 同じ月かどうかを判定
 */
export const isSameDateMonth = (date1: Date, date2: Date): boolean => {
  return isSameMonth(date1, date2);
};

/**
 * 月を移動
 */
export const navigateMonth = (
  currentDate: Date,
  direction: 'next' | 'prev'
): Date => {
  return direction === 'next'
    ? addMonths(currentDate, 1)
    : subMonths(currentDate, 1);
};

/**
 * 週の曜日名を取得（開始曜日に応じて配列を調整）
 */
export const getWeekDayNames = (weekStartsOn: 0 | 1 = 0): string[] => {
  const { language } = useI18nStore.getState();
  
  let base: string[];
  if (language === 'ja') {
    base = ['日', '月', '火', '水', '木', '金', '土'];
  } else if (language === 'de') {
    base = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  } else {
    base = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }
  
  // 月曜始まりの場合は配列を回転
  if (weekStartsOn === 1) {
    return [...base.slice(1), base[0]];
  }
  
  return base;
};

/**
 * 現在時刻を HH:MM 形式で取得
 */
export const getCurrentTimeString = (): string => {
  const now = new Date();
  return format(now, 'HH:mm');
};

/**
 * 時間の妥当性をチェック
 */
export const isValidTimeString = (timeString: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};
