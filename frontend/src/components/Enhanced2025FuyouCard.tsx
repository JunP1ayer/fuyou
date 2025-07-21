import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Alert,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  CheckCircle,
  TrendingUp,
  Info,
  ExpandMore,
  School,
  Business,
  Star,
  FiberNew,
} from '@mui/icons-material';
import type { FuyouStatus } from '../types/fuyou';
import { FuyouLimitType } from '../types/fuyou';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface Enhanced2025FuyouCardProps {
  onStatusUpdate?: (status: FuyouStatus) => void;
  compactMode?: boolean;
}

interface FuyouLimit2025 {
  type: FuyouLimitType;
  amount: number;
  name: string;
  description: string;
  effectiveDate: string;
  isNew?: boolean;
  targetAge?: string;
  conditions?: string[];
  benefits?: string[];
}

const FUYOU_LIMITS_2025: FuyouLimit2025[] = [
  {
    type: FuyouLimitType.FUYOU_103,
    amount: 1030000,
    name: '配偶者控除（103万円）',
    description: '従来の配偶者控除制度',
    effectiveDate: '2025-01-01',
    conditions: ['配偶者の年収が103万円以下', '納税者本人の年収が1195万円以下'],
    benefits: ['配偶者控除38万円（住民税33万円）', '配偶者特別控除適用可能'],
  },
  {
    type: FuyouLimitType.FUYOU_123,
    amount: 1230000,
    name: '新・配偶者控除（123万円）',
    description: '2025年新制度：従来の103万円から20万円引き上げ',
    effectiveDate: '2025-01-01',
    isNew: true,
    conditions: ['配偶者の年収が123万円以下', '納税者本人の年収が1195万円以下'],
    benefits: [
      '配偶者控除38万円（住民税33万円）',
      '社会保険料負担なし',
      '働く意欲向上支援',
    ],
  },
  {
    type: FuyouLimitType.FUYOU_150,
    amount: 1500000,
    name: '学生特例制度（150万円）',
    description: '2025年新制度：19-22歳学生向け特別控除',
    effectiveDate: '2025-01-01',
    isNew: true,
    targetAge: '19-22歳',
    conditions: [
      '19-22歳の学生',
      '大学・専門学校等在学中',
      '学業が本分であること',
    ],
    benefits: [
      '年収150万円まで扶養内',
      '学業支援控除10万円追加',
      '親の扶養控除48万円',
    ],
  },
];

