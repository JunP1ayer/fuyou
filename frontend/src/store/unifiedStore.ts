// 🏪 統合ストア - Zustand単一ストアによる状態管理

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { SupportedLanguage, SupportedCountry } from './i18nStore';

// 🎯 シフト関連の型定義
interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  workplaceName: string;
  workplaceId: string;
  breakMinutes: number;
  hourlyRate: number;
  actualWorkMinutes: number;
  totalEarnings: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Workplace {
  id: string;
  name: string;
  color: string;
  defaultHourlyRate: number;
  address?: string;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
}

// 👥 友達共有関連の型定義
interface Friend {
  id: string;
  name: string;
  shareCode: string;
  isVisible: boolean;
  color: string;
  addedAt: string;
}

interface SharedSchedule {
  shareCode: string;
  days: Record<string, {
    shifts: Array<{
      start: string;
      end: string;
      workplace: string;
    }>;
  }>;
  metadata: {
    ownerName: string;
    generatedAt: string;
    expiresAt: string;
  };
}

// 📊 分析データの型定義
interface AnalyticsState {
  yearlyEarnings: number;
  monthlyEarnings: number;
  totalShifts: number;
  riskLevel: 'safe' | 'warning' | 'danger';
  lastCalculated: string;
}

// 🌐 国際化状態
interface I18nState {
  language: SupportedLanguage;
  country: SupportedCountry;
  isTranslationLoaded: boolean;
}

// 🔄 同期状態
interface SyncState {
  isOnline: boolean;
  lastSyncAt: string | null;
  pendingChanges: number;
  syncInProgress: boolean;
}

// 📱 UI状態
interface UIState {
  activeTab: 'calendar' | 'submit' | 'friends' | 'salary' | 'settings';
  isLoading: boolean;
  selectedDate: string;
  calendarView: 'month' | 'week' | 'day';
  compactMode: boolean;
}

