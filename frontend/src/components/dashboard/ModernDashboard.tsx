/**
 * Material Design 3準拠の現代的なダッシュボードコンポーネント
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Avatar,
  LinearProgress,
  Divider,
  useTheme,
  useMediaQuery,
  Fab,
  Backdrop,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  Schedule,
  Warning,
  CheckCircle,
  Add,
  Edit,
  Analytics,
  Notifications,
  Settings,
  Upload,
  Camera,
  PersonAdd,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { TouchButton, TouchCard } from '../common/TouchOptimized';
import { useSimpleShiftStore } from '../../store/simpleShiftStore';

// アニメーション設定
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// ダッシュボードカードのインターフェース
interface DashboardCard {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

// 統計カードコンポーネント
const StatCard: React.FC<{ card: DashboardCard; index: number }> = ({ card, index }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay: index * 0.1 }}
    >
      <TouchCard
        interactive
        onClick={card.action?.onClick}
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${theme.palette[card.color].light}20 0%, ${theme.palette[card.color].main}10 100%)`,
          border: `1px solid ${theme.palette[card.color].main}30`,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                {card.title}
              </Typography>
              <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 700, color: `${card.color}.main` }}>
                {card.value}
              </Typography>
            </Box>
            <Avatar
              sx={{
                backgroundColor: `${card.color}.main`,
                color: `${card.color}.contrastText`,
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
              }}
            >
              {card.icon}
            </Avatar>
          </Box>

          {card.change && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {card.change.type === 'increase' && <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />}
              {card.change.type === 'decrease' && <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />}
              <Typography
                variant="caption"
                sx={{
                  color: card.change.type === 'increase' ? 'success.main' : card.change.type === 'decrease' ? 'error.main' : 'text.secondary',
                  fontWeight: 600,
                }}
              >
                {card.change.type === 'increase' && '+'}
                {card.change.value}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                vs {card.change.period}
              </Typography>
            </Box>
          )}

          {card.action && (
            <Button
              size="small"
              sx={{
                mt: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
              onClick={(e) => {
                e.stopPropagation();
                card.action!.onClick();
              }}
            >
              {card.action.label}
            </Button>
          )}
        </CardContent>
      </TouchCard>
    </motion.div>
  );
};

// プログレスカードコンポーネント
const ProgressCard: React.FC<{
  title: string;
  current: number;
  total: number;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  suffix?: string;
}> = ({ title, current, total, color, suffix = '' }) => {
  const percentage = Math.min((current / total) * 100, 100);
  
  return (
    <motion.div variants={fadeInUp}>
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {title}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: `${color}.main` }}>
                {current.toLocaleString()}{suffix}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                / {total.toLocaleString()}{suffix}
              </Typography>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={percentage}
              color={color}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: `${color}.lighter`,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              進捗率: {percentage.toFixed(1)}%
            </Typography>
            
            {percentage >= 90 && (
              <Chip
                label="目標達成間近"
                size="small"
                color="warning"
                icon={<Warning />}
              />
            )}
            
            {percentage >= 100 && (
              <Chip
                label="目標達成"
                size="small"
                color="success"
                icon={<CheckCircle />}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// 最新アクティビティコンポーネント
const RecentActivity: React.FC = () => {
  const { shifts } = useSimpleShiftStore();
  
  const recentShifts = useMemo(() => {
    return shifts
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [shifts]);

  return (
    <motion.div variants={fadeInUp}>
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            最新のシフト
          </Typography>
          
          <Box>
            {recentShifts.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                まだシフトが登録されていません
              </Typography>
            ) : (
              recentShifts.map((shift, index) => (
                <Box key={shift.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: 'primary.light',
                        mr: 2,
                        fontSize: '0.875rem',
                      }}
                    >
                      <Schedule />
                    </Avatar>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                        {shift.workplaceName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(shift.date).toLocaleDateString('ja-JP')} {shift.startTime} - {shift.endTime}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      ¥{shift.totalEarnings.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  {index < recentShifts.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// スピードダイアルアクション
const SpeedDialActions: React.FC = () => {
  const [open, setOpen] = useState(false);

  const actions = [
    { icon: <Add />, name: '新しいシフト', action: () => console.log('Add shift') },
    { icon: <Upload />, name: 'CSVアップロード', action: () => console.log('Upload CSV') },
    { icon: <Camera />, name: 'OCR読み取り', action: () => console.log('OCR scan') },
    { icon: <Analytics />, name: '分析', action: () => console.log('Analytics') },
  ];

  return (
    <>
      <Backdrop open={open} />
      <SpeedDial
        ariaLabel="クイックアクション"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              action.action();
              setOpen(false);
            }}
          />
        ))}
      </SpeedDial>
    </>
  );
};

// メインダッシュボードコンポーネント
export const ModernDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { shifts } = useSimpleShiftStore();
  
  // 統計データの計算
  const stats = useMemo(() => {
    const totalEarnings = shifts.reduce((sum, shift) => sum + shift.totalEarnings, 0);
    const totalHours = shifts.reduce((sum, shift) => {
      const start = new Date(`2000-01-01T${shift.startTime}`);
      const end = new Date(`2000-01-01T${shift.endTime}`);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
    
    const thisMonth = new Date();
    const thisMonthShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate.getMonth() === thisMonth.getMonth() && 
             shiftDate.getFullYear() === thisMonth.getFullYear();
    });
    
    const thisMonthEarnings = thisMonthShifts.reduce((sum, shift) => sum + shift.totalEarnings, 0);
    const avgHourlyWage = totalHours > 0 ? totalEarnings / totalHours : 0;
    
    return {
      totalEarnings,
      totalHours,
      thisMonthEarnings,
      avgHourlyWage,
      shiftsCount: shifts.length,
    };
  }, [shifts]);
  
  const dashboardCards: DashboardCard[] = [
    {
      id: 'total-earnings',
      title: '累計収入',
      value: `¥${stats.totalEarnings.toLocaleString()}`,
      change: {
        value: 12.5,
        type: 'increase',
        period: '先月'
      },
      icon: <AccountBalanceWallet />,
      color: 'primary',
      action: {
        label: '詳細を見る',
        onClick: () => console.log('View earnings details')
      }
    },
    {
      id: 'month-earnings',
      title: '今月の収入',
      value: `¥${stats.thisMonthEarnings.toLocaleString()}`,
      change: {
        value: 8.3,
        type: 'increase',
        period: '先月同期'
      },
      icon: <TrendingUp />,
      color: 'success',
    },
    {
      id: 'total-hours',
      title: '総労働時間',
      value: `${Math.floor(stats.totalHours)}h`,
      icon: <Schedule />,
      color: 'info',
    },
    {
      id: 'avg-wage',
      title: '平均時給',
      value: `¥${Math.floor(stats.avgHourlyWage)}`,
      change: {
        value: 5.2,
        type: 'increase',
        period: '前月'
      },
      icon: <Analytics />,
      color: 'secondary',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 10 }}>
      {/* ヘッダー */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 0 }
        }}>
          <Box>
            <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 700, mb: 1 }}>
              ダッシュボード
            </Typography>
            <Typography variant="body1" color="text.secondary">
              扶養管理の状況を確認しましょう
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="通知">
              <Badge badgeContent={3} color="error">
                <IconButton>
                  <Notifications />
                </IconButton>
              </Badge>
            </Tooltip>
            
            <Tooltip title="設定">
              <IconButton>
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </motion.div>

      <motion.div
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        {/* 統計カード */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: 3,
          mb: 4
        }}>
          {dashboardCards.map((card, index) => (
            <StatCard key={card.id} card={card} index={index} />
          ))}
        </Box>

        {/* プログレスと最新アクティビティ */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 3,
          mb: 4
        }}>
          <ProgressCard
            title="扶養限度額"
            current={stats.totalEarnings}
            total={1030000}
            color="warning"
            suffix="円"
          />
          
          <RecentActivity />
        </Box>

        {/* クイックアクション */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                クイックアクション
              </Typography>
              
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 2
              }}>
                <TouchButton
                  variant="outlined"
                  startIcon={<Add />}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                  touchSize="large"
                >
                  <Typography variant="body2">新規シフト</Typography>
                </TouchButton>
                
                <TouchButton
                  variant="outlined"
                  startIcon={<Upload />}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                  touchSize="large"
                >
                  <Typography variant="body2">CSV取込</Typography>
                </TouchButton>
                
                <TouchButton
                  variant="outlined"
                  startIcon={<Camera />}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                  touchSize="large"
                >
                  <Typography variant="body2">OCR読取</Typography>
                </TouchButton>
                
                <TouchButton
                  variant="outlined"
                  startIcon={<Analytics />}
                  sx={{ py: 2, flexDirection: 'column', gap: 1 }}
                  touchSize="large"
                >
                  <Typography variant="body2">分析</Typography>
                </TouchButton>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* スピードダイアル */}
      <SpeedDialActions />
    </Box>
  );
};