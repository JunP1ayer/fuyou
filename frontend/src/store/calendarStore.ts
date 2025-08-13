// カレンダーストア

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  CalendarEvent, 
  CalendarViewMode, 
  CalendarSettings,
  MonthlyStats,
  EventType,
  BottomNavTab
} from '../types/calendar';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface CalendarStore {
  // イベントデータ
  events: CalendarEvent[];
  
  // 表示状態
  currentMonth: Date;
  headerMonth: Date; // ヘッダー表示用（スクロールに追従）
  viewMode: CalendarViewMode;
  selectedDate: string | null;
  selectedTab: BottomNavTab;
  
  // 設定
  settings: CalendarSettings;
  
  // ダイアログ状態
  isEventDialogOpen: boolean;
  editingEvent: CalendarEvent | null;
  initialEventType: EventType | null;
  
  // Actions - イベント管理
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventsByDate: (date: string) => CalendarEvent[];
  getEventsByMonth: (year: number, month: number) => CalendarEvent[];
  
  // Actions - 表示制御
  setCurrentMonth: (date: Date) => void;
  setHeaderMonth: (date: Date) => void;
  setViewMode: (mode: CalendarViewMode) => void;
  setSelectedDate: (date: string | null) => void;
  setSelectedTab: (tab: BottomNavTab) => void;
  navigateMonth: (direction: 'prev' | 'next') => void;
  
  // Actions - ダイアログ制御
  openEventDialog: (date?: string, eventTypeOrEvent?: EventType | CalendarEvent) => void;
  openEditDialog: (event: CalendarEvent) => void;
  closeEventDialog: () => void;
  
  // Actions - 統計計算
  calculateMonthlyStats: (year: number, month: number) => MonthlyStats;
  calculateDailyEarnings: (date: string) => number;
  
  // Actions - 設定
  updateSettings: (settings: Partial<CalendarSettings>) => void;
  
  // Actions - インポート（既存シフトデータから）
  importFromShifts: (shifts: any[]) => void;
}

// デフォルト設定
const defaultSettings: CalendarSettings = {
  weekStartsOn: 0, // 日曜始まり
  showWeekNumbers: false,
  defaultEventColor: '#FFD54F',
  defaultEventType: 'shift',
  enableNotifications: true,
};

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      // 初期状態
      events: [],
      currentMonth: new Date(),
      headerMonth: new Date(),
      viewMode: 'month',
      selectedDate: null,
      selectedTab: 'shift',
      settings: defaultSettings,
      isEventDialogOpen: false,
      editingEvent: null,
      initialEventType: null,
      
      // イベント管理
      addEvent: (eventData) => {
        const newEvent: CalendarEvent = {
          ...eventData,
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        
        set(state => ({
          events: [...state.events, newEvent],
        }));
      },
      
      updateEvent: (id, eventData) => {
        set(state => ({
          events: state.events.map(event =>
            event.id === id ? { ...event, ...eventData } : event
          ),
        }));
      },
      
      deleteEvent: (id) => {
        set(state => ({
          events: state.events.filter(event => event.id !== id),
        }));
      },
      
      getEventsByDate: (date) => {
        return get().events.filter(event => event.date === date);
      },
      
      getEventsByMonth: (year, month) => {
        const monthStart = startOfMonth(new Date(year, month - 1));
        const monthEnd = endOfMonth(new Date(year, month - 1));
        
        return get().events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= monthStart && eventDate <= monthEnd;
        });
      },
      
      // 表示制御
      setCurrentMonth: (date) => {
        set({ currentMonth: date });
      },
      
      setHeaderMonth: (date) => {
        set({ headerMonth: date });
      },
      
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },
      
      setSelectedDate: (date) => {
        set({ selectedDate: date });
      },
      
      setSelectedTab: (tab) => {
        set({ selectedTab: tab });
      },
      
      navigateMonth: (direction) => {
        set(state => {
          const current = state.currentMonth;
          const newMonth = new Date(current);
          newMonth.setMonth(current.getMonth() + (direction === 'prev' ? -1 : 1));
          return { currentMonth: newMonth, headerMonth: newMonth };
        });
      },
      
      // ダイアログ制御
      openEventDialog: (date, eventTypeOrEvent) => {
        // eventTypeOrEventがCalendarEventオブジェクトかEventType文字列かを判定
        const isEditMode = eventTypeOrEvent && typeof eventTypeOrEvent === 'object' && 'id' in eventTypeOrEvent;
        
        set({
          isEventDialogOpen: true,
          selectedDate: date || null,
          editingEvent: isEditMode ? eventTypeOrEvent as CalendarEvent : null,
          initialEventType: isEditMode ? null : eventTypeOrEvent as EventType || null,
        });
      },
      
      openEditDialog: (event) => {
        set({
          isEventDialogOpen: true,
          selectedDate: event.date,
          editingEvent: event,
          initialEventType: null,
        });
      },
      
      closeEventDialog: () => {
        set({
          isEventDialogOpen: false,
          editingEvent: null,
          initialEventType: null,
        });
      },
      
      // 統計計算
      calculateMonthlyStats: (year, month) => {
        const monthEvents = get().getEventsByMonth(year, month);
        const shiftEvents = monthEvents.filter(e => e.type === 'shift');
        
        let totalEarnings = 0;
        let totalHours = 0;
        const workplaceCounts: Record<string, number> = {};
        const dailyEarnings: Record<string, number> = {};
        
        shiftEvents.forEach(event => {
          if (event.earnings) {
            totalEarnings += event.earnings;
            dailyEarnings[event.date] = (dailyEarnings[event.date] || 0) + event.earnings;
          }
          
          if (event.workplace) {
            const wpName = event.workplace.name;
            workplaceCounts[wpName] = (workplaceCounts[wpName] || 0) + 1;
            
            if (event.startTime && event.endTime) {
              const start = new Date(`2024-01-01T${event.startTime}`);
              const end = new Date(`2024-01-01T${event.endTime}`);
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              totalHours += hours;
            }
          }
        });
        
        return {
          totalShifts: shiftEvents.length,
          totalEarnings,
          totalHours,
          averageHourlyRate: totalHours > 0 ? totalEarnings / totalHours : 0,
          workplaceCounts,
          dailyEarnings,
        };
      },
      
      calculateDailyEarnings: (date) => {
        const dayEvents = get().getEventsByDate(date);
        return dayEvents
          .filter(e => e.type === 'shift' && e.earnings)
          .reduce((sum, e) => sum + (e.earnings || 0), 0);
      },
      
      // 設定更新
      updateSettings: (settings) => {
        set(state => ({
          settings: { ...state.settings, ...settings },
        }));
      },
      
      // シフトデータインポート
      importFromShifts: (shifts) => {
        const importedEvents: CalendarEvent[] = shifts.map(shift => ({
          id: `imported-${shift.id}`,
          date: shift.date,
          type: 'shift' as EventType,
          title: shift.workplaceName,
          startTime: shift.startTime,
          endTime: shift.endTime,
          color: '#FFD54F',
          workplace: {
            id: shift.id,
            name: shift.workplaceName,
            hourlyRate: shift.hourlyRate,
            isOneTime: false,
          },
          earnings: shift.totalEarnings,
          breakTime: shift.breakTime, // 休憩時間データを含める
        }));
        
        set(state => ({
          events: [...state.events, ...importedEvents],
        }));
      },
    }),
    {
      name: 'calendar-storage',
      partialize: (state) => ({
        events: state.events,
        settings: state.settings,
      }),
    }
  )
);