// シフト関連の型定義

export interface Shift {
  id: string;
  userId: string;
  jobSourceId?: string;
  jobSourceName: string;
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  breakMinutes: number;
  workingHours: number;
  calculatedEarnings: number;
  description?: string;
  isConfirmed: boolean;
  payDay?: number; // 給料日 (1-31)
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftData {
  jobSourceId?: string;
  jobSourceName: string;
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  breakMinutes?: number;
  description?: string;
  isConfirmed?: boolean;
  payDay?: number; // 給料日 (1-31)
}

export interface UpdateShiftData {
  jobSourceId?: string;
  jobSourceName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  hourlyRate?: number;
  breakMinutes?: number;
  description?: string;
  isConfirmed?: boolean;
  payDay?: number; // 給料日 (1-31)
}

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
