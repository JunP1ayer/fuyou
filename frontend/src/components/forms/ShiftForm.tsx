// 📝 FUYOU PRO - シフト作成・編集フォーム

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Chip,
  Alert,
  Divider,
  useTheme,
  alpha,
  InputAdornment,
} from '@mui/material';
import {
  Close,
  AccessTime,
  Business,
  Payment,
  Notes,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import useI18nStore from '@/store/i18nStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { useShiftStore } from '@store/shiftStore';
import type { Shift, ShiftFormData } from '@/types/index';
import { calculateWorkMinutes } from '@/utils/dateUtils';
import { formatCurrency, formatDuration } from '@/utils/calculations';

interface ShiftFormProps {
  open?: boolean;
  shift?: Shift | null;
  onClose: () => void;
  onSubmit?: (data: ShiftFormData) => void;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({
  open = true,
  shift = null,
  onClose,
  onSubmit,
}) => {
  const theme = useTheme();
  const { country } = useI18nStore();
  const { addShift, updateShift, workplaces } = useShiftStore();

  const isEditing = Boolean(shift);

  const [formData, setFormData] = useState<ShiftFormData>({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '18:00',
    workplaceId: '',
    hourlyRate: 1000,
    breakMinutes: 60,
    notes: '',
  });

  type ShiftFormErrors = Partial<Record<keyof ShiftFormData, string>>;
  const [errors, setErrors] = useState<ShiftFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 編集時にデータを設定
  useEffect(() => {
    if (shift) {
      setFormData({
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        workplaceId: shift.workplaceId,
        hourlyRate: shift.hourlyRate,
        breakMinutes: shift.breakMinutes || 0,
        notes: shift.notes || '',
      });
    }
  }, [shift]);

  // 予想労働時間と給料を計算
  const predictedStats = React.useMemo(() => {
    if (!formData.startTime || !formData.endTime || !formData.hourlyRate) {
      return null;
    }

    const workMinutes = calculateWorkMinutes(
      formData.startTime,
      formData.endTime,
      formData.breakMinutes
    );

    const earnings = Math.floor((workMinutes / 60) * formData.hourlyRate);

    return {
      workMinutes,
      earnings,
      workHours: workMinutes / 60,
    };
  }, [
    formData.startTime,
    formData.endTime,
    formData.breakMinutes,
    formData.hourlyRate,
  ]);

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: ShiftFormErrors = {};

    if (!formData.date) newErrors.date = '日付を選択してください';
    if (!formData.startTime) newErrors.startTime = '開始時間を入力してください';
    if (!formData.endTime) newErrors.endTime = '終了時間を入力してください';
    if (!formData.workplaceId)
      newErrors.workplaceId = '勤務先を選択してください';
    if (formData.hourlyRate <= 0)
      newErrors.hourlyRate = '時給を入力してください';

    // 時間の整合性チェック
    if (formData.startTime && formData.endTime) {
      const startDate = new Date(`2024-01-01T${formData.startTime}`);
      const endDate = new Date(`2024-01-01T${formData.endTime}`);
      if (startDate >= endDate) {
        newErrors.endTime = '終了時間は開始時間より後に設定してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('入力内容を確認してください');
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        onSubmit(formData);
      } else if (isEditing && shift) {
        updateShift(shift.id, formData);
        toast.success('シフトを更新しました！');
      } else {
        addShift(formData);
        toast.success('新しいシフトを追加しました！');
      }

      onClose();
    } catch (error) {
      toast.error('エラーが発生しました');
      console.error('Shift form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // フィールド変更
  const handleFieldChange = (field: keyof ShiftFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={false}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            maxHeight: '90vh',
          },
        }}
      >
        {/* ヘッダー */}
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 3,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {isEditing ? 'シフトを編集' : '新しいシフトを追加'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              勤務の詳細情報を入力してください
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 0 }}>
            {/* 基本情報セクション */}
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  基本情報
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 3,
                  mb: 3,
                }}
              >
                {/* 日付 */}
                <DatePicker
                  label="勤務日"
                  value={new Date(formData.date)}
                  onChange={date => {
                    if (date) {
                      handleFieldChange('date', format(date, 'yyyy-MM-dd'));
                    }
                  }}
                  slotProps={{
                    textField: {
                      error: Boolean(errors.date),
                      helperText: errors.date,
                      fullWidth: true,
                    },
                  }}
                />

                {/* 勤務先 */}
                <FormControl fullWidth error={Boolean(errors.workplaceId)}>
                  <InputLabel>勤務先</InputLabel>
                  <Select
                    value={formData.workplaceId}
                    label="勤務先"
                    onChange={e => {
                      const workplaceId = e.target.value;
                      handleFieldChange('workplaceId', workplaceId);

                      // 勤務先のデフォルト時給を設定
                      const workplace = workplaces.find(
                        w => w.id === workplaceId
                      );
                      if (workplace && !isEditing) {
                        handleFieldChange(
                          'hourlyRate',
                          workplace.defaultHourlyRate
                        );
                      }
                    }}
                    startAdornment={
                      <InputAdornment position="start">
                        <Business />
                      </InputAdornment>
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
                              bgcolor: workplace.color,
                            }}
                          />
                          {workplace.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.workplaceId && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, ml: 2 }}
                    >
                      {errors.workplaceId}
                    </Typography>
                  )}
                </FormControl>
              </Box>
            </Box>

            <Divider />

            {/* 時間設定セクション */}
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  勤務時間
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 3,
                  mb: 3,
                }}
              >
                {/* 開始時間 */}
                <TimePicker
                  label="開始時間"
                  value={new Date(`2024-01-01T${formData.startTime}`)}
                  onChange={time => {
                    if (time) {
                      handleFieldChange('startTime', format(time, 'HH:mm'));
                    }
                  }}
                  slotProps={{
                    textField: {
                      error: Boolean(errors.startTime),
                      helperText: errors.startTime,
                      fullWidth: true,
                    },
                  }}
                />

                {/* 終了時間 */}
                <TimePicker
                  label="終了時間"
                  value={new Date(`2024-01-01T${formData.endTime}`)}
                  onChange={time => {
                    if (time) {
                      handleFieldChange('endTime', format(time, 'HH:mm'));
                    }
                  }}
                  slotProps={{
                    textField: {
                      error: Boolean(errors.endTime),
                      helperText: errors.endTime,
                      fullWidth: true,
                    },
                  }}
                />

                {/* 休憩時間 */}
                <TextField
                  label="休憩時間（分）"
                  type="number"
                  value={formData.breakMinutes}
                  onChange={e =>
                    handleFieldChange(
                      'breakMinutes',
                      parseInt(e.target.value) || 0
                    )
                  }
                  InputProps={{
                    inputProps: { min: 0, max: 480 },
                  }}
                  helperText="0-480分の間で入力"
                  fullWidth
                />
              </Box>

              {/* 予測統計 */}
              {predictedStats && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
                      borderRadius: 2,
                      p: 2,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="success.main"
                      sx={{ mb: 1, fontWeight: 600 }}
                    >
                      ⚡ 予測統計
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        textAlign: 'center',
                      }}
                    >
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: 'success.main' }}
                        >
                          {formatDuration(predictedStats.workMinutes)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          労働時間
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: 'success.main' }}
                        >
                          {formatCurrency(predictedStats.earnings)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          予想収入
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              )}
            </Box>

            <Divider />

            {/* 給料設定セクション */}
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Payment sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  給料設定
                </Typography>
              </Box>

              <TextField
                label="時給"
                type="number"
                value={formData.hourlyRate}
                onChange={e =>
                  handleFieldChange('hourlyRate', parseInt(e.target.value) || 0)
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">{country === 'UK' ? '£' : country === 'DE' || country === 'FI' || country === 'AT' ? '€' : country === 'DK' || country === 'NO' ? 'kr' : country === 'PL' ? 'zł' : country === 'HU' ? 'Ft' : '¥'}</InputAdornment>
                  ),
                  inputProps: { min: 0, max: 10000 },
                }}
                error={Boolean(errors.hourlyRate)}
                helperText={errors.hourlyRate || '円/時'}
                fullWidth
                sx={{ mb: 3 }}
              />
            </Box>

            <Divider />

            {/* メモセクション */}
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Notes sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  メモ（任意）
                </Typography>
              </Box>

              <TextField
                label="メモ・備考"
                multiline
                rows={3}
                value={formData.notes}
                onChange={e => handleFieldChange('notes', e.target.value)}
                placeholder="特記事項があれば入力してください..."
                fullWidth
              />
            </Box>
          </DialogContent>

          {/* アクションボタン */}
          <DialogActions
            sx={{
              p: 3,
              backgroundColor: alpha(theme.palette.action.hover, 0.02),
              justifyContent: 'space-between',
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={isSubmitting}
              sx={{ borderRadius: 2, minWidth: 120 }}
            >
              キャンセル
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <Schedule /> : <CheckCircle />}
              sx={{
                borderRadius: 2,
                minWidth: 120,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                },
              }}
            >
              {isSubmitting ? '保存中...' : isEditing ? '更新' : '追加'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};
