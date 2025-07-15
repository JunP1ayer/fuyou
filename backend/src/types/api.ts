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

// Income schemas
export const CreateIncomeSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  source: z.string().min(1, 'Source is required'),
  description: z.string().optional(),
  incomeDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid date format'
  ),
});

export const UpdateIncomeSchema = CreateIncomeSchema.partial();

export const GetIncomesSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  source: z.string().optional(),
});

// Dependent schemas
export const CreateDependentSchema = z.object({
  annualLimit: z.number().positive('Annual limit must be positive').default(1030000),
  currentYear: z.number().int().min(2020).max(2100),
  alertThreshold: z.number().min(0).max(1).default(0.8),
});

export const UpdateDependentSchema = CreateDependentSchema.partial();

// Calculation schemas
export const CalculateDeductionSchema = z.object({
  year: z.number().int().min(2020).max(2100).default(new Date().getFullYear()),
  includeProjections: z.boolean().default(false),
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
export type CreateDependentRequest = z.infer<typeof CreateDependentSchema>;
export type UpdateDependentRequest = z.infer<typeof UpdateDependentSchema>;
export type CalculateDeductionRequest = z.infer<typeof CalculateDeductionSchema>;
export type ProjectIncomeRequest = z.infer<typeof ProjectIncomeSchema>;

// User-related types (moved to top)

export interface AuthToken {
  token: string;
  refreshToken?: string;
  expiresIn: number;
  user: AuthUser;
}

// Income-related types
export interface IncomeResponse {
  id: string;
  userId: string;
  amount: number;
  source: string;
  description: string | null;
  incomeDate: string;
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

// Calculation-related types
export interface DeductionCalculation {
  year: number;
  totalIncome: number;
  annualLimit: number;
  remainingAmount: number;
  deductionRate: number;
  projectedYearEndIncome?: number;
  isOverLimit: boolean;
  alertTriggered: boolean;
}

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  deduction: number;
}