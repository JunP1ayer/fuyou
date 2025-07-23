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
  Switch,
  FormControlLabel,
  Grid,
} from '@mui/material';
import { ChromePicker } from 'react-color';
import type { 
  Workplace, 
  CreateWorkplaceData, 
  UpdateWorkplaceData 
} from '../../types/shift';

interface WorkplaceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWorkplaceData | UpdateWorkplaceData) => Promise<void>;
  editingWorkplace?: Workplace;
  loading: boolean;
}

// デフォルトカラーパレット
const DEFAULT_COLORS = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#F44336', // Red
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#FFEB3B', // Yellow
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#E91E63', // Pink
];

export const WorkplaceFormDialog: React.FC<WorkplaceFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  editingWorkplace,
  loading,
}) => {
  const [formData, setFormData] = useState<CreateWorkplaceData>({
    name: '',
    hourlyRate: 1000,
    color: DEFAULT_COLORS[0],
    payDay: 25,
    description: '',
    isActive: true,
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [error, setError] = useState<string>('');

  // 編集時にフォームデータを設定
  useEffect(() => {
    if (editingWorkplace) {
      setFormData({
        name: editingWorkplace.name,
        hourlyRate: editingWorkplace.hourlyRate,
        color: editingWorkplace.color,
        payDay: editingWorkplace.payDay || 25,
        description: editingWorkplace.description || '',
        isActive: editingWorkplace.isActive,
      });
    } else {
      setFormData({
        name: '',
        hourlyRate: 1000,
        color: DEFAULT_COLORS[0],
        payDay: 25,
        description: '',
        isActive: true,
      });
    }
    setError('');
  }, [editingWorkplace, open]);

  const handleInputChange = (field: keyof CreateWorkplaceData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    // バリデーション
    if (!formData.name.trim()) {
      setError('職場名は必須です');
      return;
    }
    if (formData.hourlyRate <= 0) {
      setError('時給は1円以上で入力してください');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {editingWorkplace ? 'バイト先を編集' : 'バイト先を追加'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* 職場名 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="職場名"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!error && !formData.name.trim()}
                helperText={error && !formData.name.trim() ? error : ''}
                disabled={loading}
                placeholder="例: コンビニA、ファミレスB"
              />
            </Grid>

            {/* 時給 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="時給"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', Number(e.target.value))}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>¥</Typography>,
                }}
                disabled={loading}
                inputProps={{ min: 1, step: 10 }}
              />
            </Grid>

            {/* 給料日 */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel>給料日</InputLabel>
                <Select
                  value={formData.payDay || 25}
                  label="給料日"
                  onChange={(e) => handleInputChange('payDay', Number(e.target.value))}
                >
                  {[...Array(31)].map((_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      毎月 {i + 1}日
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* カラー設定 */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                カレンダー表示色
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {DEFAULT_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => handleInputChange('color', color)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: formData.color === color ? '3px solid #000' : '2px solid #ddd',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                    }}
                  />
                ))}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  disabled={loading}
                >
                  カスタム
                </Button>
              </Box>
              
              {showColorPicker && (
                <Box sx={{ mb: 2 }}>
                  <ChromePicker
                    color={formData.color}
                    onChange={(color) => handleInputChange('color', color.hex)}
                  />
                </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: formData.color,
                    border: '1px solid #ddd',
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  選択色: {formData.color}
                </Typography>
              </Box>
            </Grid>

            {/* 説明 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="説明（任意）"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={2}
                disabled={loading}
                placeholder="職場の詳細情報やメモ"
              />
            </Grid>

            {/* アクティブ状態 */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    disabled={loading}
                  />
                }
                label="アクティブ（シフト登録で選択可能）"
              />
            </Grid>
          </Grid>

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? '保存中...' : editingWorkplace ? '更新' : '追加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};