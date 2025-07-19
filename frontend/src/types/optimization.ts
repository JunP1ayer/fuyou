// Phase 4: Optimization Types for Frontend
// TypeScript definitions for optimization algorithms and constraints

export interface OptimizationConstraint {
  id: string;
  userId: string;
  constraintType: 'max_weekly_hours' | 'max_monthly_hours' | 'min_monthly_income' | 'max_monthly_income' | 'fuyou_limit' | 'custom';
  constraintValue: number;
  constraintUnit: 'hours' | 'yen' | 'percentage' | 'custom';
  priority: number; // 1-5, 1 is highest priority
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  id: string;
  userId: string;
  dayOfWeek: number; // 0-6, 0 is Sunday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserOptimizationPreferences {
  id: string;
  userId: string;
  preferredAlgorithm: AlgorithmType;
  optimizationGoal: ObjectiveType;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  timeHorizon: 'short' | 'medium' | 'long'; // 1-3 months, 3-6 months, 6-12 months
  autoOptimize: boolean;
  notificationSettings: {
    newRecommendations: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
    riskAlerts: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OptimizationAlgorithm {
  id: AlgorithmType;
  name: string;
  description: string;
  complexity: 'low' | 'medium' | 'high';
  executionTime: 'fast' | 'medium' | 'slow';
  suitableFor: ObjectiveType[];
  tierRequirement: 'free' | 'standard' | 'pro';
}

export interface OptimizationRun {
  id: string;
  userId: string;
  objectiveType: ObjectiveType;
  algorithmUsed: AlgorithmType;
  timePeriodStart: string; // ISO date
  timePeriodEnd: string; // ISO date
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-1
  message: string;
  estimatedCompletion?: string;
  result?: OptimizationResult;
  createdAt: string;
  completedAt?: string;
}

export interface OptimizationResult {
  runId: string;
  objectiveValue: number;
  optimizedSchedule: OptimizedShift[];
  recommendations: OptimizationRecommendation[];
  constraints: OptimizationConstraint[];
  convergenceMetrics: {
    iterations: number;
    executionTime: number;
    confidenceScore: number;
  };
  alternativeSolutions?: OptimizationResult[];
}

export interface OptimizedShift {
  id: string;
  jobSourceId: string;
  jobSourceName: string;
  date: string; // ISO date
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  duration: number; // hours
  hourlyRate: number;
  expectedIncome: number;
  isRecommended: boolean;
  recommendationReason: string;
  priority: number;
}

export interface OptimizationRecommendation {
  id: string;
  type: 'shift_add' | 'shift_remove' | 'shift_modify' | 'constraint_adjust' | 'goal_modify';
  title: string;
  description: string;
  impact: {
    incomeChange: number;
    hoursChange: number;
    riskChange: 'decrease' | 'maintain' | 'increase';
  };
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  estimatedBenefit: number;
  relatedShifts?: OptimizedShift[];
}

export interface OptimizationStats {
  totalRuns: number;
  averageIncome: number;
  averageHours: number;
  successRate: number;
  averageExecutionTime: number;
  popularAlgorithms: {
    algorithm: AlgorithmType;
    usage: number;
    successRate: number;
  }[];
  monthlyTrends: {
    month: string;
    averageIncome: number;
    averageHours: number;
    runsCount: number;
  }[];
}

export interface OptimizationTier {
  name: string;
  price: number;
  features: string[];
  limits: {
    maxOptimizationRuns: number; // -1 for unlimited
    maxConstraints: number; // -1 for unlimited
    maxTimeHorizon: number; // days
  };
}

export interface OptimizationValidation {
  isValid: boolean;
  violations: {
    constraintId: string;
    message: string;
    severity: 'warning' | 'error';
  }[];
  suggestions: string[];
}

// Enum types
export type ObjectiveType = 
  | 'maximize_income'
  | 'minimize_hours'
  | 'balance_sources'
  | 'minimize_risk'
  | 'multi_objective';

export type AlgorithmType = 
  | 'linear_programming'
  | 'genetic_algorithm'
  | 'simulated_annealing'
  | 'multi_objective_nsga2';

// API Request/Response types
export interface CreateOptimizationConstraintRequest {
  constraintType: OptimizationConstraint['constraintType'];
  constraintValue: number;
  constraintUnit: OptimizationConstraint['constraintUnit'];
  priority?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateOptimizationConstraintRequest {
  constraintValue?: number;
  constraintUnit?: OptimizationConstraint['constraintUnit'];
  priority?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateAvailabilitySlotRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  notes?: string;
}

export interface UpdateAvailabilitySlotRequest {
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
  notes?: string;
}

export interface CreateUserOptimizationPreferencesRequest {
  preferredAlgorithm: AlgorithmType;
  optimizationGoal: ObjectiveType;
  riskTolerance: UserOptimizationPreferences['riskTolerance'];
  timeHorizon: UserOptimizationPreferences['timeHorizon'];
  autoOptimize: boolean;
  notificationSettings: UserOptimizationPreferences['notificationSettings'];
}

export interface UpdateUserOptimizationPreferencesRequest {
  preferredAlgorithm?: AlgorithmType;
  optimizationGoal?: ObjectiveType;
  riskTolerance?: UserOptimizationPreferences['riskTolerance'];
  timeHorizon?: UserOptimizationPreferences['timeHorizon'];
  autoOptimize?: boolean;
  notificationSettings?: UserOptimizationPreferences['notificationSettings'];
}

export interface CreateOptimizationRunRequest {
  objectiveType: ObjectiveType;
  timePeriodStart: string;
  timePeriodEnd: string;
  algorithmUsed: AlgorithmType;
}

// Response wrappers
export interface OptimizationApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    source?: string;
  };
}

export interface OptimizationApiError {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

// UI State types
export interface OptimizationUIState {
  isLoading: boolean;
  error: string | null;
  activeTab: number;
  selectedRun: OptimizationRun | null;
  constraints: OptimizationConstraint[];
  availability: AvailabilitySlot[];
  preferences: UserOptimizationPreferences | null;
  runs: OptimizationRun[];
  algorithms: OptimizationAlgorithm[];
  tiers: Record<string, OptimizationTier>;
}

// Chart data types for visualization
export interface OptimizationChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
  }[];
}

export interface OptimizationMetrics {
  income: {
    current: number;
    optimized: number;
    improvement: number;
    improvementPercentage: number;
  };
  hours: {
    current: number;
    optimized: number;
    change: number;
    changePercentage: number;
  };
  efficiency: {
    current: number; // income per hour
    optimized: number;
    improvement: number;
    improvementPercentage: number;
  };
  risk: {
    current: 'low' | 'medium' | 'high';
    optimized: 'low' | 'medium' | 'high';
    change: 'decrease' | 'maintain' | 'increase';
  };
}