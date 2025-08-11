// 📅 安全なカレンダー表示コンポーネント

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  IconButton,
  useTheme,
  Chip,
  Dialog,
  DialogContent,
  useMediaQuery,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSimpleShiftStore } from '../store/simpleShiftStore';
import { useFriendStore } from '../store/friendStore';
import { SimpleShiftForm } from './SimpleShiftForm';
import { SimpleShiftEditDialog } from './SimpleShiftEditDialog';
import type { Shift } from '../types/simple';

export const SafeCalendarView: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shiftFormOpen, setShiftFormOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // 設定から週の開始曜日を取得（リアルタイム反映用）
  const [weekStartsOnMonday, setWeekStartsOnMonday] = useState(
    localStorage.getItem('weekStartsOnMonday') === 'true'
  );

  // localStorageの変更を監視
  React.useEffect(() => {
    const handleStorageChange = () => {
      setWeekStartsOnMonday(localStorage.getItem('weekStartsOnMonday') === 'true');
    };
    
    window.addEventListener('storage', handleStorageChange);
    // 同じタブ内での変更も検知
    const interval = setInterval(() => {
      const current = localStorage.getItem('weekStartsOnMonday') === 'true';
      if (current !== weekStartsOnMonday) {
        setWeekStartsOnMonday(current);
      }
    }, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [weekStartsOnMonday]);
  const { shifts, getShiftsByDate, getTotalEarnings } = useSimpleShiftStore();
  const { getVisibleFriends, getVisibleSchedules } = useFriendStore();

  // 友達のシフト取得
  const getFriendShiftsByDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const visibleFriends = getVisibleFriends();
    const visibleSchedules = getVisibleSchedules();
    
    const friendShifts = [];
    for (const schedule of visibleSchedules) {
      const friend = visibleFriends.find(f => f.id === schedule.friendId);
      if (friend && schedule.days && typeof schedule.days === 'object') {
        const dayData = (schedule.days as any)[dateString];
        if (dayData && dayData.shifts) {
          for (const shift of dayData.shifts) {
            friendShifts.push({
              id: `friend-${friend.id}-${Math.random()}`,
              friendId: friend.id,
              friendName: friend.displayName,
              friendColor: friend.color,
              startTime: shift.start || shift.startTime || '09:00',
              endTime: shift.end || shift.endTime || '17:00',
              workplace: shift.workplace || shift.workplaceName || '不明',
              ...shift
            });
          }
        }
      }
    }
    return friendShifts;
  };

  // 簡単な月移動
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // カレンダーの日付計算
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );
  const firstDayOfWeek = weekStartsOnMonday ? 
    (firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1) : // 月曜始まりなら調整
    firstDayOfMonth.getDay(); // 日曜始まり
  const daysInMonth = lastDayOfMonth.getDate();

  // 前月の末日を取得
  const prevMonthLastDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    0
  ).getDate();

  // カレンダーに表示する日付の配列を作成（最適化版）
  const calendarDays: {
    day: number;
    month: 'prev' | 'current' | 'next';
    date: Date;
  }[] = [];

  // 前月の日付を追加
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    calendarDays.push({
      day,
      month: 'prev',
      date: new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        day
      ),
    });
  }

  // 当月の日付を追加
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      month: 'current',
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
    });
  }

  // まずは全日付（6週間分）を生成
  const totalDaysNeeded = 42 - calendarDays.length;
  for (let day = 1; day <= totalDaysNeeded; day++) {
    calendarDays.push({
      day,
      month: 'next',
      date: new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        day
      ),
    });
  }

  // 週ごとにグループ化
  const allWeeks = [];
  for (let i = 0; i < Math.ceil(calendarDays.length / 7); i++) {
    allWeeks.push(calendarDays.slice(i * 7, (i + 1) * 7));
  }

  // 最適化されたカレンダー
  let optimizedCalendarDays = calendarDays;
  let isOptimized = false;

  // 最後の週（6週目）を確認
  if (allWeeks.length === 6) {
    const lastWeek = allWeeks[5];
    const currentMonthInLastWeek = lastWeek.filter(d => d.month === 'current').length;
    
    // 6週目が全て来月の日付の場合のみ除外
    if (currentMonthInLastWeek === 0) {
      optimizedCalendarDays = calendarDays.slice(0, 35); // 5週間のみ表示
      isOptimized = true;
    }
  }

  const finalWeeks = Math.ceil(optimizedCalendarDays.length / 7);
  const lastWeekCurrentMonth = allWeeks.length === 6 ? 
    allWeeks[5].filter(d => d.month === 'current').length : 
    'N/A';
  
  console.log(`🗓️ [${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月] ${finalWeeks}週間表示 ${isOptimized ? '✅最適化' : '❌標準'} (6週目今月日付: ${lastWeekCurrentMonth}個)`);

  // 最終的なカレンダーデータ
  const finalCalendarDays = optimizedCalendarDays;

  const weekDays = weekStartsOnMonday ? 
    ['月', '火', '水', '木', '金', '土', '日'] :
    ['日', '月', '火', '水', '木', '金', '土'];

  // シフト選択処理
  const handleShiftClick = (shift: Shift, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedShift(shift);
    setEditDialogOpen(true);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height: isMobile ? 'auto' : '100%',
        minHeight: isMobile ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
      }}
    >
      <Card
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: isMobile ? 'visible' : 'hidden',
          boxShadow: 'none',
          backgroundColor: 'transparent',
        }}
      >
        <CardContent
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: { xs: 1, sm: 1 },
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {/* ヘッダー - シンプルカレンダー風 */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: { xs: 0.5, sm: 0.5 },
              flexShrink: 0,
              backgroundColor: 'white',
              py: 0.5,
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <IconButton
              onClick={() => navigateMonth('prev')}
              size="small"
              sx={{ mr: 2 }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#333',
                minWidth: '150px',
                textAlign: 'center',
                fontSize: { xs: '1rem', sm: '1.1rem' },
              }}
            >
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </Typography>
            <IconButton
              onClick={() => navigateMonth('next')}
              size="small"
              sx={{ ml: 2 }}
            >
              <ChevronRight />
            </IconButton>
          </Box>

          {/* 曜日ヘッダー - シンプルカレンダー風 */}
          <Grid
            container
            spacing={0}
            sx={{
              mb: 0.25,
              flexShrink: 0,
              backgroundColor: 'white',
              borderRadius: 1,
              py: 0.25,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            {weekDays.map((day, index) => (
              <Grid item xs key={day}>
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 0.5,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    fontWeight: 600,
                    color: weekStartsOnMonday
                      ? (index === 5 ? '#64b5f6' : index === 6 ? '#e57373' : '#757575') // 月曜始まり：土=青、日=赤
                      : (index === 0 ? '#e57373' : index === 6 ? '#64b5f6' : '#757575'), // 日曜始まり：日=赤、土=青
                  }}
                >
                  {day}
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* 最適化されたシンプルカレンダーUI */}
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
              border: '1px solid #e0e0e0',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              // 動的な高さ設定
              height: finalWeeks * (isMobile ? 80 : 100), // 週数に応じてサイズ調整
            }}
          >
            {Array.from({ length: finalWeeks }, (_, weekIndex) => {
              const weekStart = weekIndex * 7;
              const weekCalendarDays = finalCalendarDays.slice(
                weekStart,
                weekStart + 7
              );

              return (
                <Grid
                  container
                  spacing={0}
                  key={weekIndex}
                  sx={{
                    mb: 0,
                    flex: '1 1 0',
                    minHeight: 0,
                    height: `${100 / 6}%`,
                  }}
                >
                  {weekCalendarDays.map((calendarDay, dayIndex) => {
                    const { day, month, date } = calendarDay;
                    const dayShifts = getShiftsByDate(date);
                    const friendShifts = getFriendShiftsByDate(date);
                    const isToday =
                      date.toDateString() === new Date().toDateString();
                    const isCurrentMonth = month === 'current';

                    return (
                      <Grid
                        item
                        key={`${month}-${day}`}
                        sx={{ flexBasis: '14.28%', maxWidth: '14.28%' }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: '100%',
                            p: 1,
                            cursor: 'pointer',
                            borderRadius: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            backgroundColor: isToday
                              ? '#e3f2fd'
                              : isCurrentMonth
                                ? 'white'
                                : '#fafafa',
                            position: 'relative',
                            border: isToday
                              ? '2px solid #2196f3'
                              : '1px solid #e0e0e0',
                            opacity: isCurrentMonth ? 1 : 0.4,
                            '&:hover': {
                              backgroundColor: isToday
                                ? '#bbdefb'
                                : isCurrentMonth
                                  ? '#f5f5f5'
                                  : '#f0f0f0',
                            },
                            transition: 'background-color 0.2s ease',
                          }}
                          onClick={() => {
                            const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                            console.log(`Clicked: ${dateStr}`, dayShifts);
                          }}
                        >
                          {/* 日付番号 */}
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: isToday ? 700 : 400,
                              color: isToday
                                ? '#1976d2'
                                : isCurrentMonth
                                  ? '#333'
                                  : '#999',
                              fontSize: { xs: '1rem', sm: '1.1rem' },
                              lineHeight: 1,
                              mb: 0.5,
                            }}
                          >
                            {day}
                          </Typography>

                          {/* シフト情報表示 - 自分のシフト */}
                          {dayShifts.length > 0 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 4,
                                right: 4,
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: '#4caf50',
                                border: '1px solid white',
                              }}
                            />
                          )}

                          {/* 友達のシフト表示 */}
                          {friendShifts.length > 0 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                left: 4,
                                display: 'flex',
                                gap: 0.5,
                                flexWrap: 'wrap',
                                maxWidth: '80%',
                              }}
                            >
                              {friendShifts.slice(0, 3).map((friendShift, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: friendShift.friendColor,
                                    border: '1px solid white',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                  }}
                                  title={`${friendShift.friendName}: ${friendShift.startTime}-${friendShift.endTime} @${friendShift.workplace}`}
                                />
                              ))}
                              {friendShifts.length > 3 && (
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: '#666',
                                    border: '1px solid white',
                                    fontSize: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                  }}
                                  title={`+${friendShifts.length - 3}人の友達`}
                                >
                                  +
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* シフト追加フォーム */}
      <Dialog
        open={shiftFormOpen}
        onClose={() => setShiftFormOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: 'background.default',
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <SimpleShiftForm
            onClose={() => setShiftFormOpen(false)}
            onSuccess={() => {
              console.log('シフトが正常に追加されました！');
            }}
          />
        </DialogContent>
      </Dialog>

      {/* シフト編集ダイアログ */}
      <SimpleShiftEditDialog
        open={editDialogOpen}
        shift={selectedShift}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedShift(null);
        }}
        onUpdated={() => {
          console.log('シフトが更新されました！');
        }}
        onDeleted={() => {
          console.log('シフトが削除されました！');
        }}
      />
    </Box>
  );
};
