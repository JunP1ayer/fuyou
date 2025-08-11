// シンプルなシフトストア

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Shift, Workplace } from '../types/simple';
import { apiService } from '../services/apiService';

interface ShiftState {
  shifts: Shift[];
  workplaces: Workplace[];
  isLoading: boolean;
  lastSync: string | null;
  getShiftsByDate: (date: Date) => Shift[];
  getTotalEarnings: () => number;
  addShift: (shiftData: Omit<Shift, 'id'>) => Promise<void>;
  updateShift: (id: string, shiftData: Partial<Shift>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  addWorkplace: (workplaceData: Omit<Workplace, 'id'>) => Promise<void>;
  updateWorkplace: (id: string, workplaceData: Partial<Workplace>) => Promise<void>;
  deleteWorkplace: (id: string) => Promise<void>;
  // API連携機能
  syncWithServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

// 初期データ（空）
const initialWorkplaces: Workplace[] = [];
const initialShifts: Shift[] = [];

export const useSimpleShiftStore = create<ShiftState>()(
  persist(
    (set, get) => ({
      shifts: initialShifts,
      workplaces: initialWorkplaces,
      isLoading: false,
      lastSync: null,

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

      addShift: async (shiftData) => {
        const newShift: Shift = {
          ...shiftData,
          id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          // デフォルト値を設定
          overtimeEnabled: shiftData.overtimeEnabled !== false, // デフォルト true
          autoBreak6Hours: shiftData.autoBreak6Hours !== false, // デフォルト true
          autoBreak8Hours: shiftData.autoBreak8Hours !== false, // デフォルト true
          dayOfWeekSettingsEnabled: shiftData.dayOfWeekSettingsEnabled || false, // デフォルト false
        };
        
        // ローカル更新
        set(state => ({
          shifts: [...state.shifts, newShift],
        }));

        // API連携（バックグラウンド）
        try {
          await apiService.createShift(newShift);
        } catch (error) {
          console.warn('API sync failed for addShift:', error);
        }
      },

      updateShift: async (id, shiftData) => {
        // ローカル更新
        set(state => ({
          shifts: state.shifts.map(shift =>
            shift.id === id ? { ...shift, ...shiftData } : shift
          ),
        }));

        // API連携（バックグラウンド）
        try {
          await apiService.updateShift(id, shiftData);
        } catch (error) {
          console.warn('API sync failed for updateShift:', error);
        }
      },

      deleteShift: async (id) => {
        // ローカル更新
        set(state => ({
          shifts: state.shifts.filter(shift => shift.id !== id),
        }));

        // API連携（バックグラウンド）
        try {
          await apiService.deleteShift(id);
        } catch (error) {
          console.warn('API sync failed for deleteShift:', error);
        }
      },

      addWorkplace: async (workplaceData) => {
        const newWorkplace: Workplace = {
          ...workplaceData,
          id: `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        
        // ローカル更新
        set(state => ({
          workplaces: [...state.workplaces, newWorkplace],
        }));

        // API連携（バックグラウンド）
        try {
          await apiService.createWorkplace(newWorkplace);
        } catch (error) {
          console.warn('API sync failed for addWorkplace:', error);
        }
      },

      updateWorkplace: async (id, workplaceData) => {
        // ローカル更新
        set(state => ({
          workplaces: state.workplaces.map(workplace =>
            workplace.id === id ? { ...workplace, ...workplaceData } : workplace
          ),
        }));

        // API連携（バックグラウンド）
        try {
          await apiService.updateWorkplace(id, workplaceData);
        } catch (error) {
          console.warn('API sync failed for updateWorkplace:', error);
        }
      },

      deleteWorkplace: async (id) => {
        // ローカル更新
        set(state => ({
          workplaces: state.workplaces.filter(workplace => workplace.id !== id),
        }));

        // API連携（バックグラウンド）
        try {
          await apiService.deleteWorkplace(id);
        } catch (error) {
          console.warn('API sync failed for deleteWorkplace:', error);
        }
      },

      // API連携機能
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      loadFromServer: async () => {
        set({ isLoading: true });
        try {
          const [shiftsResponse, workplacesResponse] = await Promise.all([
            apiService.getShifts(),
            apiService.getWorkplaces(),
          ]);

          if (shiftsResponse.success && workplacesResponse.success) {
            set({
              shifts: shiftsResponse.data || [],
              workplaces: workplacesResponse.data || [],
              lastSync: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.warn('Failed to load from server:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      syncWithServer: async () => {
        const { shifts, workplaces } = get();
        set({ isLoading: true });
        
        try {
          await Promise.all([
            apiService.syncShifts(shifts),
            apiService.syncWorkplaces(workplaces),
          ]);
          
          set({ lastSync: new Date().toISOString() });
        } catch (error) {
          console.warn('Failed to sync with server:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'fuyou-shifts', // localStorage key
      partialize: state => ({
        shifts: state.shifts,
        workplaces: state.workplaces,
        lastSync: state.lastSync,
      }),
    }
  )
);
