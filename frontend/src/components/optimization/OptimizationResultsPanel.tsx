import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  Button,
  IconButton,
  Collapse,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ExpandMore,
  ExpandLess,
  Visibility,
  CheckCircle,
  Error,
  PlayArrow,
  History,
  Analytics,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import type { OptimizationRun } from '../../types/optimization';

interface OptimizationResultsPanelProps {
  runs: OptimizationRun[];
  onUpdate?: () => void;
}

export function OptimizationResultsPanel({
  runs,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUpdate: _,
}: OptimizationResultsPanelProps) {
  const { user } = useAuth();
  const [selectedRun, setSelectedRun] = useState<OptimizationRun | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleViewDetails = async (run: OptimizationRun) => {
    if (!user?.token) return;

    try {
      setIsLoading(true);
      setError(null);

      const [
        detailsResult,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        suggestionsResult,
      ] = await Promise.all([
        apiService.getOptimizationRunDetails(user.token, run.id),
        apiService.getOptimizationSuggestions(user.token, run.id),
      ]);

      setSelectedRun({
        ...run,
        result: detailsResult.data?.result,
        // suggestions: suggestionsResult.data,
      });
      setDetailsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '詳細の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpand = (runId: string) => {
    const newExpanded = new Set(expandedRuns);
    if (newExpanded.has(runId)) {
      newExpanded.delete(runId);
    } else {
      newExpanded.add(runId);
    }
    setExpandedRuns(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '完了';
      case 'failed':
        return '失敗';
      case 'running':
        return '実行中';
      case 'pending':
        return '待機中';
      default:
        return status;
    }
  };

  const getObjectiveLabel = (objective: string) => {
    switch (objective) {
      case 'maximize_income':
        return '収入最大化';
      case 'minimize_hours':
        return '労働時間最小化';
      case 'balance_sources':
        return '収入源バランス';
      case 'minimize_risk':
        return 'リスク最小化';
      case 'multi_objective':
        return '多目的最適化';
      default:
        return objective;
    }
  };

  const getAlgorithmLabel = (algorithm: string) => {
    switch (algorithm) {
      case 'linear_programming':
        return '線形計画法';
      case 'genetic_algorithm':
        return '遺伝的アルゴリズム';
      case 'simulated_annealing':
        return '焼きなまし法';
      case 'multi_objective_nsga2':
        return 'NSGA-II多目的最適化';
      default:
        return algorithm;
    }
  };

  const completedRuns = runs.filter(run => run.status === 'completed');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const failedRuns = runs.filter(run => run.status === 'failed');
  const runningRuns = runs.filter(
    run => run.status === 'running' || run.status === 'pending'
  );

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    総実行回数
                  </Typography>
                  <Typography variant="h4">{runs.length}</Typography>
                </Box>
                <History color="primary" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    成功実行
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {completedRuns.length}
                  </Typography>
                </Box>
                <CheckCircle color="success" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    実行中
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {runningRuns.length}
                  </Typography>
                </Box>
                <PlayArrow color="info" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    成功率
                  </Typography>
                  <Typography variant="h4">
                    {runs.length > 0
                      ? Math.round((completedRuns.length / runs.length) * 100)
                      : 0}
                    %
                  </Typography>
                </Box>
                <Analytics color="primary" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Runs Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            実行履歴
          </Typography>

          {runs.length === 0 ? (
            <Alert severity="info">
              まだ最適化を実行していません。最適化実行タブから新しい最適化を開始できます。
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>実行日時</TableCell>
                    <TableCell>最適化目標</TableCell>
                    <TableCell>アルゴリズム</TableCell>
                    <TableCell>期間</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>進捗</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {runs.map(run => (
                    <React.Fragment key={run.id}>
                      <TableRow>
                        <TableCell>
                          {new Date(run.createdAt).toLocaleString('ja-JP')}
                        </TableCell>
                        <TableCell>
                          {getObjectiveLabel(run.objectiveType)}
                        </TableCell>
                        <TableCell>
                          {getAlgorithmLabel(run.algorithmUsed)}
                        </TableCell>
                        <TableCell>
                          {new Date(run.timePeriodStart).toLocaleDateString(
                            'ja-JP'
                          )}{' '}
                          〜{' '}
                          {new Date(run.timePeriodEnd).toLocaleDateString(
                            'ja-JP'
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(run.status)}
                            color={
                              getStatusColor(run.status) as
                                | 'default'
                                | 'primary'
                                | 'secondary'
                                | 'error'
                                | 'info'
                                | 'success'
                                | 'warning'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {run.status === 'running' ||
                          run.status === 'pending' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LinearProgress
                                variant="determinate"
                                value={run.progress * 100}
                                sx={{ width: 100, mr: 1 }}
                              />
                              <Typography variant="body2">
                                {Math.round(run.progress * 100)}%
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2">
                              {run.status === 'completed' ? '100%' : '0%'}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleExpand(run.id)}
                            >
                              {expandedRuns.has(run.id) ? (
                                <ExpandLess />
                              ) : (
                                <ExpandMore />
                              )}
                            </IconButton>
                            {run.status === 'completed' && (
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(run)}
                                disabled={isLoading}
                              >
                                <Visibility />
                              </IconButton>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row */}
                      <TableRow>
                        <TableCell
                          style={{ paddingBottom: 0, paddingTop: 0 }}
                          colSpan={7}
                        >
                          <Collapse
                            in={expandedRuns.has(run.id)}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box sx={{ margin: 1 }}>
                              <Typography
                                variant="h6"
                                gutterBottom
                                component="div"
                              >
                                実行詳細
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography
                                    variant="body2"
                                    color="textSecondary"
                                  >
                                    実行メッセージ
                                  </Typography>
                                  <Typography variant="body2">
                                    {run.message}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography
                                    variant="body2"
                                    color="textSecondary"
                                  >
                                    推定完了時刻
                                  </Typography>
                                  <Typography variant="body2">
                                    {run.estimatedCompletion
                                      ? new Date(
                                          run.estimatedCompletion
                                        ).toLocaleString('ja-JP')
                                      : 'N/A'}
                                  </Typography>
                                </Grid>
                                {run.completedAt && (
                                  <Grid item xs={12} md={6}>
                                    <Typography
                                      variant="body2"
                                      color="textSecondary"
                                    >
                                      完了時刻
                                    </Typography>
                                    <Typography variant="body2">
                                      {new Date(run.completedAt).toLocaleString(
                                        'ja-JP'
                                      )}
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>最適化結果詳細</DialogTitle>
        <DialogContent>
          {selectedRun && (
            <Box>
              <Tabs
                value={currentTab}
                onChange={(_, value) => setCurrentTab(value)}
              >
                <Tab label="概要" />
                <Tab label="推奨シフト" />
                <Tab label="改善提案" />
                <Tab label="指標" />
              </Tabs>

              <Box sx={{ mt: 3 }}>
                {currentTab === 0 && (
                  <OptimizationOverviewTab run={selectedRun} />
                )}
                {currentTab === 1 && (
                  <OptimizationShiftsTab run={selectedRun} />
                )}
                {currentTab === 2 && (
                  <OptimizationRecommendationsTab run={selectedRun} />
                )}
                {currentTab === 3 && (
                  <OptimizationMetricsTab run={selectedRun} />
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Tab Components
function OptimizationOverviewTab({ run }: { run: OptimizationRun }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              実行情報
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  目標
                </Typography>
                <Typography variant="body1">{run.objectiveType}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  アルゴリズム
                </Typography>
                <Typography variant="body1">{run.algorithmUsed}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  期間
                </Typography>
                <Typography variant="body1">
                  {new Date(run.timePeriodStart).toLocaleDateString('ja-JP')} 〜{' '}
                  {new Date(run.timePeriodEnd).toLocaleDateString('ja-JP')}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              実行結果
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  ステータス
                </Typography>
                <Chip
                  label={run.status === 'completed' ? '完了' : run.status}
                  color={run.status === 'completed' ? 'success' : 'error'}
                  size="small"
                />
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  目的関数値
                </Typography>
                <Typography variant="body1">
                  {run.result?.objectiveValue?.toLocaleString() || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  信頼度
                </Typography>
                <Typography variant="body1">
                  {run.result?.convergenceMetrics?.confidenceScore
                    ? `${(run.result.convergenceMetrics.confidenceScore * 100).toFixed(1)}%`
                    : 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function OptimizationShiftsTab({ run }: { run: OptimizationRun }) {
  const optimizedShifts = run.result?.optimizedSchedule || [];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        推奨シフトスケジュール
      </Typography>

      {optimizedShifts.length === 0 ? (
        <Alert severity="info">推奨シフトデータがありません。</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>日付</TableCell>
                <TableCell>勤務先</TableCell>
                <TableCell>時間</TableCell>
                <TableCell>労働時間</TableCell>
                <TableCell>時給</TableCell>
                <TableCell>予想収入</TableCell>
                <TableCell>推奨理由</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {optimizedShifts.map(shift => (
                <TableRow key={shift.id}>
                  <TableCell>
                    {new Date(shift.date).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell>{shift.jobSourceName}</TableCell>
                  <TableCell>
                    {shift.startTime} - {shift.endTime}
                  </TableCell>
                  <TableCell>{shift.duration}時間</TableCell>
                  <TableCell>¥{shift.hourlyRate.toLocaleString()}</TableCell>
                  <TableCell>
                    ¥{shift.expectedIncome.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {shift.recommendationReason}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

function OptimizationRecommendationsTab({ run }: { run: OptimizationRun }) {
  const recommendations = run.result?.recommendations || [];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        改善提案
      </Typography>

      {recommendations.length === 0 ? (
        <Alert severity="info">改善提案がありません。</Alert>
      ) : (
        <Stack spacing={2}>
          {recommendations.map(rec => (
            <Card key={rec.id}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      {rec.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {rec.description}
                    </Typography>
                  </Box>
                  <Chip
                    label={
                      rec.priority === 'high'
                        ? '高'
                        : rec.priority === 'medium'
                          ? '中'
                          : '低'
                    }
                    color={
                      rec.priority === 'high'
                        ? 'error'
                        : rec.priority === 'medium'
                          ? 'warning'
                          : 'success'
                    }
                    size="small"
                  />
                </Stack>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    予想効果
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Typography variant="body2">
                      収入変化: {rec.impact.incomeChange > 0 ? '+' : ''}¥
                      {rec.impact.incomeChange.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      時間変化: {rec.impact.hoursChange > 0 ? '+' : ''}
                      {rec.impact.hoursChange}時間
                    </Typography>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function OptimizationMetricsTab({ run }: { run: OptimizationRun }) {
  const metrics = run.result?.convergenceMetrics;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        実行指標
      </Typography>

      {metrics ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {metrics.iterations}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  反復回数
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {metrics.executionTime.toFixed(2)}秒
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  実行時間
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {(metrics.confidenceScore * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  信頼度スコア
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">実行指標データがありません。</Alert>
      )}
    </Box>
  );
}
