// Phase 4: Optimization Integration Service
// Service to integrate with the Python optimization microservice

import axios, { AxiosInstance, AxiosError } from 'axios';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import {
  OptimizationConstraintResponse,
  AvailabilitySlotResponse,
  UserOptimizationPreferencesResponse,
  OptimizationRequest,
  OptimizationResult,
  TierLevel,
  AlgorithmType,
  ObjectiveType
} from '../types/optimization';

export interface PythonOptimizationRequest {
  user_id: string;
  objective: ObjectiveType;
  time_range: {
    start: string;
    end: string;
  };
  constraints: Array<{
    constraint_type: string;
    constraint_value: number;
    constraint_unit: string;
    priority: number;
    metadata?: any;
  }>;
  job_sources: Array<{
    id: string;
    name: string;
    hourly_rate: number;
    is_active: boolean;
    expected_monthly_hours?: number;
    default_break_minutes?: number;
  }>;
  existing_shifts: Array<{
    date: string;
    start_time: string;
    end_time: string;
    job_source_id?: string;
    job_source_name: string;
    is_confirmed: boolean;
    hourly_rate: number;
    break_minutes: number;
  }>;
  availability: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
    job_source_id?: string;
    priority: number;
  }>;
  preferences: {
    algorithm: AlgorithmType;
    max_iterations?: number;
    timeout?: number;
    convergence_threshold?: number;
    enable_parallel?: boolean;
    random_seed?: number;
  };
  tier_level: TierLevel;
}

export interface PythonOptimizationResponse {
  success: boolean;
  optimization_run_id: string;
  solution?: {
    suggested_shifts: Array<{
      id: string;
      job_source_id?: string;
      job_source_name: string;
      date: string;
      start_time: string;
      end_time: string;
      hourly_rate: number;
      break_minutes: number;
      working_hours: number;
      calculated_earnings: number;
      confidence: number;
      priority: number;
      reasoning: string;
      is_original: boolean;
    }>;
    objective_value: number;
    constraints_satisfied: Record<string, boolean>;
    algorithm_used: AlgorithmType;
    execution_time_ms: number;
    confidence_score: number;
    metadata: any;
    total_income: number;
    total_hours: number;
    total_shifts: number;
    job_source_distribution: Record<string, number>;
  };
  error?: string;
  timestamp: string;
  processing_time_ms: number;
}

export class OptimizationIntegrationService {
  private client: AxiosInstance;
  private serviceUrl: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    this.serviceUrl = process.env.PYTHON_OPTIMIZATION_SERVICE_URL || 'http://localhost:8000';
    this.timeout = parseInt(process.env.OPTIMIZATION_TIMEOUT || '30000'); // 30 seconds
    this.maxRetries = parseInt(process.env.OPTIMIZATION_MAX_RETRIES || '3');
    this.retryDelay = parseInt(process.env.OPTIMIZATION_RETRY_DELAY || '1000'); // 1 second
    
