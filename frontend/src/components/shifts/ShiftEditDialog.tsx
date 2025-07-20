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
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { format } from '../../utils/dateUtils';
import { Delete } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import type { Shift, ShiftFormData, UpdateShiftData } from '../../types/shift';

interface ShiftEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shift: Shift | null;
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

export const ShiftEditDialog: React.FC<ShiftEditDialogProps> = ({
  open,
  onClose,
  onSuccess,
  shift,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  // シフトデータの初期化
  useEffect(() => {
    if (shift) {
      setFormData({
        jobSourceName: shift.jobSourceName,
        date: new Date(shift.date),
        startTime: shift.startTime,
        endTime: shift.endTime,
        hourlyRate: shift.hourlyRate.toString(),
        breakMinutes: shift.breakMinutes.toString(),
        description: shift.description || '',
        isConfirmed: shift.isConfirmed,
      });
    }
  }, [shift]);

  // フォームのリセット
  const resetForm = () => {
    if (shift) {
      setFormData({
        jobSourceName: shift.jobSourceName,
        date: new Date(shift.date),
        startTime: shift.startTime,
        endTime: shift.endTime,
        hourlyRate: shift.hourlyRate.toString(),
        breakMinutes: shift.breakMinutes.toString(),
        description: shift.description || '',
        isConfirmed: shift.isConfirmed,
      });
    }
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

  // フォーム送信（更新）
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token || !formData.date || !shift) {
      setError('必要な情報が不足しています');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData: Partial<UpdateShiftData> = {
        jobSourceName: formData.jobSourceName,
        date: format(formData.date, 'yyyy-MM-dd'),
        startTime: formData.startTime,
        endTime: formData.endTime,
        hourlyRate: parseFloat(formData.hourlyRate),
        breakMinutes: parseInt(formData.breakMinutes),
        description: formData.description || undefined,
        isConfirmed: formData.isConfirmed,
      };

      const response = (await apiService.updateShift(
        token,
        shift.id,
        updateData
      )) as { success: boolean; data?: unknown; error?: unknown };

      if ('success' in response && (response as { success: boolean }).success) {
        onSuccess();
      } else {
        throw new Error('シフトの更新に失敗しました');
      }
    } catch (err) {
      console.error('Failed to update shift:', err);
      setError(
        err instanceof Error ? err.message : 'シフトの更新に失敗しました'
      );
    } finally {
      setLoading(false);
    }
  };

  // シフト削除
  const handleDelete = async () => {
    if (!token || !shift || !confirm('本当にこのシフトを削除しますか？')) {
      return;
    }

    setDeleteLoading(true);
    setError(null);

    try {
      const response = (await apiService.deleteShift(token, shift.id)) as {
        success: boolean;
        data?: unknown;
        error?: unknown;
      };

      if ('success' in response && (response as { success: boolean }).success) {
        onSuccess();
      } else {
        throw new Error('シフトの削除に失敗しました');
      }
    } catch (err) {
      console.error('Failed to delete shift:', err);
      setError(
        err instanceof Error ? err.message : 'シフトの削除に失敗しました'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // シフト確定切り替え
  const handleToggleConfirm = async () => {
    if (!token || !shift) return;

    setLoading(true);
    setError(null);

    try {
      if (!shift.isConfirmed) {
        // 確定する場合は専用エンドポイントを使用
        const response = (await apiService.confirmShift(token, shift.id)) as {
          success: boolean;
          data?: unknown;
          error?: unknown;
        };
        if (
          'success' in response &&
          (response as { success: boolean }).success
        ) {
          setFormData(prev => ({ ...prev, isConfirmed: true }));
          onSuccess();
        } else {
          throw new Error('シフトの確定に失敗しました');
        }
      } else {
        // 確定を取り消す場合は通常の更新
        const response = (await apiService.updateShift(token, shift.id, {
          isConfirmed: false,
        })) as { success: boolean; data?: unknown; error?: unknown };
        if (
          'success' in response &&
          (response as { success: boolean }).success
        ) {
          setFormData(prev => ({ ...prev, isConfirmed: false }));
          onSuccess();
        } else {
          throw new Error('シフトの確定取り消しに失敗しました');
        }
      }
    } catch (err) {
      console.error('Failed to toggle shift confirmation:', err);
      setError(
        err instanceof Error ? err.message : 'シフトの状態変更に失敗しました'
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

  if (!shift) {
    return null;
  }

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
      <DialogTitle>
        シフト編集
        <Box
          component="span"
          sx={{ ml: 2, fontSize: '0.8em', color: 'text.secondary' }}
        >
          作成日: {format(new Date(shift.createdAt), 'yyyy/MM/dd HH:mm')}
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* バイト先名 */}
          <Grid item xs={12}>
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
          </Grid>

          {/* 日付 */}
          <Grid item xs={12} md={6}>
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
          </Grid>

          {/* 時給 */}
          <Grid item xs={12} md={6}>
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
          </Grid>

          {/* 開始時間 */}
          <Grid item xs={12} md={6}>
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
          </Grid>

          {/* 終了時間 */}
          <Grid item xs={12} md={6}>
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
          </Grid>

          {/* 休憩時間 */}
          <Grid item xs={12} md={6}>
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
          </Grid>

          {/* 労働時間・収入表示 */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <span>労働時間:</span>
                <strong>{calculation.workingHours.toFixed(1)}時間</strong>
              </Box>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <span>予想収入:</span>
                <strong>
                  ¥{Math.round(calculation.earnings).toLocaleString()}
                </strong>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>現在の収入:</span>
                <strong>
                  ¥{Math.round(shift.calculatedEarnings).toLocaleString()}
                </strong>
              </Box>
            </Box>
          </Grid>

          {/* 備考 */}
          <Grid item xs={12}>
            <TextField
              label="備考"
              multiline
              rows={3}
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              fullWidth
              placeholder="特記事項があれば入力してください"
            />
          </Grid>

          {/* 確定フラグ */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isConfirmed}
                  onChange={e => updateField('isConfirmed', e.target.checked)}
                />
              }
              label="このシフトを確定済みとして登録する"
            />
            {shift.isConfirmed !== formData.isConfirmed && (
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleToggleConfirm}
                  disabled={loading}
                >
                  {formData.isConfirmed
                    ? 'シフトを確定する'
                    : 'シフト確定を取り消す'}
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleDelete}
          color="error"
          startIcon={<Delete />}
          disabled={loading || deleteLoading}
        >
          {deleteLoading ? '削除中...' : '削除'}
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button onClick={handleClose} disabled={loading || deleteLoading}>
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={
            loading ||
            deleteLoading ||
            !formData.jobSourceName ||
            !formData.date
          }
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? '更新中...' : '更新'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
