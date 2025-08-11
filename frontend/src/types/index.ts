// 🎯 FUYOU PRO - 型定義ファイル

export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD format
  endDate?: string; // Optional: YYYY-MM-DD if cross-day
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  workplaceId: string;
  workplaceName: string;
  hourlyRate: number;
  breakMinutes?: number;
  actualWorkMinutes: number;
  totalEarnings: number;
  status: 'confirmed' | 'tentative' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workplace {
  id: string;
  name: string;
  color: string; // hex color for UI
  defaultHourlyRate: number;
  timeZone?: string; // IANA timezone, e.g., 'Asia/Tokyo', 'Europe/Berlin'
  address?: string;
  phone?: string;
  notes?: string;
  description?: string;
  paymentDate?: number; // 給料日（日付）
  timeBasedRates?: { startTime: string; endTime: string; rate: number }[]; // 時間帯別時給
  transportationFee?: number; // 交通費
  weekdayRates?: Record<string, number>; // 曜日別時給
  allowances?: { name: string; amount: number }[]; // 手当
  deductions?: { name: string; amount: number }[]; // 控除
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyEarnings {
  year: number;
  month: number;
  totalEarnings: number;
  totalHours: number;
  averageHourlyRate: number;
  shiftsCount: number;
  workplacesBreakdown: {
    workplaceId: string;
    workplaceName: string;
    earnings: number;
    hours: number;
    shiftsCount: number;
  }[];
}

export interface FuyouStatus {
  currentYearEarnings: number;
  dependencyLimit: number; // 扶養限度額
  remainingAmount: number;
  progressPercentage: number;
  riskLevel: 'safe' | 'warning' | 'danger';
  estimatedYearEndEarnings: number;
}

export interface ShiftFormData {
  date: string;
  startTime: string;
  endTime: string;
  workplaceId: string;
  hourlyRate: number;
  breakMinutes: number;
  notes?: string;
}

// Calendar view types
export type CalendarView = 'month' | 'week';

export interface CalendarDate {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  shifts: Shift[];
  totalEarnings: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Theme types
export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  themeMode: ThemeMode;
  defaultView: CalendarView;
  workingDaysOnly: boolean;
  notifications: {
    shiftReminders: boolean;
    limitWarnings: boolean;
  };
}

// Friend collaboration types
export interface Friend {
  id: string;
  displayName: string;
  color: string;
}

export interface FriendSchedule {
  friendId: string;
  // 柔軟に扱うため詳細構造は未固定。必要に応じて厳密化する
  days: unknown;
}