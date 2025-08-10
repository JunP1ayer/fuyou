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
import { ja } from 'date-fns/locale';

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
export const formatJapaneseDate = (date: Date, pattern = 'M月d日'): string => {
  return format(date, pattern, { locale: ja });
};

/**
 * 月間カレンダー用の日付配列を生成
 */
export const generateCalendarDays = (year: number, month: number): Date[] => {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = endOfMonth(firstDayOfMonth);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 }); // 日曜始まり
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 });

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
  breakMinutes = 0
): number => {
  const start = timeStringToMinutes(startTime);
  let end = timeStringToMinutes(endTime);

  // 日をまたぐ場合の処理
  if (end < start) {
    end += 24 * 60;
  }

  const totalMinutes = end - start - breakMinutes;
  return Math.max(0, totalMinutes);
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
 * 週の日本語名を取得
 */
export const getWeekDayNames = (): string[] => {
  return ['日', '月', '火', '水', '木', '金', '土'];
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
