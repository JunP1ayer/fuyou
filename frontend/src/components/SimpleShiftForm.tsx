// 📝 シンプルなシフト追加フォーム

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useSimpleShiftStore } from '../store/simpleShiftStore';
import useI18nStore from '../store/i18nStore';
import { formatCurrency } from '../utils/calculations';
import type { Shift } from '../types/simple';

interface SimpleShiftFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  selectedDate?: string;
}

export const SimpleShiftForm: React.FC<SimpleShiftFormProps> = ({
  onClose,
  onSuccess,
  selectedDate,
}) => {
  const { workplaces, addShift } = useSimpleShiftStore();
  const { country } = useI18nStore();

  const [formData, setFormData] = useState({
    date: selectedDate || new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:00',
    workplaceId: '',
    workplaceName: '',
    hourlyRate: 1000,
    totalEarnings: 0,
    status: 'tentative' as const,
    isAllDay: false,
    isMultiDay: false,
    hasRepeat: false,
    hasNotification: false,
    memo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [workplaceDialogOpen, setWorkplaceDialogOpen] = useState(false);
  const [selectedWorkplace, setSelectedWorkplace] = useState<any>(null);

  // バリデーション
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = '日付を選択してください';
    if (!formData.startTime) newErrors.startTime = '開始時間を入力してください';
    if (!formData.endTime) newErrors.endTime = '終了時間を入力してください';
    if (!formData.workplaceId)
      newErrors.workplaceId = '勤務先を選択してください';
    if (formData.hourlyRate <= 0)
      newErrors.hourlyRate = '時給を入力してください';

    // 時間の整合性チェック
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2024-01-01T${formData.startTime}`);
      const end = new Date(`2024-01-01T${formData.endTime}`);
      if (start >= end) {
        newErrors.endTime = '終了時間は開始時間より後にしてください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 勤務先変更時の処理
  const handleWorkplaceSelect = (workplace: any) => {
    setSelectedWorkplace(workplace);
    setFormData(prev => ({
      ...prev,
      workplaceId: workplace.id,
      workplaceName: workplace.name,
      hourlyRate: workplace.defaultHourlyRate,
    }));
    setWorkplaceDialogOpen(false);
  };

  // 日付フォーマット関数
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日（${weekday}）`;
  };

  // 収入計算
  const calculateEarnings = () => {
    if (formData.startTime && formData.endTime && formData.hourlyRate) {
      const start = new Date(`2024-01-01T${formData.startTime}`);
      const end = new Date(`2024-01-01T${formData.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return Math.floor(hours * formData.hourlyRate);
    }
    return 0;
  };

  // フォーム送信
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const totalEarnings = calculateEarnings();

    const newShift: Omit<Shift, 'id'> = {
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      workplaceName: formData.workplaceName,
      hourlyRate: formData.hourlyRate,
      totalEarnings,
      status: 'confirmed', // 追加時は確定にする
    };

    try {
      addShift(newShift);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('シフト追加エラー:', error);
    }
  };

  const predictedEarnings = calculateEarnings();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card sx={{ maxWidth: 600, m: 2 }}>
        <CardContent>
          {/* バイト先選択タイトル */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              タイトル
            </Typography>
            {selectedWorkplace ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    backgroundColor: selectedWorkplace.color,
                    fontSize: 12,
                  }}
                >
                  {selectedWorkplace.name.charAt(0)}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedWorkplace.name}
                </Typography>
                <Button
                  size="small"
                  onClick={() => setWorkplaceDialogOpen(true)}
                  sx={{ ml: 'auto' }}
                >
                  変更
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                onClick={() => setWorkplaceDialogOpen(true)}
                sx={{
                  p: 2,
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                + バイト先を選択
              </Button>
            )}
          </Box>

          <form onSubmit={handleSubmit}>
            {/* 日時セクション */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                日時
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    開始: {formatDateDisplay(formData.date)}{' '}
                    {formData.startTime}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    終了: {formatDateDisplay(formData.date)} {formData.endTime}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    label="開始時間"
                    type="time"
                    fullWidth
                    size="small"
                    value={formData.startTime}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    error={Boolean(errors.startTime)}
                    helperText={errors.startTime}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    label="終了時間"
                    type="time"
                    fullWidth
                    size="small"
                    value={formData.endTime}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    error={Boolean(errors.endTime)}
                    helperText={errors.endTime}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* 設定セクション */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isAllDay}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            isAllDay: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="終日設定"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {formData.isAllDay
                      ? 'オン（終日）'
                      : 'オフ（特定時間のみ）'}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isMultiDay}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            isMultiDay: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="複数日設定"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {formData.isMultiDay ? 'あり' : 'なし'}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hasRepeat}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            hasRepeat: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="繰り返し"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {formData.hasRepeat ? 'あり' : 'なし'}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hasNotification}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            hasNotification: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="通知"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {formData.hasNotification ? 'あり' : 'なし'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* メモ・時給セクション */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="メモ"
                  multiline
                  rows={2}
                  size="small"
                  value={formData.memo}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, memo: e.target.value }))
                  }
                  placeholder={formData.memo ? formData.memo : '未入力'}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="時給"
                  type="number"
                  fullWidth
                  size="small"
                  value={formData.hourlyRate}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      hourlyRate: parseInt(e.target.value) || 0,
                    }))
                  }
                  error={Boolean(errors.hourlyRate)}
                  helperText={errors.hourlyRate}
                  InputProps={{
                    startAdornment: (
                      <span style={{ marginRight: 8 }}>
                        {country === 'UK' ? '£' : country === 'DE' || country === 'FI' || country === 'AT' ? '€' : country === 'DK' || country === 'NO' ? 'kr' : country === 'PL' ? 'zł' : country === 'HU' ? 'Ft' : '¥'}
                      </span>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'success.main',
                    borderRadius: 1,
                    backgroundColor: 'success.light',
                    color: 'success.contrastText',
                    textAlign: 'center',
                    height: '56px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    予想収入
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, fontSize: '1.1rem' }}
                  >
                    {formatCurrency(predictedEarnings)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* ボタン */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'flex-end',
                mt: 4,
              }}
            >
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{ minWidth: 100 }}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  minWidth: 100,
                  background:
                    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)',
                  },
                }}
              >
                追加
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* バイト先選択ダイアログ */}
      <Dialog
        open={workplaceDialogOpen}
        onClose={() => setWorkplaceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>バイト先を選択</DialogTitle>
        <DialogContent>
          <List>
            {workplaces.map(workplace => (
              <ListItem key={workplace.id} disablePadding>
                <ListItemButton
                  onClick={() => handleWorkplaceSelect(workplace)}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        backgroundColor: workplace.color,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {workplace.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={workplace.name}
                    secondary={`${formatCurrency(workplace.defaultHourlyRate)}/時`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkplaceDialogOpen(false)}>
            キャンセル
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};
