import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Grid,
  Alert,
  InputAdornment,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Work,
  Schedule,
  AttachMoney,
  DirectionsBus,
} from '@mui/icons-material';
// カラーピッカーを削除してMaterial-UIの色選択に変更

export interface JobTemplate {
  id: string;
  name: string;
  hourlyRate: number;
  transportationCost: number;
  defaultStartTime: string;
  defaultEndTime: string;
  defaultBreakMinutes: number;
  color: string;
  isActive: boolean;
  description?: string;
  // 深夜時給関連
  nightHourlyRate?: number; // 深夜時給（22:00-05:00）
  nightTimeStart?: string; // 深夜時間開始（デフォルト22:00）
  nightTimeEnd?: string; // 深夜時間終了（デフォルト05:00）
  // 休日時給
  holidayHourlyRate?: number; // 土日祝の時給
  weekendHourlyRate?: number; // 土日の時給
  // 交通費詳細
  transportationType?: 'fixed' | 'distance' | 'actual'; // 定額・距離・実費
  transportationDistance?: number; // 距離（km）
  transportationRatePerKm?: number; // km単価
  // 各種手当
  allowances?: Array<{
    id: string;
    name: string;
    amount: number;
    type: 'fixed' | 'hourly' | 'daily';
    condition?: string; // 支給条件
  }>;
}

interface JobManagementProps {
  onJobSelect?: (job: JobTemplate) => void;
  compactMode?: boolean;
}

const DEFAULT_COLORS = [
  '#4CAF50', // 緑
  '#2196F3', // 青
  '#FF9800', // オレンジ
  '#9C27B0', // 紫
  '#F44336', // 赤
  '#607D8B', // 青灰色
  '#795548', // 茶色
  '#E91E63', // ピンク
  '#00BCD4', // シアン
  '#FFC107', // 黄色
];

