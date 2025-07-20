import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Stack,
  LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  TrendingUp,
  Schedule,
  Settings,
  Assessment,
  PlayArrow,
  Pause,
  Refresh,
  Info,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { OptimizationConstraintsPanel } from './optimization/OptimizationConstraintsPanel';
import { OptimizationResultsPanel } from './optimization/OptimizationResultsPanel';
import { OptimizationSettingsPanel } from './optimization/OptimizationSettingsPanel';
import { OptimizationRunPanel } from './optimization/OptimizationRunPanel';
import type {
  OptimizationConstraint,
  OptimizationRun,
  OptimizationAlgorithm,
  OptimizationTier,
  UserOptimizationPreferences,
  AvailabilitySlot,
} from '../types/optimization';

interface OptimizationDashboardProps {
  onError?: (error: string) => void;
  simplified?: boolean; // シフトボード型UI用の簡素化モード
}

export function OptimizationDashboard({
  onError,
  simplified = false,
}: OptimizationDashboardProps) {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceHealthy, setServiceHealthy] = useState<boolean | null>(null);

  // Data state
  const [constraints, setConstraints] = useState<OptimizationConstraint[]>([]);
  const [runs, setRuns] = useState<OptimizationRun[]>([]);
  const [algorithms, setAlgorithms] = useState<OptimizationAlgorithm[]>([]);
  const [tiers, setTiers] = useState<Record<string, OptimizationTier>>({});
  const [preferences, setPreferences] =
    useState<UserOptimizationPreferences | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [activeRun, setActiveRun] = useState<OptimizationRun | null>(null);

  // Tab configuration
  const tabs = [
    { label: 'ダッシュボード', icon: <Assessment />, value: 0 },
    { label: '制約設定', icon: <Settings />, value: 1 },
    { label: '最適化実行', icon: <PlayArrow />, value: 2 },
    { label: '結果・履歴', icon: <TrendingUp />, value: 3 },
  ];

  // Load initial data
  const loadData = useCallback(async () => {
    if (!user?.token) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load all optimization data in parallel
      const [
        healthResult,
        constraintsResult,
        runsResult,
        algorithmsResult,
        tiersResult,
        preferencesResult,
        availabilityResult,
      ] = await Promise.allSettled([
        apiService.getOptimizationHealth(user.token),
        apiService.getOptimizationConstraints(user.token),
        apiService.getOptimizationRuns(user.token),
        apiService.getOptimizationAlgorithms(user.token),
        apiService.getOptimizationTiers(user.token),
        apiService.getOptimizationPreferences(user.token),
        apiService.getAvailabilitySlots(user.token),
      ]);

      // Process health check
      if (healthResult.status === 'fulfilled') {
        setServiceHealthy(healthResult.value?.data?.status === 'healthy');
      } else {
        setServiceHealthy(false);
      }

      // Process constraints
      if (constraintsResult.status === 'fulfilled') {
        setConstraints(constraintsResult.value?.data || []);
      }

      // Process runs
      if (runsResult.status === 'fulfilled') {
        const runsData = runsResult.value?.data || [];
        setRuns(runsData);

        // Find active run
        const activeRun = runsData.find(
          (run: OptimizationRun) =>
            run.status === 'running' || run.status === 'pending'
        );
        setActiveRun(activeRun || null);
      }

      // Process algorithms
      if (algorithmsResult.status === 'fulfilled') {
        setAlgorithms(algorithmsResult.value?.data || []);
      }

      // Process tiers
      if (tiersResult.status === 'fulfilled') {
        setTiers(tiersResult.value?.data || {});
      }

      // Process preferences
      if (preferencesResult.status === 'fulfilled') {
        setPreferences(preferencesResult.value?.data || null);
      }

      // Process availability
      if (availabilityResult.status === 'fulfilled') {
        setAvailability(availabilityResult.value?.data || []);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'データの読み込みに失敗しました';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.token, onError]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll active run status
  useEffect(() => {
    if (!activeRun || !user?.token) return;

    const pollInterval = setInterval(async () => {
      try {
        const statusResult = await apiService.getOptimizationRunStatus(
          user.token!,
          activeRun.id
        );
        const updatedRun = statusResult.data;

        if (
          updatedRun.status === 'completed' ||
          updatedRun.status === 'failed'
        ) {
          setActiveRun(null);
          loadData(); // Refresh all data
        } else {
          setActiveRun(updatedRun);
        }
      } catch (err) {
        console.error('Failed to poll run status:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [activeRun, user?.token, loadData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleConstraintsUpdate = () => {
    loadData();
  };

  const handleRunStart = (run: OptimizationRun) => {
    setActiveRun(run);
    setCurrentTab(2); // Switch to run panel
  };

  const handleRefresh = () => {
    loadData();
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // 簡素化モード用のレンダリング
  if (simplified) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            労働時間最適化（簡易版）
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            シフトボード型UIでは最適化機能は簡素化されています。
            詳細な最適化は「最適化タブ」をご利用ください。
          </Alert>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                推奨月間労働時間
              </Typography>
              <Typography variant="h6" color="primary">
                60-80 時間
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                扶養内収入目標
              </Typography>
              <Typography variant="h6" color="success.main">
                ¥100,000/月
              </Typography>
            </Paper>
          </Box>

          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 2 }}
            startIcon={<Assessment />}
          >
            詳細最適化機能を見る
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h4" component="h1" gutterBottom>
            最適化ダッシュボード
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Tooltip title="サービス状態">
              <Chip
                icon={serviceHealthy ? <CheckCircle /> : <Warning />}
                label={serviceHealthy ? 'サービス正常' : 'サービス不安定'}
                color={serviceHealthy ? 'success' : 'warning'}
                size="small"
              />
            </Tooltip>
            <Tooltip title="データを更新">
              <IconButton onClick={handleRefresh} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Active Run Status */}
        {activeRun && (
          <Alert
            severity="info"
            icon={<CircularProgress size={20} />}
            sx={{ mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => setCurrentTab(2)}
              >
                詳細を見る
              </Button>
            }
          >
            <Typography variant="body2">
              最適化実行中: {activeRun.message}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={activeRun.progress * 100}
              sx={{ mt: 1 }}
            />
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          {tabs.map(tab => (
            <Tab
              key={tab.value}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ minHeight: '500px' }}>
        {currentTab === 0 && (
          <OptimizationOverview
            constraints={constraints}
            runs={runs}
            algorithms={algorithms}
            tiers={tiers}
            preferences={preferences}
            activeRun={activeRun}
            onStartRun={handleRunStart}
          />
        )}

        {currentTab === 1 && (
          <OptimizationConstraintsPanel
            constraints={constraints}
            availability={availability}
            onUpdate={handleConstraintsUpdate}
          />
        )}

        {currentTab === 2 && (
          <OptimizationRunPanel
            algorithms={algorithms}
            tiers={tiers}
            preferences={preferences}
            constraints={constraints}
            activeRun={activeRun}
            onRunStart={handleRunStart}
            onUpdate={loadData}
          />
        )}

        {currentTab === 3 && (
          <OptimizationResultsPanel runs={runs} onUpdate={loadData} />
        )}
      </Box>
    </Box>
  );
}

// Overview component
interface OptimizationOverviewProps {
  constraints: OptimizationConstraint[];
  runs: OptimizationRun[];
  algorithms: OptimizationAlgorithm[];
  tiers: Record<string, OptimizationTier>;
  preferences: UserOptimizationPreferences | null;
  activeRun: OptimizationRun | null;
  onStartRun: (run: OptimizationRun) => void;
}

function OptimizationOverview({
  constraints,
  runs,
  algorithms,
  tiers,
  preferences,
  activeRun,
  onStartRun,
}: OptimizationOverviewProps) {
  const completedRuns = runs.filter(run => run.status === 'completed');
  const successRate =
    runs.length > 0 ? (completedRuns.length / runs.length) * 100 : 0;

  return (
    <Grid container spacing={3}>
      {/* Statistics Cards */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              設定済み制約
            </Typography>
            <Typography variant="h4">
              {constraints.filter(c => c.isActive).length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              / {constraints.length} 総制約数
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              実行回数
            </Typography>
            <Typography variant="h4">{runs.length}</Typography>
            <Typography variant="body2" color="textSecondary">
              成功率 {successRate.toFixed(1)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              利用可能アルゴリズム
            </Typography>
            <Typography variant="h4">{algorithms.length}</Typography>
            <Typography variant="body2" color="textSecondary">
              選択済み: {preferences?.preferredAlgorithm || 'なし'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              最適化目標
            </Typography>
            <Typography variant="h6">
              {preferences?.optimizationGoal || '未設定'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              リスク許容度: {preferences?.riskTolerance || 'なし'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Results */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              最近の実行結果
            </Typography>
            {completedRuns.length === 0 ? (
              <Typography color="textSecondary">
                まだ最適化を実行していません
              </Typography>
            ) : (
              <Stack spacing={2}>
                {completedRuns.slice(0, 3).map(run => (
                  <Box
                    key={run.id}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography variant="subtitle1">
                          {run.objectiveType} - {run.algorithmUsed}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {new Date(run.createdAt).toLocaleString('ja-JP')}
                        </Typography>
                      </Box>
                      <Chip
                        label={run.status === 'completed' ? '完了' : '失敗'}
                        color={run.status === 'completed' ? 'success' : 'error'}
                        size="small"
                      />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
