import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  PlayArrow,
  Settings,
  Timeline,
  Assessment,
  Error,
  Warning,
  Schedule,
  MonetizationOn,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import type {
  OptimizationRun,
  OptimizationAlgorithm,
  OptimizationTier,
  UserOptimizationPreferences,
  OptimizationConstraint,
  CreateOptimizationRunRequest,
  ObjectiveType,
} from '../../types/optimization';

interface OptimizationRunPanelProps {
  algorithms: OptimizationAlgorithm[];
  tiers: Record<string, OptimizationTier>;
  preferences: UserOptimizationPreferences | null;
  constraints: OptimizationConstraint[];
  activeRun: OptimizationRun | null;
  onRunStart: (run: OptimizationRun) => void;
  onUpdate: () => void;
}

export function OptimizationRunPanel({
  algorithms,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tiers: _tiers,
  preferences,
  constraints,
  activeRun,
  onRunStart,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUpdate: _onUpdate,
}: OptimizationRunPanelProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [runConfig, setRunConfig] = useState<CreateOptimizationRunRequest>({
    objectiveType: 'maximize_income',
    timePeriodStart: new Date().toISOString().split('T')[0],
    timePeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    algorithmUsed: 'linear_programming',
  });

  const objectiveTypes: {
    value: ObjectiveType;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'maximize_income',
      label: '収入最大化',
      description: '扶養限度額内で最大収入を目指す',
      icon: <MonetizationOn />,
    },
    {
      value: 'minimize_hours',
      label: '労働時間最小化',
      description: '必要収入を最小時間で達成',
      icon: <Schedule />,
    },
    {
      value: 'balance_sources',
      label: '収入源バランス',
      description: '複数の収入源を均等に活用',
      icon: <Timeline />,
    },
    {
      value: 'minimize_risk',
      label: 'リスク最小化',
      description: '扶養限度額超過リスクを最小化',
      icon: <Warning />,
    },
    {
      value: 'multi_objective',
      label: '多目的最適化',
      description: '複数の目標を同時に最適化',
      icon: <Assessment />,
    },
  ];

  const steps = [
    {
      label: '目標設定',
      description: '最適化の目標を選択',
    },
    {
      label: 'アルゴリズム選択',
      description: '使用するアルゴリズムを選択',
    },
    {
      label: '期間設定',
      description: '最適化対象期間を設定',
    },
    {
      label: '実行確認',
      description: '設定内容を確認して実行',
    },
  ];

  // Update run config with preferences
  useEffect(() => {
    if (preferences) {
      setRunConfig(prev => ({
        ...prev,
        objectiveType: preferences.optimizationGoal,
        algorithmUsed: preferences.preferredAlgorithm,
      }));
    }
  }, [preferences]);

  const handleStartOptimization = async () => {
    if (!user?.token) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await apiService.runOptimizationAsync(
        user.token,
        runConfig
      );

      if (result.success) {
        onRunStart(result.data);
        setCurrentStep(0);
        setConfirmDialogOpen(false);
      } else {
        setError(result.error?.message || '最適化の開始に失敗しました');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '最適化の開始に失敗しました'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!runConfig.objectiveType;
      case 1:
        return !!runConfig.algorithmUsed;
      case 2:
        return !!runConfig.timePeriodStart && !!runConfig.timePeriodEnd;
      case 3:
        return constraints.length > 0;
      default:
        return false;
    }
  };

  const selectedAlgorithm = algorithms.find(
    a => a.id === runConfig.algorithmUsed
  );
  const selectedObjective = objectiveTypes.find(
    o => o.value === runConfig.objectiveType
  );
  const activeConstraints = constraints.filter(c => c.isActive);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Active Run Status */}
      {activeRun && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">実行中の最適化</Typography>
              <Chip
                label={activeRun.status === 'running' ? '実行中' : '待機中'}
                color="info"
                icon={<CircularProgress size={16} />}
              />
            </Stack>

            <Typography variant="body2" color="textSecondary" gutterBottom>
              {activeRun.message}
            </Typography>

            <LinearProgress
              variant="determinate"
              value={activeRun.progress * 100}
              sx={{ mb: 2 }}
            />

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2">
                進捗: {Math.round(activeRun.progress * 100)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                開始: {new Date(activeRun.createdAt).toLocaleString('ja-JP')}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Configuration Stepper */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            最適化設定
          </Typography>

          <Stepper activeStep={currentStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={index}>
                <StepLabel>{step.label}</StepLabel>
                <StepContent>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 2 }}
                  >
                    {step.description}
                  </Typography>

                  {/* Step 0: Objective Selection */}
                  {index === 0 && (
                    <Grid container spacing={2}>
                      {objectiveTypes.map(objective => (
                        <Grid item xs={12} md={6} key={objective.value}>
                          <Paper
                            sx={{
                              p: 2,
                              cursor: 'pointer',
                              border:
                                runConfig.objectiveType === objective.value
                                  ? 2
                                  : 1,
                              borderColor:
                                runConfig.objectiveType === objective.value
                                  ? 'primary.main'
                                  : 'divider',
                            }}
                            onClick={() =>
                              setRunConfig({
                                ...runConfig,
                                objectiveType: objective.value,
                              })
                            }
                          >
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                            >
                              {objective.icon}
                              <Box>
                                <Typography variant="subtitle1">
                                  {objective.label}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="textSecondary"
                                >
                                  {objective.description}
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  {/* Step 1: Algorithm Selection */}
                  {index === 1 && (
                    <Grid container spacing={2}>
                      {algorithms.map(algorithm => (
                        <Grid item xs={12} key={algorithm.id}>
                          <Paper
                            sx={{
                              p: 2,
                              cursor: 'pointer',
                              border:
                                runConfig.algorithmUsed === algorithm.id
                                  ? 2
                                  : 1,
                              borderColor:
                                runConfig.algorithmUsed === algorithm.id
                                  ? 'primary.main'
                                  : 'divider',
                            }}
                            onClick={() =>
                              setRunConfig({
                                ...runConfig,
                                algorithmUsed: algorithm.id,
                              })
                            }
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Box>
                                <Typography variant="subtitle1">
                                  {algorithm.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="textSecondary"
                                >
                                  {algorithm.description}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <Chip
                                  label={algorithm.complexity}
                                  color={
                                    algorithm.complexity === 'low'
                                      ? 'success'
                                      : algorithm.complexity === 'medium'
                                        ? 'warning'
                                        : 'error'
                                  }
                                  size="small"
                                />
                                <Chip
                                  label={algorithm.executionTime}
                                  variant="outlined"
                                  size="small"
                                />
                              </Stack>
                            </Stack>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  {/* Step 2: Time Period */}
                  {index === 2 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="開始日"
                          type="date"
                          value={runConfig.timePeriodStart}
                          onChange={e =>
                            setRunConfig({
                              ...runConfig,
                              timePeriodStart: e.target.value,
                            })
                          }
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="終了日"
                          type="date"
                          value={runConfig.timePeriodEnd}
                          onChange={e =>
                            setRunConfig({
                              ...runConfig,
                              timePeriodEnd: e.target.value,
                            })
                          }
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </Grid>
                  )}

                  {/* Step 3: Confirmation */}
                  {index === 3 && (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        設定内容の確認
                      </Typography>

                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            最適化目標
                          </Typography>
                          <Typography variant="body1">
                            {selectedObjective?.label}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            アルゴリズム
                          </Typography>
                          <Typography variant="body1">
                            {selectedAlgorithm?.name}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            最適化期間
                          </Typography>
                          <Typography variant="body1">
                            {runConfig.timePeriodStart} 〜{' '}
                            {runConfig.timePeriodEnd}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            有効な制約
                          </Typography>
                          <Typography variant="body1">
                            {activeConstraints.length} 件
                          </Typography>
                        </Box>
                      </Stack>

                      {activeConstraints.length === 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          制約が設定されていません。制約設定タブで制約を追加してください。
                        </Alert>
                      )}
                    </Box>
                  )}

                  <Box sx={{ mt: 3 }}>
                    <Stack direction="row" spacing={2}>
                      <Button disabled={index === 0} onClick={handleBack}>
                        戻る
                      </Button>
                      {index < steps.length - 1 ? (
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          disabled={!canProceed()}
                        >
                          次へ
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={() => setConfirmDialogOpen(true)}
                          disabled={!canProceed() || !!activeRun}
                          startIcon={<PlayArrow />}
                        >
                          最適化を開始
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>最適化実行の確認</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            以下の設定で最適化を実行しますか？
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>{selectedObjective?.icon}</ListItemIcon>
              <ListItemText
                primary="最適化目標"
                secondary={selectedObjective?.label}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText
                primary="アルゴリズム"
                secondary={selectedAlgorithm?.name}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Schedule />
              </ListItemIcon>
              <ListItemText
                primary="期間"
                secondary={`${runConfig.timePeriodStart} 〜 ${runConfig.timePeriodEnd}`}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Assessment />
              </ListItemIcon>
              <ListItemText
                primary="制約数"
                secondary={`${activeConstraints.length} 件の制約`}
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleStartOptimization}
            variant="contained"
            disabled={isLoading}
            startIcon={
              isLoading ? <CircularProgress size={16} /> : <PlayArrow />
            }
          >
            {isLoading ? '開始中...' : '最適化を開始'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
