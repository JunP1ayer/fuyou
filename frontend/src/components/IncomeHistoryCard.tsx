import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Box,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Work,
  AccountBalance,
  Upload,
  Add,
  TrendingUp,
  CalendarToday,
} from '@mui/icons-material';
import type { Income } from '../types/fuyou';
import { IncomeCategory } from '../types/fuyou';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface IncomeHistoryCardProps {
  onAddIncome?: () => void;
  onUploadCSV?: () => void;
}

export const IncomeHistoryCard: React.FC<IncomeHistoryCardProps> = ({
  onAddIncome,
  onUploadCSV,
}) => {
  const { token } = useAuth();
  const [recentIncomes, setRecentIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const fetchRecentIncomes = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = (await apiService.getRecentIncomes(token, 5)) as {
        success: boolean;
        data?: unknown;
        error?: any;
      };

      if (
        !('success' in response) ||
        !(response as { success: boolean }).success
      ) {
        throw new Error('収入履歴の取得に失敗しました');
      }

      const responseData = response as { success: boolean; data?: unknown };
      const incomes =
        (responseData.data as Array<Record<string, unknown>>) || [];

      // Transform API data to match frontend types
      const transformedIncomes: Income[] = incomes.map(income => ({
        id: income.id as string,
        amount: income.amount as number,
        date: income.date as string,
        category:
          (income.category as IncomeCategory) || IncomeCategory.PART_TIME_JOB,
        description: income.description as string,
        isAutoDetected: income.isAutoDetected as boolean,
        detectionConfidence: income.detectionConfidence as number,
        createdAt: income.createdAt as string,
      }));

      setRecentIncomes(transformedIncomes);

      // 今月の合計を計算
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthIncomes = transformedIncomes.filter(income => {
        const incomeDate = new Date(income.date);
        return (
          incomeDate.getMonth() === currentMonth &&
          incomeDate.getFullYear() === currentYear
        );
      });

      const total = thisMonthIncomes.reduce(
        (sum, income) => sum + income.amount,
        0
      );
      setMonthlyTotal(total);
    } catch (err) {
      console.error('Failed to fetch recent incomes:', err);
      setError(
        err instanceof Error ? err.message : '予期せぬエラーが発生しました'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRecentIncomes();
  }, [fetchRecentIncomes]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getCategoryIcon = (category: IncomeCategory) => {
    switch (category) {
      case IncomeCategory.PART_TIME_JOB:
        return <Work color="primary" />;
      case IncomeCategory.TEMPORARY_WORK:
        return <Work color="secondary" />;
      case IncomeCategory.FREELANCE:
        return <Work color="action" />;
      default:
        return <Work />;
    }
  };

  const getCategoryLabel = (category: IncomeCategory) => {
    const labels: Record<IncomeCategory, string> = {
      [IncomeCategory.PART_TIME_JOB]: 'アルバイト',
      [IncomeCategory.TEMPORARY_WORK]: '単発バイト',
      [IncomeCategory.FREELANCE]: 'フリーランス',
      [IncomeCategory.SCHOLARSHIP]: '奨学金',
      [IncomeCategory.FAMILY_SUPPORT]: '家族支援',
      [IncomeCategory.OTHER]: 'その他',
    };
    return labels[category];
  };

  const getCategoryColor = (
    category: IncomeCategory
  ): 'primary' | 'secondary' | 'default' => {
    switch (category) {
      case IncomeCategory.PART_TIME_JOB:
        return 'primary';
      case IncomeCategory.TEMPORARY_WORK:
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="最近の収入" />
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
        <CardHeader title="最近の収入" />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="最近の収入"
        action={
          <Box display="flex" gap={1}>
            <Button size="small" startIcon={<Upload />} onClick={onUploadCSV}>
              CSV
            </Button>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={onAddIncome}
              variant="outlined"
            >
              追加
            </Button>
          </Box>
        }
      />
      <CardContent>
        {/* 今月の合計 */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          p={2}
          bgcolor="primary.50"
          borderRadius={1}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarToday color="primary" fontSize="small" />
            <Typography variant="body2" color="primary">
              今月の収入
            </Typography>
          </Box>
          <Typography variant="h6" color="primary" fontWeight="bold">
            {formatCurrency(monthlyTotal)}
          </Typography>
        </Box>

        {recentIncomes.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            まだ収入データがありません。CSVファイルをアップロードするか、手動で追加してください。
          </Alert>
        ) : (
          <List disablePadding>
            {recentIncomes.map((income, index) => (
              <React.Fragment key={income.id}>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon>
                    {getCategoryIcon(income.category)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="body1">
                          {income.description}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(income.amount)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mt={0.5}
                      >
                        <Box display="flex" gap={1} alignItems="center">
                          <Chip
                            label={getCategoryLabel(income.category)}
                            size="small"
                            color={getCategoryColor(income.category)}
                            variant="outlined"
                          />
                          {income.isAutoDetected && (
                            <Chip
                              label={`自動検出 ${(income.detectionConfidence! * 100).toFixed(0)}%`}
                              size="small"
                              color="success"
                              variant="outlined"
                              icon={<AccountBalance />}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(income.date)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < recentIncomes.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* フッター統計 */}
        <Box mt={2} pt={2} borderTop="1px solid" borderColor="divider">
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingUp color="action" fontSize="small" />
              <Typography variant="caption" color="text.secondary">
                過去30日間
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {recentIncomes.length}件の収入
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
