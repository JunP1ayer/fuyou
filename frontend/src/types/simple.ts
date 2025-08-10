// シンプルな型定義

export interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
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
  description?: string;
  // 給料日設定
  paymentDate?: number; // 毎月の支払日（例: 25日）
  // 時間帯別時給
  timeBasedRates?: {
    startTime: string;
    endTime: string;
    rate: number;
    name: string;
  }[];
  // 曜日別時給
  weekdayRates?: {
    monday?: number;
    tuesday?: number;
    wednesday?: number;
    thursday?: number;
    friday?: number;
    saturday?: number;
    sunday?: number;
  };
  // 交通費・手当・天引き
  transportationFee?: number; // 交通費（日額）
  allowances?: {
    name: string;
    amount: number;
    type: 'daily' | 'monthly' | 'shift'; // 支給タイプ
  }[];
  deductions?: {
    name: string;
    amount: number;
    type: 'percentage' | 'fixed'; // 天引きタイプ
  }[];
}

export type ThemeMode = 'light' | 'dark';
