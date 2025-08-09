import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Paper,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
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
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

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

  // 日付のシフト追加（未使用なのでコメントアウト）
  // const handleAddShift = (date: Date) => {
  //   onAddShift(format(date, 'yyyy-MM-dd'));
  // };

  // シフトカードのレンダリング（richモード専用、未使用なのでコメントアウト）
  // const renderShiftCard = (shift: Shift, _isCompact: boolean = false) => (
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
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Card
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '600px', md: '800px', lg: '1000px' },
          mx: 'auto',
        }}
      >
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
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
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
              mb: 0.5,
            }}
          >
            {weekDays.map((day, index) => (
              <Typography
                key={day}
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
            ))}
          </Box>

          {/* 日付グリッド（7列カレンダー） */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: { xs: 0.5, sm: 1 },
              width: '100%',
            }}
          >
            {simpleCalendarDates.map((date, idx) => {
              if (!date) {
                return (
                  <Box
                    key={`empty-${idx}`}
                    sx={{ height: { xs: 80, sm: 100, md: 120 } }}
                  />
                );
              }

              const isSelected =
                selectedDate &&
                format(selectedDate, 'yyyy-MM-dd') ===
                  format(date, 'yyyy-MM-dd');
              const isCurrentDay = isToday(date);
              const dayOfWeek = date.getDay();
              const dateKey = format(date, 'yyyy-MM-dd');
              const dayShifts = shiftsByDate[dateKey] || [];

              return (
                <Paper
                  key={dateKey}
                  variant="outlined"
                  onClick={() => {
                    setSelectedDate(date);
                    onAddShift(format(date, 'yyyy-MM-dd'));
                  }}
                  sx={{
                    height: { xs: 80, sm: 100, md: 120 },
                    p: { xs: 0.5, sm: 1 },
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
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                    }}
                  >
                    <Typography
                      variant={{ xs: 'body2', sm: 'h6', md: 'h5' }}
                      sx={{
                        fontWeight:
                          isSelected || isCurrentDay ? 'bold' : 'normal',
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
                      <Chip
                        size="small"
                        label={`${dayShifts.length}`}
                        sx={{
                          height: { xs: 18, sm: 20, md: 24 },
                          fontSize: {
                            xs: '0.7rem',
                            sm: '0.75rem',
                            md: '0.8rem',
                          },
                        }}
                      />
                    )}
                  </Box>

                  {/* シフト詳細表示 */}
                  {dayShifts.length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                      {dayShifts.slice(0, 2).map(shift => (
                        <Box
                          key={shift.id}
                          sx={{
                            fontSize: {
                              xs: '0.6rem',
                              sm: '0.7rem',
                              md: '0.75rem',
                            },
                            color: 'text.secondary',
                            backgroundColor: shift.isConfirmed
                              ? 'success.50'
                              : 'warning.50',
                            borderRadius: 0.5,
                            px: 0.5,
                            py: 0.25,
                            mb: 0.25,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: shift.isConfirmed
                                ? 'success.100'
                                : 'warning.100',
                            },
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            onEditShift(shift);
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontSize: 'inherit' }}
                          >
                            {shift.jobSourceName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontSize: 'inherit', ml: 0.5 }}
                          >
                            {shift.startTime}-{shift.endTime}
                          </Typography>
                        </Box>
                      ))}
                      {dayShifts.length > 2 && (
                        <Typography
                          variant="caption"
                          sx={{ fontSize: '0.6rem', color: 'text.secondary' }}
                        >
                          +{dayShifts.length - 2}件
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
