// シフト関連の型定義

export interface Shift {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  location: string;
  workingHours: number;
  calculatedEarnings: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShiftData {
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  location?: string;
  notes?: string;
}
