import React, { useState, useCallback } from 'react';
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
  Grid,
  Alert,
  Chip,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { Repeat } from '@mui/icons-material';
import { format, addDays, addMonths } from '../../utils/dateUtils';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import type { CreateShiftData } from '../../types/shift';

interface RecurringShiftDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (shiftsCreated: number) => void;
}

type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly';
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface RecurringShiftData {
  jobSourceName: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  breakMinutes: number;
  transportFee: number;
  isHoliday: boolean;
  isNightShift: boolean;
  description: string;

  // 繰り返し設定
  pattern: RecurrencePattern;
  startDate: Date;
  endDate: Date;
  selectedDays: DayOfWeek[]; // 週単位の場合の曜日選択
  frequency: number; // 頻度（例：2週間おき、3日おきなど）
}

const COMMON_JOB_SOURCES = [
  'コンビニ（セブン-イレブン）',
  'コンビニ（ファミリーマート）',
  'コンビニ（ローソン）',
  'ファストフード（マクドナルド）',
  'カフェ（スターバックス）',
  '居酒屋',
  'ファミリーレストラン',
  'スーパー',
  'ドラッグストア',
  '塾講師',
  '家庭教師',
  'その他',
];

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

export const RecurringShiftDialog: React.FC<RecurringShiftDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewShifts, setPreviewShifts] = useState<Date[]>([]);
  const [formData, setFormData] = useState<RecurringShiftData>({
    jobSourceName: '',
    startTime: '09:00',
    endTime: '17:00',
    hourlyRate: 1000,
    breakMinutes: 60,
    transportFee: 0,
    isHoliday: false,
    isNightShift: false,
    description: '',
    pattern: 'weekly',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1ヶ月後
    selectedDays: [1, 3, 5], // 月水金
    frequency: 1,
  });

  // フォームリセット
  const resetForm = () => {
    setFormData({
      jobSourceName: '',
      startTime: '09:00',
      endTime: '17:00',
      hourlyRate: 1000,
      breakMinutes: 60,
      transportFee: 0,
      isHoliday: false,
      isNightShift: false,
      description: '',
      pattern: 'weekly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      selectedDays: [1, 3, 5],
      frequency: 1,
    });
    setError(null);
    setPreviewShifts([]);
  };

  // ダイアログを閉じる
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 繰り返しシフトの日付を生成
  const generateShiftDates = useCallback(() => {
    const dates: Date[] = [];
    let currentDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    while (currentDate <= endDate) {
      let shouldAddDate = false;

      switch (formData.pattern) {
        case 'daily':
          shouldAddDate = true;
          break;
        case 'weekly':
        case 'biweekly':
          shouldAddDate = formData.selectedDays.includes(
            currentDate.getDay() as DayOfWeek
          );
          break;
        case 'monthly':
          // 月ごとの同じ日付
          shouldAddDate =
            currentDate.getDate() === formData.startDate.getDate();
          break;
      }

      if (shouldAddDate) {
        dates.push(new Date(currentDate));
      }

      // 次の日付を計算
      switch (formData.pattern) {
        case 'daily':
          currentDate = addDays(currentDate, formData.frequency);
          break;
        case 'weekly':
          currentDate = addDays(currentDate, 1);
          break;
        case 'biweekly':
          currentDate = addDays(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, formData.frequency);
          break;
      }
    }

    return dates.slice(0, 50); // 最大50個のシフトに制限
  }, [formData]);

  // プレビュー更新
  const updatePreview = useCallback(() => {
    if (formData.jobSourceName && formData.startDate && formData.endDate) {
      const dates = generateShiftDates();
      setPreviewShifts(dates);
    } else {
      setPreviewShifts([]);
    }
  }, [formData, generateShiftDates]);

  // フォームデータ更新
  const updateField = <K extends keyof RecurringShiftData>(
    field: K,
    value: RecurringShiftData[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 曜日選択トグル
  const toggleDay = (day: DayOfWeek) => {
    const currentDays = formData.selectedDays;
    if (currentDays.includes(day)) {
      updateField(
        'selectedDays',
        currentDays.filter(d => d !== day)
      );
    } else {
      updateField('selectedDays', [...currentDays, day]);
    }
  };

  // プレビュー更新（フォームデータ変更時）
  React.useEffect(() => {
    updatePreview();
  }, [formData, updatePreview]);

  // 労働時間と収入の計算
  const calculateEarnings = () => {
    const startMinutes = timeToMinutes(formData.startTime);
    const endMinutes = timeToMinutes(formData.endTime);
    const workMinutes = endMinutes - startMinutes - formData.breakMinutes;
    const workHours = Math.max(0, workMinutes / 60);

    let hourlyRate = formData.hourlyRate;
    if (formData.isHoliday) hourlyRate *= 1.25;
    if (formData.isNightShift) hourlyRate *= 1.25;

    const earnings = workHours * hourlyRate + formData.transportFee;

    return {
      workingHours: workHours,
      earnings: earnings,
      totalEarnings: earnings * previewShifts.length,
    };
  };

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // フォーム送信
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token || previewShifts.length === 0) {
      setError('必要な情報が不足しているか、生成されるシフトがありません');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const shifts: CreateShiftData[] = previewShifts.map(date => ({
        jobSourceName: formData.jobSourceName,
        date: format(date, 'yyyy-MM-dd'),
        startTime: formData.startTime,
        endTime: formData.endTime,
        hourlyRate: formData.hourlyRate,
        breakMinutes: formData.breakMinutes,
        transportFee: formData.transportFee,
        isHoliday: formData.isHoliday,
        isNightShift: formData.isNightShift,
        description: formData.description,
        isConfirmed: false, // 定期シフトは初期は未確定
      }));

      const response = await apiService.createBulkShifts(token, shifts);

      if ('success' in response && (response as { success: boolean }).success) {
        onSuccess(shifts.length);
        resetForm();
      } else {
        throw new Error('定期シフトの登録に失敗しました');
      }
    } catch (err) {
      console.error('Failed to create recurring shifts:', err);
      setError(
        err instanceof Error ? err.message : '定期シフトの登録に失敗しました'
      );
    } finally {
      setLoading(false);
    }
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
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Repeat color="primary" />
          定期シフト登録
          {previewShifts.length > 0 && (
            <Chip
              label={`${previewShifts.length}回のシフト`}
              size="small"
              color="success"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* 基本情報 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              基本情報
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={COMMON_JOB_SOURCES}
              value={formData.jobSourceName}
              onChange={(event, newValue) =>
                updateField('jobSourceName', newValue || '')
              }
              freeSolo
              renderInput={params => (
                <TextField {...params} label="バイト先名" required fullWidth />
              )}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              label="開始時間"
              type="time"
              value={formData.startTime}
              onChange={e => updateField('startTime', e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              label="終了時間"
              type="time"
              value={formData.endTime}
              onChange={e => updateField('endTime', e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              label="時給"
              type="number"
              value={formData.hourlyRate}
              onChange={e => updateField('hourlyRate', Number(e.target.value))}
              fullWidth
              inputProps={{ min: 0, step: 50 }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              label="休憩時間（分）"
              type="number"
              value={formData.breakMinutes}
              onChange={e =>
                updateField('breakMinutes', Number(e.target.value))
              }
              fullWidth
              inputProps={{ min: 0, step: 15 }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              label="交通費"
              type="number"
              value={formData.transportFee}
              onChange={e =>
                updateField('transportFee', Number(e.target.value))
              }
              fullWidth
              inputProps={{ min: 0, step: 50 }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isHoliday}
                    onChange={e => updateField('isHoliday', e.target.checked)}
                  />
                }
                label="休日勤務"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isNightShift}
                    onChange={e =>
                      updateField('isNightShift', e.target.checked)
                    }
                  />
                }
                label="深夜勤務"
              />
            </Box>
          </Grid>

          {/* 繰り返し設定 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              繰り返し設定
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>繰り返しパターン</InputLabel>
              <Select
                value={formData.pattern}
                label="繰り返しパターン"
                onChange={e =>
                  updateField('pattern', e.target.value as RecurrencePattern)
                }
              >
                <MenuItem value="daily">毎日</MenuItem>
                <MenuItem value="weekly">毎週</MenuItem>
                <MenuItem value="biweekly">隔週</MenuItem>
                <MenuItem value="monthly">毎月</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={4}>
            <TextField
              label="開始日"
              type="date"
              value={format(formData.startDate, 'yyyy-MM-dd')}
              onChange={e => updateField('startDate', new Date(e.target.value))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={6} md={4}>
            <TextField
              label="終了日"
              type="date"
              value={format(formData.endDate, 'yyyy-MM-dd')}
              onChange={e => updateField('endDate', new Date(e.target.value))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* 曜日選択（週単位の場合） */}
          {(formData.pattern === 'weekly' ||
            formData.pattern === 'biweekly') && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                勤務する曜日を選択
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {DAY_NAMES.map((dayName, index) => (
                  <Chip
                    key={index}
                    label={dayName}
                    onClick={() => toggleDay(index as DayOfWeek)}
                    color={
                      formData.selectedDays.includes(index as DayOfWeek)
                        ? 'primary'
                        : 'default'
                    }
                    variant={
                      formData.selectedDays.includes(index as DayOfWeek)
                        ? 'filled'
                        : 'outlined'
                    }
                  />
                ))}
              </Box>
            </Grid>
          )}

          {/* 頻度設定（日単位・月単位の場合） */}
          {(formData.pattern === 'daily' || formData.pattern === 'monthly') && (
            <Grid item xs={12} md={6}>
              <TextField
                label={formData.pattern === 'daily' ? '何日おき' : '何ヶ月おき'}
                type="number"
                value={formData.frequency}
                onChange={e => updateField('frequency', Number(e.target.value))}
                fullWidth
                inputProps={{
                  min: 1,
                  max: formData.pattern === 'daily' ? 7 : 12,
                }}
              />
            </Grid>
          )}

          {/* 収入計算 */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ bgcolor: 'success.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  収入予測
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2">1回あたり労働時間</Typography>
                    <Typography variant="h6">
                      {calculation.workingHours.toFixed(1)}時間
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2">1回あたり収入</Typography>
                    <Typography variant="h6">
                      ¥{Math.round(calculation.earnings).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2">シフト回数</Typography>
                    <Typography variant="h6">
                      {previewShifts.length}回
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2">合計収入</Typography>
                    <Typography variant="h6" color="success.main">
                      ¥{Math.round(calculation.totalEarnings).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* プレビュー */}
          {previewShifts.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                生成されるシフト（最初の10件）
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {previewShifts.slice(0, 10).map((date, index) => (
                  <Chip
                    key={index}
                    label={format(date, 'M/d')}
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {previewShifts.length > 10 && (
                  <Chip
                    label={`...他${previewShifts.length - 10}件`}
                    color="default"
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>
          )}

          {/* 備考 */}
          <Grid item xs={12}>
            <TextField
              label="備考"
              multiline
              rows={2}
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              fullWidth
              placeholder="定期シフトの特記事項があれば入力してください"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={
            loading || !formData.jobSourceName || previewShifts.length === 0
          }
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? '登録中...' : `${previewShifts.length}件のシフトを登録`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
