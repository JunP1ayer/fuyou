// 🎯 FUYOU PRO - 型定義ファイル

export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD format
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
  address?: string;
  phone?: string;
  notes?: string;
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
