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
  FormControlLabel,
  Switch,
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
  // デバッグ: 編集中の変更を可視化
  React.useEffect(() => {
    if (!isEditing || !editData) return;
    try {
      const next = calculateEarnings(editData);
      // 重要: 開発時のみ詳細ログ
      if (process.env.NODE_ENV !== 'production') {
        console.debug('🧮 SimpleShiftEditDialog recalculated', {
          startTime: editData.startTime,
          endTime: editData.endTime,
          hourlyRate: editData.hourlyRate,
          breakTime: editData.breakTime,
          autoBreak6Hours: editData.autoBreak6Hours,
          autoBreak8Hours: editData.autoBreak8Hours,
          overtimeEnabled: editData.overtimeEnabled,
          nextEarnings: next,
        });
      }
    } catch {}
  }, [isEditing, editData?.startTime, editData?.endTime, editData?.hourlyRate, editData?.breakTime, editData?.autoBreak6Hours, editData?.autoBreak8Hours, editData?.overtimeEnabled]);

  // ダイアログが開いた時の初期化
  React.useEffect(() => {
    if (shift && open) {
      const shiftWithDefaults = {
        ...shift,
        // デフォルト値を設定
        overtimeEnabled: shift.overtimeEnabled !== false, // デフォルト true
        autoBreak6Hours: shift.autoBreak6Hours !== false, // デフォルト true
        autoBreak8Hours: shift.autoBreak8Hours !== false, // デフォルト true
      };
      setEditData(shiftWithDefaults);
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

  // 収入計算（休憩時間・残業割増対応）
  const calculateEarnings = (data: Shift) => {
    if (data.startTime && data.endTime && data.hourlyRate) {
      const start = new Date(`2024-01-01T${data.startTime}`);
      const end = new Date(`2024-01-01T${data.endTime}`);
      const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      
      // 休憩時間を計算
      let breakMinutes = 0;
      
      // 手動入力の休憩時間
      if (data.breakTime) {
        breakMinutes = data.breakTime;
      }
      
      // 自動休憩時間（6時間・8時間越え）
      const workHours = totalMinutes / 60;
      if (data.autoBreak8Hours && workHours > 8) {
        breakMinutes += 60; // 8時間越えで1時間休憩
      } else if (data.autoBreak6Hours && workHours > 6) {
        breakMinutes += 45; // 6時間越えで45分休憩
      }
      
      // 実労働時間を計算
      const actualWorkMinutes = Math.max(0, totalMinutes - breakMinutes);
      const actualWorkHours = actualWorkMinutes / 60;
      
      // 残業割増計算
      let earnings = 0;
      const overtimeEnabled = data.overtimeEnabled !== false; // デフォルト true
      
      if (overtimeEnabled && actualWorkHours > 8) {
        // 8時間以内は通常時給
        const regularHours = 8;
        const overtimeHours = actualWorkHours - 8;
        
        earnings = (regularHours * data.hourlyRate) + (overtimeHours * data.hourlyRate * 1.25);
      } else {
        // 通常計算
        earnings = actualWorkHours * data.hourlyRate;
      }
      
      return Math.floor(earnings);
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
      field === 'hourlyRate' ||
      field === 'breakTime' ||
      field === 'autoBreak6Hours' ||
      field === 'autoBreak8Hours' ||
      field === 'overtimeEnabled' ||
      field === 'dayOfWeekSettingsEnabled'
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

  // 勤務時間・休憩時間・実働時間の計算
  const getTimeInfo = () => {
    if (!editData.startTime || !editData.endTime) {
      return { totalHours: '0', breakMinutes: 0, actualHours: '0' };
    }
    
    const start = new Date(`2024-01-01T${editData.startTime}`);
    const end = new Date(`2024-01-01T${editData.endTime}`);
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const totalHours = totalMinutes / 60;
    
    let breakMinutes = 0;
    if (editData.breakTime) breakMinutes += editData.breakTime;
    
    const workHours = totalMinutes / 60;
    if (editData.autoBreak8Hours && workHours > 8) {
      breakMinutes += 60;
    } else if (editData.autoBreak6Hours && workHours > 6) {
      breakMinutes += 45;
    }
    
    const actualMinutes = Math.max(0, totalMinutes - breakMinutes);
    const actualHours = actualMinutes / 60;
    
    return {
      totalHours: totalHours.toFixed(1),
      breakMinutes,
      actualHours: actualHours.toFixed(1)
    };
  };

  const timeInfo = getTimeInfo();

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

                    <Grid item xs={12}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                      >
                        <AccessTime color="action" />
                        <Typography variant="body1" color="text.secondary">
                          時間:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {editData.startTime} - {editData.endTime} (総{timeInfo.totalHours}h)
                        </Typography>
                      </Box>
                      {timeInfo.breakMinutes > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            休憩: {timeInfo.breakMinutes}分 → 実働: {timeInfo.actualHours}h
                          </Typography>
                        </Box>
                      )}
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
                        {timeInfo.actualHours}h
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

              {/* 残業設定 */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  💼 労働条件設定
                </Typography>
              </Grid>

              {/* 残業割増設定 */}
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editData.overtimeEnabled !== false} // デフォルト true
                      onChange={e =>
                        handleFieldChange('overtimeEnabled', e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label="残業割増25%（8時間超）"
                />
              </Grid>

              {/* 曜日別設定オンオフ */}
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editData.dayOfWeekSettingsEnabled || false}
                      onChange={e =>
                        handleFieldChange('dayOfWeekSettingsEnabled', e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label="曜日別詳細設定"
                />
              </Grid>

              {/* 曜日別設定が有効な場合のみ表示 */}
              {editData.dayOfWeekSettingsEnabled && (
                <>
                  {/* 休憩時間設定 */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      ⏱️ 休憩時間設定
                    </Typography>
                  </Grid>

                  {/* 自動休憩設定 */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={editData.autoBreak6Hours !== false} // デフォルト true
                            onChange={e =>
                              handleFieldChange('autoBreak6Hours', e.target.checked)
                            }
                            color="primary"
                          />
                        }
                        label="6時間越えで45分休憩"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={editData.autoBreak8Hours !== false} // デフォルト true
                            onChange={e =>
                              handleFieldChange('autoBreak8Hours', e.target.checked)
                            }
                            color="primary"
                          />
                        }
                        label="8時間越えで60分休憩"
                      />
                    </Box>
                  </Grid>

                  {/* 手動休憩時間入力 */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="追加休憩時間（分）"
                      type="number"
                      size="small"
                      value={editData.breakTime || ''}
                      onChange={e =>
                        handleFieldChange(
                          'breakTime',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      helperText="手動で追加する休憩時間を分単位で入力"
                      inputProps={{ min: 0, max: 480 }}
                      sx={{ maxWidth: 300 }}
                    />
                  </Grid>
                </>
              )}

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

              {/* 時間詳細表示 */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'info.main',
                    borderRadius: 1,
                    backgroundColor: 'info.light',
                    color: 'info.contrastText',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    時間詳細
                  </Typography>
                  <Typography variant="body2">
                    総勤務時間: {timeInfo.totalHours}h
                  </Typography>
                  <Typography variant="body2">
                    休憩時間: {timeInfo.breakMinutes}分
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    実働時間: {timeInfo.actualHours}h
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
