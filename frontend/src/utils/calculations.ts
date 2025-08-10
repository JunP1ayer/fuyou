// 💰 扶養・給料計算ユーティリティ

import type { Shift, FuyouStatus, MonthlyEarnings } from '@types/index';

/**
 * 2025年扶養制度の限度額定数
 */
export const FUYOU_LIMITS = {
  STUDENT_SPECIAL: 150_0000, // 学生特例 150万円
  STANDARD: 103_0000, // 基本扶養 103万円
  SOCIAL_INSURANCE: 130_0000, // 社会保険扶養 130万円
} as const;

/**
 * シフトから給料を計算
 */
export const calculateShiftEarnings = (
  shift: Omit<Shift, 'totalEarnings'>
): number => {
  const workMinutes = shift.actualWorkMinutes;
  const hourlyRate = shift.hourlyRate;

  // 分を時間に変換して計算
  const workHours = workMinutes / 60;
  return Math.floor(workHours * hourlyRate);
};

/**
 * 複数シフトの総収入を計算
 */
export const calculateTotalEarnings = (shifts: Shift[]): number => {
  return shifts.reduce((total, shift) => total + shift.totalEarnings, 0);
};

/**
 * 年間収入から扶養ステータスを計算
 */
export const calculateFuyouStatus = (
  yearlyEarnings: number,
  isStudent = true,
  targetLimit?: number
): FuyouStatus => {
  const limit =
    targetLimit ||
    (isStudent ? FUYOU_LIMITS.STUDENT_SPECIAL : FUYOU_LIMITS.STANDARD);
  const remaining = Math.max(0, limit - yearlyEarnings);
  const progress = Math.min(100, (yearlyEarnings / limit) * 100);

  let riskLevel: FuyouStatus['riskLevel'] = 'safe';
  if (progress >= 100) {
    riskLevel = 'danger';
  } else if (progress >= 80) {
    riskLevel = 'warning';
  }

  // 年末予測収入（現在の月からの予測）
  const currentMonth = new Date().getMonth() + 1;
  const monthlyAverage = yearlyEarnings / currentMonth;
  const estimatedYearEnd = monthlyAverage * 12;

  return {
    currentYearEarnings: yearlyEarnings,
    dependencyLimit: limit,
    remainingAmount: remaining,
    progressPercentage: Math.round(progress * 10) / 10, // 小数点1桁
    riskLevel,
    estimatedYearEndEarnings: Math.floor(estimatedYearEnd),
  };
};

/**
 * 月別収入統計を計算
 */
export const calculateMonthlyEarnings = (
  shifts: Shift[],
  year: number,
  month: number
): MonthlyEarnings => {
  const monthShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return (
      shiftDate.getFullYear() === year && shiftDate.getMonth() === month - 1
    );
  });

  const totalEarnings = calculateTotalEarnings(monthShifts);
  const totalMinutes = monthShifts.reduce(
    (total, shift) => total + shift.actualWorkMinutes,
    0
  );
  const totalHours = totalMinutes / 60;
  const averageRate = totalHours > 0 ? totalEarnings / totalHours : 0;

  // 勤務先別の内訳を計算
  const workplacesBreakdown = monthShifts.reduce(
    (acc, shift) => {
      const existing = acc.find(item => item.workplaceId === shift.workplaceId);

      if (existing) {
        existing.earnings += shift.totalEarnings;
        existing.hours += shift.actualWorkMinutes / 60;
        existing.shiftsCount += 1;
      } else {
        acc.push({
          workplaceId: shift.workplaceId,
          workplaceName: shift.workplaceName,
          earnings: shift.totalEarnings,
          hours: shift.actualWorkMinutes / 60,
          shiftsCount: 1,
        });
      }

      return acc;
    },
    [] as MonthlyEarnings['workplacesBreakdown']
  );

  return {
    year,
    month,
    totalEarnings,
    totalHours: Math.round(totalHours * 10) / 10,
    averageHourlyRate: Math.round(averageRate),
    shiftsCount: monthShifts.length,
    workplacesBreakdown,
  };
};

/**
 * 時給からの収入予測
 */
export const predictEarnings = (
  hourlyRate: number,
  hoursPerWeek: number,
  weeksPerMonth = 4.3
): {
  monthly: number;
  yearly: number;
  fuyouRisk: 'safe' | 'warning' | 'danger';
} => {
  const monthly = Math.floor(hourlyRate * hoursPerWeek * weeksPerMonth);
  const yearly = monthly * 12;

  let fuyouRisk: 'safe' | 'warning' | 'danger' = 'safe';
  if (yearly >= FUYOU_LIMITS.STUDENT_SPECIAL) {
    fuyouRisk = 'danger';
  } else if (yearly >= FUYOU_LIMITS.STUDENT_SPECIAL * 0.8) {
    fuyouRisk = 'warning';
  }

  return { monthly, yearly, fuyouRisk };
};

/**
 * 収入を人間が読みやすい形式にフォーマット
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
};

/**
 * 大きな数値を短縮形式でフォーマット（例：1,500,000 → 150万）
 */
export const formatLargeNumber = (amount: number): string => {
  if (amount >= 10000) {
    const manAmount = Math.floor(amount / 10000);
    const remainder = amount % 10000;
    if (remainder === 0) {
      return `${manAmount}万円`;
    } else {
      return `${manAmount}.${Math.floor(remainder / 1000)}万円`;
    }
  }
  return formatCurrency(amount);
};

/**
 * パーセンテージを色に変換
 */
export const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return '#f44336'; // red
  if (percentage >= 80) return '#ff9800'; // orange
  if (percentage >= 60) return '#ffc107'; // amber
  return '#4caf50'; // green
};
