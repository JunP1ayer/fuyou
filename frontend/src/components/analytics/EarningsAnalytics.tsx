// 📊 収入分析ダッシュボード

import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Paper,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  WorkOutline,
  AccountBalanceWallet,
  Schedule,
  Warning,
  CheckCircle,
  PieChart,
  BarChart,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSimpleShiftStore } from '../../store/simpleShiftStore';
import useI18n from '../../hooks/useI18n';
import { getCountryLimits } from '../../lib/rules/provider';

export const EarningsAnalytics: React.FC = () => {
  const { shifts, workplaces } = useSimpleShiftStore();
  const { t, country, formatCurrency, formatDate } = useI18n();
  
  // 分析データ計算
  const analytics = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // 年間収入
    const yearlyShifts = shifts.filter(shift => 
      new Date(shift.date).getFullYear() === currentYear
    );
    const yearlyEarnings = yearlyShifts.reduce((sum, shift) => sum + shift.totalEarnings, 0);
    
    // 今月収入
    const monthlyShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate.getFullYear() === currentYear && shiftDate.getMonth() === currentMonth;
    });
    const monthlyEarnings = monthlyShifts.reduce((sum, shift) => sum + shift.totalEarnings, 0);
    
    // バイト先別統計
    const workplaceStats = workplaces.map(workplace => {
      const workplaceShifts = shifts.filter(shift => shift.workplaceName === workplace.name);
      return {
        id: workplace.id,
        name: workplace.name,
        color: workplace.color,
        shiftsCount: workplaceShifts.length,
        totalEarnings: workplaceShifts.reduce((sum, shift) => sum + shift.totalEarnings, 0),
        totalHours: workplaceShifts.reduce((sum, shift) => sum + (Number(shift.totalEarnings) / Math.max(1, workplace.defaultHourlyRate)), 0),
        avgHourlyRate: workplace.defaultHourlyRate,
      };
    }).sort((a, b) => b.totalEarnings - a.totalEarnings);

    // 月別推移（過去6ヶ月）
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - i, 1);
      const monthShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate.getFullYear() === targetDate.getFullYear() && 
               shiftDate.getMonth() === targetDate.getMonth();
      });
      monthlyTrends.push({
        month: formatDate(targetDate, { year: 'numeric', month: 'short' }),
        earnings: monthShifts.reduce((sum, shift) => sum + shift.totalEarnings, 0),
        hours: monthShifts.reduce((sum, shift) => sum + (shift.totalEarnings / Math.max(1, shift.hourlyRate)), 0),
        shiftsCount: monthShifts.length,
      });
    }

    // 扶養限度額情報
    const limits = getCountryLimits(country);
    const remainingAmount = limits.taxAnnual - yearlyEarnings;
    const progressPercentage = (yearlyEarnings / limits.taxAnnual) * 100;
    const riskLevel = progressPercentage > 95 ? 'danger' : progressPercentage > 80 ? 'warning' : 'safe';

    return {
      yearlyEarnings,
      monthlyEarnings,
      workplaceStats,
      monthlyTrends,
      limits,
      remainingAmount,
      progressPercentage,
      riskLevel,
      totalShifts: shifts.length,
      totalWorkplaces: workplaces.length,
      avgMonthlyEarnings: monthlyTrends.reduce((sum, m) => sum + m.earnings, 0) / 6,
    };
  }, [shifts, workplaces, country]);

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
        📊 {t('analytics.title', '収入分析ダッシュボード')}
      </Typography>

      {/* サマリーカード */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <AccountBalanceWallet sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {formatCurrency(analytics.yearlyEarnings)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {t('analytics.yearlyIncome', '年間収入')}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={6} md={3}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {formatCurrency(analytics.monthlyEarnings)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {t('dashboard.monthlyEarnings', '今月収入')}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={6} md={3}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {analytics.totalShifts}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {t('dashboard.totalShifts', '総シフト数')}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={6} md={3}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <WorkOutline sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {analytics.totalWorkplaces}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {t('dashboard.workplaces', 'バイト先')}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* 扶養限度額進捗 */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {analytics.riskLevel === 'safe' ? <CheckCircle color="success" sx={{ mr: 1 }} /> :
               analytics.riskLevel === 'warning' ? <Warning color="warning" sx={{ mr: 1 }} /> :
               <Warning color="error" sx={{ mr: 1 }} />}
              <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                {t('analytics.dependencyProgress', '扶養限度額進捗')}
              </Typography>
              <Chip 
                label={`${analytics.progressPercentage.toFixed(1)}%`}
                color={analytics.riskLevel === 'safe' ? 'success' : analytics.riskLevel === 'warning' ? 'warning' : 'error'}
              />
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={Math.min(analytics.progressPercentage, 100)}
              sx={{
                height: 12,
                borderRadius: 6,
                mb: 2,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 6,
                  backgroundColor: 
                    analytics.riskLevel === 'safe' ? '#4caf50' :
                    analytics.riskLevel === 'warning' ? '#ff9800' : '#f44336',
                }
              }}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">{t('dashboard.yearlyEarnings', '現在収入')}</Typography>
                <Typography variant="h6">{formatCurrency(analytics.yearlyEarnings)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">{t('dashboard.dependencyLimit', '限度額')}</Typography>
                <Typography variant="h6">{formatCurrency(analytics.limits.taxAnnual)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  {analytics.remainingAmount > 0 ? t('dashboard.remainingAmount', '残り可能額') : t('dashboard.exceededAmount', '超過額')}
                </Typography>
                <Typography 
                  variant="h6" 
                  color={analytics.remainingAmount > 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(Math.abs(analytics.remainingAmount))}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      <Grid container spacing={3}>
        {/* バイト先別統計 */}
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                  <PieChart sx={{ mr: 1 }} />
                  {t('analytics.workplaceBreakdown', 'バイト先別収入')}
                </Typography>
                
                {analytics.workplaceStats.length === 0 ? (
                  <Alert severity="info">
                    {t('workplace.noData', 'バイト先データがありません')}
                  </Alert>
                ) : (
                  <List dense>
                    {analytics.workplaceStats.slice(0, 5).map((workplace, index) => {
                      const percentage = analytics.yearlyEarnings > 0 
                        ? (workplace.totalEarnings / analytics.yearlyEarnings) * 100 
                        : 0;
                      return (
                        <ListItem key={workplace.id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: workplace.color,
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {workplace.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {percentage.toFixed(1)}%
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {formatCurrency(workplace.totalEarnings)} ({workplace.shiftsCount}回)
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={percentage}
                                  sx={{
                                    mt: 0.5,
                                    height: 4,
                                    borderRadius: 2,
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: workplace.color,
                                    }
                                  }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* 月別推移 */}
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                  <BarChart sx={{ mr: 1 }} />
                  {t('analytics.monthlyTrend', '月別収入推移')}
                </Typography>
                
                <Box sx={{ height: 320, overflowY: 'auto' }}>
                  {analytics.monthlyTrends.map((trend, index) => {
                    const maxEarnings = Math.max(...analytics.monthlyTrends.map(t => t.earnings));
                    const percentage = maxEarnings > 0 ? (trend.earnings / maxEarnings) * 100 : 0;
                    
                    return (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {trend.month}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {formatCurrency(trend.earnings)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                            }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {trend.shiftsCount}回 • {trend.hours.toFixed(1)}{t('calendar.workHours', '時間')}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};