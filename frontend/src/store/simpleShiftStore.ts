// シンプルなシフトストア

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Shift, Workplace } from '../types/simple';

interface ShiftState {
  shifts: Shift[];
  workplaces: Workplace[];
  getShiftsByDate: (date: Date) => Shift[];
  getTotalEarnings: () => number;
  addShift: (shiftData: Omit<Shift, 'id'>) => void;
  updateShift: (id: string, shiftData: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  addWorkplace: (workplaceData: Omit<Workplace, 'id'>) => void;
  updateWorkplace: (id: string, workplaceData: Partial<Workplace>) => void;
  deleteWorkplace: (id: string) => void;
}

// サンプルデータ
const sampleWorkplaces: Workplace[] = [
  {
    id: 'wp-1',
    name: 'カフェ・ド・クリーム',
    color: '#4caf50',
    defaultHourlyRate: 1000,
  },
  {
    id: 'wp-2',
    name: 'コンビニABC',
    color: '#2196f3',
    defaultHourlyRate: 950,
  },
  {
    id: 'wp-3',
    name: 'ファミレス・ハッピー',
    color: '#ff9800',
    defaultHourlyRate: 1100,
  },
];

// サンプルシフトデータ（空）
const sampleShifts: Shift[] = [];

export const useSimpleShiftStore = create<ShiftState>()(
  persist(
    (set, get) => ({
      shifts: sampleShifts,
      workplaces: sampleWorkplaces,

      getShiftsByDate: (date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        return get().shifts.filter(shift => shift.date === dateString);
      },

      getTotalEarnings: () => {
        return get().shifts.reduce(
          (total, shift) => total + shift.totalEarnings,
          0
        );
      },

      addShift: shiftData => {
        const newShift: Shift = {
          ...shiftData,
          id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        set(state => ({
          shifts: [...state.shifts, newShift],
        }));
      },

      updateShift: (id, shiftData) => {
        set(state => ({
          shifts: state.shifts.map(shift =>
            shift.id === id ? { ...shift, ...shiftData } : shift
          ),
        }));
      },

      deleteShift: id => {
        set(state => ({
          shifts: state.shifts.filter(shift => shift.id !== id),
        }));
      },

      addWorkplace: workplaceData => {
        const newWorkplace: Workplace = {
          ...workplaceData,
          id: `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        set(state => ({
          workplaces: [...state.workplaces, newWorkplace],
        }));
      },

      updateWorkplace: (id, workplaceData) => {
        set(state => ({
          workplaces: state.workplaces.map(workplace =>
            workplace.id === id ? { ...workplace, ...workplaceData } : workplace
          ),
        }));
      },

      deleteWorkplace: id => {
        set(state => ({
          workplaces: state.workplaces.filter(workplace => workplace.id !== id),
        }));
      },
    }),
    {
      name: 'fuyou-shifts', // localStorage key
      partialize: state => ({
        shifts: state.shifts,
        workplaces: state.workplaces, // バイト先も保存するように変更
      }),
    }
  )
);
