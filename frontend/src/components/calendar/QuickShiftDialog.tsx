import { computeShiftEarnings } from '@/utils/calcShift';
// クイックシフト登録ダイアログ
import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Grid,
  Chip,
  Divider,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  AccessTime,
  Business,
  Add,
  Edit,
  Delete,
  Star,
  StarBorder,
  Save,
  Cancel,
} from '@mui/icons-material';
// 日付チップは非表示要望のため、date-fnsは未使用
import { useSimpleShiftStore } from '../../store/simpleShiftStore';
import { useShiftTemplateStore, type ShiftTemplate } from '../../store/shiftTemplateStore';
import { APP_COLOR_PALETTE } from '@/utils/colors';

interface QuickShiftDialogProps {
  open: boolean;
  selectedDate: string | null;
  onClose: () => void;
}

export const QuickShiftDialog: React.FC<QuickShiftDialogProps> = ({
  open,
  selectedDate,
  onClose,
}) => {
  const { workplaces, addShift } = useSimpleShiftStore();
  const { 
    templates, 
    addTemplate, 
    updateTemplate, 
    deleteTemplate, 
    setDefaultTemplate,
    getDefaultTemplate 
  } = useShiftTemplateStore();
  
  const [step, setStep] = useState<'select' | 'create' | 'edit'>('select');
  const [editingTemplate, setEditingTemplate] = useState<Partial<ShiftTemplate> | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null);
  
  // フォームの状態
  const [formData, setFormData] = useState({
    name: '',
    workplaceName: '',
    startTime: '09:00',
    endTime: '17:00',
    hourlyRate: 1000,
    description: '',
    color: '#FFCC02',
  });

  // テンプレート選択処理
  const handleSelectTemplate = useCallback((template: ShiftTemplate) => {
    if (!selectedDate) return;
    
    const startTime = new Date(`2000-01-01T${template.startTime}`);
    let endTime = new Date(`2000-01-01T${template.endTime}`);
    // 翌日にまたがるケース
    if (endTime.getTime() <= startTime.getTime()) {
      endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
    }

    const isPersonal = template.category === 'personal';
    const wp = workplaces.find(w => w.name === (template.workplaceName || '')) || workplaces[0] || null;
    const result = computeShiftEarnings(isPersonal ? null : wp, {
      startTime: template.startTime,
      endTime: template.endTime,
      isPersonal,
      shiftDate: selectedDate,
    });
    const totalEarnings = result.totalEarnings;
    
    addShift({
      date: selectedDate,
      startTime: template.startTime,
      endTime: template.endTime,
      workplaceName: isPersonal ? 'プライベート' : (template.workplaceName || workplaces[0]?.name || 'バイト先'),
      hourlyRate: result.baseRate,
      totalEarnings,
      status: 'confirmed',
    });
    
    onClose();
  }, [selectedDate, addShift, workplaces, onClose]);

  // 新規テンプレート作成
  const handleCreateTemplate = useCallback(() => {
    addTemplate({
      ...formData,
      category: ((formData as any).category || 'shift') as any,
      isDefault: false,
    });
    setStep('select');
    setFormData({
      name: '',
      workplaceName: '',
      startTime: '09:00',
      endTime: '17:00',
      hourlyRate: 1000,
      description: '',
      color: '#FFCC02',
    });
  }, [formData, addTemplate]);

  // テンプレート編集
  const handleEditTemplate = useCallback((template: ShiftTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      workplaceName: template.workplaceName,
      startTime: template.startTime,
      endTime: template.endTime,
      hourlyRate: template.hourlyRate,
      description: template.description || '',
      color: template.color,
    });
    setStep('edit');
  }, []);

  // テンプレート更新
  const handleUpdateTemplate = useCallback(() => {
    if (!editingTemplate?.id) return;
    
    updateTemplate(editingTemplate.id, { ...formData, category: ((formData as any).category || 'shift') as any });
    setStep('select');
    setEditingTemplate(null);
  }, [editingTemplate, formData, updateTemplate]);

  // デフォルト設定切り替え
  const handleToggleDefault = useCallback((templateId: string) => {
    setDefaultTemplate(templateId);
  }, [setDefaultTemplate]);

  // ダイアログ閉じる時のリセット
  const handleClose = useCallback(() => {
    setStep('select');
    setEditingTemplate(null);
    setSelectedTemplate(null);
    onClose();
  }, [onClose]);

  const colorOptions = APP_COLOR_PALETTE.map(c => c.color);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {step === 'select' ? 'クイックシフト登録' : 
             step === 'create' ? '新しいテンプレート' : 'テンプレート編集'}
          </Typography>
          {/* 右側の日付チップは非表示にしました */}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 2 }}>
        {step === 'select' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              テンプレートを選択して予定をすぐに登録できます（シフト/プライベート）
            </Typography>

            <List sx={{ py: 0 }}>
              {templates.map((template) => (
                <ListItemButton
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                >
                  <ListItemIcon>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: template.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AccessTime sx={{ fontSize: 16, color: '#000' }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {template.name}
                        </Typography>
                        {template.isDefault && <Star sx={{ fontSize: 16, color: 'warning.main' }} />}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {template.startTime} - {template.endTime} {template.category === 'personal' ? '' : `| ¥${template.hourlyRate}/h`}
                        </Typography>
                        {template.workplaceName && (
                          <Typography variant="caption" color="text.secondary">
                            {template.workplaceName}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleDefault(template.id);
                      }}
                    >
                      {template.isDefault ? <Star sx={{ fontSize: 16 }} /> : <StarBorder sx={{ fontSize: 16 }} />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTemplate(template);
                      }}
                    >
                      <Edit sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTemplate(template.id);
                      }}
                    >
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </ListItemButton>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setStep('create')}
            >
              新しいテンプレートを作成
            </Button>
          </Box>
        )}

        {(step === 'create' || step === 'edit') && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="テンプレート名"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例: 朝シフト、夜勤など"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>カテゴリー</InputLabel>
                  <Select
                    value={(formData as any).category || 'shift'}
                    label="カテゴリー"
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...(prev as any),
                        category: e.target.value as any,
                        ...(e.target.value === 'personal' ? { workplaceName: '' } : {}),
                      }))
                    }
                  >
                    <MenuItem value="shift">シフト</MenuItem>
                    <MenuItem value="personal">プライベート</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {((formData as any).category || 'shift') === 'shift' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>職場</InputLabel>
                    <Select
                      value={formData.workplaceName}
                      onChange={(e) => setFormData(prev => ({ ...prev, workplaceName: e.target.value }))}
                      label="職場"
                    >
                      <MenuItem value="">全ての職場で使用</MenuItem>
                      {workplaces.map((workplace) => (
                        <MenuItem key={workplace.id} value={workplace.name}>
                          {workplace.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="開始時間"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="終了時間"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {((formData as any).category || 'shift') === 'shift' ? (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="時給（円）"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                  />
                </Grid>
              ) : null}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="説明（任意）"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="テンプレートの説明"
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1 }}>色</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {colorOptions.map((color) => (
                    <Box
                      key={color}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: formData.color === color ? '3px solid' : '1px solid',
                        borderColor: formData.color === color ? 'primary.main' : 'divider',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        '&:hover': { transform: 'scale(1.1)' },
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {step === 'select' ? (
          <Button onClick={handleClose} variant="outlined">
            キャンセル
          </Button>
        ) : (
          <>
            <Button
              onClick={() => setStep('select')}
              startIcon={<Cancel />}
            >
              戻る
            </Button>
            <Button
              onClick={step === 'create' ? handleCreateTemplate : handleUpdateTemplate}
              variant="contained"
              startIcon={<Save />}
              disabled={!formData.name.trim()}
            >
              {step === 'create' ? '作成' : '更新'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};