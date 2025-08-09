import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Typography,
  Divider,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';

import type {
  CreateShiftData,
  UpdateShiftData,
  Shift,
  Workplace,
} from '../../types/shift';

interface ShiftFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateShiftData | UpdateShiftData) => Promise<void>;
  editingShift?: Shift;
  loading?: boolean;
  workplaces?: Workplace[];
}

export const ShiftFormDialog: React.FC<ShiftFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  editingShift,
  loading = false,
  workplaces = [],
}) => {
  const [formData, setFormData] = useState<CreateShiftData>({
    jobSourceId: '',
    jobSourceName: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '17:00',
    hourlyRate: 1000,
    breakMinutes: 60,
    description: '',
    isConfirmed: false,
    payDay: 25, // デフォルト25日
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflictError, setConflictError] = useState<string>('');

  // 職場選択時の処理
  const handleWorkplaceSelect = (workplaceId: string) => {
    const selectedWorkplace = workplaces.find(wp => wp.id === workplaceId);
    if (selectedWorkplace) {
      setFormData(prev => ({
        ...prev,
        jobSourceId: selectedWorkplace.id,
        jobSourceName: selectedWorkplace.name,
        hourlyRate: selectedWorkplace.hourlyRate,
        payDay: selectedWorkplace.payDay || 25,
      }));
    }
  };

  // editingShiftが変更されたときにフォームデータを更新
  useEffect(() => {
    if (editingShift) {
      setFormData({
        jobSourceId: editingShift.jobSourceId,
        jobSourceName: editingShift.jobSourceName,
        date: editingShift.date,
        startTime: editingShift.startTime,
        endTime: editingShift.endTime,
        hourlyRate: editingShift.hourlyRate,
        breakMinutes: editingShift.breakMinutes,
        description: editingShift.description,
        isConfirmed: editingShift.isConfirmed,
        payDay: editingShift.payDay || 25,
      });
    } else {
      setFormData({
        jobSourceId: '',
        jobSourceName: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '17:00',
        hourlyRate: 1000,
        breakMinutes: 60,
        description: '',
        isConfirmed: false,
        payDay: 25,
      });
    }
    setErrors({});
    setConflictError('');
  }, [editingShift, open]);

  // 労働時間計算
  const calculateWorkingHours = (): number => {
    const startMinutes = timeToMinutes(formData.startTime);
    const endMinutes = timeToMinutes(formData.endTime);

    let totalMinutes = endMinutes - startMinutes;

    // 翌日跨ぎの場合
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }

    const workingMinutes = totalMinutes - (formData.breakMinutes || 0);
    return Math.max(0, workingMinutes / 60);
  };

  // 時間を分に変換
  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 給与計算
  const calculateEarnings = (): number => {
    return calculateWorkingHours() * formData.hourlyRate;
  };

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.jobSourceName.trim()) {
      newErrors.jobSourceName = 'バイト先名は必須です';
    }

    if (!formData.date) {
      newErrors.date = '日付は必須です';
    }

    if (!formData.startTime) {
      newErrors.startTime = '開始時間は必須です';
    }

    if (!formData.endTime) {
      newErrors.endTime = '終了時間は必須です';
    }

    if (formData.hourlyRate <= 0) {
      newErrors.hourlyRate = '時給は0より大きい値を入力してください';
    }

    if ((formData.breakMinutes || 0) < 0) {
      newErrors.breakMinutes = '休憩時間は0以上の値を入力してください';
    }

    // 労働時間チェック
    const workingHours = calculateWorkingHours();
    if (workingHours <= 0) {
      newErrors.time = '労働時間が0以下になっています。時間を確認してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setConflictError('');
      await onSubmit(formData);
      onClose();
    } catch (error: unknown) {
      // 時間重複エラーの処理
      const err = error as { response?: { status: number; data: { error?: { message?: string } } } };
      if (err?.response?.status === 409) {
        setConflictError(
          err.response.data.error?.message || '時間が重複しています'
        );
      } else {
        setConflictError('エラーが発生しました。もう一度お試しください。');
      }
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const workingHours = calculateWorkingHours();
  const earnings = calculateEarnings();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingShift ? 'シフト編集' : '新しいシフトを追加'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* エラー表示 */}
            {conflictError && <Alert severity="error">{conflictError}</Alert>}

            {/* バイト先選択 */}
            {workplaces.length > 0 ? (
              <FormControl fullWidth required error={!!errors.jobSourceName}>
                <InputLabel>バイト先</InputLabel>
                <Select
                  value={formData.jobSourceId || ''}
                  label="バイト先"
                  onChange={e =>
                    handleWorkplaceSelect(e.target.value as string)
                  }
                >
                  {workplaces.map(workplace => (
                    <MenuItem key={workplace.id} value={workplace.id}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: workplace.color,
                            flexShrink: 0,
                          }}
                        />
                        {workplace.name} (¥
                        {workplace.hourlyRate.toLocaleString()})
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.jobSourceName && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, ml: 2 }}
                  >
                    {errors.jobSourceName}
                  </Typography>
                )}
              </FormControl>
            ) : (
              <TextField
                label="バイト先名"
                value={formData.jobSourceName}
                onChange={e =>
                  setFormData({ ...formData, jobSourceName: e.target.value })
                }
                error={!!errors.jobSourceName}
                helperText={errors.jobSourceName}
                required
                fullWidth
              />
            )}

            {/* 日付 */}
            <DatePicker
              label="日付"
              value={parseISO(formData.date)}
              onChange={date => {
                if (date) {
                  setFormData({
                    ...formData,
                    date: format(date, 'yyyy-MM-dd'),
                  });
                }
              }}
              slotProps={{
                textField: {
                  error: !!errors.date,
                  helperText: errors.date,
                  required: true,
                  fullWidth: true,
                },
              }}
            />

            {/* 時間設定 */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TimePicker
                label="開始時間"
                value={new Date(`1970-01-01T${formData.startTime}:00`)}
                onChange={time => {
                  if (time) {
                    setFormData({
                      ...formData,
                      startTime: format(time, 'HH:mm'),
                    });
                  }
                }}
                slotProps={{
                  textField: {
                    error: !!errors.startTime,
                    helperText: errors.startTime,
                    required: true,
                    fullWidth: true,
                  },
                }}
              />
              <TimePicker
                label="終了時間"
                value={new Date(`1970-01-01T${formData.endTime}:00`)}
                onChange={time => {
                  if (time) {
                    setFormData({
                      ...formData,
                      endTime: format(time, 'HH:mm'),
                    });
                  }
                }}
                slotProps={{
                  textField: {
                    error: !!errors.endTime,
                    helperText: errors.endTime,
                    required: true,
                    fullWidth: true,
                  },
                }}
              />
            </Box>

            {/* 時間エラー表示 */}
            {errors.time && <Alert severity="error">{errors.time}</Alert>}

            {/* 時給・休憩時間 */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="時給 (円)"
                type="number"
                value={formData.hourlyRate}
                onChange={e =>
                  setFormData({
                    ...formData,
                    hourlyRate: Number(e.target.value),
                  })
                }
                error={!!errors.hourlyRate}
                helperText={errors.hourlyRate}
                required
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
              <TextField
                label="休憩時間 (分)"
                type="number"
                value={formData.breakMinutes || 0}
                onChange={e =>
                  setFormData({
                    ...formData,
                    breakMinutes: Number(e.target.value),
                  })
                }
                error={!!errors.breakMinutes}
                helperText={errors.breakMinutes}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Box>

            {/* 給料日 */}
            <FormControl fullWidth>
              <InputLabel>給料日</InputLabel>
              <Select
                value={formData.payDay || 25}
                label="給料日"
                onChange={e =>
                  setFormData({ ...formData, payDay: Number(e.target.value) })
                }
              >
                {[...Array(31)].map((_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    毎月 {i + 1}日
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 備考 */}
            <TextField
              label="備考"
              value={formData.description || ''}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              multiline
              rows={2}
              fullWidth
            />

            <Divider />

            {/* 計算結果表示 */}
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                計算結果
              </Typography>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography>労働時間:</Typography>
                <Typography fontWeight="bold">
                  {workingHours.toFixed(1)}時間
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>予想給与:</Typography>
                <Typography fontWeight="bold" color="primary.main">
                  ¥{earnings.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? '処理中...' : editingShift ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};
