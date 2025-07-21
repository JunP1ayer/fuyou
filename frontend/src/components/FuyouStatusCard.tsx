import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  TrendingUp,
} from '@mui/icons-material';
import type { FuyouStatus, FuyouLimitType } from '../types/fuyou';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface FuyouStatusCardProps {
  onStatusUpdate?: (status: FuyouStatus) => void;
}

export const FuyouStatusCard: React.FC<FuyouStatusCardProps> = ({
  onStatusUpdate,
}) => {
  const { token } = useAuth();
  const [status, setStatus] = useState<FuyouStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFuyouStatus = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = (await apiService.getEnhancedCalculation(token)) as {
        success: boolean;
        data?: unknown;
        error?: unknown;
      };

      if (
        !('success' in response) ||
        !(response as { success: boolean }).success
      ) {
        throw new Error('扶養ステータスの取得に失敗しました');
      }

      const responseData = response as { success: boolean; data?: unknown };
      const calculation = (responseData.data as Record<string, unknown>) || {};

      // Transform backend data to match frontend FuyouStatus interface
      const fuyouStatus: FuyouStatus = {
        currentYearIncome: calculation.currentIncome as number,
        currentMonthIncome: calculation.monthlyTarget as number, // Use monthly target as current month estimate
        applicableLimits: (
          calculation.applicableLimits as Array<Record<string, unknown>>
        ).map(limit => ({
          type: limit.type as FuyouLimitType,
          amount: limit.amount as number,
          name: limit.description as string,
          description: limit.description as string,
          effectiveDate: '2025-01-01',
        })),
        selectedLimit: {
          type: (calculation.recommendedLimit as Record<string, unknown>)
            .type as FuyouLimitType,
          amount: (calculation.recommendedLimit as Record<string, unknown>)
            .amount as number,
          name: (calculation.recommendedLimit as Record<string, unknown>)
            .description as string,
          description: (calculation.recommendedLimit as Record<string, unknown>)
            .description as string,
          effectiveDate: '2025-01-01',
        },
        remainingCapacity: calculation.remainingAmount as number,
        percentageUsed: (calculation.usageRate as number) * 100,
        monthlyAverage: calculation.monthlyTarget as number,
        monthlyTargetIncome: calculation.monthlyTarget as number,
        projectedYearIncome: calculation.projectedYearEndIncome as number,
        riskLevel:
          calculation.riskLevel === 'safe'
            ? 'safe'
            : calculation.riskLevel === 'caution'
              ? 'warning'
              : 'danger',
        isOverLimit: (calculation.usageRate as number) > 1,
        alertTriggered: ((calculation.alerts as unknown[]) || []).length > 0,
        calculationDate: new Date().toISOString(),
      };

      setStatus(fuyouStatus);
      onStatusUpdate?.(fuyouStatus);
    } catch (err) {
      console.error('Failed to fetch fuyou status:', err);
      setError(
        err instanceof Error ? err.message : '予期せぬエラーが発生しました'
      );
    } finally {
      setLoading(false);
    }
  }, [token, onStatusUpdate]);

  useEffect(() => {
    fetchFuyouStatus();
  }, [fetchFuyouStatus]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const getRiskColor = (riskLevel: string): 'success' | 'warning' | 'error' => {
    switch (riskLevel) {
      case 'safe':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      default:
        return 'success';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'error';
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

  if (!status) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">扶養ステータスが取得できませんでした</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            扶養ステータス
          </Typography>
          <Chip
            icon={getRiskIcon(status.riskLevel)}
            label={
              status.riskLevel === 'safe'
                ? '安全'
                : status.riskLevel === 'warning'
                  ? '注意'
                  : '危険'
            }
            color={getRiskColor(status.riskLevel)}
            variant="outlined"
          />
        </Box>

        {/* 現在の使用率 */}
        <Box mb={3}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="body2" color="text.secondary">
              使用率
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {status.percentageUsed.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(status.percentageUsed, 100)}
            color={getProgressColor(status.percentageUsed)}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="caption" color="text.secondary">
              現在: {formatCurrency(status.currentYearIncome)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              限度額: {formatCurrency(status.selectedLimit.amount)}
            </Typography>
          </Box>
        </Box>

        {/* 重要な数値 */}
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              残り枠
            </Typography>
            <Typography variant="h6" color="primary">
              {formatCurrency(status.remainingCapacity)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              今月の収入
            </Typography>
            <Typography variant="h6">
              {formatCurrency(status.currentMonthIncome)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 予測と目標 */}
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              月平均収入
            </Typography>
            <Typography variant="body1">
              {formatCurrency(status.monthlyAverage)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              月間目標収入
            </Typography>
            <Typography variant="body1" color="primary">
              {formatCurrency(status.monthlyTargetIncome)}
            </Typography>
          </Box>
        </Box>

        {/* 年間予測アラート */}
        {status.projectedYearIncome > status.selectedLimit.amount && (
          <Alert severity="warning" sx={{ mt: 2 }} icon={<TrendingUp />}>
            年間予測収入が限度額を超過する見込みです
            <br />
            予測: {formatCurrency(status.projectedYearIncome)}
          </Alert>
        )}

        {/* 適用制度情報 */}
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            適用制度
          </Typography>
          <Typography variant="body2">{status.selectedLimit.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {status.selectedLimit.description}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
