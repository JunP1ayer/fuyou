/* eslint-disable @typescript-eslint/no-unused-vars */
// このファイルは将来の最適化機能のための定数・型定義を含みます。
// 現状では参照されないため、未使用警告を抑制します。
// Phase 4: Optimization Algorithm Types
// TypeScript types for the optimization system

import { z } from 'zod';

// Constraint Type Enumeration
export enum ConstraintType {
  FUYOU_LIMIT = 'fuyou_limit',
  WEEKLY_HOURS = 'weekly_hours',
  DAILY_HOURS = 'daily_hours',
  AVAILABILITY = 'availability',
  JOB_SOURCE_LIMIT = 'job_source_limit',
  MINIMUM_INCOME = 'minimum_income',
  BREAK_CONSTRAINTS = 'break_constraints'
}

// Constraint Unit Enumeration
export enum ConstraintUnit {
  YEN = 'yen',
  HOURS = 'hours',
  MINUTES = 'minutes',
  DAYS = 'days',
  SHIFTS = 'shifts',
  PERCENTAGE = 'percentage'
}

// Objective Type Enumeration
export enum ObjectiveType {
  MAXIMIZE_INCOME = 'maximize_income',
  MINIMIZE_HOURS = 'minimize_hours',
  BALANCE_SOURCES = 'balance_sources',
  MULTI_OBJECTIVE = 'multi_objective'
}

// Algorithm Type Enumeration
export enum AlgorithmType {
  LINEAR_PROGRAMMING = 'linear_programming',
  GENETIC_ALGORITHM = 'genetic_algorithm',
  SIMULATED_ANNEALING = 'simulated_annealing',
  MULTI_OBJECTIVE_NSGA2 = 'multi_objective_nsga2'
}

// Subscription Tier Enumeration
export enum TierLevel {
  FREE = 'free',
  STANDARD = 'standard',
  PRO = 'pro'
}

// Optimization Status Enumeration
export enum OptimizationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Optimization Constraint Schema
export const OptimizationConstraintSchema = z.object({
  constraintType: z.nativeEnum(ConstraintType),
  constraintValue: z.number().positive('Constraint value must be positive'),
  constraintUnit: z.nativeEnum(ConstraintUnit),
  priority: z.number().int().min(1).max(3).default(1),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional()
});

export const CreateOptimizationConstraintSchema = OptimizationConstraintSchema;
export const UpdateOptimizationConstraintSchema = OptimizationConstraintSchema.partial();

// Optimization Run Schema
export const OptimizationRunSchema = z.object({
  objectiveType: z.nativeEnum(ObjectiveType),
  timePeriodStart: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid start date format'
  ),
  timePeriodEnd: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid end date format'
  ),
  algorithmUsed: z.nativeEnum(AlgorithmType).optional(),
  inputData: z.record(z.unknown()).optional(),
  preferences: z.object({
    maxIterations: z.number().int().positive().optional(),
    timeout: z.number().int().positive().optional(),
    convergenceThreshold: z.number().positive().optional()
  }).optional()
});

export const CreateOptimizationRunSchema = OptimizationRunSchema;

// Availability Slot Schema
export const AvailabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0=Sunday, 6=Saturday
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  isAvailable: z.boolean().default(true),
  jobSourceId: z.string().uuid().optional(),
  priority: z.number().int().min(1).max(3).default(1)
});

export const CreateAvailabilitySlotSchema = AvailabilitySlotSchema;
export const UpdateAvailabilitySlotSchema = AvailabilitySlotSchema.partial();

// User Optimization Preferences Schema
export const UserOptimizationPreferencesSchema = z.object({
  defaultObjective: z.nativeEnum(ObjectiveType).default(ObjectiveType.MAXIMIZE_INCOME),
  optimizationFrequency: z.enum(['daily', 'weekly', 'bi_weekly', 'monthly', 'manual']).default('weekly'),
  autoApplySuggestions: z.boolean().default(false),
  notificationPreferences: z.object({
    email: z.boolean().default(true),
    inApp: z.boolean().default(true),
    push: z.boolean().default(false),
    optimizationComplete: z.boolean().default(true),
    constraintViolation: z.boolean().default(true),
    limitApproaching: z.boolean().default(true)
  }).optional(),
  tierLevel: z.nativeEnum(TierLevel).default(TierLevel.FREE)
});

export const CreateUserOptimizationPreferencesSchema = UserOptimizationPreferencesSchema;
export const UpdateUserOptimizationPreferencesSchema = UserOptimizationPreferencesSchema.partial();

// Type definitions from schemas
export type OptimizationConstraintRequest = z.infer<typeof OptimizationConstraintSchema>;
export type CreateOptimizationConstraintRequest = z.infer<typeof CreateOptimizationConstraintSchema>;
export type UpdateOptimizationConstraintRequest = z.infer<typeof UpdateOptimizationConstraintSchema>;

export type OptimizationRunRequest = z.infer<typeof OptimizationRunSchema>;
export type CreateOptimizationRunRequest = z.infer<typeof CreateOptimizationRunSchema>;

export type AvailabilitySlotRequest = z.infer<typeof AvailabilitySlotSchema>;
export type CreateAvailabilitySlotRequest = z.infer<typeof CreateAvailabilitySlotSchema>;
export type UpdateAvailabilitySlotRequest = z.infer<typeof UpdateAvailabilitySlotSchema>;

