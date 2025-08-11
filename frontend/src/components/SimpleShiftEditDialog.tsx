// 📝 シフト編集・詳細表示ダイアログ

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Grid,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Edit,
  Delete,
  Save,
  Cancel,
  AccessTime,
  AttachMoney,
  Business,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSimpleShiftStore } from '../store/simpleShiftStore';
import type { Shift } from '../types/simple';
import { formatCurrency } from '../utils/calculations';
import useI18nStore from '../store/i18nStore';

interface SimpleShiftEditDialogProps {
  open: boolean;
  shift: Shift | null;
  onClose: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

export const SimpleShiftEditDialog: React.FC<SimpleShiftEditDialogProps> = ({
  open,
  shift,
  onClose,
  onUpdated,
  onDeleted,
}) => {
  const { workplaces, updateShift, deleteShift } = useSimpleShiftStore();
  const { country } = useI18nStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Shift | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ダイアログが開いた時の初期化
  React.useEffect(() => {
    if (shift && open) {
      setEditData({ ...shift });
      setIsEditing(false);
      setErrors({});
    }
  }, [shift, open]);

  // 編集開始
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    if (shift) {
      setEditData({ ...shift });
    }
    setIsEditing(false);
    setErrors({});
  };

  // バリデーション
  const validateForm = () => {
    if (!editData) return false;

    const newErrors: Record<string, string> = {};

    if (!editData.date) newErrors.date = '日付を選択してください';
    if (!editData.startTime) newErrors.startTime = '開始時間を入力してください';
    if (!editData.endTime) newErrors.endTime = '終了時間を入力してください';
    if (!editData.workplaceName)
      newErrors.workplaceName = '勤務先を選択してください';
    if (editData.hourlyRate <= 0)
      newErrors.hourlyRate = '時給を入力してください';

    // 時間の整合性チェック
    if (editData.startTime && editData.endTime) {
      const start = new Date(`2024-01-01T${editData.startTime}`);
      const end = new Date(`2024-01-01T${editData.endTime}`);
      if (start >= end) {
        newErrors.endTime = '終了時間は開始時間より後にしてください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 収入計算
  const calculateEarnings = (data: Shift) => {
    if (data.startTime && data.endTime && data.hourlyRate) {
      const start = new Date(`2024-01-01T${data.startTime}`);
      const end = new Date(`2024-01-01T${data.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return Math.floor(hours * data.hourlyRate);
    }
    return 0;
  };

  // 勤務先変更時の処理
  const handleWorkplaceChange = (workplaceName: string) => {
    if (!editData) return;

    const workplace = workplaces.find(w => w.name === workplaceName);
    if (workplace) {
      const updatedData = {
        ...editData,
        workplaceName: workplace.name,
        hourlyRate: workplace.defaultHourlyRate,
      };
      updatedData.totalEarnings = calculateEarnings(updatedData);
      setEditData(updatedData);
    }
  };

  // フォーム値更新
  const handleFieldChange = (field: keyof Shift, value: any) => {
    if (!editData) return;

    const updatedData = { ...editData, [field]: value };
    if (
      field === 'startTime' ||
      field === 'endTime' ||
      field === 'hourlyRate'
    ) {
      updatedData.totalEarnings = calculateEarnings(updatedData);
    }
    setEditData(updatedData);
  };

  // 保存
  const handleSave = () => {
    if (!editData || !validateForm()) return;

    const finalData = {
      ...editData,
      totalEarnings: calculateEarnings(editData),
    };

    updateShift(editData.id, finalData);
    setIsEditing(false);
    onUpdated?.();
  };

  // 削除
  const handleDelete = () => {
    if (!shift) return;

    if (
      window.confirm(
        `${shift.workplaceName}のシフト（${shift.date}）を削除しますか？`
      )
    ) {
      deleteShift(shift.id);
      onDeleted?.();
      onClose();
    }
  };

  if (!shift || !editData) return null;

  const workHours =
    editData.startTime && editData.endTime
      ? (
          (new Date(`2024-01-01T${editData.endTime}`).getTime() -
            new Date(`2024-01-01T${editData.startTime}`).getTime()) /
          (1000 * 60 * 60)
        ).toFixed(1)
      : '0';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: 'background.default',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            📅 シフト詳細
          </Typography>
          <Box>
            {!isEditing ? (
              <IconButton onClick={handleStartEdit} color="primary">
                <Edit />
              </IconButton>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={handleCancelEdit} size="small">
                  <Cancel />
                </IconButton>
                <IconButton onClick={handleSave} color="primary" size="small">
                  <Save />
                </IconButton>
              </Box>
            )}
            <IconButton onClick={handleDelete} color="error">
              <Delete />
            </IconButton>
          </Box>
        </Box>

        {/* ステータスチップ */}
        <Box sx={{ mt: 1 }}>
          <Chip
            label={
              editData.status === 'confirmed' ? '✅ 確定シフト' : '⏳ 仮シフト'
            }
            color={editData.status === 'confirmed' ? 'success' : 'warning'}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {!isEditing ? (
            // 表示モード
            <Grid container spacing={3}>
              {/* 基本情報 */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'action.hover',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor:
                      editData.status === 'confirmed'
                        ? 'success.main'
                        : 'warning.main',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Business color="primary" />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {editData.workplaceName}
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant="body1" color="text.secondary">
                          📅 勤務日:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {editData.date}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <AccessTime color="action" />
                        <Typography variant="body1" color="text.secondary">
                          時間:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {editData.startTime} - {editData.endTime} ({workHours}
                          h)
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* 収入詳細 */}
              <Grid item xs={12}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  💰 収入詳細
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        backgroundColor: 'info.light',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" color="info.contrastText">
                        時給
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: 'info.contrastText' }}
                      >
                        {formatCurrency(editData.hourlyRate)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        backgroundColor: 'warning.light',
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="warning.contrastText"
                      >
                        勤務時間
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: 'warning.contrastText' }}
                      >
                        {workHours}h
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        backgroundColor: 'success.light',
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="success.contrastText"
                      >
                        総収入
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: 'success.contrastText' }}
                      >
                        {formatCurrency(editData.totalEarnings)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          ) : (
            // 編集モード
            <Grid container spacing={3}>
              {/* 日付 */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="勤務日"
                  type="date"
                  fullWidth
                  value={editData.date}
                  onChange={e => handleFieldChange('date', e.target.value)}
                  error={Boolean(errors.date)}
                  helperText={errors.date}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* 勤務先 */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={Boolean(errors.workplaceName)}>
                  <InputLabel>勤務先</InputLabel>
                  <Select
                    value={editData.workplaceName}
                    label="勤務先"
                    onChange={e => handleWorkplaceChange(e.target.value)}
                  >
                    {workplaces.map(workplace => (
                      <MenuItem key={workplace.id} value={workplace.name}>
                        {workplace.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.workplaceName && (
                    <Typography variant="caption" color="error">
                      {errors.workplaceName}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* 開始時間 */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="開始時間"
                  type="time"
                  fullWidth
                  value={editData.startTime}
                  onChange={e => handleFieldChange('startTime', e.target.value)}
                  error={Boolean(errors.startTime)}
                  helperText={errors.startTime}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* 終了時間 */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="終了時間"
                  type="time"
                  fullWidth
                  value={editData.endTime}
                  onChange={e => handleFieldChange('endTime', e.target.value)}
                  error={Boolean(errors.endTime)}
                  helperText={errors.endTime}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* 時給 */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="時給"
                  type="number"
                  fullWidth
                  value={editData.hourlyRate}
                  onChange={e =>
                    handleFieldChange(
                      'hourlyRate',
                      parseInt(e.target.value) || 0
                    )
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

              {/* 予想収入 */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'success.main',
                    borderRadius: 1,
                    backgroundColor: 'success.light',
                    color: 'success.contrastText',
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    更新後収入
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(calculateEarnings(editData))}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </motion.div>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose} sx={{ minWidth: 100 }}>
          {isEditing ? 'キャンセル' : '閉じる'}
        </Button>

        {!isEditing && (
          <Button
            variant="contained"
            onClick={handleStartEdit}
            sx={{
              minWidth: 100,
              background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
            }}
          >
            編集
          </Button>
        )}

        {isEditing && (
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              minWidth: 100,
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            }}
          >
            保存
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
