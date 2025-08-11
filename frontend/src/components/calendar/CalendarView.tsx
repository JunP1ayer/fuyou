// 📅 FUYOU PRO - 美しいシフトカレンダー

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  IconButton,
  Grid,
  Chip,
  useTheme,
  useMediaQuery,
  alpha,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Add,
  TrendingUp,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isToday,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { useI18n } from '@/hooks/useI18n';

import { useShiftStore } from '../../store/shiftStore';
import { formatCurrency } from '../../utils/calculations';
import { CalendarDay } from './CalendarDay';
import { ShiftDetailsDialog } from './ShiftDetailsDialog';
import { ShiftForm } from '../forms/ShiftForm';
import type { Shift } from '../../types/index';

export const CalendarView: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useI18n();
  const {
    shifts,
    selectedDate,
    setSelectedDate,
    getShiftsByDate,
    getTotalEarningsForMonth,
  } = useShiftStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [shiftFormOpen, setShiftFormOpen] = useState(false);

  // カレンダーの日付を生成（最下段の来月のみ行を除外）
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 日曜始まり
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    // 最後の週が全て来月の日付かチェック
    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }
    
    // 最後の週の今月日付数をチェック
    const lastWeek = weeks[weeks.length - 1];
    const currentMonthDaysInLastWeek = lastWeek.filter(day => 
      isSameMonth(day, currentMonth)
    ).length;
    
    // 最下段の最適化判定:
    // 1. 最下段に今月の日付が1-2個しかない場合（来月の日付が多い）
    // 2. 最下段が全て来月の日付の場合
    // 3. 6週間ある場合は最適化対象
    const shouldOptimize = weeks.length > 1 && (
      currentMonthDaysInLastWeek === 0 || // 全て来月
      (currentMonthDaysInLastWeek <= 2 && weeks.length === 6) // 来月の日付が多い6週間
    );
    
    if (shouldOptimize) {
      console.log(`🗓️ [${format(currentMonth, 'yyyy年M月')}] ✅最下段除外: ${weeks.length}週 → ${weeks.length - 1}週 (今月日付: ${currentMonthDaysInLastWeek}個)`);
      return allDays.slice(0, -7); // 最後の7日間を除外
    }
    
    console.log(`🗓️ [${format(currentMonth, 'yyyy年M月')}] ❌そのまま表示: ${weeks.length}週 (今月日付: ${currentMonthDaysInLastWeek}個)`);
    
    return allDays;
  }, [currentMonth]);

  // 月に基づいた最適化されたカレンダーレイアウト（最下段除外対応）
  const calendarLayout = useMemo(() => {
    const weeks = Math.ceil(calendarDays.length / 7);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // 月の詳細情報
    const firstDayOfWeek = monthStart.getDay(); // 0 = 日曜日
    const lastDayOfWeek = monthEnd.getDay();
    const daysInMonth = monthEnd.getDate();
    
    // 最下段除外によるレイアウトタイプ判定
    const isOptimizedLayout = weeks < 6; // 6週未満=最下段が除外された可能性
    const isCompact = weeks === 4;
    const isMedium = weeks === 5;
    const isLong = weeks === 6;
    
    // 動的グリッド設定（最適化された行数に基づく）
    let gridConfig;
    let dayHeight;
    let spacing;
    
    if (isCompact) {
      // 4週間（最下段除外で短縮された月 + 元々短い月）
      gridConfig = 'repeat(7, minmax(120px, 1fr))';
      dayHeight = 120; // より大きな高さで見やすく
      spacing = 1.0;
    } else if (isMedium) {
      // 5週間（最も一般的なケース）
      gridConfig = 'repeat(7, minmax(100px, 1fr))';
      dayHeight = 100;
      spacing = 0.8;
    } else {
      // 6週間（まれなケース）
      gridConfig = 'repeat(7, minmax(85px, 1fr))';
      dayHeight = 85;
      spacing = 0.5;
    }
    
    return {
      weeks,
      firstDayOfWeek,
      lastDayOfWeek,
      daysInMonth,
      isOptimizedLayout,
      isCompact,
      isMedium,
      isLong,
      gridColumns: gridConfig,
      dayMinHeight: dayHeight,
      spacing: spacing,
      // レスポンシブ対応
      mobileGridColumns: 'repeat(7, minmax(60px, 1fr))',
      mobileDayHeight: Math.max(dayHeight * 0.75, 60), // 最小60px確保
      mobileSpacing: spacing * 0.6,
    };
  }, [calendarDays, currentMonth]);

  // 月の統計を計算
  const monthStats = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const monthShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return (
        shiftDate.getFullYear() === year && shiftDate.getMonth() === month - 1
      );
    });

    return {
      totalEarnings: getTotalEarningsForMonth(year, month),
      totalShifts: monthShifts.length,
      totalHours: monthShifts.reduce(
        (total, shift) => total + shift.actualWorkMinutes / 60,
        0
      ),
    };
  }, [shifts, currentMonth, getTotalEarningsForMonth]);

  // 月移動
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev =>
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  // 日付クリック
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayShifts = getShiftsByDate(date);
    if (dayShifts.length === 1) {
      setSelectedShift(dayShifts[0]);
      setDetailsDialogOpen(true);
    }
  };

  // シフトクリック
  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setDetailsDialogOpen(true);
  };

  const weekDays = [0,1,2,3,4,5,6].map((dow) => t(`calendar.weekdays.${dow}`, ['日','月','火','水','木','金','土'][dow]));

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, height: '100%' }}>
      {/* ヘッダー */}
      <Card
        sx={{
          mb: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          overflow: 'visible',
        }}
      >
        <Box sx={{ p: 3 }}>
          {/* 月ナビゲーション */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <IconButton
                onClick={() => navigateMonth('prev')}
                sx={{ color: 'white' }}
              >
                <ChevronLeft />
              </IconButton>
            </motion.div>

            <motion.div
              key={currentMonth.getTime()}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, textAlign: 'center', color: 'red' }}
              >
                🔥 {t('calendar.testing', 'テスト中')} 🔥 {format(currentMonth, 'yyyy年M月', { locale: ja })}
              </Typography>
              {/* Debug: Layout info */}
              <Typography
                variant="caption"
                sx={{ 
                  opacity: 0.7, 
                  textAlign: 'center',
                  display: 'block',
                  fontSize: '0.75rem',
                  mt: 0.5 
                }}
              >
                {calendarLayout.weeks}{t('calendar.weeks','週間')} | {calendarLayout.isCompact ? t('calendar.layout.compact','コンパクト') : calendarLayout.isMedium ? t('calendar.layout.standard','標準') : t('calendar.layout.expanded','拡張')} | {t('calendar.height','高さ')}: {calendarLayout.dayMinHeight}px | {calendarLayout.isOptimizedLayout ? t('calendar.layout.optimized','最適化済み') : t('calendar.layout.normal','標準レイアウト')}
              </Typography>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <IconButton
                onClick={() => navigateMonth('next')}
                sx={{ color: 'white' }}
              >
                <ChevronRight />
              </IconButton>
            </motion.div>
          </Box>

          {/* 月間統計 */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-around',
              textAlign: 'center',
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatCurrency(monthStats.totalEarnings)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                月間収入
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {monthStats.totalShifts}件
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                シフト数
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {Math.round(monthStats.totalHours)}時間
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                労働時間
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* カレンダー */}
      <Card sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 1, md: 2 } }}>
          {/* 曜日ヘッダー - レスポンシブ最適化 */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: calendarLayout.mobileGridColumns,
                md: calendarLayout.gridColumns,
              },
              gap: {
                xs: calendarLayout.mobileSpacing,
                md: calendarLayout.spacing,
              },
              mb: 1,
            }}
          >
            {weekDays.map((day, index) => (
              <Box
                key={day}
                sx={{
                  textAlign: 'center',
                  py: { xs: 0.5, md: 1 },
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  color:
                    index === 0
                      ? 'error.main'
                      : index === 6
                        ? 'primary.main'
                        : 'text.secondary',
                }}
              >
                {day}
              </Box>
            ))}
          </Box>

          {/* カレンダー本体 - 月別最適化 & レスポンシブ */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: calendarLayout.mobileGridColumns,
                md: calendarLayout.gridColumns,
              },
              gap: {
                xs: calendarLayout.mobileSpacing,
                md: calendarLayout.spacing,
              },
              minHeight: {
                xs: `${calendarLayout.weeks * calendarLayout.mobileDayHeight}px`,
                md: `${calendarLayout.weeks * calendarLayout.dayMinHeight}px`,
              },
            }}
          >
            <AnimatePresence mode="wait">
              {calendarDays.map(date => {
                const dayShifts = getShiftsByDate(date);
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isSelected = isSameDay(date, selectedDate);
                const isCurrentDay = isToday(date);

                return (
                  <motion.div
                    key={date.getTime()}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      duration: 0.2,
                      delay: 0.01 * calendarDays.indexOf(date),
                    }}
                    style={{ 
                      minHeight: isMobile ? calendarLayout.mobileDayHeight : calendarLayout.dayMinHeight,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <CalendarDay
                      date={date}
                      shifts={dayShifts}
                      isCurrentMonth={isCurrentMonth}
                      isSelected={isSelected}
                      isToday={isCurrentDay}
                      onClick={() => handleDateClick(date)}
                      onShiftClick={handleShiftClick}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Box>
        </Box>
      </Card>

      {/* FAB - シフト追加 */}
      <Tooltip title={t('calendar.addShift','シフトを追加')} placement="left">
        <Fab
          color="primary"
          onClick={() => setShiftFormOpen(true)}
          sx={{
            position: 'fixed',
            bottom: { xs: 100, md: 32 },
            right: 32,
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              transform: 'scale(1.1)',
            },
            boxShadow: '0 8px 24px rgba(67, 233, 123, 0.3)',
          }}
          component={motion.div}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Add />
        </Fab>
      </Tooltip>

      {/* 収入トレンド FAB */}
      <Tooltip title={t('calendar.earningsDetail','収入詳細')} placement="left">
        <Fab
          size="medium"
          sx={{
            position: 'fixed',
            bottom: { xs: 170, md: 100 },
            right: 32,
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              transform: 'scale(1.05)',
            },
            boxShadow: '0 6px 20px rgba(79, 172, 254, 0.3)',
          }}
          component={motion.div}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <TrendingUp />
        </Fab>
      </Tooltip>

      {/* シフト詳細ダイアログ */}
      <ShiftDetailsDialog
        open={detailsDialogOpen}
        shift={selectedShift}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedShift(null);
        }}
        onEdit={() => {
          setDetailsDialogOpen(false);
          setShiftFormOpen(true);
        }}
        onDelete={() => {
          // 削除確認とか実装するなら
          setDetailsDialogOpen(false);
          setSelectedShift(null);
        }}
      />

      {/* シフト作成・編集フォーム */}
      <ShiftForm
        open={shiftFormOpen}
        shift={selectedShift}
        onClose={() => {
          setShiftFormOpen(false);
          setSelectedShift(null);
        }}
      />
    </Box>
  );
};
