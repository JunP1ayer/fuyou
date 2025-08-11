// 💰 シフトボード風給料管理コンポーネント

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider,
  Alert,
  Button,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  Schedule,
  Warning,
  CheckCircle,
  Business,
  CalendarMonth,
  Analytics,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  WALL_LABEL,
  getAnnualLimitByWall,
  type WallKey,
} from '../lib/fuyou/config';
import { useSimpleShiftStore } from '../store/simpleShiftStore';
import useI18nStore from '../store/i18nStore';
import { formatCurrency } from '../utils/calculations';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ShiftboardSalaryManager: React.FC = () => {
  const { shifts, workplaces, getTotalEarnings } = useSimpleShiftStore();
  const { language, country } = useI18nStore();
  const [tabValue, setTabValue] = useState(0);
  const [wall, setWall] = useState<WallKey>('tax');
  const navigate = useNavigate();

  // 年間扶養限度額（選択式）
  const FUYOU_LIMIT = getAnnualLimitByWall(wall);
  const totalEarnings = getTotalEarnings();
  const remainingAmount = FUYOU_LIMIT - totalEarnings;
  const fuyouProgress = Math.min((totalEarnings / FUYOU_LIMIT) * 100, 100);

  // 月別収入データ
  const getMonthlyEarnings = () => {
    const monthlyData: { [key: string]: number } = {};
    shifts.forEach(shift => {
      const date = new Date(shift.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyData[monthKey] =
        (monthlyData[monthKey] || 0) + shift.totalEarnings;
    });
    return monthlyData;
  };

  // バイト先別収入データ
  const getWorkplaceEarnings = () => {
    const workplaceData: {
      [key: string]: { earnings: number; shifts: number; color: string };
    } = {};

    shifts.forEach(shift => {
      const workplace = workplaces.find(w => w.name === shift.workplaceName);
      if (!workplaceData[shift.workplaceName]) {
        workplaceData[shift.workplaceName] = {
          earnings: 0,
          shifts: 0,
          color: workplace?.color || '#4caf50',
        };
      }
      workplaceData[shift.workplaceName].earnings += shift.totalEarnings;
      workplaceData[shift.workplaceName].shifts += 1;
    });

    return Object.entries(workplaceData)
      .map(([name, data]) => ({
        name,
        ...data,
      }))
      .sort((a, b) => b.earnings - a.earnings);
  };

  const monthlyEarnings = getMonthlyEarnings();
  const workplaceEarnings = getWorkplaceEarnings();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthEarnings = monthlyEarnings[currentMonth] || 0;

  // 扶養リスクレベル
  const getRiskLevel = () => {
    if (fuyouProgress < 60)
      return { level: 'low', color: 'success', label: '安全' };
    if (fuyouProgress < 85)
      return { level: 'medium', color: 'warning', label: '注意' };
    return { level: 'high', color: 'error', label: '危険' };
  };

  const riskLevel = getRiskLevel();

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
      {/* メインダッシュボード */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              {formatCurrency(totalEarnings)}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              今年の収入
            </Typography>
            {/* 壁セレクター */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={wall}
                onChange={(_, v) => v && setWall(v)}
              >
                <ToggleButton value="tax">{WALL_LABEL.tax}</ToggleButton>
                <ToggleButton value="hifu130">
                  {WALL_LABEL.hifu130}
                </ToggleButton>
                <ToggleButton value="shaho106">
                  {WALL_LABEL.shaho106}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ maxWidth: 400, mx: 'auto', mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={fuyouProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor:
                      riskLevel.color === 'error'
                        ? '#f44336'
                        : riskLevel.color === 'warning'
                          ? '#ff9800'
                          : '#4caf50',
                    borderRadius: 4,
                  },
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary">
              壁まで残り {formatCurrency(Math.max(0, remainingAmount))}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={() => navigate('/wizard')}>
                税金・保険料のチェックをする
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {shifts.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  シフト数
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {formatCurrency(thisMonthEarnings)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  今月
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {formatCurrency(shifts.length > 0 ? Math.round(totalEarnings / shifts.length) : 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  平均/日
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {workplaceEarnings.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  勤務先
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 詳細データ */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
          >
            <Tab label="バイト先別" />
            <Tab label="月別" />
            <Tab label="履歴" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            {workplaceEarnings.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {workplaceEarnings.map(workplace => (
                  <Box
                    key={workplace.name}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: workplace.color,
                          mr: 2,
                        }}
                      />
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600 }}
                        >
                          {workplace.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {workplace.shifts}回
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {formatCurrency(workplace.earnings)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', py: 4 }}
              >
                データなし
              </Typography>
            )}
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CardContent>
            {Object.keys(monthlyEarnings).length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(monthlyEarnings)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([month, earnings]) => {
                    const [year, monthNum] = month.split('-');
                    return (
                      <Box
                        key={month}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 2,
                          px: 1,
                        }}
                      >
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {parseInt(monthNum)}月
                          </Typography>
                          {month === currentMonth && (
                            <Typography variant="caption" color="primary.main">
                              今月
                            </Typography>
                          )}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {formatCurrency(earnings)}
                        </Typography>
                      </Box>
                    );
                  })}
              </Box>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', py: 4 }}
              >
                データなし
              </Typography>
            )}
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CardContent>
            {shifts.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {shifts
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .slice(0, 10)
                  .map(shift => {
                    const workplace = workplaces.find(
                      w => w.name === shift.workplaceName
                    );
                    return (
                      <Box
                        key={shift.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 2,
                          px: 1,
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {new Date(shift.date).toLocaleDateString(language, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: workplace?.color || '#4caf50',
                                mr: 1,
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {shift.workplaceName}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {formatCurrency(shift.totalEarnings)}
                        </Typography>
                      </Box>
                    );
                  })}
              </Box>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', py: 4 }}
              >
                データなし
              </Typography>
            )}
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
};