// 🏪 統合ストア型定義
interface UnifiedStore {
  // === Shifts State ===
  shifts: Shift[];
  workplaces: Workplace[];
  addShift: (shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateShift: (id: string, updates: Partial<Shift>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  addWorkplace: (workplace: Omit<Workplace, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWorkplace: (id: string, updates: Partial<Workplace>) => void;
  deleteWorkplace: (id: string) => void;

  // === Friends State ===
  friends: Friend[];
  sharedSchedules: Record<string, SharedSchedule>;
  myShareCode: string | null;
  addFriend: (shareCode: string, friendName: string) => Promise<boolean>;
  removeFriend: (friendId: string) => void;
  toggleFriendVisibility: (friendId: string) => void;
  generateShareCode: () => string;
  loadSharedSchedule: (shareCode: string) => Promise<boolean>;

  // === Analytics State ===
  analytics: AnalyticsState;
  updateAnalytics: () => void;

  // === I18n State ===
  i18n: I18nState;
  setLanguage: (language: SupportedLanguage) => void;
  setCountry: (country: SupportedCountry) => void;
  setTranslationLoaded: (loaded: boolean) => void;

  // === Sync State ===
  sync: SyncState;
  setOnlineStatus: (isOnline: boolean) => void;
  syncWithServer: () => Promise<void>;
  markPendingChange: () => void;

  // === UI State ===
  ui: UIState;
  setActiveTab: (tab: UIState['activeTab']) => void;
  setLoading: (loading: boolean) => void;
  setSelectedDate: (date: string) => void;
  setCalendarView: (view: UIState['calendarView']) => void;
  toggleCompactMode: () => void;

  // === Utility Actions ===
  reset: () => void;
  exportData: () => string;
  importData: (data: string) => boolean;
}

// 🎯 初期状態
const initialState = {
  shifts: [],
  workplaces: [],
  friends: [],
  sharedSchedules: {},
  myShareCode: null,
  analytics: {
    yearlyEarnings: 0,
    monthlyEarnings: 0,
    totalShifts: 0,
    riskLevel: 'safe' as const,
    lastCalculated: new Date().toISOString(),
  },
  i18n: {
    language: 'ja' as SupportedLanguage,
    country: 'JP' as SupportedCountry,
    isTranslationLoaded: false,
  },
  sync: {
    isOnline: navigator.onLine,
    lastSyncAt: null,
    pendingChanges: 0,
    syncInProgress: false,
  },
  ui: {
    activeTab: 'calendar' as const,
    isLoading: false,
    selectedDate: new Date().toISOString().split('T')[0],
    calendarView: 'month' as const,
    compactMode: false,
  },
};

// 🏪 統合ストア作成
export const useUnifiedStore = create<UnifiedStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...initialState,

        // === Shift Actions ===
        addShift: async (shiftData) => {
          const id = crypto.randomUUID();
          const now = new Date().toISOString();
          
          const newShift: Shift = {
            ...shiftData,
            id,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => {
            state.shifts.push(newShift);
          });

          // バックグラウンドでAPI同期
          try {
            // API呼び出し（実装は後で）
            await fetch('/api/shifts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newShift),
            });
          } catch (error) {
            console.error('Failed to sync shift to server:', error);
            get().markPendingChange();
          }

          get().updateAnalytics();
        },

        updateShift: async (id, updates) => {
          set((state) => {
            const shiftIndex = state.shifts.findIndex(s => s.id === id);
            if (shiftIndex !== -1) {
              state.shifts[shiftIndex] = {
                ...state.shifts[shiftIndex],
                ...updates,
                updatedAt: new Date().toISOString(),
              };
            }
          });

          try {
            await fetch(`/api/shifts/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
          } catch (error) {
            console.error('Failed to sync shift update:', error);
            get().markPendingChange();
          }

          get().updateAnalytics();
        },

        deleteShift: async (id) => {
          set((state) => {
            state.shifts = state.shifts.filter(s => s.id !== id);
          });

          try {
            await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
          } catch (error) {
            console.error('Failed to sync shift deletion:', error);
            get().markPendingChange();
          }

          get().updateAnalytics();
        },

        addWorkplace: (workplaceData) => {
          const id = crypto.randomUUID();
          const now = new Date().toISOString();
          
          const newWorkplace: Workplace = {
            ...workplaceData,
            id,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => {
            state.workplaces.push(newWorkplace);
          });
        },

        updateWorkplace: (id, updates) => {
          set((state) => {
            const workplaceIndex = state.workplaces.findIndex(w => w.id === id);
            if (workplaceIndex !== -1) {
              state.workplaces[workplaceIndex] = {
                ...state.workplaces[workplaceIndex],
                ...updates,
                updatedAt: new Date().toISOString(),
              };
            }
          });
        },

        deleteWorkplace: (id) => {
          set((state) => {
            state.workplaces = state.workplaces.filter(w => w.id !== id);
            // 関連するシフトも削除または更新
            state.shifts = state.shifts.filter(s => s.workplaceId !== id);
          });
        },

        // === Friends Actions ===
        addFriend: async (shareCode, friendName) => {
          try {
            // 共有スケジュールをロード
            const success = await get().loadSharedSchedule(shareCode);
            if (!success) return false;

            const newFriend: Friend = {
              id: crypto.randomUUID(),
              name: friendName,
              shareCode,
              isVisible: true,
              color: `hsl(${Math.random() * 360}, 70%, 50%)`,
              addedAt: new Date().toISOString(),
            };

            set((state) => {
              state.friends.push(newFriend);
            });

            return true;
          } catch (error) {
            console.error('Failed to add friend:', error);
            return false;
          }
        },

        removeFriend: (friendId) => {
          set((state) => {
            const friend = state.friends.find(f => f.id === friendId);
            if (friend) {
              // 友達を削除
              state.friends = state.friends.filter(f => f.id !== friendId);
              // 共有スケジュールも削除
              delete state.sharedSchedules[friend.shareCode];
            }
          });
        },

        toggleFriendVisibility: (friendId) => {
          set((state) => {
            const friendIndex = state.friends.findIndex(f => f.id === friendId);
            if (friendIndex !== -1) {
              state.friends[friendIndex].isVisible = !state.friends[friendIndex].isVisible;
            }
          });
        },

        generateShareCode: () => {
          const code = btoa(JSON.stringify({
            userId: crypto.randomUUID(),
            timestamp: Date.now(),
          })).replace(/[+=\/]/g, '').substring(0, 12);
          
          set((state) => {
            state.myShareCode = code;
          });

          return code;
        },

        loadSharedSchedule: async (shareCode) => {
          try {
            // 実際の実装では外部APIから取得
            const mockSchedule: SharedSchedule = {
              shareCode,
              days: {},
              metadata: {
                ownerName: 'テストユーザー',
                generatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              },
            };

            set((state) => {
              state.sharedSchedules[shareCode] = mockSchedule;
            });

            return true;
          } catch (error) {
            console.error('Failed to load shared schedule:', error);
            return false;
          }
        },

        // === Analytics Actions ===
        updateAnalytics: () => {
          set((state) => {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            
            const yearlyShifts = state.shifts.filter(shift => 
              new Date(shift.date).getFullYear() === currentYear
            );
            
            const monthlyShifts = state.shifts.filter(shift => {
              const shiftDate = new Date(shift.date);
              return shiftDate.getFullYear() === currentYear && 
                     shiftDate.getMonth() === currentMonth;
            });

            const yearlyEarnings = yearlyShifts.reduce((sum, shift) => sum + shift.totalEarnings, 0);
            const monthlyEarnings = monthlyShifts.reduce((sum, shift) => sum + shift.totalEarnings, 0);

            // リスクレベル計算（簡略化）
            const annualLimit = 1230000; // 123万円
            const riskLevel = yearlyEarnings > annualLimit * 0.95 ? 'danger' :
                            yearlyEarnings > annualLimit * 0.8 ? 'warning' : 'safe';

            state.analytics = {
              yearlyEarnings,
              monthlyEarnings,
              totalShifts: state.shifts.length,
              riskLevel,
              lastCalculated: new Date().toISOString(),
            };
          });
        },

        // === I18n Actions ===
        setLanguage: (language) => {
          set((state) => {
            state.i18n.language = language;
            state.i18n.isTranslationLoaded = false;
          });
        },

        setCountry: (country) => {
          set((state) => {
            state.i18n.country = country;
          });
        },

        setTranslationLoaded: (loaded) => {
          set((state) => {
            state.i18n.isTranslationLoaded = loaded;
          });
        },

        // === Sync Actions ===
        setOnlineStatus: (isOnline) => {
          set((state) => {
            state.sync.isOnline = isOnline;
            if (isOnline && state.sync.pendingChanges > 0) {
              // オンライン復帰時は自動同期
              setTimeout(() => get().syncWithServer(), 1000);
            }
          });
        },

        syncWithServer: async () => {
          const { sync } = get();
          if (sync.syncInProgress || !sync.isOnline) return;

          set((state) => {
            state.sync.syncInProgress = true;
          });

          try {
            // 実際のAPI同期ロジック
            await new Promise(resolve => setTimeout(resolve, 1000)); // モック

            set((state) => {
              state.sync.lastSyncAt = new Date().toISOString();
              state.sync.pendingChanges = 0;
              state.sync.syncInProgress = false;
            });
          } catch (error) {
            console.error('Sync failed:', error);
            set((state) => {
              state.sync.syncInProgress = false;
            });
          }
        },

        markPendingChange: () => {
          set((state) => {
            state.sync.pendingChanges += 1;
          });
        },

        // === UI Actions ===
        setActiveTab: (tab) => {
          set((state) => {
            state.ui.activeTab = tab;
          });
        },

        setLoading: (loading) => {
          set((state) => {
            state.ui.isLoading = loading;
          });
        },

        setSelectedDate: (date) => {
          set((state) => {
            state.ui.selectedDate = date;
          });
        },

        setCalendarView: (view) => {
          set((state) => {
            state.ui.calendarView = view;
          });
        },

        toggleCompactMode: () => {
          set((state) => {
            state.ui.compactMode = !state.ui.compactMode;
          });
        },

        // === Utility Actions ===
        reset: () => {
          set(() => ({ ...initialState }));
        },

        exportData: () => {
          const state = get();
          return JSON.stringify({
            shifts: state.shifts,
            workplaces: state.workplaces,
            friends: state.friends,
            analytics: state.analytics,
            exportedAt: new Date().toISOString(),
          }, null, 2);
        },

        importData: (data) => {
          try {
            const importedData = JSON.parse(data);
            
            if (importedData.shifts && Array.isArray(importedData.shifts)) {
              set((state) => {
                state.shifts = importedData.shifts;
                state.workplaces = importedData.workplaces || [];
                state.friends = importedData.friends || [];
              });
              
              get().updateAnalytics();
              return true;
            }
            return false;
          } catch (error) {
            console.error('Import failed:', error);
            return false;
          }
        },
      })),
      {
        name: 'fuyou-unified-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          shifts: state.shifts,
          workplaces: state.workplaces,
          friends: state.friends,
          sharedSchedules: state.sharedSchedules,
          myShareCode: state.myShareCode,
          i18n: state.i18n,
          ui: {
            activeTab: state.ui.activeTab,
            selectedDate: state.ui.selectedDate,
            calendarView: state.ui.calendarView,
            compactMode: state.ui.compactMode,
          },
        }),
      }
    )
  )
);

// オンライン状態の監視
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useUnifiedStore.getState().setOnlineStatus(true));
  window.addEventListener('offline', () => useUnifiedStore.getState().setOnlineStatus(false));
}

// 分析データの自動更新（シフトが変更されたとき）
useUnifiedStore.subscribe(
  (state) => state.shifts,
  () => {
    useUnifiedStore.getState().updateAnalytics();
  }
);

export type { Shift, Workplace, Friend, SharedSchedule, UnifiedStore };