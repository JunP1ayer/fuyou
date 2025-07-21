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
  Grid,
} from '@mui/material';
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
} from '../../utils/dateUtils';
import { apiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type {
  Shift,
  ShiftStats,
  CalendarDate,
  ViewMode,
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
  const [, setSelectedDate] = useState<string | null>(null);

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
      })) as { success: boolean; data?: Shift[]; error?: unknown };

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
      )) as { success: boolean; data?: ShiftStats; error?: unknown };

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

  // 勤務先ごとの色設定
  const getWorkplaceColor = (jobSourceName: string): string => {
    const colors: { [key: string]: string } = {
      カフェ: '#4CAF50',
      コンビニ: '#2196F3',
      家庭教師: '#FF9800',
      レストラン: '#9C27B0',
      小売店: '#F44336',
      配達: '#607D8B',
      オフィス: '#795548',
      塾講師: '#E91E63',
    };

    // 部分マッチも試行
    for (const [key, color] of Object.entries(colors)) {
      if (jobSourceName?.includes(key)) {
        return color;
      }
    }

    return '#666666'; // デフォルト色
  };

  // シフトの状態に応じた色を取得

  // シフトチップの背景色を取得
  const getShiftChipStyle = (shift: Shift) => {
    const workplaceColor = getWorkplaceColor(shift.jobSourceName || '');
    return {
      backgroundColor: workplaceColor,
      color: 'white',
      '& .MuiChip-label': {
        color: 'white',
      },
      '&:hover': {
        backgroundColor: workplaceColor,
        filter: 'brightness(0.9)',
      },
    };
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
            <Schedule
              color="primary"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            />
            <Typography
              variant="h6"
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              シフト管理
            </Typography>
            <Chip
              label={format(currentDate, 'yyyy年M月')}
              variant="outlined"
              color="primary"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
            />
          </Box>
        }
        action={
          <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1 }}>
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: 60, sm: 100 },
                display: { xs: 'none', sm: 'block' },
              }}
            >
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
              <IconButton
                onClick={handleToday}
                size="small"
                sx={{ p: { xs: 0.5, sm: 1 } }}
              >
                <Today fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="前月">
              <IconButton
                onClick={handlePrevMonth}
                size="small"
                sx={{ p: { xs: 0.5, sm: 1 } }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="次月">
              <IconButton
                onClick={handleNextMonth}
                size="small"
                sx={{ p: { xs: 0.5, sm: 1 } }}
              >
                <ChevronRight fontSize="small" />
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
        <Grid
          container
          spacing={{ xs: 1, sm: 2 }}
          sx={{ mb: { xs: 2, sm: 3 } }}
        >
          {/* 統計情報 */}
          {stats && (
            <Grid item xs={12} lg={8}>
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                  }}
                >
                  <TrendingUp fontSize="small" />
                  月間統計
                </Typography>
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: { xs: 1, sm: 2 }, textAlign: 'center' }}>
                      <Typography
                        variant="h6"
                        color="primary"
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                      >
                        {stats.thisMonth.shifts}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                      >
                        今月のシフト数
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: { xs: 1, sm: 2 }, textAlign: 'center' }}>
                      <Typography
                        variant="h6"
                        color="primary"
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                      >
                        {formatHours(stats.thisMonth.hours)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                      >
                        今月の労働時間
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: { xs: 1, sm: 2 }, textAlign: 'center' }}>
                      <Typography
                        variant="h6"
                        color="primary"
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                      >
                        {formatCurrency(stats.thisMonth.earnings)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                      >
                        今月の収入
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: { xs: 1, sm: 2 }, textAlign: 'center' }}>
                      <Typography
                        variant="h6"
                        color="primary"
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                      >
                        {Math.round(
                          stats.thisMonth.earnings /
                            Math.max(stats.thisMonth.hours, 1)
                        )}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                      >
                        平均時給
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          )}

          {/* 収入予測 */}
          <Grid item xs={12} lg={4}>
            <EarningsProjectionCard />
          </Grid>
        </Grid>

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
          <Grid container spacing={{ xs: 0.5, sm: 1 }} sx={{ mb: 1 }}>
            {getWeekDays().map((day, index) => (
              <Grid item xs key={index}>
                <Box
                  textAlign="center"
                  py={{ xs: 0.5, sm: 1 }}
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '0.8rem', sm: '1rem' },
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
              </Grid>
            ))}
          </Grid>

          {/* 日付グリッド */}
          <Grid container spacing={{ xs: 0.5, sm: 1 }}>
            {calendarDates.map(calendarDate => (
              <Grid item xs key={calendarDate.date}>
                <Paper
                  elevation={calendarDate.isToday ? 3 : 1}
                  sx={{
                    minHeight: {
                      xs: compactMode ? 60 : 100,
                      sm: compactMode ? 80 : 120,
                    },
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
                  <Box p={{ xs: 0.5, sm: 1 }}>
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
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
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
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: { xs: '0.6rem', sm: '0.75rem' },
                                  }}
                                >
                                  {shift.startTime}-{shift.endTime}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    opacity: 0.8,
                                    fontSize: { xs: '0.6rem', sm: '0.75rem' },
                                    display: { xs: 'none', sm: 'block' },
                                  }}
                                >
                                  {shift.jobSourceName || 'バイト'}
                                </Typography>
                              </Box>
                            }
                            size="small"
                            sx={{
                              width: '100%',
                              mb: 0.5,
                              ...getShiftChipStyle(shift),
                              '& .MuiChip-label': {
                                width: '100%',
                                textAlign: 'left',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              },
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              handleShiftClick(shift);
                            }}
                          />
                        ))}

                      {calendarDate.shifts.length > (compactMode ? 1 : 2) && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
                        >
                          +{calendarDate.shifts.length - (compactMode ? 1 : 2)}{' '}
                          more
                        </Typography>
                      )}
                    </Box>

                    {/* 収入表示 */}
                    {calendarDate.totalEarnings > 0 && (
                      <Box mt={{ xs: 0.5, sm: 1 }}>
                        <Typography
                          variant="caption"
                          color="success.main"
                          sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
                        >
                          {formatCurrency(calendarDate.totalEarnings)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 新規シフト追加ボタン（コンパクトモードでは非表示） */}
        {!compactMode && (
          <Fab
            color="primary"
            aria-label="add shift"
            size="medium"
            sx={{
              position: 'fixed',
              bottom: { xs: 16, sm: 24 },
              right: { xs: 16, sm: 24 },
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
            }}
            onClick={() => onAddShift?.()}
          >
            <Add fontSize="medium" />
          </Fab>
        )}
      </CardContent>
    </Card>
  );
};
