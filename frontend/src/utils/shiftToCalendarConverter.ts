// 🔄 シフトデータとカレンダーイベント変換ユーティリティ

import type { CalendarEvent, EventType } from '../types/calendar';
import type { Shift } from '../store/unifiedStore';

/**
 * シフトデータをカレンダーイベントに変換
 */
export const convertShiftToCalendarEvent = (shift: Shift): CalendarEvent => {
  return {
    id: `shift-${shift.id}`,
    date: shift.date,
    type: 'shift' as EventType,
    title: shift.workplaceName,
    startTime: shift.startTime,
    endTime: shift.endTime,
    color: getWorkplaceColor(shift.workplaceName), // 職場名に基づく色
    workplace: {
      id: shift.workplaceId,
      name: shift.workplaceName,
      hourlyRate: shift.hourlyRate,
      isOneTime: false,
    },
    earnings: shift.totalEarnings,
    breakTime: shift.breakMinutes,
  };
};

/**
 * 複数のシフトをカレンダーイベントに一括変換
 */
export const convertShiftsToCalendarEvents = (shifts: Shift[]): CalendarEvent[] => {
  return shifts.map(convertShiftToCalendarEvent);
};

/**
 * カレンダーイベントをシフトデータに変換
 */
export const convertCalendarEventToShift = (event: CalendarEvent): Shift | null => {
  if (event.type !== 'shift' || !event.workplace || !event.startTime || !event.endTime) {
    return null;
  }
  
  return {
    id: event.id.replace('shift-', ''), // ID正規化
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    workplaceId: event.workplace.id,
    workplaceName: event.workplace.name,
    hourlyRate: event.workplace.hourlyRate || 1000,
    breakMinutes: event.breakTime || 0,
    actualWorkMinutes: calculateWorkMinutes(event.startTime, event.endTime, event.breakTime || 0),
    totalEarnings: event.earnings || 0,
    notes: event.title !== event.workplace.name ? event.title : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * 作業時間を計算（分単位）
 */
function calculateWorkMinutes(startTime: string, endTime: string, breakMinutes: number): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  
  // 日をまたぐ場合の処理
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }
  
  return Math.max(0, totalMinutes - breakMinutes);
}

/**
 * 職場名に基づく色を生成
 */
function getWorkplaceColor(workplaceName: string): string {
  const colors = [
    '#FFD54F', // Yellow
    '#4CAF50', // Green  
    '#2196F3', // Blue
    '#FF9800', // Orange
    '#9C27B0', // Purple
    '#F44336', // Red
    '#00BCD4', // Cyan
    '#795548', // Brown
  ];
  
  // 職場名のハッシュから色を決定
  let hash = 0;
  for (let i = 0; i < workplaceName.length; i++) {
    hash = workplaceName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}