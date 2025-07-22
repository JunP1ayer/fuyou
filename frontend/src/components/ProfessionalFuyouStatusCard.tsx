import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Button,
  IconButton,
  Avatar,
  Paper,
  Grid,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  TrendingUp,
  School,
  AccountBalance,
  Lightbulb,
  ExpandMore,
  ExpandLess,
  Shield,
  MonetizationOn,
  Psychology,
  Timeline,
  Celebration,
} from '@mui/icons-material';
import type { FuyouStatus, FuyouLimit } from '../types/fuyou';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

// ユーザープロファイル拡張
interface UserProfile {
  isStudent: boolean;
  age?: number;
  university?: string;
  graduationYear?: number;
  preferredTaxStrategy?: 'conservative' | 'optimal' | 'aggressive';
}

// AIインサイト型定義
interface PredictiveInsight {
  type: 'opportunity' | 'warning' | 'optimization' | 'congratulations';
  priority: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  actionLabel?: string;
  actionCallback?: () => void;
  icon: React.ReactNode;
  color: 'success' | 'warning' | 'error' | 'info' | 'primary';
}

// 月間推奨収入計算
interface MonthlyRecommendation {
  conservative: number; // 安全マージン込み
  optimal: number; // 最適化
  aggressive: number; // 限度額ギリギリ
  socialInsuranceLimit: number; // 社会保険の壁
}

interface ProfessionalFuyouStatusCardProps {
  onStatusUpdate?: (status: FuyouStatus) => void;
  userProfile?: UserProfile;
  compact?: boolean;
}

export const ProfessionalFuyouStatusCard: React.FC<
  ProfessionalFuyouStatusCardProps
