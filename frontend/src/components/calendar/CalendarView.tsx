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

import { useShiftStore } from '@store/shiftStore';
import { formatCurrency } from '@/utils/calculations';
import { CalendarDay } from './CalendarDay';
import { ShiftDetailsDialog } from './ShiftDetailsDialog';
import { ShiftForm } from '@components/forms/ShiftForm';
import type { Shift } from '@types/index';

export const CalendarView: React.FC = () => {
  const theme = useTheme();
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

  // カレンダーの日付を生成
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 日曜始まり
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

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

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

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
                sx={{ fontWeight: 700, textAlign: 'center' }}
              >
                {format(currentMonth, 'yyyy年M月', { locale: ja })}
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
          {/* 曜日ヘッダー */}
          <Grid container spacing={0} sx={{ mb: 1 }}>
            {weekDays.map((day, index) => (
              <Grid item xs key={day}>
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 1,
                    fontWeight: 600,
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
              </Grid>
            ))}
          </Grid>

          {/* カレンダー本体 */}
          <Grid container spacing={0.5}>
            <AnimatePresence mode="wait">
              {calendarDays.map(date => {
                const dayShifts = getShiftsByDate(date);
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isSelected = isSameDay(date, selectedDate);
                const isCurrentDay = isToday(date);

                return (
                  <Grid item xs key={date.getTime()}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        duration: 0.2,
                        delay: 0.01 * calendarDays.indexOf(date),
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
                  </Grid>
                );
              })}
            </AnimatePresence>
          </Grid>
        </Box>
      </Card>

      {/* FAB - シフト追加 */}
      <Tooltip title="シフトを追加" placement="left">
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
      <Tooltip title="収入詳細" placement="left">
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
