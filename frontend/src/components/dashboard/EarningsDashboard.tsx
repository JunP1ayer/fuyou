// 📊 FUYOU PRO - 収入ダッシュボード

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  Grid,
  useTheme,
  alpha,
  Button,
  IconButton,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Schedule,
  Payment,
  Analytics,
  School,
  Refresh,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { useUnifiedStore } from '../../store/unifiedStore';
import { formatCurrency } from '@/utils/calculations';

// 2025年扶養限度額
const FUYOU_LIMITS = {
  BASIC: 1030000, // 基本扶養控除
  STUDENT_SPECIAL: 1500000, // 学生特例（2025年新制度）
  SOCIAL_INSURANCE: 1300000, // 社会保険の壁
};

type RiskLevel = 'safe' | 'warning' | 'danger';

export const EarningsDashboard: React.FC = () => {
  const theme = useTheme();
  const { shifts, getTotalEarningsForMonth, getTotalEarningsForYear } = useUnifiedStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // 年間収入を計算
  const yearlyStats = useMemo(() => {
    const yearlyEarnings = Array.from({ length: 12 }, (_, month) =>
      getTotalEarningsForMonth(selectedYear, month + 1)
    );

    const totalEarnings = yearlyEarnings.reduce(
      (sum, earnings) => sum + earnings,
      0
    );
    const currentMonth = new Date().getMonth();
    const monthlyAverage = totalEarnings / (currentMonth + 1);

    // 年末予測
    const projectedYearlyEarnings =
      totalEarnings + monthlyAverage * (11 - currentMonth);

    return {
      totalEarnings,
      yearlyEarnings,
      monthlyAverage,
      projectedYearlyEarnings,
    };
  }, [selectedYear, shifts, getTotalEarningsForMonth]);

  // リスクレベルを判定
  const riskAssessment = useMemo(() => {
    const { totalEarnings, projectedYearlyEarnings } = yearlyStats;
    const studentLimit = FUYOU_LIMITS.STUDENT_SPECIAL;
    const socialInsuranceLimit = FUYOU_LIMITS.SOCIAL_INSURANCE;

    let level: RiskLevel = 'safe';
    let message = '';
    let remainingAmount = 0;

    if (projectedYearlyEarnings >= studentLimit) {
      level = 'danger';
      message = '🚨 学生特例を超過する可能性があります！';
      remainingAmount = studentLimit - totalEarnings;
    } else if (projectedYearlyEarnings >= socialInsuranceLimit) {
      level = 'warning';
      message = '⚠️ 社会保険の壁（130万円）を超える可能性があります';
      remainingAmount = socialInsuranceLimit - totalEarnings;
    } else if (projectedYearlyEarnings >= studentLimit * 0.8) {
      level = 'warning';
      message = '💡 扶養限度額の80%に近づいています';
      remainingAmount = studentLimit - totalEarnings;
    } else {
      level = 'safe';
      message = '✅ 扶養控除内で安全に稼働中です';
      remainingAmount = studentLimit - totalEarnings;
    }

    return {
      level,
      message,
      remainingAmount: Math.max(0, remainingAmount),
      progressPercentage: (totalEarnings / studentLimit) * 100,
    };
  }, [yearlyStats]);

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'safe':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'danger':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const getProgressColor = (level: RiskLevel) => {
    switch (level) {
      case 'safe':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, height: '100%' }}>
      {/* ヘッダー */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          📊 収入ダッシュボード
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            size="small"
            onClick={() => window.location.reload()}
            sx={{ borderRadius: 2 }}
          >
            更新
          </Button>
        </Box>
      </Box>

      {/* メイン統計カード */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 今年の総収入 */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white',
                height: '100%',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Payment sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedYear}年 総収入
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {formatCurrency(yearlyStats.totalEarnings)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  月平均{' '}
                  {formatCurrency(Math.round(yearlyStats.monthlyAverage))}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* 扶養限度額の進捗 */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <School sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    学生特例進捗
                  </Typography>
                  <Chip
                    label={`${Math.round(riskAssessment.progressPercentage)}%`}
                    color={getProgressColor(riskAssessment.level)}
                    size="small"
                    sx={{ ml: 'auto', fontWeight: 600 }}
                  />
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={Math.min(riskAssessment.progressPercentage, 100)}
                  color={getProgressColor(riskAssessment.level)}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    mb: 2,
                  }}
                />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    限度額: {formatCurrency(FUYOU_LIMITS.STUDENT_SPECIAL)}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: getRiskColor(riskAssessment.level),
                    }}
                  >
                    残り {formatCurrency(riskAssessment.remainingAmount)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* リスクアラート */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Alert
          severity={
            riskAssessment.level === 'safe'
              ? 'success'
              : riskAssessment.level === 'warning'
                ? 'warning'
                : 'error'
          }
          icon={
            riskAssessment.level === 'safe' ? (
              <CheckCircle />
            ) : riskAssessment.level === 'warning' ? (
              <Warning />
            ) : (
              <TrendingUp />
            )
          }
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {riskAssessment.message}
          </Typography>
        </Alert>
      </motion.div>

      {/* 詳細統計 */}
      <Grid container spacing={3}>
        {/* 月別収入グラフ */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  📈 月別収入推移
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {yearlyStats.yearlyEarnings.map((earnings, month) => {
                    const monthName = format(
                      new Date(selectedYear, month, 1),
                      'M月',
                      { locale: ja }
                    );
                    const maxEarnings = Math.max(...yearlyStats.yearlyEarnings);
                    const percentage =
                      maxEarnings > 0 ? (earnings / maxEarnings) * 100 : 0;

                    return (
                      <Box
                        key={month}
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            minWidth: 40,
                            fontWeight: 600,
                            color: 'text.secondary',
                          }}
                        >
                          {monthName}
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.1
                              ),
                              '& .MuiLinearProgress-bar': {
                                backgroundColor:
                                  earnings > 0
                                    ? theme.palette.primary.main
                                    : 'transparent',
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            minWidth: 80,
                            textAlign: 'right',
                            fontWeight: 600,
                          }}
                        >
                          {formatCurrency(earnings).replace('￥', '¥')}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* 重要な数値 */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  🎯 重要指標
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* 年末予測 */}
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      年末予測収入
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(
                        Math.round(yearlyStats.projectedYearlyEarnings)
                      )}
                    </Typography>
                  </Box>

                  <Divider />

                  {/* 社会保険の壁 */}
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      社会保険の壁まで
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color:
                          yearlyStats.totalEarnings >=
                          FUYOU_LIMITS.SOCIAL_INSURANCE
                            ? 'error.main'
                            : 'success.main',
                      }}
                    >
                      {formatCurrency(
                        Math.max(
                          0,
                          FUYOU_LIMITS.SOCIAL_INSURANCE -
                            yearlyStats.totalEarnings
                        )
                      )}
                    </Typography>
                  </Box>

                  <Divider />

                  {/* 今月の収入 */}
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      今月の収入
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(
                        getTotalEarningsForMonth(
                          selectedYear,
                          new Date().getMonth() + 1
                        )
                      )}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};
