// シフト管理関連の型定義

// シフト基本情報
export interface Shift {
  id: string;
  userId: string;
  jobSourceId?: string;
  jobSourceName: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  hourlyRate: number;
  breakMinutes: number;
  workingHours: number;
  calculatedEarnings: number;
  description?: string;
  isConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

// シフト作成・更新用の型
export interface CreateShiftData {
  jobSourceId?: string;
  jobSourceName: string;
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  breakMinutes: number;
  description?: string;
  isConfirmed: boolean;
  [key: string]: unknown; // Index signature for API compatibility
}

export interface UpdateShiftData extends Partial<CreateShiftData> {
  id: string;
}

// シフト統計情報
export interface ShiftStats {
  totalShifts: number;
  totalHours: number;
  totalEarnings: number;
  thisMonth: {
    shifts: number;
    hours: number;
    earnings: number;
  };
  byJobSource: Array<{
    jobSourceId?: string;
    jobSourceName: string;
    shifts: number;
    hours: number;
    earnings: number;
  }>;
}

// シフト検索・フィルタリング用
export interface ShiftFilters {
  startDate?: string;
  endDate?: string;
  jobSourceId?: string;
  isConfirmed?: boolean;
}

// カレンダー表示用の日付情報
export interface CalendarDate {
  date: string;
  dayOfWeek: number; // 0=日曜日, 1=月曜日, ...
  isToday: boolean;
  isCurrentMonth: boolean;
  shifts: Shift[];
  totalEarnings: number;
  totalHours: number;
}

// 月間カレンダー情報
export interface MonthlyCalendar {
  year: number;
  month: number; // 1-12
  dates: CalendarDate[];
  stats: {
    totalShifts: number;
    totalHours: number;
    totalEarnings: number;
    workingDays: number;
  };
}

// 週間表示用
export interface WeeklyView {
  weekStart: string;
  weekEnd: string;
  dates: CalendarDate[];
  stats: {
    totalShifts: number;
    totalHours: number;
    totalEarnings: number;
  };
}

// バイト先情報（簡易版）
export interface JobSource {
  id: string;
  name: string;
  defaultHourlyRate?: number;
  defaultBreakMinutes?: number;
  isActive: boolean;
}

// シフト表示モード
export type ViewMode = 'month' | 'week' | 'day' | 'list';

// 時間帯の区分
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

// シフトの状態
export type ShiftStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled';

// 繰り返しシフト作成用
export interface RecurringShiftTemplate {
  jobSourceName: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  breakMinutes: number;
  description?: string;
  dayOfWeek: number[]; // 0=日曜日, 1=月曜日, ...
  startDate: string;
  endDate: string;
}

// シフトパターン（将来のOCR機能用）
export interface ShiftPattern {
  id: string;
  name: string;
  pattern: string; // 正規表現など
  jobSourceName: string;
  defaultHourlyRate?: number;
  confidence: number; // 0-1
}

// API レスポンス型
export interface ShiftApiResponse {
  success: boolean;
  data: Shift | Shift[] | ShiftStats;
  message?: string;
}

// エラーハンドリング用
export interface ShiftError {
  field?: string;
  message: string;
  code?: string;
}

// フォーム用の型
export interface ShiftFormData {
  jobSourceName: string;
  date: Date | null;
  startTime: string;
  endTime: string;
  hourlyRate: string; // フォームでは文字列
  breakMinutes: string; // フォームでは文字列
  description: string;
  isConfirmed: boolean;
}

// 時間計算用のヘルパー型
export interface TimeCalculation {
  totalMinutes: number;
  hours: number;
  minutes: number;
  formattedTime: string; // "8時間30分"
}

// 収入予測用
export interface EarningsProjection {
  currentMonth: number;
  projectedTotal: number;
  dailyAverage: number;
  remainingWorkingDays: number;
  suggestedDailyTarget: number;
  fuyouLimitRemaining: number;
  riskLevel: 'safe' | 'warning' | 'danger';
  projectedMonthEnd: number;
  usageRate: number;
  yearToDate: number;
}

// 通知・アラート用
export interface ShiftNotification {
  id: string;
  type: 'reminder' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  shiftId?: string;
  timestamp: string;
  isRead: boolean;
}

// 設定用
export interface ShiftSettings {
  defaultView: ViewMode;
  workingDayStart: string; // "09:00"
  workingDayEnd: string; // "22:00"
  defaultBreakMinutes: number;
  notifications: {
    enabled: boolean;
    reminderBefore: number; // 分
    dailyEarningsLimit: number;
    weeklyEarningsLimit: number;
  };
  calendar: {
    weekStartsOn: number; // 0=日曜日, 1=月曜日
    showWeekends: boolean;
    highlightToday: boolean;
  };
}

// カラーテーマ用
export interface ShiftTheme {
  confirmed: string;
  draft: string;
  overtime: string;
  warning: string;
  earnings: string;
}
