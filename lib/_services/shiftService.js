import { supabaseAdmin } from '../_utils/supabase.js';
import { v4 as uuidv4 } from 'uuid';

export class ShiftService {
  // Create a new shift
  async createShift(userId, data) {
    try {
      // Check for time conflicts with existing shifts on the same date
      await this.checkForTimeConflicts(userId, data.date, data.startTime, data.endTime);

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

      // Use service client to bypass RLS for demo authentication
      const { data: insertedShift, error } = await supabaseAdmin
        .from('shifts')
        .insert([shift])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create shift: ${error.message}`);
      }

      return this.transformShiftResponse(insertedShift);
    } catch (error) {
      throw error;
    }
  }

  // Get shifts with filters
  async getShifts(userId, filters = {}) {
    try {
      let query = supabaseAdmin
        .from('shifts')
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
        throw new Error(`Failed to fetch shifts: ${error.message}`);
      }

      return (shifts || []).map((shift) => this.transformShiftResponse(shift));
    } catch (error) {
      throw error;
    }
  }

  // Get a single shift by ID
  async getShiftById(userId, shiftId) {
    try {
      const { data: shift, error } = await supabaseAdmin
        .from('shifts')
        .select('*')
        .eq('id', shiftId)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new Error(`Shift not found: ${error.message}`);
      }

      return this.transformShiftResponse(shift);
    } catch (error) {
      throw error;
    }
  }

  // Update a shift
  async updateShift(userId, shiftId, data) {
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

      const updateData = {
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

      const { data: updatedShift, error } = await supabaseAdmin
        .from('shifts')
        .update(updateData)
        .eq('id', shiftId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update shift: ${error.message}`);
      }

      return this.transformShiftResponse(updatedShift);
    } catch (error) {
      throw error;
    }
  }

  // Delete a shift
  async deleteShift(userId, shiftId) {
    try {
      const { error } = await supabaseAdmin
        .from('shifts')
        .delete()
        .eq('id', shiftId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete shift: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  // Get shift statistics
  async getShiftStats(userId, year, month) {
    try {
      let query = supabaseAdmin
        .from('shifts')
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
        throw new Error(`Failed to fetch shift stats: ${error.message}`);
      }

      return this.calculateShiftStats(shifts || []);
    } catch (error) {
      throw error;
    }
  }

  // Get earnings projection based on shifts
  async getEarningsProjection(userId) {
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
      let riskLevel;
      
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
      throw error;
    }
  }

  // Bulk create shifts with conflict handling
  async bulkCreateShifts(userId, shiftsData) {
    const savedShifts = [];
    const skippedShifts = [];

    for (const shiftData of shiftsData) {
      try {
        const shift = await this.createShift(userId, shiftData);
        savedShifts.push(shift);
      } catch (error) {
        const errorMessage = error.message || 'Unknown error';
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

  // Helper method to calculate working hours
  calculateWorkingHours(startTime, endTime, breakMinutes) {
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
  transformShiftResponse(shift) {
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

  // Check for time conflicts with existing shifts
  async checkForTimeConflicts(userId, date, startTime, endTime, excludeShiftId) {
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
          throw new Error(
            `Time conflict detected with existing shift: ${existingShift.jobSourceName} (${existingShift.startTime} - ${existingShift.endTime})`
          );
        }
      }
    } catch (error) {
      throw error;
    }
  }

  // Check if two time ranges overlap
  hasTimeOverlap(start1, end1, start2, end2) {
    const parseTime = (timeStr) => {
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

  // Helper method to calculate statistics
  calculateShiftStats(shifts) {
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