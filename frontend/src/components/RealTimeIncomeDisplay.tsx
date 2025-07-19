import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Refresh,
  MonetizationOn,
  AccountBalance,
  Timer,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import type { FuyouStatus } from '../types/fuyou';

interface RealTimeIncomeDisplayProps {
  fuyouStatus: FuyouStatus | null;
  onRefresh?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  compactMode?: boolean;
}

export const RealTimeIncomeDisplay: React.FC<RealTimeIncomeDisplayProps> = ({
  fuyouStatus,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 300000, // 5分間隔
  compactMode = false,
}) => {
  const { token } = useAuth();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [weeklyIncome, setWeeklyIncome] = useState<number>(0);
  const [dailyAverage, setDailyAverage] = useState<number>(0);

  // リアルタイム収入データ取得
  const fetchRealTimeData = useCallback(async () => {
    if (!token) return;

    setIsRefreshing(true);
    try {
      // 今月、今週、日平均の収入を並行取得
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const [monthlyResponse, weeklyResponse] = await Promise.all([
        apiService.getMonthlyIncome(token, currentYear, currentMonth),
        apiService.getWeeklyIncome(token),
      ]);

      if (monthlyResponse.success) {
        setMonthlyIncome(monthlyResponse.data?.totalAmount || 0);
      }

      if (weeklyResponse.success) {
        setWeeklyIncome(weeklyResponse.data?.totalAmount || 0);
      }

      // 日平均計算（今月の稼働日数で割る）
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const currentDay = now.getDate();
      if (currentDay > 0) {
        setDailyAverage(monthlyIncome / currentDay);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch real-time income data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [token, monthlyIncome]);

  // 自動更新機能
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchRealTimeData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchRealTimeData]);

  // 初回データ取得
  useEffect(() => {
    fetchRealTimeData();
  }, [fetchRealTimeData]);

  // fuyouStatusの変更に応じて更新
  useEffect(() => {
    if (fuyouStatus?.currentMonthIncome) {
      setMonthlyIncome(fuyouStatus.currentMonthIncome);
    }
  }, [fuyouStatus]);

  const handleRefresh = () => {
    fetchRealTimeData();
    onRefresh?.();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskColor = (
    percentage: number
  ): 'success' | 'warning' | 'error' => {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'error';
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'danger':
        return <ErrorIcon color="error" />;
      default:
        return <CheckCircle color="success" />;
    }
  };

  const usagePercentage = fuyouStatus
    ? (fuyouStatus.currentYearIncome / fuyouStatus.selectedLimit.amount) * 100
    : 0;

  const remainingAmount = fuyouStatus ? fuyouStatus.remainingCapacity : 0;

  if (compactMode) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        {/* 今月の収入（コンパクト） */}
        <Card
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <MonetizationOn sx={{ fontSize: 24 }} />
              <IconButton
                size="small"
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{ color: 'white' }}
              >
                <Refresh sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
              {formatCurrency(monthlyIncome)}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              今月の収入
            </Typography>
          </CardContent>
        </Card>

        {/* 扶養まで残り（コンパクト） */}
        <Card
          sx={{
            background:
              fuyouStatus && fuyouStatus.riskLevel === 'danger'
                ? 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)'
                : fuyouStatus && fuyouStatus.riskLevel === 'warning'
                  ? 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)'
                  : 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)',
            color: 'white',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <AccountBalance sx={{ fontSize: 24 }} />
              {fuyouStatus && getRiskIcon(fuyouStatus.riskLevel)}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
              {formatCurrency(remainingAmount)}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              扶養まで残り
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" component="div">
            リアルタイム収入状況
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<Timer />}
              label={`更新: ${lastUpdated.toLocaleTimeString()}`}
              size="small"
              variant="outlined"
            />
            <Tooltip title="手動更新">
              <IconButton
                size="small"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 今月の収入進捗 */}
        {fuyouStatus && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                年間扶養枠使用率
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {usagePercentage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(usagePercentage, 100)}
              color={getRiskColor(usagePercentage)}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}
            >
              <Typography variant="caption" color="text.secondary">
                現在: {formatCurrency(fuyouStatus.currentYearIncome)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                限度額: {formatCurrency(fuyouStatus.selectedLimit.amount)}
              </Typography>
            </Box>
          </Box>
        )}

        {/* 収入詳細グリッド */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
            gap: 2,
            mb: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              今月収入
            </Typography>
            <Typography
              variant="h6"
              color="primary"
              sx={{ fontWeight: 'bold' }}
            >
              {formatCurrency(monthlyIncome)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              今週収入
            </Typography>
            <Typography
              variant="h6"
              color="secondary"
              sx={{ fontWeight: 'bold' }}
            >
              {formatCurrency(weeklyIncome)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              日平均収入
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(dailyAverage)}
            </Typography>
          </Box>
        </Box>

        {/* 扶養残り枠アラート */}
        {fuyouStatus && remainingAmount < fuyouStatus.monthlyTargetIncome && (
          <Fade in>
            <Alert
              severity={
                remainingAmount < fuyouStatus.monthlyTargetIncome / 2
                  ? 'error'
                  : 'warning'
              }
              sx={{ mt: 2 }}
              icon={
                remainingAmount < fuyouStatus.monthlyTargetIncome / 2 ? (
                  <ErrorIcon />
                ) : (
                  <Warning />
                )
              }
            >
              残り扶養枠が月間目標収入を下回っています
              <br />
              残り: {formatCurrency(remainingAmount)} / 月目標:{' '}
              {formatCurrency(fuyouStatus.monthlyTargetIncome)}
            </Alert>
          </Fade>
        )}

        {/* 収入トレンド指標 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
          <Chip
            icon={
              weeklyIncome > monthlyIncome / 4 ? (
                <TrendingUp />
              ) : (
                <TrendingDown />
              )
            }
            label={`週次トレンド: ${weeklyIncome > monthlyIncome / 4 ? '上昇' : '下降'}`}
            color={weeklyIncome > monthlyIncome / 4 ? 'success' : 'warning'}
            size="small"
          />
          {fuyouStatus && (
            <Chip
              icon={getRiskIcon(fuyouStatus.riskLevel)}
              label={
                fuyouStatus.riskLevel === 'safe'
                  ? '安全'
                  : fuyouStatus.riskLevel === 'warning'
                    ? '注意'
                    : '危険'
              }
              color={
                fuyouStatus.riskLevel === 'safe'
                  ? 'success'
                  : fuyouStatus.riskLevel === 'warning'
                    ? 'warning'
                    : 'error'
              }
              size="small"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