export const JobManagement: React.FC<JobManagementProps> = ({
  onJobSelect,
  compactMode = false,
}) => {
  const [jobs, setJobs] = useState<JobTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobTemplate | null>(null);
  // カラーセレクター機能は将来実装予定
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<JobTemplate>>({
    name: '',
    hourlyRate: 1000,
    transportationCost: 0,
    defaultStartTime: '09:00',
    defaultEndTime: '17:00',
    defaultBreakMinutes: 60,
    color: DEFAULT_COLORS[0],
    isActive: true,
    // 深夜時給関連（デフォルト値）
    nightHourlyRate: 1250, // 通常時給の1.25倍
    nightTimeStart: '22:00',
    nightTimeEnd: '05:00',
    // 休日時給
    weekendHourlyRate: 1000, // 通常と同じ
    // 交通費詳細
    transportationType: 'fixed',
    transportationDistance: 0,
    transportationRatePerKm: 20,
    // 手当
    allowances: [],
  });

  // ローカルストレージからデータを読み込み
  useEffect(() => {
    const savedJobs = localStorage.getItem('jobTemplates');
    if (savedJobs) {
      try {
        setJobs(JSON.parse(savedJobs));
      } catch (error) {
        console.error('Failed to parse saved jobs:', error);
        setJobs([]);
      }
    } else {
      // デフォルトのテンプレートを設定
      const defaultJobs: JobTemplate[] = [
        {
          id: '1',
          name: 'コンビニ（セブン-イレブン）',
          hourlyRate: 1000,
          transportationCost: 200,
          defaultStartTime: '09:00',
          defaultEndTime: '17:00',
          defaultBreakMinutes: 60,
          color: '#4CAF50',
          isActive: true,
        },
        {
          id: '2',
          name: 'カフェ（スターバックス）',
          hourlyRate: 1100,
          transportationCost: 300,
          defaultStartTime: '10:00',
          defaultEndTime: '18:00',
          defaultBreakMinutes: 60,
          color: '#2196F3',
          isActive: true,
        },
      ];
      setJobs(defaultJobs);
      localStorage.setItem('jobTemplates', JSON.stringify(defaultJobs));
    }
  }, []);

  // データをローカルストレージに保存
  const saveJobs = (updatedJobs: JobTemplate[]) => {
    setJobs(updatedJobs);
    localStorage.setItem('jobTemplates', JSON.stringify(updatedJobs));
  };

  // 新規作成ダイアログを開く
  const handleAddJob = () => {
    setEditingJob(null);
    setFormData({
      name: '',
      hourlyRate: 1000,
      transportationCost: 0,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      defaultBreakMinutes: 60,
      color: DEFAULT_COLORS[jobs.length % DEFAULT_COLORS.length],
      isActive: true,
      // 深夜時給関連（デフォルト値）
      nightHourlyRate: 1250, // 通常時給の1.25倍
      nightTimeStart: '22:00',
      nightTimeEnd: '05:00',
      // 休日時給
      weekendHourlyRate: 1000, // 通常と同じ
      // 交通費詳細
      transportationType: 'fixed',
      transportationDistance: 0,
      transportationRatePerKm: 20,
      // 手当
      allowances: [],
    });
    setDialogOpen(true);
  };

  // 編集ダイアログを開く
  const handleEditJob = (job: JobTemplate) => {
    setEditingJob(job);
    setFormData(job);
    setDialogOpen(true);
  };

  // ジョブを削除
  const handleDeleteJob = (jobId: string) => {
    const updatedJobs = jobs.filter(job => job.id !== jobId);
    saveJobs(updatedJobs);
  };

  // フォーム送信
  const handleSubmit = () => {
    if (!formData.name?.trim()) {
      setError('バイト先名を入力してください');
      return;
    }

    const newJob: JobTemplate = {
      id: editingJob?.id || Date.now().toString(),
      name: formData.name.trim(),
      hourlyRate: formData.hourlyRate || 1000,
      transportationCost: formData.transportationCost || 0,
      defaultStartTime: formData.defaultStartTime || '09:00',
      defaultEndTime: formData.defaultEndTime || '17:00',
      defaultBreakMinutes: formData.defaultBreakMinutes || 60,
      color: formData.color || DEFAULT_COLORS[0],
      isActive: formData.isActive ?? true,
      description: formData.description,
      // 深夜時給関連
      nightHourlyRate:
        formData.nightHourlyRate ||
        Math.round((formData.hourlyRate || 1000) * 1.25),
      nightTimeStart: formData.nightTimeStart || '22:00',
      nightTimeEnd: formData.nightTimeEnd || '05:00',
      // 休日時給
      weekendHourlyRate:
        formData.weekendHourlyRate || formData.hourlyRate || 1000,
      // 交通費詳細
      transportationType: formData.transportationType || 'fixed',
      transportationDistance: formData.transportationDistance || 0,
      transportationRatePerKm: formData.transportationRatePerKm || 20,
      // 手当
      allowances: formData.allowances || [],
    };

    let updatedJobs: JobTemplate[];
    if (editingJob) {
      updatedJobs = jobs.map(job => (job.id === editingJob.id ? newJob : job));
    } else {
      updatedJobs = [...jobs, newJob];
    }

    saveJobs(updatedJobs);
    setDialogOpen(false);
    setError(null);
  };

  // バイト先選択
  const handleJobSelect = (job: JobTemplate) => {
    onJobSelect?.(job);
  };

  // フィールド更新
  const updateField = <K extends keyof JobTemplate>(
    field: K,
    value: JobTemplate[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (compactMode) {
    // コンパクトモード - バイト先選択用
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          バイト先を選択
        </Typography>
        <Grid container spacing={1}>
          {jobs
            .filter(job => job.isActive)
            .map(job => (
              <Grid item xs={6} sm={4} md={3} key={job.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    '&:hover': {
                      borderColor: job.color,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s',
                    minHeight: { xs: '100px', sm: '110px' },
                  }}
                  onClick={() => handleJobSelect(job)}
                >
                  <CardContent
                    sx={{
                      textAlign: 'center',
                      py: { xs: 1.5, sm: 1 },
                      px: { xs: 1, sm: 2 },
                      '&:last-child': { pb: { xs: 1.5, sm: 1 } },
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 24, sm: 20 },
                        height: { xs: 24, sm: 20 },
                        backgroundColor: job.color,
                        borderRadius: '50%',
                        mx: 'auto',
                        mb: 1,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        lineHeight: 1.2,
                        mb: 0.5,
                      }}
                    >
                      {job.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    >
                      ¥{job.hourlyRate}/h
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          <Grid item xs={6} sm={4} md={3}>
            <Card
              sx={{
                cursor: 'pointer',
                border: '2px dashed #ccc',
                '&:hover': {
                  borderColor: 'primary.main',
                },
                minHeight: { xs: '100px', sm: '110px' },
                display: 'flex',
                alignItems: 'center',
              }}
              onClick={handleAddJob}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: { xs: 1.5, sm: 1 },
                  px: { xs: 1, sm: 2 },
                  '&:last-child': { pb: { xs: 1.5, sm: 1 } },
                  width: '100%',
                }}
              >
                <Add
                  sx={{
                    fontSize: { xs: 28, sm: 24 },
                    color: 'primary.main',
                    mb: 1,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    lineHeight: 1.2,
                  }}
                >
                  新規追加
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 編集ダイアログ */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 1, sm: 2 },
              width: { xs: 'calc(100% - 16px)', sm: 'auto' },
              maxHeight: { xs: '90vh', sm: '85vh' },
            },
          }}
        >
          <DialogTitle>
            {editingJob ? 'バイト先を編集' : '新しいバイト先を追加'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="バイト先名"
                  value={formData.name || ''}
                  onChange={e => updateField('name', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="時給"
                  type="number"
                  value={formData.hourlyRate || ''}
                  onChange={e =>
                    updateField('hourlyRate', parseInt(e.target.value))
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">円</InputAdornment>
                    ),
                  }}
                  fullWidth
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="交通費"
                  type="number"
                  value={formData.transportationCost || ''}
                  onChange={e =>
                    updateField('transportationCost', parseInt(e.target.value))
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">円</InputAdornment>
                    ),
                  }}
                  fullWidth
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="開始時間"
                  type="time"
                  value={formData.defaultStartTime || ''}
                  onChange={e =>
                    updateField('defaultStartTime', e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="終了時間"
                  type="time"
                  value={formData.defaultEndTime || ''}
                  onChange={e => updateField('defaultEndTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <Box>
                  <Typography variant="body2" mb={1}>
                    色:
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {DEFAULT_COLORS.map(color => (
                      <Box
                        key={color}
                        sx={{
                          width: 30,
                          height: 30,
                          backgroundColor: color,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          border:
                            formData.color === color
                              ? '3px solid #000'
                              : '2px solid #ccc',
                          '&:hover': {
                            transform: 'scale(1.1)',
                          },
                        }}
                        onClick={() => updateField('color', color)}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive ?? true}
                      onChange={e => updateField('isActive', e.target.checked)}
                    />
                  }
                  label="有効"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingJob ? '更新' : '追加'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // フルモード - 管理画面
  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" display="flex" alignItems="center" gap={1}>
          <Work />
          バイト先管理
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddJob}>
          新規追加
        </Button>
      </Box>

      <Grid container spacing={3}>
        {jobs.map(job => (
          <Grid item xs={12} md={6} lg={4} key={job.id}>
            <Card
              sx={{
                borderLeft: `4px solid ${job.color}`,
                opacity: job.isActive ? 1 : 0.6,
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="start"
                  mb={2}
                >
                  <Typography variant="h6">{job.name}</Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleEditJob(job)}>
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <AttachMoney fontSize="small" />
                  <Typography variant="body2">
                    時給: ¥{job.hourlyRate}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <DirectionsBus fontSize="small" />
                  <Typography variant="body2">
                    交通費: ¥{job.transportationCost}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Schedule fontSize="small" />
                  <Typography variant="body2">
                    {job.defaultStartTime} - {job.defaultEndTime}
                  </Typography>
                </Box>

                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip
                    label={job.isActive ? '有効' : '無効'}
                    color={job.isActive ? 'success' : 'default'}
                    size="small"
                  />
                  <Chip
                    label={`休憩${job.defaultBreakMinutes}分`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {jobs.length === 0 && (
        <Box textAlign="center" py={8}>
          <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            バイト先が登録されていません
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            新しいバイト先を追加して、シフト登録を簡単にしましょう
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddJob}
          >
            最初のバイト先を追加
          </Button>
        </Box>
      )}

      {/* 編集ダイアログ（フルモード用） */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingJob ? 'バイト先を編集' : '新しいバイト先を追加'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="バイト先名"
                value={formData.name || ''}
                onChange={e => updateField('name', e.target.value)}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" mb={1}>
                  テーマカラー:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {DEFAULT_COLORS.map(color => (
                    <Box
                      key={color}
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: color,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border:
                          formData.color === color
                            ? '4px solid #000'
                            : '2px solid #ccc',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s',
                      }}
                      onClick={() => updateField('color', color)}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                時給設定
              </Typography>
            </Grid>

            <Grid item xs={4}>
              <TextField
                label="通常時給"
                type="number"
                value={formData.hourlyRate || ''}
                onChange={e => {
                  const newRate = parseInt(e.target.value);
                  updateField('hourlyRate', newRate);
                  // 深夜時給を自動更新（1.25倍）
                  updateField('nightHourlyRate', Math.round(newRate * 1.25));
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">円</InputAdornment>
                  ),
                }}
                fullWidth
              />
            </Grid>

            <Grid item xs={4}>
              <TextField
                label="深夜時給"
                type="number"
                value={formData.nightHourlyRate || ''}
                onChange={e =>
                  updateField('nightHourlyRate', parseInt(e.target.value))
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">円</InputAdornment>
                  ),
                }}
                fullWidth
                helperText="22:00-05:00の時給"
              />
            </Grid>

            <Grid item xs={4}>
              <TextField
                label="土日時給"
                type="number"
                value={formData.weekendHourlyRate || ''}
                onChange={e =>
                  updateField('weekendHourlyRate', parseInt(e.target.value))
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">円</InputAdornment>
                  ),
                }}
                fullWidth
                helperText="土日の時給"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                交通費設定
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="交通費（定額）"
                type="number"
                value={formData.transportationCost || ''}
                onChange={e =>
                  updateField('transportationCost', parseInt(e.target.value))
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">円</InputAdornment>
                  ),
                }}
                fullWidth
                helperText="1日あたりの定額交通費"
              />
            </Grid>

            <Grid item xs={3}>
              <TextField
                label="距離"
                type="number"
                value={formData.transportationDistance || ''}
                onChange={e =>
                  updateField(
                    'transportationDistance',
                    parseInt(e.target.value)
                  )
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">km</InputAdornment>
                  ),
                }}
                fullWidth
                helperText="自宅からの距離"
              />
            </Grid>

            <Grid item xs={3}>
              <TextField
                label="km単価"
                type="number"
                value={formData.transportationRatePerKm || ''}
                onChange={e =>
                  updateField(
                    'transportationRatePerKm',
                    parseInt(e.target.value)
                  )
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">円/km</InputAdornment>
                  ),
                }}
                fullWidth
                helperText="距離計算用"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                勤務時間設定
              </Typography>
            </Grid>

            <Grid item xs={4}>
              <TextField
                label="デフォルト開始時間"
                type="time"
                value={formData.defaultStartTime || ''}
                onChange={e => updateField('defaultStartTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText="シフト登録時の初期値"
              />
            </Grid>

            <Grid item xs={4}>
              <TextField
                label="デフォルト終了時間"
                type="time"
                value={formData.defaultEndTime || ''}
                onChange={e => updateField('defaultEndTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText="シフト登録時の初期値"
              />
            </Grid>

            <Grid item xs={4}>
              <TextField
                label="休憩時間"
                type="number"
                value={formData.defaultBreakMinutes || ''}
                onChange={e =>
                  updateField('defaultBreakMinutes', parseInt(e.target.value))
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">分</InputAdornment>
                  ),
                }}
                fullWidth
                helperText="デフォルトの休憩時間"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                深夜時間帯（深夜時給が適用される時間帯）
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="深夜時間開始"
                type="time"
                value={formData.nightTimeStart || ''}
                onChange={e => updateField('nightTimeStart', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText="深夜時給開始時刻（通常22:00）"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="深夜時間終了"
                type="time"
                value={formData.nightTimeEnd || ''}
                onChange={e => updateField('nightTimeEnd', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText="深夜時給終了時刻（通常05:00）"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="備考"
                multiline
                rows={3}
                value={formData.description || ''}
                onChange={e => updateField('description', e.target.value)}
                fullWidth
                placeholder="特記事項があれば入力してください"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive ?? true}
                    onChange={e => updateField('isActive', e.target.checked)}
                  />
                }
                label="有効にする"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingJob ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
