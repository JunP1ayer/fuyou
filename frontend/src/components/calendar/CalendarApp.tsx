// メインカレンダーアプリコンポーネント

import React, { useState, useEffect, useRef } from 'react';
import { Box, Card, Slide, IconButton, useTheme } from '@mui/material';
import { Close } from '@mui/icons-material';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { EventDialog } from './EventDialog';
import { DayEventsView } from './DayEventsView';
import { DayViewDialog } from './DayViewDialog';
import { DateEventTypeSelector } from './DateEventTypeSelector';
import { QuickActionMenu } from './QuickActionMenu';
import { NewBottomNavigation, type NewTabValue } from './NewBottomNavigation';
import { ShiftImageAnalyzer } from '../ShiftImageAnalyzer';
import { SettingsView } from '../settings/SettingsView';
import { FriendSharingHub } from '../FriendSharingHub';
import { MobileSalaryView } from '../salary/MobileSalaryView';
import { JobManagementHub } from '../JobManagementHub';
import { QuickShiftDialog } from './QuickShiftDialog';
import { GPT5ShiftSubmissionFlow } from '../GPT5ShiftSubmissionFlow';
import { FriendFeatureIntroDialog } from './FriendFeatureIntroDialog';
import { useCalendarStore } from '../../store/calendarStore';
import { useUnifiedStore } from '../../store/unifiedStore';
import { useFriendStore } from '../../store/friendStore';
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
  const { shifts } = useUnifiedStore();
  const { friends, shouldShowFriendFeatureIntro, markFriendFeatureIntroAsShown } = useFriendStore();
  
  // CalendarGridのrefを作成
  const calendarGridRef = useRef<{ scrollToToday: () => void } | null>(null);
  
  const [currentTab, setCurrentTab] = useState<NewTabValue>('shift');
  const [dayEventsOpen, setDayEventsOpen] = useState(false);
  const [dayViewOpen, setDayViewOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [eventTypeSelectorOpen, setEventTypeSelectorOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gpt5AnalyzerOpen, setGpt5AnalyzerOpen] = useState(false);
  const [quickShiftDialogOpen, setQuickShiftDialogOpen] = useState(false);
  const [shiftSubmissionOpen, setShiftSubmissionOpen] = useState(false);
  const [friendFeatureIntroOpen, setFriendFeatureIntroOpen] = useState(false);
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

  // 友達機能説明の表示チェック
  useEffect(() => {
    // カレンダータブが選択されている時のみチェック
    if (currentTab === 'shift' && shouldShowFriendFeatureIntro()) {
      setFriendFeatureIntroOpen(true);
    }
  }, [currentTab, shouldShowFriendFeatureIntro]);

  // タブ切り替え処理（シンプル版）
  const handleTabChange = (tab: NewTabValue) => {
    setCurrentTab(tab);
    // タブ切り替え時に設定画面を閉じる
    if (settingsOpen) {
      setSettingsOpen(false);
    }
  };

  // 日付クリック時の処理（予定がある場合は日別予定画面、ない場合はシフト登録画面）
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    
    // その日の予定を確認
    const { events } = useCalendarStore.getState();
    const dayEvents = events.filter(event => event.date === date);
    
    if (dayEvents.length > 0) {
      // 予定がある場合は日別予定画面を開く
      setDayViewOpen(true);
    } else {
      // 予定がない場合は従来どおりシフト登録画面を開く
      openEventDialog(date, 'shift');
    }
  };

  // イベントタイプ選択からシフト追加
  const handleSelectShiftType = () => {
    setEventTypeSelectorOpen(false);
    if (selectedDate) {
      openEventDialog(selectedDate, 'shift');
    }
  };

  // イベントタイプ選択から個人予定追加
  const handleSelectPersonalType = () => {
    setEventTypeSelectorOpen(false);
    if (selectedDate) {
      openEventDialog(selectedDate, 'personal');
    }
  };

  // 予定追加処理（DayViewから）
  const handleAddEventFromDayView = () => {
    setDayViewOpen(false);
    if (selectedDate) {
      // 直接EventDialogを開く（シフトタブを選択）
      openEventDialog(selectedDate, 'shift');
    }
  };

  // 予定編集処理（DayViewから）
  const handleEditEventFromDayView = (event: CalendarEvent) => {
    setDayViewOpen(false);
    openEditDialog(event);
  };

  // 予定追加処理（旧）
  const handleAddEvent = () => {
    setDayEventsOpen(false);
    if (selectedDate) {
      openEventDialog(selectedDate);
    }
  };

  // 予定編集処理（旧）
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

  // GPT-5 シフト解析を開く
  const handleOpenGPT5Analyzer = () => {
    setQuickMenuOpen(false);
    setGpt5AnalyzerOpen(true);
  };

  // AIシフト提出画面を開く
  const handleAISubmission = () => {
    setShiftSubmissionOpen(true);
  };

  // 今日に戻る処理
  const handleScrollToToday = () => {
    if (calendarGridRef.current) {
      calendarGridRef.current.scrollToToday();
    }
  };

  // 友達機能説明ダイアログを閉じる
  const handleCloseFriendFeatureIntro = () => {
    setFriendFeatureIntroOpen(false);
    markFriendFeatureIntroAsShown();
  };

  // クイックシフト登録を開く
  const handleOpenQuickShift = () => {
    setQuickMenuOpen(false);
    setQuickShiftDialogOpen(true);
  };

  // GPT-5からシフトデータを受信した時の処理
  const handleShiftsExtracted = (shifts: any[]) => {
    // シフトストアに追加し、カレンダーにも反映
    shifts.forEach(shift => {
      const event: CalendarEvent = {
        id: `gpt5-${Date.now()}-${Math.random()}`,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        title: shift.workplace || 'シフト',
        type: 'shift',
        description: shift.notes || '',
        color: '#FFD54F',
      };
      
      // カレンダーストアに追加
      useCalendarStore.getState().addEvent(event);
    });
    
    setGpt5AnalyzerOpen(false);
    
    // 成功メッセージ（必要に応じて）
    console.log(`${shifts.length}件のシフトをカレンダーに追加しました`);
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
          {/* カレンダーページ以外はヘッダーを非表示 */}
          {currentTab === 'shift' && (
            <Box sx={{ flexShrink: 0 }}>
              <CalendarHeader onSettingsClick={handleSettingsToggle} />
            </Box>
          )}
          
          {/* メインコンテンツ - タブに応じて表示を切り替え */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'hidden',
            p: 0,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {(() => {
              switch (currentTab) {
                case 'salary':
                  return (
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2, pb: 10 }}>
                      <MobileSalaryView />
                    </Box>
                  );
                case 'workplace':
                  return (
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2, pb: 10 }}>
                      <JobManagementHub />
                    </Box>
                  );
                case 'share':
                  return (
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2, pb: 10 }}>
                      <FriendSharingHub onBack={() => setCurrentTab('shift')} />
                    </Box>
                  );
                case 'shift':
                default:
                  return <CalendarGrid ref={calendarGridRef} onDateClick={handleDateClick} />;
              }
            })()}
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
        onOpenGPT5Analyzer={handleOpenGPT5Analyzer}
        onQuickShiftRegister={handleOpenQuickShift}
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
            zIndex: 1299,
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

      {/* GPT-5 シフト表解析ダイアログ */}
      {gpt5AnalyzerOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1400,
            p: 2,
          }}
        >
          <ShiftImageAnalyzer
            onShiftsExtracted={handleShiftsExtracted}
            onClose={() => setGpt5AnalyzerOpen(false)}
          />
        </Box>
      )}

      {/* 日別予定表示ダイアログ */}
      <DayViewDialog
        open={dayViewOpen}
        selectedDate={selectedDate}
        onClose={() => setDayViewOpen(false)}
        onEditEvent={handleEditEventFromDayView}
        onCreateEvent={handleAddEventFromDayView}
      />

      {/* イベントタイプ選択ダイアログ */}
      <DateEventTypeSelector
        open={eventTypeSelectorOpen}
        selectedDate={selectedDate}
        onClose={() => setEventTypeSelectorOpen(false)}
        onSelectShift={handleSelectShiftType}
        onSelectPersonal={handleSelectPersonalType}
      />

      {/* クイックシフト登録ダイアログ */}
      <QuickShiftDialog
        open={quickShiftDialogOpen}
        selectedDate={selectedDate}
        onClose={() => setQuickShiftDialogOpen(false)}
      />

      {/* AIシフト提出フロー */}
      {shiftSubmissionOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'background.default',
            zIndex: 1400,
            overflow: 'auto',
            p: 2,
          }}
        >
          <GPT5ShiftSubmissionFlow onClose={() => setShiftSubmissionOpen(false)} />
        </Box>
      )}

      {/* 友達機能紹介ダイアログ */}
      <FriendFeatureIntroDialog
        open={friendFeatureIntroOpen}
        onClose={handleCloseFriendFeatureIntro}
        friendCount={friends.length}
      />

      {/* 新しいボトムナビゲーション */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          pointerEvents: 'auto',
        }}
      >
        <NewBottomNavigation
          currentTab={currentTab}
          onTabChange={handleTabChange}
          onAIClick={handleAISubmission}
          onScrollToToday={handleScrollToToday}
        />
      </Box>

    </Box>
  );
};