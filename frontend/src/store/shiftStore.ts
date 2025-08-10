// 🗂️ FUYOU PRO - シフト管理ストア

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Shift, Workplace, ShiftFormData } from '@types/index';
import { calculateShiftEarnings } from '@/utils/calculations';
import { calculateWorkMinutes } from '@/utils/dateUtils';

interface ShiftState {
  shifts: Shift[];
  workplaces: Workplace[];
  selectedDate: Date;
  isLoading: boolean;

  // Actions
  addShift: (shiftData: ShiftFormData) => void;
  updateShift: (id: string, shiftData: Partial<ShiftFormData>) => void;
  deleteShift: (id: string) => void;
  setSelectedDate: (date: Date) => void;
  addWorkplace: (
    workplace: Omit<Workplace, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;

  // Getters
  getShiftsByDate: (date: Date) => Shift[];
  getShiftsByMonth: (year: number, month: number) => Shift[];
  getTotalEarningsForMonth: (year: number, month: number) => number;
}

// モックワークプレイスデータ
const mockWorkplaces: Workplace[] = [
  {
    id: 'wp-1',
    name: 'カフェ・ド・クリーム',
    color: '#4caf50',
    defaultHourlyRate: 1000,
    address: '東京都渋谷区',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wp-2',
    name: 'コンビニABC',
    color: '#2196f3',
    defaultHourlyRate: 950,
    address: '東京都新宿区',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wp-3',
    name: 'ファミレス・ハッピー',
    color: '#ff9800',
    defaultHourlyRate: 1100,
    address: '東京都池袋区',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// モックシフトデータ
const generateMockShifts = (): Shift[] => {
  const shifts: Shift[] = [];
  const today = new Date();

  // 今月と来月のシフトを生成
  for (let monthOffset = -1; monthOffset <= 1; monthOffset++) {
    for (let day = 1; day <= 31; day++) {
      const date = new Date(
        today.getFullYear(),
        today.getMonth() + monthOffset,
        day
      );

      // 無効な日付をスキップ
      if (date.getMonth() !== (today.getMonth() + monthOffset + 12) % 12)
        continue;

      // ランダムにシフトを生成（30%の確率）
      if (Math.random() < 0.3) {
        const workplace =
          mockWorkplaces[Math.floor(Math.random() * mockWorkplaces.length)];
        const startHour = 9 + Math.floor(Math.random() * 10); // 9-18時開始
        const duration = 4 + Math.floor(Math.random() * 6); // 4-9時間
        const startTime = `${startHour.toString().padStart(2, '0')}:00`;
        const endTime = `${(startHour + duration).toString().padStart(2, '0')}:00`;

        const actualWorkMinutes = calculateWorkMinutes(startTime, endTime, 60); // 1時間休憩

        shifts.push({
          id: `shift-${date.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
          date: date.toISOString().split('T')[0],
          startTime,
          endTime,
          workplaceId: workplace.id,
          workplaceName: workplace.name,
          hourlyRate:
            workplace.defaultHourlyRate + Math.floor(Math.random() * 200 - 100), // ±100円の変動
          breakMinutes: 60,
          actualWorkMinutes,
          totalEarnings: 0, // calculateShiftEarnings で計算
          status: Math.random() > 0.2 ? 'confirmed' : 'tentative',
          notes: Math.random() > 0.8 ? '忙しい時間帯' : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  // 給料を計算
  return shifts.map(shift => ({
    ...shift,
    totalEarnings: calculateShiftEarnings(shift),
  }));
};

export const useShiftStore = create<ShiftState>()(
  devtools(
    persist(
      (set, get) => ({
        shifts: generateMockShifts(),
        workplaces: mockWorkplaces,
        selectedDate: new Date(),
        isLoading: false,

        addShift: (shiftData: ShiftFormData) => {
          const workplace = get().workplaces.find(
            w => w.id === shiftData.workplaceId
          );
          if (!workplace) return;

          const actualWorkMinutes = calculateWorkMinutes(
            shiftData.startTime,
            shiftData.endTime,
            shiftData.breakMinutes
          );

          const newShift: Shift = {
            id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: shiftData.date,
            startTime: shiftData.startTime,
            endTime: shiftData.endTime,
            workplaceId: workplace.id,
            workplaceName: workplace.name,
            hourlyRate: shiftData.hourlyRate,
            breakMinutes: shiftData.breakMinutes,
            actualWorkMinutes,
            totalEarnings: 0,
            status: 'tentative',
            notes: shiftData.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          newShift.totalEarnings = calculateShiftEarnings(newShift);

          set(state => ({
            shifts: [...state.shifts, newShift],
          }));
        },

        updateShift: (id: string, shiftData: Partial<ShiftFormData>) => {
          set(state => ({
            shifts: state.shifts.map(shift => {
              if (shift.id !== id) return shift;

              const updatedShift = { ...shift, ...shiftData };
              if (
                shiftData.startTime ||
                shiftData.endTime ||
                shiftData.breakMinutes
              ) {
                updatedShift.actualWorkMinutes = calculateWorkMinutes(
                  updatedShift.startTime,
                  updatedShift.endTime,
                  updatedShift.breakMinutes || 0
                );
              }
              updatedShift.totalEarnings = calculateShiftEarnings(updatedShift);
              updatedShift.updatedAt = new Date().toISOString();

              return updatedShift;
            }),
          }));
        },

        deleteShift: (id: string) => {
          set(state => ({
            shifts: state.shifts.filter(shift => shift.id !== id),
          }));
        },

        setSelectedDate: (date: Date) => {
          set({ selectedDate: date });
        },

        addWorkplace: workplaceData => {
          const newWorkplace: Workplace = {
            ...workplaceData,
            id: `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set(state => ({
            workplaces: [...state.workplaces, newWorkplace],
          }));
        },

        getShiftsByDate: (date: Date) => {
          const dateString = date.toISOString().split('T')[0];
          return get().shifts.filter(shift => shift.date === dateString);
        },

        getShiftsByMonth: (year: number, month: number) => {
          return get().shifts.filter(shift => {
            const shiftDate = new Date(shift.date);
            return (
              shiftDate.getFullYear() === year &&
              shiftDate.getMonth() === month - 1
            );
          });
        },

        getTotalEarningsForMonth: (year: number, month: number) => {
          const monthShifts = get().getShiftsByMonth(year, month);
          return monthShifts.reduce(
            (total, shift) => total + shift.totalEarnings,
            0
          );
        },
      }),
      {
        name: 'fuyou-shift-store',
        partialize: state => ({
          workplaces: state.workplaces,
          // シフトデータは揮発性なので永続化しない
        }),
      }
    ),
    {
      name: 'shift-store',
    }
  )
);
