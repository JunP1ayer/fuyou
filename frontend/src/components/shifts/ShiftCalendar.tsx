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
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
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
  onDeleteShift: _onDeleteShift,
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
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '600px', md: '700px', lg: '800px' },
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
                    sx={{
                      aspectRatio: '1',
                      minHeight: { xs: 60, sm: 80 },
                    }}
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
                <Box
                  key={dateKey}
                  onClick={() => {
                    setSelectedDate(date);
                    onAddShift(format(date, 'yyyy-MM-dd'));
                  }}
                  sx={{
                    aspectRatio: '1',
                    minHeight: { xs: 60, sm: 80 },
                    p: { xs: 0.5, sm: 1 },
                    cursor: 'pointer',
                    borderRadius: { xs: 1, sm: 1.5 },
                    bgcolor: isSelected
                      ? 'primary.main'
                      : isCurrentDay
                        ? '#e3f2fd'
                        : 'transparent',
                    color: isSelected ? 'white' : 'inherit',
                    '&:hover': { 
                      bgcolor: isSelected 
                        ? 'primary.dark' 
                        : isCurrentDay 
                          ? '#bbdefb'
                          : 'action.hover',
                    },
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant={{ xs: 'body2', sm: 'body1' }}
                      sx={{
                        fontWeight:
                          isSelected || isCurrentDay ? 'bold' : 'normal',
                        color:
                          dayOfWeek === 0
                            ? 'error.main'
                            : dayOfWeek === 6
                              ? 'primary.main'
                              : 'text.primary',
                        lineHeight: 1,
                      }}
                    >
                      {format(date, 'd')}
                    </Typography>
                    {dayShifts.length > 0 && (
                      <Chip
                        size="small"
                        label={`${dayShifts.length}`}
                        sx={{
                          height: { xs: 16, sm: 18 },
                          fontSize: {
                            xs: '0.65rem',
                            sm: '0.7rem',
                          },
                          '& .MuiChip-label': {
                            px: 0.5,
                          },
                        }}
                      />
                    )}
                  </Box>

                  {/* シフト詳細表示 */}
                  {dayShifts.length > 0 && (
                    <Box
                      sx={{
                        mt: 0.25,
                        flex: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.25,
                      }}
                    >
                      {dayShifts.slice(0, 2).map(shift => (
                        <Box
                          key={shift.id}
                          sx={{
                            fontSize: {
                              xs: '0.55rem',
                              sm: '0.65rem',
                            },
                            color: isSelected 
                              ? 'rgba(255,255,255,0.9)' 
                              : shift.isConfirmed 
                                ? 'success.main'
                                : 'warning.main',
                            backgroundColor: isSelected 
                              ? 'rgba(255,255,255,0.15)'
                              : shift.isConfirmed
                                ? 'success.50'
                                : 'warning.50',
                            borderRadius: 0.75,
                            px: 0.5,
                            py: 0.15,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: isSelected
                                ? 'rgba(255,255,255,0.2)'
                                : shift.isConfirmed
                                  ? 'success.100'
                                  : 'warning.100',
                            },
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            onEditShift(shift);
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: 'inherit',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                flexShrink: 1,
                              }}
                            >
                              {shift.jobSourceName}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: 'inherit',
                                ml: 0.25,
                                flexShrink: 0,
                              }}
                            >
                              {shift.startTime}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                      {dayShifts.length > 2 && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: { xs: '0.5rem', sm: '0.6rem' },
                            color: 'text.secondary',
                            mt: 'auto',
                          }}
                        >
                          +{dayShifts.length - 2}件
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
