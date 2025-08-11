import { supabase, supabaseAdmin } from '../utils/supabase';
import { CreateShiftRequest, UpdateShiftRequest, GetShiftsRequest, ShiftResponse, ShiftStats } from '../types/api';
import { createError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

// Use admin client from shared utils (handles test env fallback)
const serviceSupabase = supabaseAdmin;

export class ShiftService {
  // Create a new shift
  async createShift(userId: string, data: CreateShiftRequest): Promise<ShiftResponse> {
    try {
      // Check for time conflicts with existing shifts on the same date
      await this.checkForTimeConflicts(userId, data.date, data.startTime, data.endTime);

      // Calculate using DB function for single source of truth (includes auto-break and overtime)
      const rpcParams = {
        p_start_time: data.startTime,
        p_end_time: data.endTime,
        p_hourly_rate: data.hourlyRate,
        p_manual_break_minutes: data.breakMinutes ?? 0,
        p_auto_break_4h: true, // 4h rule enabled by default if available
        p_auto_break_6h: data.autoBreak6Hours !== false,
        p_auto_break_8h: data.autoBreak8Hours !== false,
        p_overtime_enabled: data.overtimeEnabled !== false,
      } as const;

      const { data: calcRows, error: calcError } = await serviceSupabase.rpc('calculate_shift_earnings', rpcParams);
      if (calcError || !calcRows || calcRows.length === 0) {
        throw createError(`Failed to calculate earnings: ${calcError?.message || 'no result'}`, 400);
      }
      const calc = Array.isArray(calcRows) ? calcRows[0] : calcRows;
      const workingHours = Number(calc.working_hours ?? calc.workingHours ?? 0);
      const calculatedEarnings = Number(calc.total_earnings ?? calc.totalEarnings ?? 0);

      const shift = {
        id: uuidv4(),
        user_id: userId,
        job_source_id: data.jobSourceId || null,
        job_source_name: data.jobSourceName,
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        hourly_rate: data.hourlyRate,
        break_minutes: data.breakMinutes,
        auto_break_6_hours: data.autoBreak6Hours !== false, // デフォルト true
        auto_break_8_hours: data.autoBreak8Hours !== false, // デフォルト true
        overtime_enabled: data.overtimeEnabled !== false, // デフォルト true
        day_of_week_settings_enabled: data.dayOfWeekSettingsEnabled || false,
        working_hours: workingHours.toString(),
        calculated_earnings: calculatedEarnings.toString(),
        description: data.description || null,
        is_confirmed: data.isConfirmed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Use service client to bypass RLS for demo authentication
      const { data: insertedShift, error } = await serviceSupabase
        .from('shifts')
        .insert([shift])
        .select()
        .single();

      if (error) {
        throw createError(`Failed to create shift: ${error.message}`, 400);
      }

      return this.transformShiftResponse(insertedShift);
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to create shift', 500);
    }
  }

  // Get shifts with filters
  async getShifts(userId: string, filters: GetShiftsRequest = {}): Promise<ShiftResponse[]> {
    try {
      let query = serviceSupabase
        .from('shifts')
        .select('id,user_id,job_source_id,job_source_name,date,start_time,end_time,hourly_rate,break_minutes,auto_break_6_hours,auto_break_8_hours,overtime_enabled,day_of_week_settings_enabled,working_hours,calculated_earnings,description,is_confirmed,created_at,updated_at')
        .eq('user_id', userId);

      // Apply filters
      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters.jobSourceId) {
        query = query.eq('job_source_id', filters.jobSourceId);
      }
      if (filters.isConfirmed !== undefined) {
        query = query.eq('is_confirmed', filters.isConfirmed);
      }

      const { data: shifts, error } = await query.order('date', { ascending: false });

      if (error) {
        throw createError(`Failed to fetch shifts: ${error.message}`, 400);
      }

      return (shifts || []).map((shift) => this.transformShiftResponse(shift));
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to fetch shifts', 500);
    }
  }

  // Get a single shift by ID
  async getShiftById(userId: string, shiftId: string): Promise<ShiftResponse> {
    try {
      const { data: shift, error } = await supabase
        .from('shifts')
        .select('id,user_id,job_source_id,job_source_name,date,start_time,end_time,hourly_rate,break_minutes,auto_break_6_hours,auto_break_8_hours,overtime_enabled,day_of_week_settings_enabled,working_hours,calculated_earnings,description,is_confirmed,created_at,updated_at')
        .eq('id', shiftId)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw createError(`Shift not found: ${error.message}`, 404);
      }

      return this.transformShiftResponse(shift);
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to fetch shift', 500);
    }
  }

  // Update a shift
  async updateShift(userId: string, shiftId: string, data: UpdateShiftRequest): Promise<ShiftResponse> {
    try {
      // Check for time conflicts if date or time is being updated
      if (data.date || data.startTime || data.endTime) {
        // Get current shift to fill missing values
        const currentShift = await this.getShiftById(userId, shiftId);
        
        const date = data.date || currentShift.date;
        const startTime = data.startTime || currentShift.startTime;
        const endTime = data.endTime || currentShift.endTime;
        
        await this.checkForTimeConflicts(userId, date, startTime, endTime, shiftId);
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Only update provided fields
      if (data.jobSourceId !== undefined) updateData.job_source_id = data.jobSourceId;
      if (data.jobSourceName !== undefined) updateData.job_source_name = data.jobSourceName;
      if (data.date !== undefined) updateData.date = data.date;
      if (data.startTime !== undefined) updateData.start_time = data.startTime;
      if (data.endTime !== undefined) updateData.end_time = data.endTime;
      if (data.hourlyRate !== undefined) updateData.hourly_rate = data.hourlyRate;
      if (data.breakMinutes !== undefined) updateData.break_minutes = data.breakMinutes;
      if (data.autoBreak6Hours !== undefined) updateData.auto_break_6_hours = data.autoBreak6Hours;
      if (data.autoBreak8Hours !== undefined) updateData.auto_break_8_hours = data.autoBreak8Hours;
      if (data.overtimeEnabled !== undefined) updateData.overtime_enabled = data.overtimeEnabled;
      if (data.dayOfWeekSettingsEnabled !== undefined) updateData.day_of_week_settings_enabled = data.dayOfWeekSettingsEnabled;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isConfirmed !== undefined) updateData.is_confirmed = data.isConfirmed;

      // Recalculate working hours and earnings if time or rate changed
      if (data.startTime || data.endTime || data.breakMinutes || data.autoBreak6Hours !== undefined || data.autoBreak8Hours !== undefined || data.overtimeEnabled !== undefined || data.hourlyRate) {
        // Get current shift to fill missing values
        const currentShift = await this.getShiftById(userId, shiftId);
        
        const startTime = data.startTime || currentShift.startTime;
        const endTime = data.endTime || currentShift.endTime;
        const breakMinutes = data.breakMinutes ?? currentShift.breakMinutes;
        const autoBreak6Hours = data.autoBreak6Hours ?? currentShift.autoBreak6Hours;
        const autoBreak8Hours = data.autoBreak8Hours ?? currentShift.autoBreak8Hours;
        const overtimeEnabled = data.overtimeEnabled ?? currentShift.overtimeEnabled;
        const hourlyRate = data.hourlyRate || currentShift.hourlyRate;

        // Use DB function for recalculation
        const { data: calcRows, error: calcError } = await serviceSupabase.rpc('calculate_shift_earnings', {
          p_start_time: startTime,
          p_end_time: endTime,
          p_hourly_rate: hourlyRate,
          p_manual_break_minutes: breakMinutes ?? 0,
          p_auto_break_4h: true,
          p_auto_break_6h: autoBreak6Hours !== false,
          p_auto_break_8h: autoBreak8Hours !== false,
          p_overtime_enabled: overtimeEnabled !== false,
        });
        if (calcError || !calcRows || calcRows.length === 0) {
          throw createError(`Failed to calculate earnings: ${calcError?.message || 'no result'}`, 400);
        }
        const calc = Array.isArray(calcRows) ? calcRows[0] : calcRows;
        const workingHours = Number(calc.working_hours ?? calc.workingHours ?? 0);
        const calculatedEarnings = Number(calc.total_earnings ?? calc.totalEarnings ?? 0);

        updateData.working_hours = workingHours.toString();
        updateData.calculated_earnings = calculatedEarnings.toString();
      }

      const { data: updatedShift, error } = await supabase
        .from('shifts')
        .update(updateData)
        .eq('id', shiftId)
        .eq('user_id', userId)
        .select('id,user_id,job_source_id,job_source_name,date,start_time,end_time,hourly_rate,break_minutes,auto_break_6_hours,auto_break_8_hours,overtime_enabled,day_of_week_settings_enabled,working_hours,calculated_earnings,description,is_confirmed,created_at,updated_at')
        .single();

      if (error) {
        throw createError(`Failed to update shift: ${error.message}`, 400);
      }

      return this.transformShiftResponse(updatedShift);
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to update shift', 500);
    }
  }

  // Delete a shift
  async deleteShift(userId: string, shiftId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId)
        .eq('user_id', userId);

      if (error) {
        throw createError(`Failed to delete shift: ${error.message}`, 400);
      }
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to delete shift', 500);
    }
  }

  // Get shift statistics
  async getShiftStats(userId: string, year?: number, month?: number): Promise<ShiftStats> {
    try {
      let query = serviceSupabase
        .from('shifts')
        .select('date,working_hours,calculated_earnings,job_source_id,job_source_name')
        .eq('user_id', userId);

      // Filter by year/month if provided
      if (year) {
        const startDate = month ? `${year}-${month.toString().padStart(2, '0')}-01` : `${year}-01-01`;
        const endDate = month 
          ? `${year}-${month.toString().padStart(2, '0')}-31`
          : `${year}-12-31`;
        
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data: shifts, error } = await query;

      if (error) {
        throw createError(`Failed to fetch shift stats: ${error.message}`, 400);
      }

      return this.calculateShiftStats(shifts || []);
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to fetch shift stats', 500);
    }
  }

  // Helper method to calculate working hours with auto-break support
  private calculateWorkingHours(startTime: string, endTime: string, breakMinutes: number = 0, autoBreak6Hours?: boolean, autoBreak8Hours?: boolean): number {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    let diffMs = end.getTime() - start.getTime();
    
    // Handle overnight shifts
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Add 24 hours
    }
    
    const totalMinutes = diffMs / (1000 * 60);
    const totalHours = totalMinutes / 60;
    
    // Calculate break time
    let totalBreakMinutes = breakMinutes;
    
    // Add automatic break time based on total work hours
    if (autoBreak8Hours !== false && totalHours > 8) {
      totalBreakMinutes += 60; // 8時間越えで1時間休憩
    } else if (autoBreak6Hours !== false && totalHours > 6) {
      totalBreakMinutes += 45; // 6時間越えで45分休憩
    }
    
    const workingMinutes = totalMinutes - totalBreakMinutes;
    
    return Math.max(0, workingMinutes / 60); // Convert to hours, minimum 0
  }

  // Helper method to calculate earnings with overtime support
  private calculateEarnings(workingHours: number, hourlyRate: number, overtimeEnabled?: boolean): number {
    if (overtimeEnabled !== false && workingHours > 8) { // デフォルト true
      // 8時間以内は通常時給
      const regularHours = 8;
      const overtimeHours = workingHours - 8;
      
      return (regularHours * hourlyRate) + (overtimeHours * hourlyRate * 1.25);
    } else {
      // 通常計算
      return workingHours * hourlyRate;
    }
  }

  // Helper method to transform database response
  private transformShiftResponse(shift: {
    id: string; user_id: string; job_source_id: string | null; job_source_name: string; date: string;
    start_time: string; end_time: string; hourly_rate: number; break_minutes: number; 
    auto_break_6_hours?: boolean; auto_break_8_hours?: boolean; overtime_enabled?: boolean; day_of_week_settings_enabled?: boolean;
    working_hours: string; calculated_earnings: string; description: string | null; is_confirmed: boolean; 
    created_at: string; updated_at: string;
  }): ShiftResponse {
    return {
      id: shift.id,
      userId: shift.user_id,
      jobSourceId: shift.job_source_id ?? undefined,
      jobSourceName: shift.job_source_name,
      date: shift.date,
      startTime: shift.start_time,
      endTime: shift.end_time,
      hourlyRate: shift.hourly_rate,
      breakMinutes: shift.break_minutes,
      autoBreak6Hours: shift.auto_break_6_hours,
      autoBreak8Hours: shift.auto_break_8_hours,
      overtimeEnabled: shift.overtime_enabled,
      dayOfWeekSettingsEnabled: shift.day_of_week_settings_enabled,
      workingHours: parseFloat(shift.working_hours),
      calculatedEarnings: parseFloat(shift.calculated_earnings),
      description: shift.description ?? undefined,
      isConfirmed: shift.is_confirmed,
      createdAt: shift.created_at,
      updatedAt: shift.updated_at,
    };
  }

  // Get earnings projection based on shifts
  async getEarningsProjection(userId: string): Promise<{
    currentMonth: number;
    projectedTotal: number;
    dailyAverage: number;
    remainingWorkingDays: number;
    suggestedDailyTarget: number;
    fuyouLimitRemaining: number;
    riskLevel: 'safe' | 'warning' | 'danger';
    projectedMonthEnd: number;
    usageRate: number;
    yearToDate: number;
  }> {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const daysPassed = now.getDate();

      // Get this month's shifts
      const thisMonthShifts = await this.getShifts(userId, {
        startDate: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`,
        endDate: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${daysInMonth}`,
      });

      // Get year-to-date shifts
      const yearShifts = await this.getShifts(userId, {
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
      });

      const currentMonthEarnings = thisMonthShifts.reduce((sum, shift) => sum + parseFloat(shift.calculatedEarnings.toString()), 0);
      const yearToDateEarnings = yearShifts.reduce((sum, shift) => sum + parseFloat(shift.calculatedEarnings.toString()), 0);

      // Calculate daily average for this month
      const dailyAverage = daysPassed > 0 ? currentMonthEarnings / daysPassed : 0;

      // Project month-end earnings
      const projectedMonthEnd = daysPassed > 0 ? (currentMonthEarnings / daysPassed) * daysInMonth : 0;

      // Calculate remaining working days (assuming 5-day work week)
      const remainingWorkingDays = Math.max(0, Math.floor((daysInMonth - daysPassed) * (5/7)));

      // Project year-end earnings
      const monthlyAverage = currentMonth > 1 ? yearToDateEarnings / currentMonth : currentMonthEarnings;
      const projectedYearEnd = monthlyAverage * 12;

      // Suggested daily target to stay within limits (150万円 for students)
      const fuyouLimit = 1500000; // 150万円
      const remainingInYear = fuyouLimit - yearToDateEarnings;
      const monthsRemaining = 12 - currentMonth;
      const suggestedDailyTarget = monthsRemaining > 0 ? 
        (remainingInYear / monthsRemaining) / 22 : // 22 working days per month
        0;

      // Calculate risk level
      const usageRate = yearToDateEarnings / fuyouLimit;
      let riskLevel: 'safe' | 'warning' | 'danger';
      
      if (projectedYearEnd > fuyouLimit * 0.95) {
        riskLevel = 'danger';
      } else if (projectedYearEnd > fuyouLimit * 0.8) {
        riskLevel = 'warning';
      } else {
        riskLevel = 'safe';
      }

      return {
        currentMonth: currentMonthEarnings,
        projectedTotal: projectedYearEnd,
        dailyAverage,
        remainingWorkingDays,
        suggestedDailyTarget,
        fuyouLimitRemaining: Math.max(0, fuyouLimit - yearToDateEarnings),
        riskLevel,
        projectedMonthEnd,
        usageRate: Math.min(1, usageRate),
        yearToDate: yearToDateEarnings,
      };
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to calculate earnings projection', 500);
    }
  }

  // Check for time conflicts with existing shifts
  private async checkForTimeConflicts(
    userId: string, 
    date: string, 
    startTime: string, 
    endTime: string, 
    excludeShiftId?: string
  ): Promise<void> {
    try {
      // Get all shifts for the same date
      const existingShifts = await this.getShifts(userId, {
        startDate: date,
        endDate: date,
      });

      // Filter out the shift being updated (if any)
      const shiftsToCheck = excludeShiftId 
        ? existingShifts.filter(shift => shift.id !== excludeShiftId)
        : existingShifts;

      // Check for time overlaps
      for (const existingShift of shiftsToCheck) {
        if (this.hasTimeOverlap(startTime, endTime, existingShift.startTime, existingShift.endTime)) {
          throw createError(
            `Time conflict detected with existing shift: ${existingShift.jobSourceName} (${existingShift.startTime} - ${existingShift.endTime})`,
            409
          );
        }
      }
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to check time conflicts', 500);
    }
  }

  // Check if two time ranges overlap
  private hasTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const parseTime = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start1Minutes = parseTime(start1);
    const end1Minutes = parseTime(end1);
    const start2Minutes = parseTime(start2);
    const end2Minutes = parseTime(end2);

    // Handle overnight shifts
    const adjustEnd1 = end1Minutes < start1Minutes ? end1Minutes + 24 * 60 : end1Minutes;
    const adjustEnd2 = end2Minutes < start2Minutes ? end2Minutes + 24 * 60 : end2Minutes;

    // Check for overlap
    return !(adjustEnd1 <= start2Minutes || adjustEnd2 <= start1Minutes);
  }

  // Bulk create shifts with conflict handling
  async bulkCreateShifts(userId: string, shiftsData: CreateShiftRequest[]): Promise<{
    savedShifts: ShiftResponse[];
    skippedShifts: Array<{ shift: CreateShiftRequest; reason: string }>;
    savedCount: number;
    skippedCount: number;
  }> {
    const savedShifts: ShiftResponse[] = [];
    const skippedShifts: Array<{ shift: CreateShiftRequest; reason: string }> = [];

    for (const shiftData of shiftsData) {
      try {
        const shift = await this.createShift(userId, shiftData);
        savedShifts.push(shift);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        skippedShifts.push({
          shift: shiftData,
          reason: errorMessage
        });
      }
    }

    return {
      savedShifts,
      skippedShifts,
      savedCount: savedShifts.length,
      skippedCount: skippedShifts.length
    };
  }

  // Helper method to calculate statistics
  private calculateShiftStats(shifts: Array<{
    date: string;
    job_source_id: string | null;
    job_source_name: string;
    working_hours: string;
    calculated_earnings: string;
  }>): ShiftStats {
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();

    const thisMonthShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate.getMonth() + 1 === thisMonth && shiftDate.getFullYear() === thisYear;
    });

    // Group by job source
    const byJobSource = shifts.reduce<Record<string, { jobSourceId: string | null; jobSourceName: string; shifts: number; hours: number; earnings: number }>>((acc, shift) => {
      const key = shift.job_source_name;
      if (!acc[key]) {
        acc[key] = {
          jobSourceId: shift.job_source_id,
          jobSourceName: shift.job_source_name,
          shifts: 0,
          hours: 0,
          earnings: 0,
        };
      }
      acc[key].shifts += 1;
      acc[key].hours += parseFloat(shift.working_hours);
      acc[key].earnings += parseFloat(shift.calculated_earnings);
      return acc;
    }, {});

    return {
      totalShifts: shifts.length,
      totalHours: shifts.reduce((sum, shift) => sum + parseFloat(shift.working_hours), 0),
      totalEarnings: shifts.reduce((sum, shift) => sum + parseFloat(shift.calculated_earnings), 0),
      thisMonth: {
        shifts: thisMonthShifts.length,
        hours: thisMonthShifts.reduce((sum, shift) => sum + parseFloat(shift.working_hours), 0),
        earnings: thisMonthShifts.reduce((sum, shift) => sum + parseFloat(shift.calculated_earnings), 0),
      },
      byJobSource: Object.values(byJobSource).map(item => ({
        jobSourceId: item.jobSourceId ?? undefined,
        jobSourceName: item.jobSourceName,
        shifts: item.shifts,
        hours: item.hours,
        earnings: item.earnings,
      })),
    };
  }
}

export const shiftService = new ShiftService();