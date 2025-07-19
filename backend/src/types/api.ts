import { z } from 'zod';

// User-related types (先に定義)
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  isStudent: boolean;
  createdAt: string;
  updatedAt: string;
}

// Express型拡張
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Common response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Authentication schemas
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  isStudent: z.boolean().default(true),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Income categories enum
export enum IncomeCategory {
  PART_TIME_JOB = 'part_time_job',
  TEMPORARY_WORK = 'temporary_work', 
  FREELANCE = 'freelance',
  SCHOLARSHIP = 'scholarship',
  FAMILY_SUPPORT = 'family_support',
  OTHER = 'other'
}

// Enhanced Income schemas
export const CreateIncomeSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  source: z.string().min(1, 'Source is required'),
  description: z.string().optional(),
  incomeDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid date format'
  ),
  category: z.nativeEnum(IncomeCategory).default(IncomeCategory.OTHER),
  jobSourceId: z.string().uuid().optional(),
  isAutoDetected: z.boolean().default(false),
  detectionConfidence: z.number().min(0).max(1).optional(),
  transactionId: z.string().optional(),
  rawDescription: z.string().optional(),
});

export const UpdateIncomeSchema = CreateIncomeSchema.partial();

export const GetIncomesSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  source: z.string().optional(),
});

// Job Source schemas
export const CreateJobSourceSchema = z.object({
  name: z.string().min(1, 'Job source name is required'),
  category: z.nativeEnum(IncomeCategory),
  hourlyRate: z.number().positive().optional(),
  expectedMonthlyHours: z.number().int().positive().optional(),
  bankAccountInfo: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
});

export const UpdateJobSourceSchema = CreateJobSourceSchema.partial();

// Enhanced Dependent schemas
export const CreateDependentSchema = z.object({
  annualLimit: z.number().positive('Annual limit must be positive').default(1500000), // 2025年学生特定扶養控除
  currentYear: z.number().int().min(2020).max(2100),
  alertThreshold: z.number().min(0).max(1).default(0.8),
  limitType: z.enum(['student_dependent', 'basic_dependent', 'social_insurance', 'spouse_special', 'custom']).default('student_dependent'),
});

export const UpdateDependentSchema = CreateDependentSchema.partial();

// Smart Alert schemas
export const CreateSmartAlertSchema = z.object({
  alertType: z.enum(['monthly_target', 'yearly_projection', 'limit_approach', 'new_income_detected', 'schedule_optimization']),
  severity: z.enum(['info', 'warning', 'critical']),
  title: z.string().min(1, 'Alert title is required'),
  message: z.string().min(1, 'Alert message is required'),
  actionSuggestion: z.string().optional(),
  expiresAt: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid expiration date format'
  ).optional(),
});

// Enhanced Calculation schemas
export const CalculateDeductionSchema = z.object({
  year: z.number().int().min(2020).max(2100).default(new Date().getFullYear()),
  includeProjections: z.boolean().default(false),
  limitType: z.enum(['student_dependent', 'basic_dependent', 'social_insurance', 'spouse_special', 'custom']).optional(),
  customLimitAmount: z.number().positive().optional(),
});

// Bank Connection schemas (Phase 3)
export const CreateBankConnectionSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountType: z.enum(['checking', 'savings', 'other']).default('checking'),
  autoSyncEnabled: z.boolean().default(true),
  syncFrequencyHours: z.number().int().positive().default(24),
});

export const ProjectIncomeSchema = z.object({
  targetAmount: z.number().positive().optional(),
  projectionMonths: z.number().int().min(1).max(12).default(12),
});

// Export type definitions
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>;
export type CreateIncomeRequest = z.infer<typeof CreateIncomeSchema>;
export type UpdateIncomeRequest = z.infer<typeof UpdateIncomeSchema>;
export type GetIncomesRequest = z.infer<typeof GetIncomesSchema>;
export type CreateJobSourceRequest = z.infer<typeof CreateJobSourceSchema>;
export type UpdateJobSourceRequest = z.infer<typeof UpdateJobSourceSchema>;
export type CreateDependentRequest = z.infer<typeof CreateDependentSchema>;
export type UpdateDependentRequest = z.infer<typeof UpdateDependentSchema>;
export type CreateSmartAlertRequest = z.infer<typeof CreateSmartAlertSchema>;
export type CalculateDeductionRequest = z.infer<typeof CalculateDeductionSchema>;
export type ProjectIncomeRequest = z.infer<typeof ProjectIncomeSchema>;
export type CreateBankConnectionRequest = z.infer<typeof CreateBankConnectionSchema>;

// Shift schemas
export const CreateShiftSchema = z.object({
  jobSourceId: z.string().uuid().optional(),
  jobSourceName: z.string().min(1, 'Job source name is required'),
  date: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid date format'
  ),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  hourlyRate: z.number().positive('Hourly rate must be positive'),
  breakMinutes: z.number().int().min(0).default(0),
  description: z.string().optional(),
  isConfirmed: z.boolean().default(false),
});

export const UpdateShiftSchema = CreateShiftSchema.partial();

export const GetShiftsSchema = z.object({
  startDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid start date format'
  ).optional(),
  endDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid end date format'
  ).optional(),
  jobSourceId: z.string().uuid().optional(),
  isConfirmed: z.boolean().optional(),
});

export type CreateShiftRequest = z.infer<typeof CreateShiftSchema>;
export type UpdateShiftRequest = z.infer<typeof UpdateShiftSchema>;
export type GetShiftsRequest = z.infer<typeof GetShiftsSchema>;

// User-related types (moved to top)

export interface AuthToken {
  token: string;
  refreshToken?: string;
  expiresIn: number;
  user: AuthUser;
}

// Job Source types
export interface JobSourceResponse {
  id: string;
  userId: string;
  name: string;
  category: IncomeCategory;
  hourlyRate?: number;
  expectedMonthlyHours?: number;
  bankAccountInfo?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Enhanced Income types
export interface IncomeResponse {
  id: string;
  userId: string;
  amount: number;
  source: string;
  description: string | null;
  incomeDate: string;
  category: IncomeCategory;
  jobSourceId?: string;
  jobSource?: JobSourceResponse;
  isAutoDetected: boolean;
  detectionConfidence?: number;
  transactionId?: string;
  rawDescription?: string;
  createdAt: string;
}

export interface IncomeStats {
  totalIncome: number;
  averageMonthlyIncome: number;
  incomeBySource: Record<string, number>;
  monthlyBreakdown: Array<{
    month: string;
    amount: number;
  }>;
}

// Smart Alert types
export interface SmartAlertResponse {
  id: string;
  userId: string;
  alertType: string;
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

// Enhanced Calculation types
export interface FuyouLimit2025 {
  type: 'student_dependent' | 'basic_dependent' | 'social_insurance' | 'spouse_special' | 'custom';
  amount: number;
  name: string;
  description: string;
  effectiveDate: string;
}

export interface DeductionCalculation {
  year: number;
  totalIncome: number;
  applicableLimits: FuyouLimit2025[];
  selectedLimit: FuyouLimit2025;
  remainingCapacity: number;
  monthlyTargetIncome: number;
  projectedYearEndIncome?: number;
  riskLevel: 'safe' | 'warning' | 'danger';
  isOverLimit: boolean;
  alertTriggered: boolean;
  calculationDate: string;
}

// Bank Connection types (Phase 3)
export interface BankConnectionResponse {
  id: string;
  userId: string;
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

// Shift response types
export interface ShiftResponse {
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
  createdAt: string;
  updatedAt: string;
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

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  deduction: number;
}