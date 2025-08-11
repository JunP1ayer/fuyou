// メインカレンダーアプリコンポーネント

import React, { useState, useEffect } from 'react';
import { Box, Card } from '@mui/material';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { EventDialog } from './EventDialog';
import { DayEventsView } from './DayEventsView';
import { QuickActionMenu } from './QuickActionMenu';
import { NewBottomNavigation, type NewTabValue } from './NewBottomNavigation';
import { useCalendarStore } from '../../store/calendarStore';
import { useSimpleShiftStore } from '../../store/simpleShiftStore';
import type { CalendarEvent } from '../../types/calendar';

interface CalendarAppProps {
  onNavigateToWorkplaceManager?: () => void;
}

export const CalendarApp: React.FC<CalendarAppProps> = ({ 
  onNavigateToWorkplaceManager 
}) => {
  const { importFromShifts, openEventDialog, openEditDialog } = useCalendarStore();
  const { shifts } = useSimpleShiftStore();
  
  const [currentTab, setCurrentTab] = useState<NewTabValue>('shift');
  const [dayEventsOpen, setDayEventsOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 初回起動時に既存のシフトデータをインポート
  useEffect(() => {
    if (shifts.length > 0) {
      // すでにインポート済みかチェック
      const imported = localStorage.getItem('calendar-shifts-imported');
      if (!imported) {
        importFromShifts(shifts);
        localStorage.setItem('calendar-shifts-imported', 'true');
      }
    }
  }, [shifts, importFromShifts]);

  // タブ切り替え処理（シンプル版）
  const handleTabChange = (tab: NewTabValue) => {
    setCurrentTab(tab);
    
    // シンプルなタブ切り替えのみ
    console.log('Tab changed to:', tab);
  };

  // 日付クリック時の処理（クイックメニューを表示）
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setQuickMenuOpen(true);
  };

  // 予定追加処理
  const handleAddEvent = () => {
    setDayEventsOpen(false);
    if (selectedDate) {
      openEventDialog(selectedDate);
    }
  };

  // 予定編集処理
  const handleEditEvent = (event: CalendarEvent) => {
    setDayEventsOpen(false);
    openEditDialog(event);
  };

  // クイックメニューからの個人予定追加
  const handleAddPersonalEvent = () => {
    if (selectedDate) {
      // 個人予定タブを選択して開く
      openEventDialog(selectedDate, 'personal');
    }
  };

  // クイックメニューからのシフト追加
  const handleAddShiftEvent = () => {
    if (selectedDate) {
      // シフトタブを選択して開く
      console.log('Opening shift dialog for date:', selectedDate);
      openEventDialog(selectedDate, 'shift');
    }
  };

  // 日別予定表示
  const handleViewDayEvents = () => {
    setDayEventsOpen(true);
  };

  return (
    <Box sx={{ 
      height: '100%', // 親コンテナのサイズをそのまま使用
      backgroundColor: 'grey.50',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* メインコンテンツエリア */}
      <Box sx={{ 
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Card sx={{ 
          flex: 1,
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* ヘッダー（超コンパクト：32px高さ） */}
          <Box sx={{ flexShrink: 0 }}>
            <CalendarHeader />
          </Box>
          
          {/* カレンダーグリッド（フレックス対応） */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'hidden', // スクロールなし
            p: 0,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <CalendarGrid onDateClick={handleDateClick} />
          </Box>
        </Card>
      </Box>

      {/* クイックアクションメニュー */}
      <QuickActionMenu
        open={quickMenuOpen}
        selectedDate={selectedDate}
        onClose={() => setQuickMenuOpen(false)}
        onAddPersonalEvent={handleAddPersonalEvent}
        onAddShiftEvent={handleAddShiftEvent}
        onViewDayEvents={handleViewDayEvents}
      />

      {/* 日付の予定一覧ダイアログ */}
      <DayEventsView
        open={dayEventsOpen}
        selectedDate={selectedDate}
        onClose={() => setDayEventsOpen(false)}
        onAddEvent={handleAddEvent}
        onEditEvent={handleEditEvent}
      />

      {/* イベント入力ダイアログ */}
      <EventDialog onNavigateToWorkplaceManager={onNavigateToWorkplaceManager} />

    </Box>
  );
};