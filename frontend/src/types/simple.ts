// 最小限のシンプル型（シンプルビュー/簡易ストア用）

export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  workplaceName: string;
  hourlyRate: number;
  totalEarnings: number;
  status: 'confirmed' | 'tentative';
}

export interface Workplace {
  id: string;
  name: string;
  color: string;
  defaultHourlyRate: number;
  // 追加の任意フィールド（詳細編集用）
  description?: string;
  paymentDate?: number;
  timeBasedRates?: {
    startTime: string;
    endTime: string;
    rate: number;
    name: string;
  }[];
  transportationFee?: number;
  weekdayRates?: {
    monday?: number;
    tuesday?: number;
    wednesday?: number;
    thursday?: number;
    friday?: number;
    saturday?: number;
    sunday?: number;
  };
  allowances?: {
    name: string;
    amount: number;
    type: 'daily' | 'monthly' | 'shift';
  }[];
  deductions?: {
    name: string;
    amount: number;
    type: 'percentage' | 'fixed';
  }[];
}


