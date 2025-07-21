import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Typography,
  Alert,
  IconButton,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  MonetizationOn as MoneyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export interface JobSource {
  id: string;
  name: string;
  category:
    | 'part_time_job'
    | 'temporary_work'
    | 'freelance'
    | 'scholarship'
    | 'family_support'
    | 'other';
  hourly_rate?: number;
  expected_monthly_hours?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface JobSourceSelectorProps {
  selectedJobSourceId?: string;
  onJobSourceSelect: (jobSource: JobSource | null) => void;
  showAddButton?: boolean;
  required?: boolean;
  label?: string;
}

const categoryLabels = {
  part_time_job: 'アルバイト',
  temporary_work: '短期バイト',
  freelance: 'フリーランス',
  scholarship: '奨学金',
  family_support: '家族からの支援',
  other: 'その他',
};

const categoryIcons = {
  part_time_job: <WorkIcon />,
  temporary_work: <BusinessIcon />,
  freelance: <MoneyIcon />,
  scholarship: <SchoolIcon />,
  family_support: <MoneyIcon />,
  other: <WorkIcon />,
};

export default function JobSourceSelector({
  selectedJobSourceId,
  onJobSourceSelect,
  showAddButton = true,
  required = false,
  label = 'バイト先を選択',
}: JobSourceSelectorProps) {
  const { token } = useAuth();
  const [jobSources, setJobSources] = useState<JobSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新規バイト先フォームの状態
  const [newJobSource, setNewJobSource] = useState({
    name: '',
    category: 'part_time_job' as JobSource['category'],
    hourlyRate: '',
    expectedMonthlyHours: '',
  });

  useEffect(() => {
    if (token) {
      loadJobSources();
    }
  }, [token, loadJobSources]);

  const loadJobSources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getJobSources(token!);
      setJobSources(response.data || []);
    } catch (error: unknown) {
      console.error('Failed to load job sources:', error);
      setError('バイト先の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleJobSourceChange = (event: SelectChangeEvent<string>) => {
    const jobSourceId = event.target.value;
    if (jobSourceId) {
      const selectedJobSource = jobSources.find(js => js.id === jobSourceId);
      onJobSourceSelect(selectedJobSource || null);
    } else {
      onJobSourceSelect(null);
    }
  };

  const handleAddJobSource = async () => {
    try {
      setError(null);

      if (!newJobSource.name.trim()) {
        setError('バイト先名を入力してください');
        return;
      }

      const data = {
        name: newJobSource.name.trim(),
        category: newJobSource.category,
        hourlyRate: newJobSource.hourlyRate
          ? parseFloat(newJobSource.hourlyRate)
          : undefined,
        expectedMonthlyHours: newJobSource.expectedMonthlyHours
          ? parseInt(newJobSource.expectedMonthlyHours)
          : undefined,
      };

      const response = await apiService.createJobSource(token!, data);

      // リストを更新
      await loadJobSources();

      // 新規作成したバイト先を自動選択
      if (response.data) {
        onJobSourceSelect(response.data);
      }

      // ダイアログを閉じる
      setAddDialogOpen(false);

      // フォームをリセット
      setNewJobSource({
        name: '',
        category: 'part_time_job',
        hourlyRate: '',
        expectedMonthlyHours: '',
      });
    } catch (error: unknown) {
      console.error('Failed to create job source:', error);
      setError('バイト先の作成に失敗しました');
    }
  };

  const selectedJobSource = jobSources.find(
    js => js.id === selectedJobSourceId
  );

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControl fullWidth required={required}>
          <InputLabel>{label}</InputLabel>
          <Select
            value={selectedJobSourceId || ''}
            label={label}
            onChange={handleJobSourceChange}
            disabled={loading}
          >
            <MenuItem value="">
              <em>選択してください</em>
            </MenuItem>
            {jobSources.map(jobSource => (
              <MenuItem key={jobSource.id} value={jobSource.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {categoryIcons[jobSource.category]}
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {jobSource.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {categoryLabels[jobSource.category]}
                      {jobSource.hourly_rate &&
                        ` | ¥${jobSource.hourly_rate}/時間`}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {showAddButton && (
          <Button
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            variant="outlined"
            size="small"
            sx={{ minWidth: 'auto', px: 2 }}
          >
            新規
          </Button>
        )}
      </Box>

      {/* 選択されたバイト先の詳細表示 */}
      {selectedJobSource && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {categoryIcons[selectedJobSource.category]}
            <Typography variant="h6">{selectedJobSource.name}</Typography>
            <Chip
              label={categoryLabels[selectedJobSource.category]}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          <Grid container spacing={2}>
            {selectedJobSource.hourly_rate && (
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  時給: ¥{selectedJobSource.hourly_rate}
                </Typography>
              </Grid>
            )}
            {selectedJobSource.expected_monthly_hours && (
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  月間予定時間: {selectedJobSource.expected_monthly_hours}時間
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* 新規バイト先追加ダイアログ */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            新しいバイト先を追加
            <IconButton onClick={() => setAddDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="バイト先名"
                value={newJobSource.name}
                onChange={e =>
                  setNewJobSource({ ...newJobSource, name: e.target.value })
                }
                required
                placeholder="例: 〇〇カフェ 新宿店"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>カテゴリ</InputLabel>
                <Select
                  value={newJobSource.category}
                  label="カテゴリ"
                  onChange={e =>
                    setNewJobSource({
                      ...newJobSource,
                      category: e.target.value as JobSource['category'],
                    })
                  }
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {categoryIcons[value as JobSource['category']]}
                        {label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="時給 (円)"
                type="number"
                value={newJobSource.hourlyRate}
                onChange={e =>
                  setNewJobSource({
                    ...newJobSource,
                    hourlyRate: e.target.value,
                  })
                }
                placeholder="1000"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="月間予定時間"
                type="number"
                value={newJobSource.expectedMonthlyHours}
                onChange={e =>
                  setNewJobSource({
                    ...newJobSource,
                    expectedMonthlyHours: e.target.value,
                  })
                }
                placeholder="80"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleAddJobSource} variant="contained">
            追加
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
