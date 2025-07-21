import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save, Notifications, Settings } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import type {
  UserOptimizationPreferences,
  UpdateUserOptimizationPreferencesRequest,
  ObjectiveType,
  AlgorithmType,
} from '../../types/optimization';

interface OptimizationSettingsPanelProps {
  preferences: UserOptimizationPreferences | null;
  onUpdate: () => void;
}

export function OptimizationSettingsPanel({
  preferences,
  onUpdate,
}: OptimizationSettingsPanelProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [settings, setSettings] =
    useState<UpdateUserOptimizationPreferencesRequest>({
      preferredAlgorithm:
        preferences?.preferredAlgorithm || 'linear_programming',
      optimizationGoal: preferences?.optimizationGoal || 'maximize_income',
      riskTolerance: preferences?.riskTolerance || 'moderate',
      timeHorizon: preferences?.timeHorizon || 'medium',
      autoOptimize: preferences?.autoOptimize || false,
      notificationSettings: preferences?.notificationSettings || {
        newRecommendations: true,
        weeklyReports: true,
        monthlyReports: true,
        riskAlerts: true,
      },
    });

  const handleSaveSettings = async () => {
    if (!user?.token) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await apiService.updateOptimizationPreferences(user.token, settings);
      setSuccess('設定を保存しました');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const algorithmOptions = [
    {
      value: 'linear_programming',
      label: '線形計画法',
      description: '高速で基本的な最適化に適している',
    },
    {
      value: 'genetic_algorithm',
      label: '遺伝的アルゴリズム',
      description: '複雑な制約に対応可能',
    },
    {
      value: 'simulated_annealing',
      label: '焼きなまし法',
      description: '局所最適解を避けやすい',
    },
    {
      value: 'multi_objective_nsga2',
      label: 'NSGA-II',
      description: '多目的最適化に特化',
    },
  ];

  const objectiveOptions = [
    {
      value: 'maximize_income',
      label: '収入最大化',
      description: '扶養限度額内で最大収入を目指す',
    },
    {
      value: 'minimize_hours',
      label: '労働時間最小化',
      description: '必要収入を最小時間で達成',
    },
    {
      value: 'balance_sources',
      label: '収入源バランス',
      description: '複数の収入源を均等に活用',
    },
    {
      value: 'minimize_risk',
      label: 'リスク最小化',
      description: '扶養限度額超過リスクを最小化',
    },
    {
      value: 'multi_objective',
      label: '多目的最適化',
      description: '複数の目標を同時に最適化',
    },
  ];

  const riskToleranceOptions = [
    {
      value: 'conservative',
      label: '保守的',
      description: '扶養限度額に余裕を持つ',
    },
    {
      value: 'moderate',
      label: '中程度',
      description: 'バランスの取れたリスク管理',
    },
    {
      value: 'aggressive',
      label: '積極的',
      description: '限度額ギリギリまで活用',
    },
  ];

  const timeHorizonOptions = [
    {
      value: 'short',
      label: '短期（1-3ヶ月）',
      description: '直近の最適化に集中',
    },
    {
      value: 'medium',
      label: '中期（3-6ヶ月）',
      description: '季節変動を考慮',
    },
    {
      value: 'long',
      label: '長期（6-12ヶ月）',
      description: '年間を通じた最適化',
    },
  ];

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Basic Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 2 }}
              >
                <Settings />
                <Typography variant="h6">基本設定</Typography>
              </Stack>

              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>優先アルゴリズム</InputLabel>
                  <Select
                    value={settings.preferredAlgorithm}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        preferredAlgorithm: e.target.value as AlgorithmType,
                      })
                    }
                  >
                    {algorithmOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box>
                          <Typography variant="body1">
                            {option.label}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {option.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>最適化目標</InputLabel>
                  <Select
                    value={settings.optimizationGoal}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        optimizationGoal: e.target.value as ObjectiveType,
                      })
                    }
                  >
                    {objectiveOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box>
                          <Typography variant="body1">
                            {option.label}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {option.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>リスク許容度</InputLabel>
                  <Select
                    value={settings.riskTolerance}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        riskTolerance: e.target.value as 'conservative' | 'moderate' | 'aggressive',
                      })
                    }
                  >
                    {riskToleranceOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box>
                          <Typography variant="body1">
                            {option.label}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {option.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>最適化期間</InputLabel>
                  <Select
                    value={settings.timeHorizon}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        timeHorizon: e.target.value as 'short' | 'medium' | 'long',
                      })
                    }
                  >
                    {timeHorizonOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box>
                          <Typography variant="body1">
                            {option.label}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {option.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoOptimize}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          autoOptimize: e.target.checked,
                        })
                      }
                    />
                  }
                  label="自動最適化を有効にする"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 2 }}
              >
                <Notifications />
                <Typography variant="h6">通知設定</Typography>
              </Stack>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.notificationSettings?.newRecommendations
                      }
                      onChange={e =>
                        setSettings({
                          ...settings,
                          notificationSettings: {
                            ...settings.notificationSettings!,
                            newRecommendations: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="新しい推奨事項"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificationSettings?.weeklyReports}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          notificationSettings: {
                            ...settings.notificationSettings!,
                            weeklyReports: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="週次レポート"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificationSettings?.monthlyReports}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          notificationSettings: {
                            ...settings.notificationSettings!,
                            monthlyReports: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="月次レポート"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificationSettings?.riskAlerts}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          notificationSettings: {
                            ...settings.notificationSettings!,
                            riskAlerts: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="リスクアラート"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Settings Display */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                現在の設定
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    優先アルゴリズム
                  </Typography>
                  <Chip
                    label={
                      algorithmOptions.find(
                        a => a.value === settings.preferredAlgorithm
                      )?.label
                    }
                    color="primary"
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    最適化目標
                  </Typography>
                  <Chip
                    label={
                      objectiveOptions.find(
                        o => o.value === settings.optimizationGoal
                      )?.label
                    }
                    color="secondary"
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    リスク許容度
                  </Typography>
                  <Chip
                    label={
                      riskToleranceOptions.find(
                        r => r.value === settings.riskTolerance
                      )?.label
                    }
                    color={
                      settings.riskTolerance === 'conservative'
                        ? 'success'
                        : settings.riskTolerance === 'moderate'
                          ? 'warning'
                          : 'error'
                    }
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    自動最適化
                  </Typography>
                  <Chip
                    label={settings.autoOptimize ? '有効' : '無効'}
                    color={settings.autoOptimize ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSaveSettings}
          disabled={isLoading}
          startIcon={<Save />}
        >
          {isLoading ? '保存中...' : '設定を保存'}
        </Button>
      </Box>
    </Box>
  );
}
