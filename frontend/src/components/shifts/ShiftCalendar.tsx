import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  IconButton,
  Paper,
  Chip,
  Fab,
  Tooltip,
  CircularProgress,
  Alert,
  Badge,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import {
  ChevronLeft,
  ChevronRight,
  Add,
  Work,
  Today,
  ViewWeek,
  ViewModule,
  TrendingUp,
  Schedule,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  ja,
} from '../../utils/dateUtils';
import { apiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type {
  Shift,
  ShiftStats,
  CalendarDate,
  ViewMode,
  EarningsProjection,
} from '../../types/shift';
import { EarningsProjectionCard } from './EarningsProjectionCard';

interface ShiftCalendarProps {
  onAddShift?: (date?: string) => void;
  onEditShift?: (shift: Shift) => void;
  onViewChange?: (mode: ViewMode) => void;
  initialDate?: Date;
  compactMode?: boolean; // シフトボード型UI用のコンパクトモード
}

export const ShiftCalendar: React.FC<ShiftCalendarProps> = ({
  onAddShift,
  onEditShift,
  onViewChange,
  compactMode = false,
  initialDate = new Date(),
}) => {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [stats, setStats] = useState<ShiftStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // カレンダーの日付を生成
  const generateCalendarDates = useCallback(
    (date: Date): CalendarDate[] => {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const days = eachDayOfInterval({ start, end });

      return days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayShifts = shifts.filter(shift => shift.date === dateStr);

        return {
          date: dateStr,
          dayOfWeek: day.getDay(),
          isToday: isToday(day),
          isCurrentMonth: isSameMonth(day, date),
          shifts: dayShifts,
          totalEarnings: dayShifts.reduce(
            (sum, shift) => sum + shift.calculatedEarnings,
            0
          ),
          totalHours: dayShifts.reduce(
            (sum, shift) => sum + shift.workingHours,
            0
          ),
        };
      });
    },
    [shifts]
  );

  const calendarDates = generateCalendarDates(currentDate);

  // シフトデータを取得
  const fetchShifts = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      const response = (await apiService.getShifts(token, {
        startDate,
        endDate,
      })) as { success: boolean; data?: Shift[]; error?: any };

      if (
        !('success' in response) ||
        !(response as { success: boolean }).success
      ) {
        throw new Error('シフトデータの取得に失敗しました');
      }

      const responseData = response as { success: boolean; data?: Shift[] };
      const shiftsData = responseData.data || [];
      setShifts(shiftsData);

      // 統計情報も取得
      const statsResponse = (await apiService.getShiftStats(
        token,
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      )) as { success: boolean; data?: ShiftStats; error?: any };

      if (
        'success' in statsResponse &&
        (statsResponse as { success: boolean }).success
      ) {
        const statsData = statsResponse as {
          success: boolean;
          data?: ShiftStats;
        };
        if (statsData.data) {
          setStats(statsData.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch shifts:', err);
      setError(
        err instanceof Error ? err.message : 'シフトデータの取得に失敗しました'
      );
    } finally {
      setLoading(false);
    }
  }, [token, currentDate]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // 月の変更
  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  // 今月に戻る
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 表示モード変更
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    onViewChange?.(mode);
  };

  // 日付クリック
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    onAddShift?.(date);
  };

  // シフトクリック
  const handleShiftClick = (shift: Shift) => {
    onEditShift?.(shift);
  };

  // 通貨フォーマット
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // 時間フォーマット
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  };

  // 週の日付を取得
  const getWeekDays = () => {
    return ['日', '月', '火', '水', '木', '金', '土'];
  };

  // シフトの状態に応じた色を取得
  const getShiftColor = (shift: Shift) => {
    if (shift.isConfirmed) {
      return 'success';
    }
    return 'warning';
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={2}>
            <Schedule color="primary" />
            <Typography variant="h6">シフト管理</Typography>
            <Chip
              label={format(currentDate, 'yyyy年M月')}
              variant="outlined"
              color="primary"
            />
          </Box>
        }
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>表示</InputLabel>
              <Select
                value={viewMode}
                label="表示"
                onChange={e => handleViewModeChange(e.target.value as ViewMode)}
              >
                <MenuItem value="month">
                  <Box display="flex" alignItems="center" gap={1}>
                    <ViewModule fontSize="small" />月
                  </Box>
                </MenuItem>
                <MenuItem value="week">
                  <Box display="flex" alignItems="center" gap={1}>
                    <ViewWeek fontSize="small" />週
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="今月">
              <IconButton onClick={handleToday}>
                <Today />
              </IconButton>
            </Tooltip>

            <Tooltip title="前月">
              <IconButton onClick={handlePrevMonth}>
                <ChevronLeft />
              </IconButton>
            </Tooltip>

            <Tooltip title="次月">
              <IconButton onClick={handleNextMonth}>
                <ChevronRight />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />

      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 統計情報と収入予測 */}
        <Grid2 container spacing={2} sx={{ mb: 3 }}>
          {/* 統計情報 */}
          {stats && (
            <Grid2 xs={12} lg={8}>
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <TrendingUp />
                  月間統計
                </Typography>
                <Grid2 container spacing={2}>
                  <Grid2 xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {stats.thisMonth.shifts}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        今月のシフト数
                      </Typography>
                    </Paper>
                  </Grid2>
                  <Grid2 xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {formatHours(stats.thisMonth.hours)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        今月の労働時間
                      </Typography>
                    </Paper>
                  </Grid2>
                  <Grid2 xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(stats.thisMonth.earnings)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        今月の収入
                      </Typography>
                    </Paper>
                  </Grid2>
                  <Grid2 xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {Math.round(
                          stats.thisMonth.earnings /
                            Math.max(stats.thisMonth.hours, 1)
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        平均時給
                      </Typography>
                    </Paper>
                  </Grid2>
                </Grid2>
              </Box>
            </Grid2>
          )}

          {/* 収入予測 */}
          <Grid2 item xs={12} lg={4}>
            <EarningsProjectionCard />
          </Grid2>
        </Grid2>

        {/* カレンダー */}
        <Box position="relative">
          {loading && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor="rgba(255, 255, 255, 0.7)"
              zIndex={1}
            >
              <CircularProgress />
            </Box>
          )}

          {/* 曜日ヘッダー */}
          <Grid2 container spacing={1} sx={{ mb: 1 }}>
            {getWeekDays().map((day, index) => (
              <Grid2 item xs key={index}>
                <Box
                  textAlign="center"
                  py={1}
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
                </Box>
              </Grid2>
            ))}
          </Grid2>

          {/* 日付グリッド */}
          <Grid2 container spacing={1}>
            {calendarDates.map(calendarDate => (
              <Grid2 item xs key={calendarDate.date}>
                <Paper
                  elevation={calendarDate.isToday ? 3 : 1}
                  sx={{
                    minHeight: compactMode ? 80 : 120,
                    cursor: 'pointer',
                    position: 'relative',
                    border: calendarDate.isToday ? '2px solid' : '1px solid',
                    borderColor: calendarDate.isToday
                      ? 'primary.main'
                      : 'divider',
                    '&:hover': {
                      elevation: 3,
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleDateClick(calendarDate.date)}
                >
                  <Box p={1}>
                    {/* 日付 */}
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: calendarDate.isToday ? 'bold' : 'normal',
                          color:
                            calendarDate.dayOfWeek === 0
                              ? 'error.main'
                              : calendarDate.dayOfWeek === 6
                                ? 'primary.main'
                                : 'text.primary',
                        }}
                      >
                        {format(new Date(calendarDate.date), 'd')}
                      </Typography>

                      {calendarDate.shifts.length > 0 && (
                        <Badge
                          badgeContent={calendarDate.shifts.length}
                          color="primary"
                        >
                          <Work fontSize="small" />
                        </Badge>
                      )}
                    </Box>

                    {/* シフト一覧 */}
                    <Box>
                      {calendarDate.shifts
                        .slice(0, compactMode ? 1 : 2)
                        .map(shift => (
                          <Chip
                            key={shift.id}
                            label={
                              <Box display="flex" alignItems="center" gap={0.5}>
                                {shift.isConfirmed ? (
                                  <CheckCircle sx={{ fontSize: 12 }} />
                                ) : (
                                  <RadioButtonUnchecked sx={{ fontSize: 12 }} />
                                )}
                                <Typography variant="caption">
                                  {shift.startTime}-{shift.endTime}
                                </Typography>
                              </Box>
                            }
                            size="small"
                            color={
                              getShiftColor(shift) as 'success' | 'warning'
                            }
                            sx={{
                              width: '100%',
                              mb: 0.5,
                              '& .MuiChip-label': {
                                width: '100%',
                                textAlign: 'left',
                              },
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              handleShiftClick(shift);
                            }}
                          />
                        ))}

                      {calendarDate.shifts.length > (compactMode ? 1 : 2) && (
                        <Typography variant="caption" color="text.secondary">
                          +{calendarDate.shifts.length - (compactMode ? 1 : 2)}{' '}
                          more
                        </Typography>
                      )}
                    </Box>

                    {/* 収入表示 */}
                    {calendarDate.totalEarnings > 0 && (
                      <Box mt={1}>
                        <Typography variant="caption" color="success.main">
                          {formatCurrency(calendarDate.totalEarnings)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid2>
            ))}
          </Grid2>
        </Box>

        {/* 新規シフト追加ボタン（コンパクトモードでは非表示） */}
        {!compactMode && (
          <Fab
            color="primary"
            aria-label="add shift"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
            onClick={() => onAddShift?.()}
          >
            <Add />
          </Fab>
        )}
      </CardContent>
    </Card>
  );
};
