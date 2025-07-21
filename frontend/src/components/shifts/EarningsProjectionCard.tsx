import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Alert,
  Paper,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  AttachMoney,
  CalendarToday,
  TrendingFlat,
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface EarningsProjection {
  currentMonth: number;
  projectedTotal: number;
  dailyAverage: number;
  remainingWorkingDays: number;
  suggestedDailyTarget: number;
  fuyouLimitRemaining: number;
  riskLevel: 'safe' | 'warning' | 'danger';
  projectedMonthEnd: number;
  usageRate: number;
  yearToDate: number;
}

export const EarningsProjectionCard: React.FC = () => {
  const { token } = useAuth();
  const [projection, setProjection] = useState<EarningsProjection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjection = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = (await apiService.getShiftProjection(token)) as {
        success: boolean;
        data?: EarningsProjection;
        error?: unknown;
      };

      if (!response.success) {
        throw new Error('収入予測の取得に失敗しました');
      }

      if (response.data) {
        setProjection(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch projection:', err);
      setError(
        err instanceof Error ? err.message : '収入予測の取得に失敗しました'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProjection();
  }, [fetchProjection]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      default:
        return 'info';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return <CheckCircle />;
      case 'warning':
        return <Warning />;
      case 'danger':
        return <TrendingDown />;
      default:
        return <TrendingFlat />;
    }
  };

  const getRiskMessage = (
    riskLevel: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _usageRate: number
  ) => {
    if (riskLevel === 'safe') {
      return '扶養範囲内で安全です';
    } else if (riskLevel === 'warning') {
      return '扶養限度額に近づいています';
    } else {
      return '扶養限度額を超過する可能性があります';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={200}
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!projection) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            シフトデータがありません。シフトを登録すると収入予測が表示されます。
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = Math.round(projection.usageRate * 100);
  const riskColor = getRiskColor(projection.riskLevel);

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={2}>
            <TrendingUp color="primary" />
            <Typography variant="h6">収入予測</Typography>
            <Chip
              icon={getRiskIcon(projection.riskLevel)}
              label={getRiskMessage(projection.riskLevel, projection.usageRate)}
              color={
                riskColor as
                  | 'default'
                  | 'primary'
                  | 'secondary'
                  | 'error'
                  | 'info'
                  | 'success'
                  | 'warning'
              }
              size="small"
            />
          </Box>
        }
      />

      <CardContent>
        {/* 扶養限度額の使用状況 */}
        <Box mb={3}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="body2" color="text.secondary">
              扶養限度額使用状況
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {usagePercentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, usagePercentage)}
            color={
              riskColor as
                | 'primary'
                | 'secondary'
                | 'error'
                | 'info'
                | 'success'
                | 'warning'
                | 'inherit'
            }
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="caption" color="text.secondary">
              年収: {formatCurrency(projection.yearToDate)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              限度額: ¥1,500,000
            </Typography>
          </Box>
        </Box>

        {/* 統計情報 */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={1}
                mb={1}
              >
                <CalendarToday fontSize="small" color="primary" />
                <Typography variant="h6" color="primary">
                  {formatCurrency(projection.currentMonth)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                今月の収入
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={1}
                mb={1}
              >
                <TrendingUp fontSize="small" color="primary" />
                <Typography variant="h6" color="primary">
                  {formatCurrency(projection.projectedTotal)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                年間予測収入
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={1}
                mb={1}
              >
                <AttachMoney fontSize="small" color="secondary" />
                <Typography variant="h6" color="secondary">
                  {formatCurrency(projection.dailyAverage)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                1日平均収入
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={1}
                mb={1}
              >
                <Warning fontSize="small" color="warning" />
                <Typography variant="h6" color="warning">
                  {formatCurrency(projection.suggestedDailyTarget)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                推奨1日収入
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* アドバイス */}
        <Box mt={3}>
          {projection.riskLevel === 'danger' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>注意:</strong>{' '}
                現在のペースでは扶養限度額を超過する可能性があります。
                今月の目標収入を
                {formatCurrency(
                  projection.suggestedDailyTarget *
                    projection.remainingWorkingDays
                )}
                以下に抑えることをお勧めします。
              </Typography>
            </Alert>
          )}

          {projection.riskLevel === 'warning' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>注意:</strong> 扶養限度額に近づいています。 残り
                {formatCurrency(projection.fuyouLimitRemaining)}
                まで働くことができます。
              </Typography>
            </Alert>
          )}

          {projection.riskLevel === 'safe' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>良好:</strong> 現在のペースなら扶養範囲内で安全です。
                残り{formatCurrency(projection.fuyouLimitRemaining)}
                まで働くことができます。
              </Typography>
            </Alert>
          )}

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              今月末予測: {formatCurrency(projection.projectedMonthEnd)}
            </Typography>
            <Tooltip title="残り稼働可能日数">
              <Typography variant="caption" color="text.secondary">
                残り{projection.remainingWorkingDays}日
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
