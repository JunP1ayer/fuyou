// 🔄 統合カレンダーフック（シフトデータ同期付き）

import { useMemo } from 'react';
import { useCalendarStore } from '../store/calendarStore';
import { useUnifiedStore } from '../store/unifiedStore';
import { convertShiftsToCalendarEvents } from '../utils/shiftToCalendarConverter';
import type { CalendarEvent } from '../types/calendar';

/**
 * シフトデータと統合されたカレンダーイベントを提供するカスタムフック
 */
export const useUnifiedCalendar = () => {
  const calendarStore = useCalendarStore();
  const { shifts } = useUnifiedStore();
  
  // シフトデータをカレンダーイベントに変換
  const shiftEvents = useMemo(() => {
    return convertShiftsToCalendarEvents(shifts);
  }, [shifts]);
  
  // カレンダーストアのイベントとシフトイベントを結合
  const allEvents = useMemo((): CalendarEvent[] => {
    const manualEvents = calendarStore.events.filter(event => event.type !== 'shift');
    return [...manualEvents, ...shiftEvents];
  }, [calendarStore.events, shiftEvents]);
  
  // 日付別イベント取得
  const getEventsByDate = (date: string): CalendarEvent[] => {
    return allEvents.filter(event => event.date === date);
  };
  
  // 月別イベント取得  
  const getEventsByMonth = (year: number, month: number): CalendarEvent[] => {
    return allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month - 1;
    });
  };
  
  return {
    // イベントデータ
    events: allEvents,
    shiftEvents,
    
    // カレンダーストアの状態とアクション
    ...calendarStore,
    
    // 拡張メソッド
    getEventsByDate,
    getEventsByMonth,
    
    // 統合ストアからの収益計算
    getTotalEarningsForMonth: useUnifiedStore.getState().getTotalEarningsForMonth,
    getTotalEarningsForYear: useUnifiedStore.getState().getTotalEarningsForYear,
  };
};