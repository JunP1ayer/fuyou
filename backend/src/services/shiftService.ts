import { supabase } from '../utils/supabase';
import { CreateShiftRequest, UpdateShiftRequest, GetShiftsRequest, ShiftResponse, ShiftStats } from '../types/api';
import { createError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export class ShiftService {
  // Create a new shift
  async createShift(userId: string, data: CreateShiftRequest): Promise<ShiftResponse> {
    try {
      // Calculate working hours and earnings
      const workingHours = this.calculateWorkingHours(data.startTime, data.endTime, data.breakMinutes);
      const calculatedEarnings = workingHours * data.hourlyRate;

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
        working_hours: workingHours.toString(),
        calculated_earnings: calculatedEarnings.toString(),
        description: data.description || null,
        is_confirmed: data.isConfirmed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: insertedShift, error } = await (supabase as any)
        .from('shifts', 500)
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
      let query = (supabase as any)
        .from('shifts', 500)
        .select('*')
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

      return (shifts || []).map((shift: any) => this.transformShiftResponse(shift));
    } catch (error) {
      throw error instanceof Error ? error : createError('Failed to fetch shifts', 500);
    }
  }

  // Get a single shift by ID
  async getShiftById(userId: string, shiftId: string): Promise<ShiftResponse> {
    try {
      const { data: shift, error } = await (supabase as any)
        .from('shifts', 500)
        .select('*')
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
      const updateData: any = {
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
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isConfirmed !== undefined) updateData.is_confirmed = data.isConfirmed;

      // Recalculate working hours and earnings if time or rate changed
      if (data.startTime || data.endTime || data.breakMinutes || data.hourlyRate) {
        // Get current shift to fill missing values
        const currentShift = await this.getShiftById(userId, shiftId);
        
        const startTime = data.startTime || currentShift.startTime;
        const endTime = data.endTime || currentShift.endTime;
        const breakMinutes = data.breakMinutes ?? currentShift.breakMinutes;
        const hourlyRate = data.hourlyRate || currentShift.hourlyRate;

        const workingHours = this.calculateWorkingHours(startTime, endTime, breakMinutes);
        const calculatedEarnings = workingHours * hourlyRate;

        updateData.working_hours = workingHours.toString();
        updateData.calculated_earnings = calculatedEarnings.toString();
      }

      const { data: updatedShift, error } = await (supabase as any)
        .from('shifts', 500)
        .update(updateData)
        .eq('id', shiftId)
        .eq('user_id', userId)
        .select()
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
      const { error } = await (supabase as any)
        .from('shifts', 500)
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
      let query = (supabase as any)
        .from('shifts', 500)
        .select('*')
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

  // Helper method to calculate working hours
  private calculateWorkingHours(startTime: string, endTime: string, breakMinutes: number): number {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    let diffMs = end.getTime() - start.getTime();
    
    // Handle overnight shifts
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Add 24 hours
    }
    
    const totalMinutes = diffMs / (1000 * 60);
    const workingMinutes = totalMinutes - breakMinutes;
    
    return Math.max(0, workingMinutes / 60); // Convert to hours, minimum 0
  }

  // Helper method to transform database response
  private transformShiftResponse(shift: any): ShiftResponse {
    return {
      id: shift.id,
      userId: shift.user_id,
      jobSourceId: shift.job_source_id,
      jobSourceName: shift.job_source_name,
      date: shift.date,
      startTime: shift.start_time,
      endTime: shift.end_time,
      hourlyRate: shift.hourly_rate,
      breakMinutes: shift.break_minutes,
      workingHours: shift.working_hours,
      calculatedEarnings: shift.calculated_earnings,
      description: shift.description,
      isConfirmed: shift.is_confirmed,
      createdAt: shift.created_at,
      updatedAt: shift.updated_at,
    };
  }

  // Get earnings projection based on shifts
  async getEarningsProjection(userId: string): Promise<any> {
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

  // Helper method to calculate statistics
  private calculateShiftStats(shifts: any[]): ShiftStats {
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();

    const thisMonthShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate.getMonth() + 1 === thisMonth && shiftDate.getFullYear() === thisYear;
    });

    // Group by job source
    const byJobSource = shifts.reduce((acc, shift) => {
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
      byJobSource: Object.values(byJobSource),
    };
  }
}

export const shiftService = new ShiftService();