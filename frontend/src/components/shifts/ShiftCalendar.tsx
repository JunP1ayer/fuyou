import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Stack,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Add,
  Edit,
  Delete,
  AccessTime,
  AttachMoney,
} from '@mui/icons-material';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ja } from 'date-fns/locale';

import type { Shift } from '../../types/shift';

interface ShiftCalendarProps {
  shifts: Shift[];
  onAddShift: (date: string) => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  loading?: boolean;
  variant?: 'rich' | 'simple';
}

export const ShiftCalendar: React.FC<ShiftCalendarProps> = ({
  shifts,
  onAddShift,
  onEditShift,
  onDeleteShift,
  loading = false,
  variant = 'simple',
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // 月の日付一覧を取得
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // 日付別のシフトをグループ化
  const shiftsByDate = useMemo(() => {
    const grouped: Record<string, Shift[]> = {};

    shifts.forEach(shift => {
      const dateKey = shift.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(shift);
    });

    // 各日付のシフトを時間順にソート
    Object.values(grouped).forEach(dayShifts => {
      dayShifts.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return grouped;
  }, [shifts]);

  // 前月・次月の移動
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // 日付のシフト追加
  const handleAddShift = (date: Date) => {
    onAddShift(format(date, 'yyyy-MM-dd'));
  };

  // シフトカードのレンダリング（richモード専用）
  const renderShiftCard = (shift: Shift, isCompact: boolean = false) => (
    <Paper
      key={shift.id}
      elevation={2}
      sx={{
        p: 1,
        mb: 0.5,
        bgcolor: shift.isConfirmed ? 'success.50' : 'warning.50',
        borderLeft: 4,
        borderLeftColor: shift.isConfirmed ? 'success.main' : 'warning.main',
        '&:hover': {
          bgcolor: shift.isConfirmed ? 'success.100' : 'warning.100',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 'bold', display: 'block' }}
          >
            {shift.jobSourceName}
          </Typography>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
          >
            <AccessTime sx={{ fontSize: 12 }} />
            <Typography variant="caption">
              {shift.startTime} - {shift.endTime}
            </Typography>
            {shift.breakMinutes > 0 && (
              <Typography variant="caption" color="text.secondary">
                (休憩{shift.breakMinutes}分)
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AttachMoney sx={{ fontSize: 12 }} />
            <Typography variant="caption" fontWeight="bold">
              ¥{shift.calculatedEarnings.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({shift.workingHours.toFixed(1)}h)
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Tooltip title="編集">
            <IconButton size="small" onClick={() => onEditShift(shift)}>
              <Edit sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="削除">
            <IconButton
              size="small"
              onClick={() => onDeleteShift(shift.id)}
              color="error"
            >
              <Delete sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  // シンプル表示用に、月初の曜日に合わせて空白セルを作る
  const simpleCalendarDates = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    const empty = Array(start.getDay()).fill(null);
    return [...empty, ...days] as Array<Date | null>;
  }, [currentDate]);

  // 強制的にsimple版を表示
  return (
      <Card>
        <CardContent>
          {/* ヘッダー（左・右ナビと中央月表示） */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <IconButton onClick={goToPreviousMonth} disabled={loading}>
              <ChevronLeft />
            </IconButton>

            <Typography variant="h6" sx={{ textAlign: 'center' }}>
              {format(currentDate, 'yyyy年M月', { locale: ja })}
            </Typography>

            <IconButton onClick={goToNextMonth} disabled={loading}>
              <ChevronRight />
            </IconButton>
          </Box>

          {/* 曜日ヘッダー */}
          <Grid container spacing={0.5} sx={{ mb: 0.5 }}>
            {weekDays.map((day, index) => (
              <Grid item xs key={day}>
                <Typography
                  variant="subtitle2"
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    color:
                      index === 0
                        ? 'error.main'
                        : index === 6
                          ? 'primary.main'
                          : 'text.secondary',
                  }}
                >
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* 日付グリッド（シンプル） */}
          <Grid container spacing={0.5}>
            {simpleCalendarDates.map((date, idx) => {
              if (!date) {
                return (
                  <Grid item xs key={`empty-${idx}`}>
                    <Box sx={{ height: 72 }} />
                  </Grid>
                );
              }

              const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
              const isCurrentDay = isToday(date);
              const dayOfWeek = date.getDay();
              const dateKey = format(date, 'yyyy-MM-dd');
              const dayShifts = shiftsByDate[dateKey] || [];

              return (
                <Grid item xs key={dateKey}>
                  <Paper
                    variant="outlined"
                    onClick={() => {
                      setSelectedDate(date);
                      onAddShift(format(date, 'yyyy-MM-dd'));
                    }}
                    sx={{
                      height: 72,
                      p: 1,
                      cursor: 'pointer',
                      borderRadius: 1,
                      bgcolor: isSelected
                        ? 'primary.50'
                        : isCurrentDay
                          ? 'primary.25'
                          : 'background.paper',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      '&:hover': { bgcolor: 'action.hover' },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isSelected || isCurrentDay ? 'bold' : 'normal',
                          color:
                            dayOfWeek === 0
                              ? 'error.main'
                              : dayOfWeek === 6
                                ? 'primary.main'
                                : 'text.primary',
                        }}
                      >
                        {format(date, 'd')}
                      </Typography>
                      {dayShifts.length > 0 && (
                        <Chip size="small" label={`${dayShifts.length}`} sx={{ height: 18, fontSize: '0.7rem' }} />
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    );
};