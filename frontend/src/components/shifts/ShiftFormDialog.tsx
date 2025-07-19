import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import { format } from '../../utils/dateUtils';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import type { ShiftFormData, CreateShiftData } from '../../types/shift';

interface ShiftFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string | null;
}

const COMMON_JOB_SOURCES = [
  'コンビニ（セブン-イレブン）',
  'コンビニ（ファミリーマート）',
  'コンビニ（ローソン）',
  'ファストフード（マクドナルド）',
  'ファストフード（KFC）',
  'カフェ（スターバックス）',
  'カフェ（ドトール）',
  '居酒屋',
  'ファミリーレストラン',
  'スーパー',
  'ドラッグストア',
  '塾講師',
  '家庭教師',
  'データ入力',
  'イベントスタッフ',
  'その他',
];

export const ShiftFormDialog: React.FC<ShiftFormDialogProps> = ({
  open,
  onClose,
  onSuccess,
  initialDate,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ShiftFormData>({
    jobSourceName: '',
    date: null,
    startTime: '09:00',
    endTime: '17:00',
    hourlyRate: '1000',
    breakMinutes: '60',
    description: '',
    isConfirmed: false,
  });

  // Date string helper functions
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  const parseDateFromInput = (dateString: string): Date | null => {
    if (!dateString) return null;
    return new Date(dateString);
  };

  // 初期日付の設定
  useEffect(() => {
    if (initialDate) {
      setFormData(prev => ({
        ...prev,
        date: new Date(initialDate),
      }));
    }
  }, [initialDate]);

  // フォームのリセット
  const resetForm = () => {
    setFormData({
      jobSourceName: '',
      date: initialDate ? new Date(initialDate) : null,
      startTime: '09:00',
      endTime: '17:00',
      hourlyRate: '1000',
      breakMinutes: '60',
      description: '',
      isConfirmed: false,
    });
    setError(null);
  };

  // ダイアログクローズ処理
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 労働時間と収入の計算
  const calculateEarnings = () => {
    const startMinutes = timeToMinutes(formData.startTime);
    const endMinutes = timeToMinutes(formData.endTime);
    const workMinutes =
      endMinutes - startMinutes - parseInt(formData.breakMinutes || '0');
    const workHours = Math.max(0, workMinutes / 60);
    const earnings = workHours * parseFloat(formData.hourlyRate || '0');

    return {
      workingHours: workHours,
      earnings: earnings,
    };
  };

  // 時間を分に変換
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // フォーム送信
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token || !formData.date) {
      setError('必要な情報が不足しています');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const shiftData: CreateShiftData = {
        jobSourceName: formData.jobSourceName,
        date: format(formData.date, 'yyyy-MM-dd'),
        startTime: formData.startTime,
        endTime: formData.endTime,
        hourlyRate: parseFloat(formData.hourlyRate),
        breakMinutes: parseInt(formData.breakMinutes),
        description: formData.description || undefined,
        isConfirmed: formData.isConfirmed,
      };

      const response = (await apiService.createShift(token, shiftData)) as {
        success: boolean;
        data?: unknown;
        error?: unknown;
      };

      if ('success' in response && (response as { success: boolean }).success) {
        onSuccess();
        resetForm();
      } else {
        throw new Error('シフトの登録に失敗しました');
      }
    } catch (err) {
      console.error('Failed to create shift:', err);
      setError(
        err instanceof Error ? err.message : 'シフトの登録に失敗しました'
      );
    } finally {
      setLoading(false);
    }
  };

  // フィールド更新
  const updateField = <K extends keyof ShiftFormData>(
    field: K,
    value: ShiftFormData[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculation = calculateEarnings();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle>新規シフト登録</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid2 container spacing={3} sx={{ mt: 1 }}>
          {/* バイト先名 */}
          <Grid2 xs={12}>
            <Autocomplete
              options={COMMON_JOB_SOURCES}
              freeSolo
              value={formData.jobSourceName}
              onChange={(event, newValue) => {
                updateField('jobSourceName', newValue || '');
              }}
              onInputChange={(event, newInputValue) => {
                updateField('jobSourceName', newInputValue);
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label="バイト先"
                  required
                  fullWidth
                  placeholder="バイト先名を入力してください"
                />
              )}
            />
          </Grid2>

          {/* 日付 */}
          <Grid2 xs={12} md={6}>
            <TextField
              label="日付"
              type="date"
              value={formatDateForInput(formData.date)}
              onChange={e =>
                updateField('date', parseDateFromInput(e.target.value))
              }
              required
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid2>

          {/* 時給 */}
          <Grid2 xs={12} md={6}>
            <TextField
              label="時給"
              type="number"
              value={formData.hourlyRate}
              onChange={e => updateField('hourlyRate', e.target.value)}
              required
              fullWidth
              inputProps={{ min: 0, step: 10 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">円</InputAdornment>
                ),
              }}
            />
          </Grid2>

          {/* 開始時間 */}
          <Grid2 xs={12} md={6}>
            <TextField
              label="開始時間"
              type="time"
              value={formData.startTime}
              onChange={e => updateField('startTime', e.target.value)}
              required
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid2>

          {/* 終了時間 */}
          <Grid2 xs={12} md={6}>
            <TextField
              label="終了時間"
              type="time"
              value={formData.endTime}
              onChange={e => updateField('endTime', e.target.value)}
              required
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid2>

          {/* 休憩時間 */}
          <Grid2 xs={12} md={6}>
            <TextField
              label="休憩時間"
              type="number"
              value={formData.breakMinutes}
              onChange={e => updateField('breakMinutes', e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: 15 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">分</InputAdornment>
                ),
              }}
            />
          </Grid2>

          {/* 労働時間・収入表示 */}
          <Grid2 xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <span>労働時間:</span>
                <strong>{calculation.workingHours.toFixed(1)}時間</strong>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>予想収入:</span>
                <strong>
                  ¥{Math.round(calculation.earnings).toLocaleString()}
                </strong>
              </Box>
            </Box>
          </Grid2>

          {/* 備考 */}
          <Grid2 xs={12}>
            <TextField
              label="備考"
              multiline
              rows={3}
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              fullWidth
              placeholder="特記事項があれば入力してください"
            />
          </Grid2>

          {/* 確定フラグ */}
          <Grid2 xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isConfirmed}
                  onChange={e => updateField('isConfirmed', e.target.checked)}
                />
              }
              label="このシフトを確定済みとして登録する"
            />
          </Grid2>
        </Grid2>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !formData.jobSourceName || !formData.date}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? '登録中...' : '登録'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