> = ({
  onStatusUpdate,
  userProfile = { isStudent: false },
  compact = false,
}) => {
  const theme = useTheme();
  const { token } = useAuth();

  // 状態管理
  const [status, setStatus] = useState<FuyouStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInsights, setExpandedInsights] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<
    'conservative' | 'optimal' | 'aggressive'
  >(userProfile.preferredTaxStrategy || 'optimal');

  // 2025年制度に基づく制度選択ロジック
  const getOptimalTaxScheme = useCallback(
    (income: number, profile: UserProfile): FuyouLimit => {
      // 学生判定（19-23歳の範囲で学生フラグがある場合）
      if (
        profile.isStudent &&
        profile.age &&
        profile.age >= 19 &&
        profile.age <= 23
      ) {
        return {
          type: 'student_dependent',
          amount: 1500000,
          name: '🎓 学生特例制度（150万円）',
          description: '2025年新制度：大学生なら150万円まで扶養控除適用！',
          effectiveDate: '2025-01-01',
        };
      }

      // 一般的な2025年新基準
      if (income <= 1230000) {
        return {
          type: 'basic_dependent',
          amount: 1230000,
          name: '✨ 新・扶養控除（123万円）',
          description: '2025年改正：従来より20万円アップ！',
          effectiveDate: '2025-01-01',
        };
      }

      // フォールバック
      return {
        type: 'fuyou_103',
        amount: 1030000,
        name: '従来制度（103万円）',
        description: '従来の扶養控除制度',
        effectiveDate: '2025-01-01',
      };
    },
    []
  );

  // 月間推奨収入計算
  const calculateMonthlyRecommendations = useCallback(
    (
      currentIncome: number,
      limit: number,
      currentMonth: number
    ): MonthlyRecommendation => {
      const remainingMonths = 12 - currentMonth;
      const remainingCapacity = Math.max(0, limit - currentIncome);

      return {
        conservative: (remainingCapacity * 0.7) / remainingMonths, // 30%安全マージン
        optimal: (remainingCapacity * 0.85) / remainingMonths, // 15%安全マージン
        aggressive: (remainingCapacity * 0.95) / remainingMonths, // 5%安全マージン
        socialInsuranceLimit:
          Math.min(remainingCapacity, 1300000 - currentIncome) /
          remainingMonths,
      };
    },
    []
  );

  // AIインサイト生成（Google的な先読み分析）
  const generatePredictiveInsights = useCallback(
    (
      status: FuyouStatus,
      profile: UserProfile,
      recommendations: MonthlyRecommendation
    ): PredictiveInsight[] => {
      const insights: PredictiveInsight[] = [];
      const currentMonth = new Date().getMonth() + 1;
      const usageRate = status.percentageUsed;

      // 🎉 成功・安全パターン
      if (usageRate < 50 && status.riskLevel === 'safe') {
        insights.push({
          type: 'congratulations',
          priority: 'low',
          title: '🎉 順調なペースです！',
          message: `現在${usageRate.toFixed(1)}%の利用率で、とても安全な範囲です。`,
          icon: <Celebration />,
          color: 'success',
        });
      }

      // 🎓 学生特典アピール
      if (profile.isStudent && status.selectedLimit.amount < 1500000) {
        insights.push({
          type: 'opportunity',
          priority: 'high',
          title: '🎓 学生なら150万円まで安全！',
          message:
            '2025年新制度で、大学生は年収150万円まで扶養控除が適用されます。',
          actionLabel: '学生制度に切替',
          icon: <School />,
          color: 'primary',
        });
      }

      // ⚠️ 社会保険の壁警告
      if (
        status.currentYearIncome > 1200000 &&
        status.selectedLimit.amount > 1300000
      ) {
        insights.push({
          type: 'warning',
          priority: 'high',
          title: '⚠️ 130万円の壁にご注意',
          message:
            '税金は150万円まで安全ですが、健康保険料は130万円から発生します。',
          icon: <Shield />,
          color: 'warning',
        });
      }

      // 💡 最適化提案
      if (usageRate > 70 && currentMonth <= 10) {
        const monthlyTarget = recommendations.optimal;
        insights.push({
          type: 'optimization',
          priority: 'medium',
          title: '💡 収入ペース調整のご提案',
          message: `残り${12 - currentMonth}ヶ月で月${formatCurrency(monthlyTarget)}以下に抑えると安全です。`,
          icon: <Psychology />,
          color: 'info',
        });
      }

      // 🔮 年末予測警告
      if (status.projectedYearIncome > status.selectedLimit.amount) {
        const overageAmount =
          status.projectedYearIncome - status.selectedLimit.amount;
        insights.push({
          type: 'warning',
          priority: 'high',
          title: '🔮 年末超過予測',
          message: `現在のペースだと年末に約${formatCurrency(overageAmount)}超過する見込みです。`,
          icon: <Timeline />,
          color: 'error',
        });
      }

      return insights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    },
    []
  );

  // データ取得
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

      if (!response.success) {
        throw new Error('扶養ステータスの取得に失敗しました');
      }

      const calculation = (response.data as Record<string, unknown>) || {};

      // 2025年制度対応の最適化
      const currentIncome = (calculation.currentIncome as number) || 0;
      const optimalLimit = getOptimalTaxScheme(currentIncome, userProfile);

      const fuyouStatus: FuyouStatus = {
        currentYearIncome: currentIncome,
        currentMonthIncome: (calculation.monthlyTarget as number) || 0,
        applicableLimits: [optimalLimit], // 最適化された制度を提案
        selectedLimit: optimalLimit,
        remainingCapacity: Math.max(0, optimalLimit.amount - currentIncome),
        percentageUsed: (currentIncome / optimalLimit.amount) * 100,
        monthlyAverage: (calculation.monthlyTarget as number) || 0,
        monthlyTargetIncome: (calculation.monthlyTarget as number) || 0,
        projectedYearIncome:
          (calculation.projectedYearEndIncome as number) || currentIncome,
        riskLevel:
          currentIncome > optimalLimit.amount * 0.9
            ? 'warning'
            : currentIncome > optimalLimit.amount * 0.7
              ? 'warning'
              : 'safe',
        isOverLimit: currentIncome > optimalLimit.amount,
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
  }, [token, onStatusUpdate, getOptimalTaxScheme, userProfile]);

  useEffect(() => {
    fetchFuyouStatus();
  }, [fetchFuyouStatus]);

  // ヘルパー関数
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
        return <CheckCircle />;
      case 'warning':
        return <Warning />;
      case 'danger':
        return <ErrorIcon />;
      default:
        return <CheckCircle />;
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

  const getProgressColor = (
    percentage: number
  ): 'success' | 'warning' | 'error' => {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'error';
  };

  // ローディング状態
  if (loading) {
    return (
      <Card elevation={compact ? 1 : 3}>
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

  // エラー状態
  if (error) {
    return (
      <Card elevation={compact ? 1 : 3}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  // データ無し状態
  if (!status) {
    return (
      <Card elevation={compact ? 1 : 3}>
        <CardContent>
          <Alert severity="info">扶養ステータスが取得できませんでした</Alert>
        </CardContent>
      </Card>
    );
  }

  // メイン計算
  const currentMonth = new Date().getMonth() + 1;
  const monthlyRecommendations = calculateMonthlyRecommendations(
    status.currentYearIncome,
    status.selectedLimit.amount,
    currentMonth
  );
  const insights = generatePredictiveInsights(
    status,
    userProfile,
    monthlyRecommendations
  );

  // メインレンダリング
  return (
    <Card
      elevation={compact ? 1 : 3}
      sx={{
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.1)}, ${alpha(theme.palette.background.paper, 0.9)})`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)}, ${theme.palette.background.paper})`,
        overflow: 'visible',
      }}
    >
      <CardContent sx={{ pb: compact ? 2 : 3 }}>
        {/* ヘッダー部分 - Google Material Design 3風 */}
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar
            sx={{
              bgcolor:
                getRiskColor(status.riskLevel) === 'success'
                  ? theme.palette.success.main
                  : getRiskColor(status.riskLevel) === 'warning'
                    ? theme.palette.warning.main
                    : theme.palette.error.main,
              width: 48,
              height: 48,
              mr: 2,
            }}
          >
            {userProfile.isStudent ? <School /> : <AccountBalance />}
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h5"
              component="div"
              fontWeight="bold"
              gutterBottom
            >
              扶養ステータス
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {status.selectedLimit.name}
            </Typography>
          </Box>

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
            size="medium"
            sx={{
              fontWeight: 'bold',
              fontSize: '1.1rem',
              '& .MuiChip-icon': { fontSize: '1.2rem' },
            }}
          />
        </Box>

        {/* メイン数値表示 - 大きく見やすく */}
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Box textAlign="center" mb={2}>
            <Typography
              variant="h3"
              component="div"
              fontWeight="bold"
              color="primary"
            >
              {formatCurrency(status.remainingCapacity)}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              残り利用可能額
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={Math.min(status.percentageUsed, 100)}
            color={getProgressColor(status.percentageUsed)}
            sx={{
              height: 12,
              borderRadius: 6,
              mb: 1,
              '& .MuiLinearProgress-bar': {
                borderRadius: 6,
              },
            }}
          />

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              使用率 {status.percentageUsed.toFixed(1)}%
            </Typography>
            <Typography variant="caption" fontWeight="bold">
              {formatCurrency(status.currentYearIncome)} /{' '}
              {formatCurrency(status.selectedLimit.amount)}
            </Typography>
          </Box>
        </Paper>

        {!compact && (
          <>
            {/* AIインサイト表示 */}
            {insights.length > 0 && (
              <Box mb={3}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Lightbulb
                    sx={{ mr: 1, color: theme.palette.primary.main }}
                  />
                  <Typography variant="h6" fontWeight="bold">
                    AIアドバイス
                  </Typography>
                  <IconButton
                    onClick={() => setExpandedInsights(!expandedInsights)}
                    size="small"
                    sx={{ ml: 'auto' }}
                  >
                    {expandedInsights ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>

                <Stack spacing={1}>
                  {insights
                    .slice(0, expandedInsights ? insights.length : 2)
                    .map((insight, index) => (
                      <Alert
                        key={index}
                        severity={
                          insight.color === 'primary' ? 'info' : insight.color
                        }
                        icon={insight.icon}
                        action={
                          insight.actionLabel ? (
                            <Button color="inherit" size="small">
                              {insight.actionLabel}
                            </Button>
                          ) : undefined
                        }
                        sx={{
                          borderRadius: 2,
                          '& .MuiAlert-message': {
                            alignItems: 'center',
                          },
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          gutterBottom
                        >
                          {insight.title}
                        </Typography>
                        <Typography variant="body2">
                          {insight.message}
                        </Typography>
                      </Alert>
                    ))}
                </Stack>

                {insights.length > 2 && !expandedInsights && (
                  <Button
                    variant="text"
                    onClick={() => setExpandedInsights(true)}
                    sx={{ mt: 1 }}
                    fullWidth
                  >
                    さらに {insights.length - 2} 件のアドバイスを表示
                  </Button>
                )}
              </Box>
            )}

            {/* 月間戦略選択 */}
            <Box mb={3}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📊 月間収入戦略
              </Typography>

              <Grid container spacing={2}>
                {[
                  {
                    key: 'conservative',
                    label: '安全重視',
                    amount: monthlyRecommendations.conservative,
                    description: '30%安全マージン',
                    icon: <Shield />,
                    color: 'success',
                  },
                  {
                    key: 'optimal',
                    label: '最適化',
                    amount: monthlyRecommendations.optimal,
                    description: '15%安全マージン',
                    icon: <Psychology />,
                    color: 'primary',
                  },
                  {
                    key: 'aggressive',
                    label: '限界追求',
                    amount: monthlyRecommendations.aggressive,
                    description: '5%安全マージン',
                    icon: <TrendingUp />,
                    color: 'warning',
                  },
                ].map(strategy => (
                  <Grid item xs={4} key={strategy.key}>
                    <Paper
                      elevation={selectedStrategy === strategy.key ? 3 : 1}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border:
                          selectedStrategy === strategy.key
                            ? `2px solid ${
                                strategy.color === 'success'
                                  ? theme.palette.success.main
                                  : strategy.color === 'warning'
                                    ? theme.palette.warning.main
                                    : theme.palette.primary.main
                              }`
                            : 'none',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          elevation: 2,
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() =>
                        setSelectedStrategy(
                          strategy.key as
                            | 'conservative'
                            | 'optimal'
                            | 'aggressive'
                        )
                      }
                    >
                      <Avatar
                        sx={{
                          bgcolor:
                            strategy.color === 'success'
                              ? theme.palette.success.main
                              : strategy.color === 'warning'
                                ? theme.palette.warning.main
                                : theme.palette.primary.main,
                          mx: 'auto',
                          mb: 1,
                          width: 32,
                          height: 32,
                        }}
                      >
                        {strategy.icon}
                      </Avatar>
                      <Typography
                        variant="caption"
                        display="block"
                        fontWeight="bold"
                      >
                        {strategy.label}
                      </Typography>
                      <Typography
                        variant="h6"
                        color="primary"
                        fontWeight="bold"
                      >
                        {formatCurrency(strategy.amount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {strategy.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* 詳細統計（Google Analytics風） */}
            <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📈 詳細統計
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <MonetizationOn
                      color="primary"
                      sx={{ fontSize: 32, mb: 1 }}
                    />
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(status.monthlyAverage)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      月平均収入
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Timeline color="secondary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(status.projectedYearIncome)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      年末予測収入
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </>
        )}

        {/* 2025年制度説明（学生向け特別表示） */}
        {userProfile.isStudent &&
          status.selectedLimit.type === 'student_dependent' && (
            <Alert severity="success" sx={{ mt: 2 }} icon={<School />}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                🎉 学生特例制度が適用されています
              </Typography>
              <Typography variant="body2">
                2025年新制度により、大学生は年収150万円まで扶養控除が適用されます。
                ただし、健康保険料は130万円から発生するのでご注意ください。
              </Typography>
            </Alert>
          )}
      </CardContent>
    </Card>
  );
};
