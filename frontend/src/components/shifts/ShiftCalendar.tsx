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
  const getShiftColor = (shift: Shift) => {
    if (shift.isConfirmed) {
      return 'success';
    }
    return 'warning';
  };

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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* シンプルな月ナビゲーション */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1,
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <IconButton onClick={handlePrevMonth} size="small">
          <ChevronLeft />
        </IconButton>
        
        <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
          {format(currentDate, 'yyyy年M月')}
        </Typography>
        
        <IconButton onClick={handleNextMonth} size="small">
          <ChevronRight />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, p: 1, overflow: 'hidden' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        {/* TimeTree風シンプルカレンダー */}
        <Box position="relative" sx={{ height: 'calc(100% - 40px)' }}>
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
          <Grid container spacing={0.5} sx={{ mb: 0.5 }}>
            {getWeekDays().map((day, index) => (
              <Grid item xs key={index}>
                <Box
                  textAlign="center"
                  py={0.5}
                  sx={{
                    fontSize: '0.75rem',
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
              </Grid>
            ))}
          </Grid>

          {/* 日付グリッド */}
          <Grid container spacing={0.5} sx={{ height: 'calc(100% - 30px)' }}>
            {calendarDates.map(calendarDate => (
              <Grid item xs key={calendarDate.date} sx={{ height: 'calc(100% / 6)' }}>
                <Paper
                  elevation={0}
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    position: 'relative',
                    border: calendarDate.isToday ? '2px solid' : '1px solid',
                    borderColor: calendarDate.isToday
                      ? 'primary.main'
                      : 'grey.300',
                    backgroundColor: calendarDate.isToday
                      ? 'primary.50'
                      : 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                  onClick={() => handleDateClick(calendarDate.date)}
                >
                  <Box p={0.5} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* 日付 */}
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={0.5}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.7rem',
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
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: 'primary.main'
                          }}
                        />
                      )}
                    </Box>

                    {/* シフト数表示 */}
                    {calendarDate.shifts.length > 0 && (
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.6rem',
                            color: 'text.secondary',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {calendarDate.shifts.length}件
                        </Typography>
                        {calendarDate.totalEarnings > 0 && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.55rem',
                              color: 'success.main',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            ¥{Math.floor(calendarDate.totalEarnings / 1000)}K
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};
