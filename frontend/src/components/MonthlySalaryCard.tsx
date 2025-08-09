import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  LinearProgress,
  Chip,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  CalendarMonth,
  AttachMoney,
  Schedule,
} from '@mui/icons-material';
import {
  format,
  isSameMonth,
  parseISO,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Shift } from '../types/shift';

interface MonthlySalaryCardProps {
  shifts: Shift[];
  selectedMonth?: Date;
  onMonthChange?: (month: Date) => void;
}

export const MonthlySalaryCard: React.FC<MonthlySalaryCardProps> = ({
  shifts,
  selectedMonth = new Date(),
  onMonthChange,
}) => {
  // 給料日ごとのグループを作成
  const salaryGroups = useMemo(() => {
    const groups: Record<
      number,
      {
        shifts: Shift[];
        totalEarnings: number;
        totalHours: number;
        payDay: number;
      }
    > = {};

    shifts.forEach(shift => {
      const payDay = shift.payDay || 25;
      if (!groups[payDay]) {
        groups[payDay] = {
          shifts: [],
          totalEarnings: 0,
          totalHours: 0,
          payDay,
        };
      }

      groups[payDay].shifts.push(shift);
      groups[payDay].totalEarnings += shift.calculatedEarnings;
      groups[payDay].totalHours += shift.workingHours;
    });

    return groups;
  }, [shifts]);

  // 選択月のシフトをフィルタリング
  const monthlyShifts = useMemo(() => {
    return shifts.filter(shift => {
      const shiftDate = parseISO(shift.date);
      return isSameMonth(shiftDate, selectedMonth);
    });
  }, [shifts, selectedMonth]);

  // 月間統計
  const monthlyStats = useMemo(() => {
    return monthlyShifts.reduce(
      (acc, shift) => ({
        totalEarnings: acc.totalEarnings + shift.calculatedEarnings,
        totalHours: acc.totalHours + shift.workingHours,
        shiftCount: acc.shiftCount + 1,
      }),
      { totalEarnings: 0, totalHours: 0, shiftCount: 0 }
    );
  }, [monthlyShifts]);

  // 扶養限度額（年間103万円）に対する進捗
  const yearlyLimit = 1030000;
  const monthlyLimit = yearlyLimit / 12;
  const progressPercentage = (monthlyStats.totalEarnings / monthlyLimit) * 100;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CalendarMonth sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">月間給料集計</Typography>
        </Box>

        {/* 月選択 */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>対象月</InputLabel>
          <Select
            value={format(selectedMonth, 'yyyy-MM')}
            label="対象月"
            onChange={e => {
              const [year, month] = e.target.value.split('-');
              onMonthChange?.(new Date(Number(year), Number(month) - 1));
            }}
          >
            {[...Array(12)].map((_, i) => {
              const date = new Date(
                new Date().getFullYear(),
                new Date().getMonth() - i,
                1
              );
              return (
                <MenuItem key={i} value={format(date, 'yyyy-MM')}>
                  {format(date, 'yyyy年M月', { locale: ja })}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        {/* 月間統計 */}
        <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 2, mb: 3 }}>
          <Stack spacing={2}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney />
                <Typography variant="subtitle1">月間総給料</Typography>
              </Box>
              <Typography variant="h5" color="primary.main" fontWeight="bold">
                ¥{monthlyStats.totalEarnings.toLocaleString()}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule />
                <Typography variant="subtitle1">総労働時間</Typography>
              </Box>
              <Typography variant="h6">
                {monthlyStats.totalHours.toFixed(1)}時間
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="subtitle1">シフト数</Typography>
              <Chip
                label={`${monthlyStats.shiftCount}件`}
                color="primary"
                size="small"
              />
            </Box>
          </Stack>
        </Box>

        {/* 扶養限度額に対する進捗 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            月間目標額に対する進捗
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(progressPercentage, 100)}
            sx={{ height: 10, borderRadius: 5, mb: 1 }}
            color={
              progressPercentage > 100
                ? 'error'
                : progressPercentage > 80
                  ? 'warning'
                  : 'success'
            }
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              月間目標: ¥{Math.floor(monthlyLimit).toLocaleString()}
            </Typography>
            <Typography
              variant="caption"
              color={progressPercentage > 100 ? 'error.main' : 'text.secondary'}
              fontWeight="bold"
            >
              {progressPercentage.toFixed(1)}%
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 給料日別集計 */}
        <Typography
          variant="subtitle1"
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          給料日別集計
        </Typography>
        <Stack spacing={2}>
          {Object.entries(salaryGroups)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([payDay, group]) => (
              <Box
                key={payDay}
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    毎月{payDay}日締め
                  </Typography>
                  <Chip
                    label={`${group.shifts.length}件`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {group.totalHours.toFixed(1)}時間
                  </Typography>
                  <Typography
                    variant="body1"
                    color="primary.main"
                    fontWeight="bold"
                  >
                    ¥{group.totalEarnings.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            ))}
        </Stack>

        {Object.keys(salaryGroups).length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              この月のシフトデータがありません
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
