// メインカレンダーアプリコンポーネント

import React, { useState, useEffect } from 'react';
import { Box, Card, Slide, IconButton, useTheme } from '@mui/material';
import { Close } from '@mui/icons-material';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { EventDialog } from './EventDialog';
import { DayEventsView } from './DayEventsView';
import { QuickActionMenu } from './QuickActionMenu';
import { NewBottomNavigation, type NewTabValue } from './NewBottomNavigation';
import { SettingsView } from '../settings/SettingsView';
import { useCalendarStore } from '../../store/calendarStore';
import { useSimpleShiftStore } from '../../store/simpleShiftStore';
import type { CalendarEvent } from '../../types/calendar';
import type { ThemeMode } from '../../types';

interface CalendarAppProps {
  onNavigateToWorkplaceManager?: () => void;
}

export const CalendarApp: React.FC<CalendarAppProps> = ({ 
  onNavigateToWorkplaceManager 
}) => {
  const theme = useTheme();
  const { importFromShifts, openEventDialog, openEditDialog } = useCalendarStore();
  const { shifts } = useSimpleShiftStore();
  
  const [currentTab, setCurrentTab] = useState<NewTabValue>('shift');
  const [dayEventsOpen, setDayEventsOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode') as ThemeMode;
    return saved || 'light';
  });

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

  // 設定画面の表示/非表示
  const handleSettingsToggle = () => {
    setSettingsOpen(!settingsOpen);
  };

  // テーマ切り替え
  const handleThemeToggle = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    localStorage.setItem('themeMode', newTheme);
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
            <CalendarHeader onSettingsClick={handleSettingsToggle} />
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

      {/* 設定画面（右からスライドイン） */}
      <Slide direction="left" in={settingsOpen} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: { xs: '100%', md: '400px' },
            height: '100vh',
            backgroundColor: 'background.paper',
            boxShadow: theme.shadows[16],
            zIndex: 1300,
            overflow: 'auto',
          }}
        >
          {/* 設定画面ヘッダー（閉じるボタン） */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <IconButton
              onClick={handleSettingsToggle}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>

          {/* 設定画面内容 */}
          <Box sx={{ pb: 2 }}>
            <SettingsView
              themeMode={themeMode}
              onThemeToggle={handleThemeToggle}
            />
          </Box>
        </Box>
      </Slide>

    </Box>
  );
};