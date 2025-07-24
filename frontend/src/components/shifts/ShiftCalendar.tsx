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
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ja } from 'date-fns/locale';

import type { Shift, Workplace } from '../../types/shift';

interface ShiftCalendarProps {
  shifts: Shift[];
  workplaces?: Workplace[];
  onAddShift: (date: string) => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shift: Shift) => void;
  loading?: boolean;
}

export const ShiftCalendar: React.FC<ShiftCalendarProps> = ({
  shifts,
  workplaces = [],
  onAddShift,
  onEditShift,
  onDeleteShift,
  loading = false,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // 職場の色を取得
  const getWorkplaceColor = (shift: Shift) => {
    const workplace = workplaces.find(
      wp => wp.id === shift.jobSourceId || wp.name === shift.jobSourceName
    );
    return workplace?.color || '#2196F3'; // デフォルトは青
  };

  // 色を薄くする関数
  const lightenColor = (color: string, opacity: number = 0.1) => {
    return `${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')}`;
  };

  // シフトカードのレンダリング
  const renderShiftCard = (shift: Shift, isCompact: boolean = false) => {
    const workplaceColor = getWorkplaceColor(shift);

    return (
      <Paper
        key={shift.id}
        elevation={2}
        sx={{
          p: 1,
          mb: 0.5,
          bgcolor: lightenColor(workplaceColor, 0.1),
          borderLeft: 4,
          borderLeftColor: workplaceColor,
          '&:hover': {
            bgcolor: lightenColor(workplaceColor, 0.2),
            transform: 'translateY(-1px)',
            boxShadow: 2,
          },
          cursor: 'pointer',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }} onClick={() => onEditShift(shift)}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: workplaceColor,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{ fontWeight: 'bold', flex: 1, minWidth: 0 }}
              >
                {shift.jobSourceName}
              </Typography>
            </Box>
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
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  onEditShift(shift);
                }}
              >
                <Edit sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="削除">
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  onDeleteShift(shift);
                }}
                color="error"
              >
                <Delete sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <Card>
      <CardContent>
        {/* ヘッダー */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Typography variant="h6">シフトカレンダー</Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={goToPreviousMonth} disabled={loading}>
              <ChevronLeft />
            </IconButton>

            <Typography
              variant="h6"
              sx={{ minWidth: 120, textAlign: 'center' }}
            >
              {format(currentDate, 'yyyy年M月', { locale: ja })}
            </Typography>

            <IconButton onClick={goToNextMonth} disabled={loading}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        {/* 曜日ヘッダー */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <Grid item xs key={index}>
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
                        : 'text.primary',
                }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* カレンダーグリッド */}
        <Grid container spacing={1}>
          {monthDays.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayShifts = shiftsByDate[dateKey] || [];
            const isCurrentDay = isToday(date);
            const dayOfWeek = date.getDay();

            return (
              <Grid item xs key={dateKey}>
                <Paper
                  variant="outlined"
                  sx={{
                    height: 180,
                    p: 1,
                    bgcolor: isCurrentDay ? 'primary.50' : 'background.paper',
                    border: isCurrentDay ? 2 : 1,
                    borderColor: isCurrentDay ? 'primary.main' : 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  {/* 日付と追加ボタン */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isCurrentDay ? 'bold' : 'normal',
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

                    <Tooltip title="シフト追加">
                      <IconButton
                        size="small"
                        onClick={() => handleAddShift(date)}
                        disabled={loading}
                        sx={{ p: 0.5 }}
                      >
                        <Add sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* シフト一覧 */}
                  <Box sx={{ height: 140, overflowY: 'auto' }}>
                    {dayShifts.length === 0 ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', textAlign: 'center', mt: 2 }}
                      >
                        シフトなし
                      </Typography>
                    ) : (
                      dayShifts.map(shift => renderShiftCard(shift, true))
                    )}
                  </Box>

                  {/* シフト数の表示 */}
                  {dayShifts.length > 0 && (
                    <Box
                      sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}
                    >
                      <Chip
                        size="small"
                        label={`${dayShifts.length}件`}
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', height: 20 }}
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* 月間統計 */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            今月の統計
          </Typography>
          <Stack direction="row" spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                総シフト数
              </Typography>
              <Typography variant="h6">{shifts.length}件</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                総労働時間
              </Typography>
              <Typography variant="h6">
                {shifts
                  .reduce((sum, shift) => sum + shift.workingHours, 0)
                  .toFixed(1)}
                時間
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                総給与
              </Typography>
              <Typography variant="h6" color="primary.main">
                ¥
                {shifts
                  .reduce((sum, shift) => sum + shift.calculatedEarnings, 0)
                  .toLocaleString()}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};
