// Phase 4: Constraint Management Service
// Handles all constraint-related operations for the optimization system

import { supabase } from '../utils/supabase';
import { createError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import {
  ConstraintType,
  ConstraintUnit,
  TierLevel,
  TIER_LIMITS,
  OptimizationConstraintResponse,
  AvailabilitySlotResponse,
  UserOptimizationPreferencesResponse,
  ConstraintValidationResult,
  CreateOptimizationConstraintRequest,
  UpdateOptimizationConstraintRequest,
  CreateAvailabilitySlotRequest,
  UpdateAvailabilitySlotRequest,
  CreateUserOptimizationPreferencesRequest,
  UpdateUserOptimizationPreferencesRequest
} from '../types/optimization';

export class ConstraintService {
  
  // ========== Optimization Constraints ==========
  
  /**
   * Create a new optimization constraint
   */
  async createConstraint(
    userId: string, 
    data: CreateOptimizationConstraintRequest
  ): Promise<OptimizationConstraintResponse> {
    try {
      // Validate tier limits
      await this.validateTierLimits(userId);
      
      // Check for duplicate constraints
      const existingConstraint = await this.getConstraintByType(userId, data.constraintType);
      if (existingConstraint && existingConstraint.isActive) {
        throw createError(
          `An active constraint of type ${data.constraintType} already exists. Please update the existing constraint instead.`,
          400
        );
      }

      const constraint = {
        id: uuidv4(),
        user_id: userId,
        constraint_type: data.constraintType,
        constraint_value: data.constraintValue,
        constraint_unit: data.constraintUnit,
        priority: data.priority || 1,
        is_active: data.isActive ?? true,
        metadata: data.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertedConstraint, error } = await (supabase as any)
        .from('optimization_constraints', 500)
        .insert([constraint])
        .select()
        .single();

      if (error) {
        throw createError(`Failed to create constraint: ${error.message}`, 400);
      }

      return this.transformConstraintResponse(insertedConstraint);
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to create constraint', 500);
    }
  }

  /**
   * Get all constraints for a user
   */
  async getConstraints(userId: string, activeOnly: boolean = true): Promise<OptimizationConstraintResponse[]> {
    try {
      let query = (supabase as any)
        .from('optimization_constraints', 500)
        .select('*')
        .eq('user_id', userId);

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data: constraints, error } = await query.order('priority', { ascending: true });

      if (error) {
        throw createError(`Failed to fetch constraints: ${error.message}`, 400);
      }

      return (constraints || []).map((constraint: any) => 
        this.transformConstraintResponse(constraint)
      );
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to fetch constraints', 500);
    }
  }

  /**
   * Get constraint by type
   */
  async getConstraintByType(
    userId: string, 
    constraintType: ConstraintType
  ): Promise<OptimizationConstraintResponse | null> {
    try {
      const { data: constraint, error } = await (supabase as any)
        .from('optimization_constraints', 500)
        .select('*')
        .eq('user_id', userId)
        .eq('constraint_type', constraintType)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No constraint found
        }
        throw createError(`Failed to fetch constraint: ${error.message}`, 400);
      }

      return this.transformConstraintResponse(constraint);
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to fetch constraint', 500);
    }
  }

  /**
   * Update a constraint
   */
  async updateConstraint(
    userId: string,
    constraintId: string,
    data: UpdateOptimizationConstraintRequest
  ): Promise<OptimizationConstraintResponse> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.constraintType !== undefined) updateData.constraint_type = data.constraintType;
      if (data.constraintValue !== undefined) updateData.constraint_value = data.constraintValue;
      if (data.constraintUnit !== undefined) updateData.constraint_unit = data.constraintUnit;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;
      if (data.metadata !== undefined) updateData.metadata = data.metadata;

      const { data: updatedConstraint, error } = await (supabase as any)
        .from('optimization_constraints', 500)
        .update(updateData)
        .eq('id', constraintId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw createError(`Failed to update constraint: ${error.message}`, 400);
      }

      return this.transformConstraintResponse(updatedConstraint);
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to update constraint', 500);
    }
  }

  /**
   * Delete a constraint
   */
  async deleteConstraint(userId: string, constraintId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('optimization_constraints', 500)
        .delete()
        .eq('id', constraintId)
        .eq('user_id', userId);

      if (error) {
        throw createError(`Failed to delete constraint: ${error.message}`, 400);
      }
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to delete constraint', 500);
    }
  }

  // ========== Availability Slots ==========

  /**
   * Create availability slot
   */
  async createAvailabilitySlot(
    userId: string,
    data: CreateAvailabilitySlotRequest
  ): Promise<AvailabilitySlotResponse> {
    try {
      // Validate time range
      this.validateTimeRange(data.startTime, data.endTime);

      const slot = {
        id: uuidv4(),
        user_id: userId,
        day_of_week: data.dayOfWeek,
        start_time: data.startTime,
        end_time: data.endTime,
        is_available: data.isAvailable ?? true,
        job_source_id: data.jobSourceId || null,
        priority: data.priority || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertedSlot, error } = await (supabase as any)
        .from('availability_slots', 500)
        .insert([slot])
        .select()
        .single();

      if (error) {
        throw createError(`Failed to create availability slot: ${error.message}`, 400);
      }

      return this.transformAvailabilitySlotResponse(insertedSlot);
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to create availability slot', 500);
    }
  }

  /**
   * Get all availability slots for a user
   */
  async getAvailabilitySlots(userId: string): Promise<AvailabilitySlotResponse[]> {
    try {
      const { data: slots, error } = await (supabase as any)
        .from('availability_slots', 500)
        .select('*')
        .eq('user_id', userId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        throw createError(`Failed to fetch availability slots: ${error.message}`, 400);
      }

      return (slots || []).map((slot: any) => 
        this.transformAvailabilitySlotResponse(slot)
      );
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to fetch availability slots', 500);
    }
  }

  /**
   * Update availability slot
   */
  async updateAvailabilitySlot(
    userId: string,
    slotId: string,
    data: UpdateAvailabilitySlotRequest
  ): Promise<AvailabilitySlotResponse> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.dayOfWeek !== undefined) updateData.day_of_week = data.dayOfWeek;
      if (data.startTime !== undefined) updateData.start_time = data.startTime;
      if (data.endTime !== undefined) updateData.end_time = data.endTime;
      if (data.isAvailable !== undefined) updateData.is_available = data.isAvailable;
      if (data.jobSourceId !== undefined) updateData.job_source_id = data.jobSourceId;
      if (data.priority !== undefined) updateData.priority = data.priority;

      // Validate time range if times are being updated
      if (data.startTime || data.endTime) {
        const currentSlot = await this.getAvailabilitySlot(userId, slotId);
        const startTime = data.startTime || currentSlot.startTime;
        const endTime = data.endTime || currentSlot.endTime;
        this.validateTimeRange(startTime, endTime);
      }

      const { data: updatedSlot, error } = await (supabase as any)
        .from('availability_slots', 500)
        .update(updateData)
        .eq('id', slotId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw createError(`Failed to update availability slot: ${error.message}`, 400);
      }

      return this.transformAvailabilitySlotResponse(updatedSlot);
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to update availability slot', 500);
    }
  }

  /**
   * Delete availability slot
   */
  async deleteAvailabilitySlot(userId: string, slotId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('availability_slots', 500)
        .delete()
        .eq('id', slotId)
        .eq('user_id', userId);

      if (error) {
        throw createError(`Failed to delete availability slot: ${error.message}`, 400);
      }
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to delete availability slot', 500);
    }
  }

  // ========== User Preferences ==========

  /**
   * Get user optimization preferences
   */
  async getUserPreferences(userId: string): Promise<UserOptimizationPreferencesResponse> {
    try {
      const { data: preferences, error } = await (supabase as any)
        .from('user_optimization_preferences', 500)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, create default
          return await this.createUserPreferences(userId, {
          defaultObjective: 'maximize_income' as any,
          optimizationFrequency: 'weekly' as any,
          autoApplySuggestions: false,
          tierLevel: 'free' as any
        });
        }
        throw createError(`Failed to fetch user preferences: ${error.message}`, 400);
      }

      return this.transformUserPreferencesResponse(preferences);
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to fetch user preferences', 500);
    }
  }

  /**
   * Create user optimization preferences
   */
  async createUserPreferences(
    userId: string,
    data: CreateUserOptimizationPreferencesRequest
  ): Promise<UserOptimizationPreferencesResponse> {
    try {
      const preferences = {
        id: uuidv4(),
        user_id: userId,
        preferred_algorithm: 'linear_programming',
        optimization_goal: data.defaultObjective || 'maximize_income',
        risk_tolerance: 'moderate',
        time_horizon: 'medium',
        auto_optimize: data.autoApplySuggestions || false,
        notification_settings: data.notificationPreferences || {
          new_recommendations: true,
          weekly_reports: false,
          monthly_reports: true,
          risk_alerts: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertedPreferences, error } = await (supabase as any)
        .from('user_optimization_preferences', 500)
        .insert([preferences])
        .select()
        .single();

      if (error) {
        throw createError(`Failed to create user preferences: ${error.message}`, 400);
      }

      return this.transformUserPreferencesResponse(insertedPreferences);
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to create user preferences', 500);
    }
  }

  /**
   * Update user optimization preferences
   */
  async updateUserPreferences(
    userId: string,
    data: UpdateUserOptimizationPreferencesRequest
  ): Promise<UserOptimizationPreferencesResponse> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.defaultObjective !== undefined) updateData.default_objective = data.defaultObjective;
      if (data.optimizationFrequency !== undefined) updateData.optimization_frequency = data.optimizationFrequency;
      if (data.autoApplySuggestions !== undefined) updateData.auto_apply_suggestions = data.autoApplySuggestions;
      if (data.notificationPreferences !== undefined) updateData.notification_preferences = data.notificationPreferences;
      if (data.tierLevel !== undefined) updateData.tier_level = data.tierLevel;

      const { data: updatedPreferences, error } = await (supabase as any)
        .from('user_optimization_preferences', 500)
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw createError(`Failed to update user preferences: ${error.message}`, 400);
      }

      return this.transformUserPreferencesResponse(updatedPreferences);
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to update user preferences', 500);
    }
  }

  // ========== Constraint Validation ==========

  /**
   * Validate constraints against current user data
   */
  async validateConstraints(userId: string): Promise<ConstraintValidationResult> {
    try {
      const constraints = await this.getConstraints(userId);
      const violations: ConstraintValidationResult['violations'] = [];
      const suggestions: string[] = [];

      for (const constraint of constraints) {
        const validation = await this.validateSingleConstraint(userId, constraint);
        
        if (!validation.isValid) {
          violations.push({
            constraintType: constraint.constraintType,
            currentValue: validation.currentValue,
            limitValue: constraint.constraintValue,
            severity: validation.severity,
            message: validation.message
          });
        }

        if (validation.suggestion) {
          suggestions.push(validation.suggestion);
        }
      }

      return {
        isValid: violations.length === 0,
        violations,
        suggestions
      };
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to validate constraints', 500);
    }
  }

  // ========== Helper Methods ==========

  private async validateTierLimits(userId: string): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    const tierLimits = TIER_LIMITS[preferences.tierLevel];
    
    const constraintCount = await this.getConstraintCount(userId);
    
    if (tierLimits.maxConstraints !== -1 && constraintCount >= tierLimits.maxConstraints) {
      throw createError(
        `You have reached the maximum number of constraints (${tierLimits.maxConstraints}) for your ${preferences.tierLevel} tier. Please upgrade to add more constraints.`,
        403
      );
    }
  }

  private async getConstraintCount(userId: string): Promise<number> {
    const { count, error } = await (supabase as any)
      .from('optimization_constraints', 500)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw createError(`Failed to count constraints: ${error.message}`, 400);
    }

    return count || 0;
  }

  private async getAvailabilitySlot(userId: string, slotId: string): Promise<AvailabilitySlotResponse> {
    const { data: slot, error } = await (supabase as any)
      .from('availability_slots', 500)
      .select('*')
      .eq('id', slotId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw createError(`Failed to fetch availability slot: ${error.message}`, 400);
    }

    return this.transformAvailabilitySlotResponse(slot);
  }

  private validateTimeRange(startTime: string, endTime: string): void {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    if (start >= end) {
      throw createError('End time must be after start time', 400);
    }
  }

  private async validateSingleConstraint(
    userId: string,
    constraint: OptimizationConstraintResponse
  ): Promise<{
    isValid: boolean;
    currentValue: number;
    severity: 'warning' | 'error';
    message: string;
    suggestion?: string;
  }> {
    // This is a simplified validation - in a real implementation,
    // you would check against actual user data
    
    switch (constraint.constraintType) {
      case ConstraintType.FUYOU_LIMIT:
        // Check current year income against fuyou limit
        const currentIncome = await this.getCurrentYearIncome(userId);
        const isValid = currentIncome <= constraint.constraintValue;
        
        return {
          isValid,
          currentValue: currentIncome,
          severity: isValid ? 'warning' : 'error',
          message: isValid 
            ? `Current income (¥${currentIncome.toLocaleString()}) is within fuyou limit`
            : `Current income (¥${currentIncome.toLocaleString()}) exceeds fuyou limit of ¥${constraint.constraintValue.toLocaleString()}`,
          suggestion: isValid ? undefined : 'Consider reducing your shift hours or optimizing your schedule'
        };
      
      default:
        return {
          isValid: true,
          currentValue: 0,
          severity: 'warning',
          message: 'Constraint validation not implemented for this type'
        };
    }
  }

  private async getCurrentYearIncome(userId: string): Promise<number> {
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;
    
    const { data: incomes, error } = await (supabase as any)
      .from('incomes', 500)
      .select('amount')
      .eq('user_id', userId)
      .gte('income_date', startDate)
      .lte('income_date', endDate);
    
    if (error) {
      return 0;
    }
    
    return (incomes || []).reduce((total: number, income: any) => total + income.amount, 0);
  }

  // Transform database responses to API responses
  private transformConstraintResponse(constraint: any): OptimizationConstraintResponse {
    return {
      id: constraint.id,
      userId: constraint.user_id,
      constraintType: constraint.constraint_type,
      constraintValue: constraint.constraint_value,
      constraintUnit: constraint.constraint_unit,
      priority: constraint.priority,
      isActive: constraint.is_active,
      metadata: constraint.metadata,
      createdAt: constraint.created_at,
      updatedAt: constraint.updated_at
    };
  }

  private transformAvailabilitySlotResponse(slot: any): AvailabilitySlotResponse {
    return {
      id: slot.id,
      userId: slot.user_id,
      dayOfWeek: slot.day_of_week,
      startTime: slot.start_time,
      endTime: slot.end_time,
      isAvailable: slot.is_available,
      jobSourceId: slot.job_source_id,
      priority: slot.priority,
      createdAt: slot.created_at,
      updatedAt: slot.updated_at
    };
  }

  private transformUserPreferencesResponse(preferences: any): UserOptimizationPreferencesResponse {
    return {
      id: preferences.id,
      userId: preferences.user_id,
      defaultObjective: preferences.default_objective,
      optimizationFrequency: preferences.optimization_frequency,
      autoApplySuggestions: preferences.auto_apply_suggestions,
      notificationPreferences: preferences.notification_preferences,
      tierLevel: preferences.tier_level,
      monthlyOptimizationRuns: preferences.monthly_optimization_runs,
      lastOptimizationReset: preferences.last_optimization_reset,
      createdAt: preferences.created_at,
      updatedAt: preferences.updated_at
    };
  }
}

export const constraintService = new ConstraintService();