    this.client = axios.create({
      baseURL: this.serviceUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'fuyou-backend/1.0.0'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`Optimization request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Optimization request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info(`Optimization response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Optimization response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    logger.info(`OptimizationIntegrationService initialized with URL: ${this.serviceUrl}`);
  }

  async runOptimization(
    userId: string,
    objective: ObjectiveType,
    timeRange: { start: string; end: string },
    constraints: OptimizationConstraintResponse[],
    jobSources: Array<any>,
    existingShifts: Array<any>,
    availability: AvailabilitySlotResponse[],
    preferences: UserOptimizationPreferencesResponse
  ): Promise<OptimizationResult> {
    try {
      logger.info(`Starting optimization for user ${userId} with objective ${objective}`);

      // Check service health first
      await this.checkServiceHealth();

      // Transform data for Python service
      const pythonRequest: PythonOptimizationRequest = {
        user_id: userId,
        objective,
        time_range: timeRange,
        constraints: constraints.map(c => ({
          constraint_type: c.constraintType,
          constraint_value: c.constraintValue,
          constraint_unit: c.constraintUnit,
          priority: c.priority,
          metadata: c.metadata
        })),
        job_sources: jobSources.map(js => ({
          id: js.id,
          name: js.name,
          hourly_rate: js.hourlyRate || js.hourly_rate,
          is_active: js.isActive ?? js.is_active ?? true,
          expected_monthly_hours: js.expectedMonthlyHours || js.expected_monthly_hours,
          default_break_minutes: js.defaultBreakMinutes || js.default_break_minutes || 0
        })),
        existing_shifts: existingShifts.map(shift => ({
          date: shift.date,
          start_time: shift.startTime || shift.start_time,
          end_time: shift.endTime || shift.end_time,
          job_source_id: shift.jobSourceId || shift.job_source_id,
          job_source_name: shift.jobSourceName || shift.job_source_name,
          is_confirmed: shift.isConfirmed ?? shift.is_confirmed ?? false,
          hourly_rate: shift.hourlyRate || shift.hourly_rate,
          break_minutes: shift.breakMinutes || shift.break_minutes || 0
        })),
        availability: availability.map(slot => ({
          day_of_week: slot.dayOfWeek,
          start_time: slot.startTime,
          end_time: slot.endTime,
          is_available: slot.isAvailable,
          job_source_id: slot.jobSourceId,
          priority: slot.priority
        })),
        preferences: {
          algorithm: this.mapAlgorithmType(preferences.defaultObjective),
          max_iterations: 1000,
          timeout: 300, // 5 minutes
          enable_parallel: true
        },
        tier_level: preferences.tierLevel
      };

      // Make optimization request with retry logic
      const response = await this.makeRequestWithRetry<PythonOptimizationResponse>(
        '/optimize',
        'POST',
        pythonRequest
      );

      if (!response.success) {
        throw createError(
          `Optimization failed: ${response.error || 'Unknown error'}`,
          500
        );
      }

      // Transform response back to our format
      const result: OptimizationResult = {
        success: true,
        optimizationRunId: response.optimization_run_id,
        solution: response.solution && response.success ? {
          suggestedShifts: response.solution.suggested_shifts.map(shift => ({
            id: shift.id,
            jobSourceId: shift.job_source_id,
            jobSourceName: shift.job_source_name,
            date: shift.date,
            startTime: shift.start_time,
            endTime: shift.end_time,
            hourlyRate: shift.hourly_rate,
            breakMinutes: shift.break_minutes,
            workingHours: shift.working_hours,
            calculatedEarnings: shift.calculated_earnings,
            confidence: shift.confidence,
            priority: shift.priority,
            reasoning: shift.reasoning,
            isOriginal: shift.is_original
          })),
          objectiveValue: response.solution.objective_value,
          constraintsSatisfied: response.solution.constraints_satisfied,
          algorithmUsed: response.solution.algorithm_used,
          executionTimeMs: response.solution.execution_time_ms,
          confidenceScore: response.solution.confidence_score,
          metadata: response.solution.metadata
        } : undefined,
        error: response.error,
        timestamp: response.timestamp,
        processingTimeMs: response.processing_time_ms
      };

      logger.info(`Optimization completed for user ${userId} in ${response.processing_time_ms}ms`);
      return result;

    } catch (error) {
      logger.error(`Optimization failed for user ${userId}:`, error);
      
      if (error instanceof AxiosError) {
        if (error.code === 'ECONNREFUSED') {
          throw createError('Optimization service is not available', 503);
        } else if (error.response?.status === 400) {
          throw createError(`Invalid optimization request: ${error.response.data?.message || error.message}`, 400);
        } else if (error.response?.status === 429) {
          throw createError('Optimization service is overloaded. Please try again later.', 429);
        }
      }

      throw error instanceof Error ? error : createError('Optimization failed', 500);
    }
  }

  async startAsyncOptimization(
    userId: string,
    objective: ObjectiveType,
    timeRange: { start: string; end: string },
    constraints: OptimizationConstraintResponse[],
    jobSources: Array<any>,
    existingShifts: Array<any>,
    availability: AvailabilitySlotResponse[],
    preferences: UserOptimizationPreferencesResponse
  ): Promise<{ runId: string; status: string }> {
    try {
      logger.info(`Starting async optimization for user ${userId}`);

      // Check service health first
      await this.checkServiceHealth();

      // Transform data for Python service (same as sync version)
      const pythonRequest: PythonOptimizationRequest = {
        user_id: userId,
        objective,
        time_range: timeRange,
        constraints: constraints.map(c => ({
          constraint_type: c.constraintType,
          constraint_value: c.constraintValue,
          constraint_unit: c.constraintUnit,
          priority: c.priority,
          metadata: c.metadata
        })),
        job_sources: jobSources.map(js => ({
          id: js.id,
          name: js.name,
          hourly_rate: js.hourlyRate || js.hourly_rate,
          is_active: js.isActive ?? js.is_active ?? true
        })),
        existing_shifts: existingShifts.map(shift => ({
          date: shift.date,
          start_time: shift.startTime || shift.start_time,
          end_time: shift.endTime || shift.end_time,
          job_source_id: shift.jobSourceId || shift.job_source_id,
          job_source_name: shift.jobSourceName || shift.job_source_name,
          is_confirmed: shift.isConfirmed ?? shift.is_confirmed ?? false,
          hourly_rate: shift.hourlyRate || shift.hourly_rate,
          break_minutes: shift.breakMinutes || shift.break_minutes || 0
        })),
        availability: availability.map(slot => ({
          day_of_week: slot.dayOfWeek,
          start_time: slot.startTime,
          end_time: slot.endTime,
          is_available: slot.isAvailable,
          job_source_id: slot.jobSourceId,
          priority: slot.priority
        })),
        preferences: {
          algorithm: this.mapAlgorithmType(preferences.defaultObjective),
          max_iterations: 1000,
          timeout: 300
        },
        tier_level: preferences.tierLevel
      };

      const response = await this.makeRequestWithRetry<{
        run_id: string;
        status: string;
        progress: number;
        message: string;
      }>('/optimize/async', 'POST', pythonRequest);

      return {
        runId: response.run_id,
        status: response.status
      };

    } catch (error) {
      logger.error(`Async optimization failed for user ${userId}:`, error);
      throw error instanceof Error ? error : createError('Async optimization failed', 500);
    }
  }

  async getOptimizationStatus(runId: string): Promise<{
    runId: string;
    status: string;
    progress: number;
    message: string;
    estimatedCompletion?: string;
  }> {
    try {
      const response = await this.makeRequestWithRetry<{
        run_id: string;
        status: string;
        progress: number;
        message: string;
        estimated_completion?: string;
      }>(`/optimize/status/${runId}`, 'GET');

      return {
        runId: response.run_id,
        status: response.status,
        progress: response.progress,
        message: response.message,
        estimatedCompletion: response.estimated_completion
      };

    } catch (error) {
      logger.error(`Failed to get optimization status for ${runId}:`, error);
      throw error instanceof Error ? error : createError('Failed to get optimization status', 500);
    }
  }

  async validateConstraints(constraints: OptimizationConstraintResponse[]): Promise<{
    isValid: boolean;
    violations: Array<{
      constraintType: string;
      message: string;
      severity: string;
    }>;
    suggestions: string[];
  }> {
    try {
      const pythonConstraints = constraints.map(c => ({
        constraint_type: c.constraintType,
        constraint_value: c.constraintValue,
        constraint_unit: c.constraintUnit,
        priority: c.priority,
        metadata: c.metadata || {}
      }));

      const response = await this.makeRequestWithRetry<{
        is_valid: boolean;
        violations: Array<{
          constraint_type: string;
          message: string;
          severity: string;
        }>;
        suggestions: string[];
      }>('/validate/constraints', 'POST', pythonConstraints);

      return {
        isValid: response.is_valid,
        violations: response.violations.map(v => ({
          constraintType: v.constraint_type,
          message: v.message,
          severity: v.severity
        })),
        suggestions: response.suggestions
      };

    } catch (error) {
      logger.error('Constraint validation failed:', error);
      throw error instanceof Error ? error : createError('Constraint validation failed', 500);
    }
  }

  async getAvailableAlgorithms(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    complexity: string;
    executionTime: string;
    suitableFor: string[];
    tierRequirement: string;
  }>> {
    try {
      const response = await this.makeRequestWithRetry<Array<{
        id: string;
        name: string;
        description: string;
        complexity: string;
        execution_time: string;
        suitable_for: string[];
        tier_requirement: string;
      }>>('/algorithms', 'GET');

      return response.map(algo => ({
        id: algo.id,
        name: algo.name,
        description: algo.description,
        complexity: algo.complexity,
        executionTime: algo.execution_time,
        suitableFor: algo.suitable_for,
        tierRequirement: algo.tier_requirement
      }));

    } catch (error) {
      logger.error('Failed to get available algorithms:', error);
      throw error instanceof Error ? error : createError('Failed to get available algorithms', 500);
    }
  }

  async checkServiceHealth(): Promise<void> {
    try {
      await this.makeRequestWithRetry<{ status: string }>('/health', 'GET');
    } catch (error) {
      logger.error('Optimization service health check failed:', error);
      throw createError('Optimization service is not available', 503);
    }
  }

  private async makeRequestWithRetry<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.request<T>({
          url,
          method,
          data: method !== 'GET' ? data : undefined,
          params: method === 'GET' ? data : undefined
        });

        return response.data;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.maxRetries) {
          break;
        }

        // Only retry on network errors or 5xx errors
        if (error instanceof AxiosError) {
          if (error.response?.status && error.response.status < 500) {
            break; // Don't retry on 4xx errors
          }
        }

        logger.warn(`Optimization request attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }

    throw lastError || createError('Request failed after retries', 500);
  }

  private mapAlgorithmType(objective: ObjectiveType): AlgorithmType {
    // Map objective to recommended algorithm
    switch (objective) {
      case ObjectiveType.MAXIMIZE_INCOME:
      case ObjectiveType.MINIMIZE_HOURS:
        return AlgorithmType.LINEAR_PROGRAMMING;
      case ObjectiveType.BALANCE_SOURCES:
        return AlgorithmType.GENETIC_ALGORITHM;
      case ObjectiveType.MULTI_OBJECTIVE:
        return AlgorithmType.MULTI_OBJECTIVE_NSGA2;
      default:
        return AlgorithmType.LINEAR_PROGRAMMING;
    }
  }
}

export const optimizationIntegrationService = new OptimizationIntegrationService();