export type UserOptimizationPreferencesRequest = z.infer<typeof UserOptimizationPreferencesSchema>;
export type CreateUserOptimizationPreferencesRequest = z.infer<typeof CreateUserOptimizationPreferencesSchema>;
export type UpdateUserOptimizationPreferencesRequest = z.infer<typeof UpdateUserOptimizationPreferencesSchema>;

// Response interfaces
export interface OptimizationConstraintResponse {
  id: string;
  userId: string;
  constraintType: ConstraintType;
  constraintValue: number;
  constraintUnit: ConstraintUnit;
  priority: number;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OptimizationRunResponse {
  id: string;
  userId: string;
  objectiveType: ObjectiveType;
  timePeriodStart: string;
  timePeriodEnd: string;
  inputData: Record<string, unknown>;
  resultData?: Record<string, unknown>;
  executionTimeMs?: number;
  status: OptimizationStatus;
  errorMessage?: string;
  algorithmUsed: AlgorithmType;
  createdAt: string;
  updatedAt: string;
}

export interface OptimizationSuggestionResponse {
  id: string;
  userId: string;
  optimizationRunId: string;
  suggestedShifts: SuggestedShift[];
  objectiveValue: number;
  algorithmUsed: AlgorithmType;
  constraintsSatisfied: Record<string, boolean>;
  confidenceScore: number;
  isApplied: boolean;
  appliedAt?: string;
  userFeedback?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlotResponse {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  jobSourceId?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserOptimizationPreferencesResponse {
  id: string;
  userId: string;
  defaultObjective: ObjectiveType;
  optimizationFrequency: string;
  autoApplySuggestions: boolean;
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
    push: boolean;
    optimizationComplete: boolean;
    constraintViolation: boolean;
    limitApproaching: boolean;
  };
  tierLevel: TierLevel;
  monthlyOptimizationRuns: number;
  lastOptimizationReset: string;
  createdAt: string;
  updatedAt: string;
}

// Suggested Shift Interface
export interface SuggestedShift {
  id: string;
  jobSourceId?: string;
  jobSourceName: string;
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  breakMinutes: number;
  workingHours: number;
  calculatedEarnings: number;
  confidence: number;
  priority: number;
  reasoning: string;
  isOriginal: boolean; // true if this is an existing shift, false if suggested
}

// Optimization Request Interface (for Python service)
export interface OptimizationRequest {
  userId: string;
  objective: ObjectiveType;
  timeRange: {
    start: string;
    end: string;
  };
  constraints: OptimizationConstraintResponse[];
  jobSources: Array<{
    id: string;
    name: string;
    hourlyRate: number;
    isActive: boolean;
  }>;
  existingShifts: Array<{
    date: string;
    startTime: string;
    endTime: string;
    jobSourceId?: string;
    isConfirmed: boolean;
  }>;
  availability: AvailabilitySlotResponse[];
  preferences: {
    algorithm: AlgorithmType;
    maxIterations?: number;
    timeout?: number;
    convergenceThreshold?: number;
  };
}

// Optimization Result Interface (from Python service)
export interface OptimizationResult {
  success: boolean;
  optimizationRunId: string;
  solution?: {
    suggestedShifts: SuggestedShift[];
    objectiveValue: number;
    constraintsSatisfied: Record<string, boolean>;
    algorithmUsed: AlgorithmType;
    executionTimeMs: number;
    confidenceScore: number;
    metadata: Record<string, unknown>;
  };
  error?: string;
  timestamp?: string;
  processingTimeMs?: number;
}

// Constraint Validation Result
export interface ConstraintValidationResult {
  isValid: boolean;
  violations: Array<{
    constraintType: ConstraintType;
    currentValue: number;
    limitValue: number;
    severity: 'warning' | 'error';
    message: string;
  }>;
  suggestions: string[];
}

// Optimization Analytics
export interface OptimizationAnalytics {
  totalRuns: number;
  successRate: number;
  averageExecutionTime: number;
  averageImprovementPercent: number;
  mostUsedObjective: ObjectiveType;
  constraintViolationRate: number;
  userSatisfactionScore: number;
  tierUsageStats: Record<TierLevel, number>;
}

// Tier Limits Configuration
export interface TierLimits {
  maxOptimizationRuns: number;
  availableAlgorithms: AlgorithmType[];
  maxConstraints: number;
  maxTimeHorizon: number; // in days
  analyticsAccess: boolean;
  apiAccess: boolean;
  supportLevel: 'basic' | 'standard' | 'premium';
}

// Default tier limits
export const TIER_LIMITS: Record<TierLevel, TierLimits> = {
  [TierLevel.FREE]: {
    maxOptimizationRuns: 5,
    availableAlgorithms: [AlgorithmType.LINEAR_PROGRAMMING],
    maxConstraints: 5,
    maxTimeHorizon: 30,
    analyticsAccess: false,
    apiAccess: false,
    supportLevel: 'basic'
  },
  [TierLevel.STANDARD]: {
    maxOptimizationRuns: 50,
    availableAlgorithms: [AlgorithmType.LINEAR_PROGRAMMING, AlgorithmType.GENETIC_ALGORITHM],
    maxConstraints: 15,
    maxTimeHorizon: 90,
    analyticsAccess: true,
    apiAccess: false,
    supportLevel: 'standard'
  },
  [TierLevel.PRO]: {
    maxOptimizationRuns: -1, // unlimited
    availableAlgorithms: Object.values(AlgorithmType),
    maxConstraints: -1, // unlimited
    maxTimeHorizon: 365,
    analyticsAccess: true,
    apiAccess: true,
    supportLevel: 'premium'
  }
};