export const Enhanced2025FuyouCard: React.FC<Enhanced2025FuyouCardProps> = ({
  onStatusUpdate,
  compactMode = false,
}) => {
  const { token, user } = useAuth();
  const [status, setStatus] = useState<FuyouStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [, setSelectedLimit] = useState<FuyouLimit2025 | null>(null);

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

      // 2025年制度に対応した扶養ステータス
      const enhanced2025Status: FuyouStatus = {
        currentYearIncome: calculation.currentIncome as number,
        currentMonthIncome: calculation.monthlyTarget as number,
        applicableLimits: FUYOU_LIMITS_2025.map(limit => ({
          type: limit.type,
          amount: limit.amount,
          name: limit.name,
          description: limit.description,
          effectiveDate: limit.effectiveDate,
        })),
        selectedLimit: {
          type:
            ((calculation.recommendedLimit as Record<string, unknown>)
              ?.type as FuyouLimitType) || 'fuyou_123',
          amount:
            ((calculation.recommendedLimit as Record<string, unknown>)
              ?.amount as number) || 1230000,
          name:
            ((calculation.recommendedLimit as Record<string, unknown>)
              ?.description as string) || '新・配偶者控除（123万円）',
          description:
            ((calculation.recommendedLimit as Record<string, unknown>)
              ?.description as string) ||
            '2025年新制度：従来の103万円から20万円引き上げ',
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

      setStatus(enhanced2025Status);
      onStatusUpdate?.(enhanced2025Status);
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

  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'error';
  };

  if (loading || error || !status) {
    return (
      <Card>
        <CardContent>
          {loading && <Typography>読み込み中...</Typography>}
          {error && <Alert severity="error">{error}</Alert>}
          {!status && (
            <Alert severity="info">扶養ステータスが取得できませんでした</Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  if (compactMode) {
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
            <Typography variant="h6">2025年扶養制度</Typography>
            <Chip
              icon={<FiberNew />}
              label="新制度"
              color="primary"
              size="small"
            />
          </Box>

          <LinearProgress
            variant="determinate"
            value={Math.min(status.percentageUsed, 100)}
            color={getProgressColor(status.percentageUsed)}
            sx={{ height: 8, borderRadius: 4, mb: 1 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">
              {formatCurrency(status.currentYearIncome)}
            </Typography>
            <Typography variant="caption">
              {formatCurrency(status.selectedLimit.amount)}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              2025年扶養制度対応ステータス
            </Typography>
            <Chip
              icon={<FiberNew />}
              label="2025年新制度"
              color="primary"
              variant="outlined"
            />
          </Box>

          {/* 現在の使用率 */}
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
                使用率（{status.selectedLimit.name}）
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
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}
            >
              <Typography variant="caption" color="text.secondary">
                現在: {formatCurrency(status.currentYearIncome)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                限度額: {formatCurrency(status.selectedLimit.amount)}
              </Typography>
            </Box>
          </Box>

          {/* 2025年制度の恩恵 */}
          <Alert severity="info" sx={{ mb: 2 }} icon={<Star />}>
            <Typography variant="body2" fontWeight="bold">
              2025年制度の恩恵
            </Typography>
            <Typography variant="caption">
              従来の103万円から123万円に引き上げ（+20万円）
              {user?.isStudent && (
                <>
                  <br />
                  学生特例で150万円まで扶養適用可能
                </>
              )}
            </Typography>
          </Alert>

          {/* 制度選択 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              適用可能制度
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {FUYOU_LIMITS_2025.map(limit => (
                <Chip
                  key={limit.type}
                  label={limit.name}
                  icon={
                    limit.isNew ? (
                      <FiberNew />
                    ) : limit.targetAge ? (
                      <School />
                    ) : (
                      <Business />
                    )
                  }
                  color={
                    status.selectedLimit.type === limit.type
                      ? 'primary'
                      : 'default'
                  }
                  variant={
                    status.selectedLimit.type === limit.type
                      ? 'filled'
                      : 'outlined'
                  }
                  size="small"
                  onClick={() => {
                    setSelectedLimit(limit);
                    setDetailsOpen(true);
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 重要な数値 */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
              mb: 2,
            }}
          >
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

          {/* 年間予測アラート */}
          {status.projectedYearIncome > status.selectedLimit.amount && (
            <Alert severity="warning" sx={{ mt: 2 }} icon={<TrendingUp />}>
              年間予測収入が限度額を超過する見込みです
              <br />
              予測: {formatCurrency(status.projectedYearIncome)}
            </Alert>
          )}

          {/* 詳細表示ボタン */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => setDetailsOpen(true)}
              startIcon={<Info />}
            >
              2025年制度詳細
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 制度詳細ダイアログ */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>2025年扶養制度詳細</DialogTitle>
        <DialogContent>
          {FUYOU_LIMITS_2025.map((limit, index) => (
            <Accordion key={limit.type} defaultExpanded={index === 1}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {limit.isNew && <FiberNew color="primary" />}
                  {limit.targetAge && <School color="secondary" />}
                  <Typography variant="h6">{limit.name}</Typography>
                  <Chip
                    label={formatCurrency(limit.amount)}
                    color="primary"
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  {limit.description}
                </Typography>

                {limit.targetAge && (
                  <Typography variant="caption" color="secondary" paragraph>
                    対象年齢: {limit.targetAge}
                  </Typography>
                )}

                {limit.conditions && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      適用条件
                    </Typography>
                    <List dense>
                      {limit.conditions.map((condition, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon>
                            <CheckCircle fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText primary={condition} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                {limit.benefits && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      制度メリット
                    </Typography>
                    <List dense>
                      {limit.benefits.map((benefit, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon>
                            <Star fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={benefit} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
