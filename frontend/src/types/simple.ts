// 最小限のシンプル型（シンプルビュー/簡易ストア用）

export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // optional for cross-day
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  workplaceName: string;
  hourlyRate: number;
  totalEarnings: number;
  status: 'confirmed' | 'tentative';
  // 休憩時間設定
  breakTime?: number; // 分単位の休憩時間（手動入力）
  autoBreak6Hours?: boolean; // 6時間越えで自動休憩45分
  autoBreak8Hours?: boolean; // 8時間越えで自動休憩60分
  // 残業設定
  overtimeEnabled?: boolean; // 残業割増25%を有効にするか（デフォルト true）
  // 曜日別設定
  dayOfWeekSettingsEnabled?: boolean; // 曜日別設定を有効にするか
}

export interface Workplace {
  id: string;
  name: string;
  color: string;
  defaultHourlyRate: number;
  timeZone?: string;
  // 労働条件設定（デフォルト値）
  overtimeEnabled?: boolean; // 残業割増25%（デフォルトtrue）
  autoBreak6Hours?: boolean; // 6時間越えで45分休憩（デフォルトtrue）
  autoBreak8Hours?: boolean; // 8時間越えで60分休憩（デフォルトtrue）
  dayOfWeekSettingsEnabled?: boolean; // 曜日別設定（デフォルトfalse）
  // 詳細休憩設定
  breakAuto4hEnabled?: boolean; // 4時間越えで休憩
  breakAuto6hEnabled?: boolean; // 6時間越えで休憩
  breakAuto8hEnabled?: boolean; // 8時間越えで休憩
  breakRules?: {
    over4h?: number; // 4時間越えの休憩時間（分）
    over6h?: number; // 6時間越えの休憩時間（分）
    over8h?: number; // 8時間越えの休憩時間（分）
  };
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


