// 🔒 扶養向け 収入カレンダー用ストア

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Shift } from '../types/index';
import {
  calculateMonthlyEarnings,
  calculateTotalEarnings,
  calculateFuyouStatus,
  getProgressColor,
} from '../utils/calculations';
import { getAnnualLimitByWall } from '../lib/fuyou/config';
import type { WallKey } from '../lib/fuyou/config';

interface FuyouCalendarState {
  // 設定
  selectedYear: number; // 年
  selectedMonth: number; // 1-12
  targetWall: WallKey; // 123/106/130 のいずれか
  isStudent: boolean; // 学生特例の有無（概算）
  customAnnualLimit?: number; // 任意の年間上限（設定時はこれを優先）

  // 更新アクション
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void; // 1-12
  setTargetWall: (key: WallKey) => void;
  setIsStudent: (isStudent: boolean) => void;
  setCustomAnnualLimit: (limit?: number) => void;

  // 計算系（シフト配列を入力して集計）
  getMonthlyStats: (
    shifts: Shift[]
  ) => ReturnType<typeof calculateMonthlyEarnings>;

  getYearToDateEarnings: (shifts: Shift[]) => number;

  getFuyouStatus: (
    shifts: Shift[]
  ) => ReturnType<typeof calculateFuyouStatus> & {
    limitUsed: number;
    progressColor: string;
  };
}

function clampMonth(month: number): number {
  return Math.min(12, Math.max(1, Math.floor(month)));
}

export const useFuyouCalendarStore = create<FuyouCalendarState>()(
  persist(
    (set, get) => ({
      // 既定値は現在年月
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth() + 1,
      targetWall: 'tax123',
      isStudent: true,
      customAnnualLimit: undefined,

      setSelectedYear: year => set({ selectedYear: Math.floor(year) }),
      setSelectedMonth: month => set({ selectedMonth: clampMonth(month) }),
      setTargetWall: key => set({ targetWall: key }),
      setIsStudent: isStudent => set({ isStudent }),
      setCustomAnnualLimit: limit => set({ customAnnualLimit: limit }),

      getMonthlyStats: (shifts: Shift[]) => {
        const { selectedYear, selectedMonth } = get();
        return calculateMonthlyEarnings(shifts, selectedYear, selectedMonth);
      },

      getYearToDateEarnings: (shifts: Shift[]) => {
        const { selectedYear, selectedMonth } = get();
        const ytdShifts = shifts.filter(shift => {
          const d = new Date(shift.date);
          const isSameYear = d.getFullYear() === selectedYear;
          const isUpToMonth = d.getMonth() + 1 <= selectedMonth;
          return isSameYear && isUpToMonth;
        });
        return calculateTotalEarnings(ytdShifts);
      },

      getFuyouStatus: (shifts: Shift[]) => {
        const { isStudent, targetWall, customAnnualLimit } = get();
        const ytd = get().getYearToDateEarnings(shifts);

        const limitUsed =
          typeof customAnnualLimit === 'number'
            ? customAnnualLimit
            : getAnnualLimitByWall(targetWall);

        const status = calculateFuyouStatus(ytd, isStudent, limitUsed);
        const progressColor = getProgressColor(status.progressPercentage);

        return { ...status, limitUsed, progressColor };
      },
    }),
    {
      name: 'fuyou-calendar-store',
      partialize: state => ({
        selectedYear: state.selectedYear,
        selectedMonth: state.selectedMonth,
        targetWall: state.targetWall,
        isStudent: state.isStudent,
        customAnnualLimit: state.customAnnualLimit,
      }),
    }
  )
);

export default useFuyouCalendarStore;


