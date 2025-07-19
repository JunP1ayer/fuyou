// 扶養管理アプリの型定義

// 収入カテゴリ（バックエンドと統一）
export const IncomeCategory = {
  PART_TIME_JOB: 'part_time_job', // アルバイト
  TEMPORARY_WORK: 'temporary_work', // 単発バイト
  FREELANCE: 'freelance', // フリーランス
  SCHOLARSHIP: 'scholarship', // 奨学金
  FAMILY_SUPPORT: 'family_support', // 家族からの支援
  OTHER: 'other', // その他
} as const;

export type IncomeCategory =
  (typeof IncomeCategory)[keyof typeof IncomeCategory];

// バイト先情報
export interface JobSource {
  id: string;
  name: string;
  category: IncomeCategory;
  hourlyRate?: number;
  expectedMonthlyHours?: number;
  bankAccountInfo?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 拡張された収入データ
export interface Income {
  id: string;
  amount: number;
  date: string;
  category: IncomeCategory;
  description?: string;
  jobSourceId?: string;
  jobSource?: JobSource;
  isAutoDetected: boolean;
  detectionConfidence?: number;
  transactionId?: string;
  rawDescription?: string;
  createdAt: string;
}

// 2025年対応の扶養限度額の種類
export const FuyouLimitType = {
  STUDENT_DEPENDENT: 'student_dependent', // 学生特定扶養控除（150万円）
  BASIC_DEPENDENT: 'basic_dependent', // 基本扶養控除（123万円）
  SOCIAL_INSURANCE: 'social_insurance', // 社会保険の扶養（130万円）
  SPOUSE_SPECIAL: 'spouse_special', // 配偶者特別控除（160万円）
  FUYOU_103: 'fuyou_103', // 従来の103万円制度
  FUYOU_123: 'fuyou_123', // 2025年新制度123万円
  FUYOU_150: 'fuyou_150', // 2025年学生特例150万円
  CUSTOM: 'custom', // カスタム設定
} as const;

export type FuyouLimitType =
  (typeof FuyouLimitType)[keyof typeof FuyouLimitType];

// 2025年対応の扶養限度額設定
export interface FuyouLimit {
  type: FuyouLimitType;
  amount: number;
  name: string;
  description: string;
  effectiveDate: string;
}

// 拡張された扶養状況
export interface FuyouStatus {
  currentYearIncome: number; // 今年の合計収入
  currentMonthIncome: number; // 今月の収入
  applicableLimits: FuyouLimit[]; // 適用可能な制度一覧
  selectedLimit: FuyouLimit; // 選択中の扶養限度
  remainingCapacity: number; // 残り枠
  percentageUsed: number; // 使用率（%）
  monthlyAverage: number; // 月平均収入
  monthlyTargetIncome: number; // 月間目標収入
  projectedYearIncome: number; // 年間予測収入
  riskLevel: 'safe' | 'warning' | 'danger'; // リスクレベル
  isOverLimit: boolean; // 限度額超過フラグ
  alertTriggered: boolean; // アラート発動フラグ
  calculationDate: string; // 計算日時
}

// スマートアラート
export interface SmartAlert {
  id: string;
  alertType:
    | 'monthly_target'
    | 'yearly_projection'
    | 'limit_approach'
    | 'new_income_detected'
    | 'schedule_optimization';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionSuggestion?: string;
  relatedCalculationId?: string;
  isRead: boolean;
  isDismissed: boolean;
  triggeredAt: string;
  expiresAt?: string;
}

// アラート設定
export interface AlertSettings {
  warningThreshold: number; // 警告閾値（デフォルト: 80%）
  dangerThreshold: number; // 危険閾値（デフォルト: 95%）
  enableNotifications: boolean;
  notifyEmail?: string;
  enableSmartAlerts: boolean; // スマートアラート有効化
  alertTypes: string[]; // 有効なアラートタイプ
}

// アプリケーション設定
export interface AppSettings {
  selectedLimitType: FuyouLimitType;
  customLimitAmount?: number;
  alertSettings: AlertSettings;
  currency: 'JPY' | 'USD';
  fiscalYearStart: number; // 会計年度開始月（1-12）
}

// 2025年対応のデフォルト扶養限度額
export const DEFAULT_FUYOU_LIMITS_2025: Record<FuyouLimitType, FuyouLimit> = {
  [FuyouLimitType.STUDENT_DEPENDENT]: {
    type: FuyouLimitType.STUDENT_DEPENDENT,
    amount: 1500000,
    name: '学生特定扶養控除',
    description: '大学生等（19-23歳）の特定扶養控除（150万円）',
    effectiveDate: '2025-01-01',
  },
  [FuyouLimitType.BASIC_DEPENDENT]: {
    type: FuyouLimitType.BASIC_DEPENDENT,
    amount: 1230000,
    name: '基本扶養控除',
    description: '基礎控除58万円 + 給与所得控除65万円（123万円）',
    effectiveDate: '2025-01-01',
  },
  [FuyouLimitType.SOCIAL_INSURANCE]: {
    type: FuyouLimitType.SOCIAL_INSURANCE,
    amount: 1300000,
    name: '社会保険の扶養',
    description: '健康保険・厚生年金の扶養認定（130万円）',
    effectiveDate: '2025-01-01',
  },
  [FuyouLimitType.SPOUSE_SPECIAL]: {
    type: FuyouLimitType.SPOUSE_SPECIAL,
    amount: 1600000,
    name: '配偶者特別控除',
    description: '配偶者特別控除の満額対象（160万円）',
    effectiveDate: '2025-01-01',
  },
  [FuyouLimitType.FUYOU_103]: {
    type: FuyouLimitType.FUYOU_103,
    amount: 1030000,
    name: '従来の配偶者控除（103万円）',
    description: '従来の配偶者控除制度',
    effectiveDate: '2025-01-01',
  },
  [FuyouLimitType.FUYOU_123]: {
    type: FuyouLimitType.FUYOU_123,
    amount: 1230000,
    name: '新・配偶者控除（123万円）',
    description: '2025年新制度：従来の103万円から20万円引き上げ',
    effectiveDate: '2025-01-01',
  },
  [FuyouLimitType.FUYOU_150]: {
    type: FuyouLimitType.FUYOU_150,
    amount: 1500000,
    name: '学生特例制度（150万円）',
    description: '2025年新制度：19-22歳学生向け特別控除',
    effectiveDate: '2025-01-01',
  },
  [FuyouLimitType.CUSTOM]: {
    type: FuyouLimitType.CUSTOM,
    amount: 0,
    name: 'カスタム設定',
    description: '任意の金額を設定',
    effectiveDate: '2025-01-01',
  },
};

// 収入分析データ
export interface IncomeAnalysis {
  jobSourceId: string;
  jobSourceName: string;
  category: IncomeCategory;
  totalIncome: number;
  monthlyAverage: number;
  percentage: number;
}

// 労働最適化提案
export interface WorkOptimization {
  recommendations: Array<{
    jobSourceId: string;
    jobSourceName: string;
    currentMonthlyHours?: number;
    recommendedMonthlyHours: number;
    hourlyRate?: number;
    expectedMonthlyIncome: number;
  }>;
  totalRecommendedIncome: number;
}

// 銀行連携情報（Phase 3用）
export interface BankConnection {
  id: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'other';
  maskedAccountNumber?: string;
  isActive: boolean;
  autoSyncEnabled: boolean;
  lastSyncDate?: string;
  syncFrequencyHours: number;
  createdAt: string;
  updatedAt: string;
}
