// カレンダーイベント型定義

export type EventType = 'shift' | 'personal' | 'study' | 'meeting' | 'other';
export type EventColor = string; // Hex color

// 通知設定
export type NotificationTime = 'none' | '0' | '5' | '10' | '15' | '30' | '60' | '120' | '1440' | '2880';

// 繰り返し設定
export type RepeatFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RepeatSettings {
  frequency: RepeatFrequency;
  interval?: number; // 間隔（例：2週間に1回の場合は2）
  endDate?: string; // 終了日 YYYY-MM-DD
  count?: number; // 回数制限
  weekdays?: number[]; // 曜日指定（0=日曜日）
}

// カレンダーイベント
export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: EventType;
  title: string;
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  endDate?: string; // 複数日イベントの終了日 YYYY-MM-DD
  color: EventColor;
  
  // シフト関連（typeがshiftの場合）
  workplace?: {
    id: string;
    name: string;
    hourlyRate: number;
    isOneTime: boolean; // 日雇いフラグ
  };
  earnings?: number;
  breakTime?: number; // 分単位の休憩時間（手動入力）
  
  // 日雇いバイト詳細（isOneTimeがtrueの場合）
  oneTimeDetails?: {
    companyName: string;
    totalPay?: number; // 総支給額
    hourlyRate?: number; // 後方互換性のため残す
    transportFee?: number; // 後方互換性のため残す
    otherAllowances?: number; // 後方互換性のため残す
    breakMinutes?: number; // 後方互換性のため残す
    memo?: string;
  };
  
  // その他
  description?: string;
  isAllDay?: boolean;
  isCompleted?: boolean;
  
  // 通知・繰り返し設定
  notification?: NotificationTime;
  repeat?: RepeatSettings;
  parentId?: string; // 繰り返しイベントの親ID
}

// 日付セル情報
export interface DayCell {
  date: string;
  events: CalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isHoliday?: boolean;
  totalEarnings: number;
}

// カレンダー表示モード
export type CalendarViewMode = 'month' | 'week' | 'day' | 'list';

// 下部ナビゲーションタブ
export type BottomNavTab = 'shift' | 'salary' | 'workplace' | 'add';

// カレンダー設定
export interface CalendarSettings {
  weekStartsOn: 0 | 1 | 6; // 0: Sunday, 1: Monday, 6: Saturday
  showWeekNumbers: boolean;
  defaultEventColor: string;
  defaultEventType: EventType;
  enableNotifications: boolean;
}

// イベントカテゴリー設定
export interface EventCategory {
  type: EventType;
  label: string;
  color: string;
  icon?: string;
}

// デフォルトカテゴリー
export const DEFAULT_EVENT_CATEGORIES: EventCategory[] = [
  { type: 'shift', label: 'シフト', color: '#FFD54F', icon: 'work' },
  { type: 'personal', label: '個人', color: '#81C784', icon: 'person' },
  { type: 'study', label: '学習', color: '#64B5F6', icon: 'school' },
  { type: 'meeting', label: '会議', color: '#BA68C8', icon: 'groups' },
  { type: 'other', label: 'その他', color: '#9E9E9E', icon: 'event' },
];

// 月間統計
export interface MonthlyStats {
  totalShifts: number;
  totalEarnings: number;
  totalHours: number;
  averageHourlyRate: number;
  workplaceCounts: Record<string, number>;
  dailyEarnings: Record<string, number>;
}