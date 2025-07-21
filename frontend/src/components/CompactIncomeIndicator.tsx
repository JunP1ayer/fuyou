import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Fab,
  Tooltip,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  CameraAlt,
  ExpandMore,
  ExpandLess,
  TrendingUp,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import type { FuyouStatus } from '../types/fuyou';

interface CompactIncomeIndicatorProps {
  fuyouStatus: FuyouStatus | null;
  onOCROpen: () => void;
  compactMode?: boolean;
}

export const CompactIncomeIndicator: React.FC<CompactIncomeIndicatorProps> = ({
  fuyouStatus,
  onOCROpen,
  compactMode = false,
}) => {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [, setLoading] = useState(true);

  // 今月の収入を取得
  useEffect(() => {
    const fetchMonthlyIncome = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // 今月のシフトデータを取得
        const response = await apiService.getShifts(token, {
          year: year.toString(),
          month: month.toString(),
        });
        const r = response as {
          success?: boolean;
          data?: { totalEarnings?: number }[];
        };
        if (r.success && r.data) {
          const shifts = r.data;
          const totalIncome = shifts.reduce(
            (sum, shift) => sum + (shift.totalEarnings || 0),
            0
          );
          setMonthlyIncome(totalIncome);
        }
      } catch (error) {
        console.error('Failed to fetch monthly income:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyIncome();
  }, [token]);

  const getRemainingAmount = () => {
    if (!fuyouStatus) return 0;
    return fuyouStatus.selectedLimit.amount - monthlyIncome;
  };

  const getProgressPercentage = () => {
    if (!fuyouStatus) return 0;
    return Math.min(
      (monthlyIncome / fuyouStatus.selectedLimit.amount) * 100,
      100
    );
  };

  const getRiskLevel = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 90) return 'high';
    if (percentage >= 75) return 'medium';
    return 'low';
  };

  const getRiskColor = () => {
    const risk = getRiskLevel();
    switch (risk) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      default:
        return '#4caf50';
    }
  };

  const getRiskIcon = () => {
    const risk = getRiskLevel();
    switch (risk) {
      case 'high':
        return <Warning />;
      case 'medium':
        return <TrendingUp />;
      default:
        return <CheckCircle />;
    }
  };

  if (compactMode) {
    return (
      <Box sx={{ position: 'relative' }}>
        {/* フローティングOCRボタン */}
        <Tooltip title="シフト表を読み込む">
          <Fab
            size="small"
            color="primary"
            onClick={onOCROpen}
            sx={{
              position: 'fixed',
              bottom: { xs: 80, sm: 90 },
              right: { xs: 16, sm: 24 },
              zIndex: 1000,
              boxShadow: 3,
            }}
          >
            <CameraAlt />
          </Fab>
        </Tooltip>

        {/* コンパクト収入表示 */}
        <Card
          sx={{
            mb: 2,
            background: `linear-gradient(135deg, ${getRiskColor()}22 0%, ${getRiskColor()}11 100%)`,
            border: `1px solid ${getRiskColor()}44`,
          }}
        >
          <CardContent sx={{ py: 1.5, px: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box flex={1}>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.8rem', mb: 0.5 }}
                >
                  今月の収入
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                >
                  ¥{monthlyIncome.toLocaleString()}
                </Typography>
              </Box>

              <Box textAlign="center" mx={2}>
                {getRiskIcon()}
              </Box>

              <Box textAlign="right" flex={1}>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.8rem', mb: 0.5 }}
                >
                  扶養残額
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: getRemainingAmount() < 0 ? '#f44336' : 'inherit',
                  }}
                >
                  ¥{Math.max(0, getRemainingAmount()).toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <LinearProgress
              variant="determinate"
              value={getProgressPercentage()}
              sx={{
                mt: 1,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getRiskColor(),
                  borderRadius: 3,
                },
              }}
            />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}
            >
              {fuyouStatus?.selectedLimit.name} (
              {getProgressPercentage().toFixed(1)}%)
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // 通常モード（詳細表示）
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">収入状況</Typography>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Box display="flex" gap={2} mb={2}>
          <Chip
            icon={getRiskIcon()}
            label={`今月: ¥${monthlyIncome.toLocaleString()}`}
            color={
              getRiskLevel() === 'low'
                ? 'success'
                : getRiskLevel() === 'medium'
                  ? 'warning'
                  : 'error'
            }
            variant="filled"
          />
          <Chip
            label={`残額: ¥${Math.max(0, getRemainingAmount()).toLocaleString()}`}
            variant="outlined"
          />
        </Box>

        <LinearProgress
          variant="determinate"
          value={getProgressPercentage()}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: getRiskColor(),
              borderRadius: 4,
            },
          }}
        />

        <Collapse in={expanded}>
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              {fuyouStatus?.selectedLimit.name}: ¥
              {fuyouStatus?.selectedLimit.amount.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              進捗: {getProgressPercentage().toFixed(1)}%
            </Typography>
            {getRemainingAmount() < 0 && (
              <Typography variant="body2" color="error">
                ⚠️ 扶養限度額を超過しています
              </Typography>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};
