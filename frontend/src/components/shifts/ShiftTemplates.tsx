import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccessTime,
  Business,
  AttachMoney,
  Delete,
  Edit,
  Add,
  ContentCopy,
  Star,
  StarBorder,
} from '@mui/icons-material';
import type { CreateShiftData } from '../../types/shift';

interface ShiftTemplate {
  id: string;
  name: string;
  workplace: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyRate: number;
  isHoliday: boolean;
  isNightShift: boolean;
  transportFee: number;
  isFavorite: boolean;
  createdAt: string;
}

interface ShiftTemplatesProps {
  onApplyTemplate: (template: Partial<CreateShiftData>) => void;
  onClose?: () => void;
}

const defaultTemplates: ShiftTemplate[] = [
  {
    id: 'morning',
    name: '朝バイト',
    workplace: 'カフェ',
    startTime: '08:00',
    endTime: '12:00',
    breakMinutes: 0,
    hourlyRate: 1000,
    isHoliday: false,
    isNightShift: false,
    transportFee: 300,
    isFavorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evening',
    name: '夕方バイト',
    workplace: '小売店',
    startTime: '17:00',
    endTime: '21:00',
    breakMinutes: 0,
    hourlyRate: 1100,
    isHoliday: false,
    isNightShift: false,
    transportFee: 200,
    isFavorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'night',
    name: '夜勤バイト',
    workplace: 'コンビニ',
    startTime: '22:00',
    endTime: '06:00',
    breakMinutes: 60,
    hourlyRate: 1200,
    isHoliday: false,
    isNightShift: true,
    transportFee: 400,
    isFavorite: true,
    createdAt: new Date().toISOString(),
  },
];

export const ShiftTemplates: React.FC<ShiftTemplatesProps> = ({
  onApplyTemplate,
  onClose,
}) => {
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(
    null
  );
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] =
    useState<ShiftTemplate | null>(null);

  // LocalStorageからテンプレートを読み込み
  useEffect(() => {
    const savedTemplates = localStorage.getItem('shiftTemplates');
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        setTemplates([...defaultTemplates, ...parsed]);
      } catch (error) {
        console.error('Failed to parse saved templates:', error);
        setTemplates(defaultTemplates);
      }
    } else {
      setTemplates(defaultTemplates);
    }
  }, []);

  // テンプレートの保存
  const saveTemplates = (newTemplates: ShiftTemplate[]) => {
    const customTemplates = newTemplates.filter(
      t => !defaultTemplates.find(dt => dt.id === t.id)
    );
    localStorage.setItem('shiftTemplates', JSON.stringify(customTemplates));
    setTemplates(newTemplates);
  };

  // 勤務時間の計算
  const calculateWorkHours = (
    startTime: string,
    endTime: string,
    breakMinutes: number = 0
  ): number => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    if (end <= start) {
      end.setDate(end.getDate() + 1); // 日をまたぐ場合
    }

    const workTimeMs = end.getTime() - start.getTime();
    const workHours = workTimeMs / (1000 * 60 * 60);
    const breakHours = breakMinutes / 60;

    return Math.max(0, workHours - breakHours);
  };

  // 予想収入の計算
  const calculateEarnings = (template: ShiftTemplate): number => {
    const workHours = calculateWorkHours(
      template.startTime,
      template.endTime,
      template.breakMinutes
    );
    let totalWage = workHours * template.hourlyRate;

    if (template.isHoliday) totalWage *= 1.25;
    if (template.isNightShift) totalWage *= 1.25;

    return totalWage + template.transportFee;
  };

  // テンプレート適用
  const handleApplyTemplate = (template: ShiftTemplate) => {
    const shiftData: Partial<CreateShiftData> = {
      jobSourceName: template.workplace,
      startTime: template.startTime,
      endTime: template.endTime,
      breakMinutes: template.breakMinutes,
      hourlyRate: template.hourlyRate,
      isHoliday: template.isHoliday,
      isNightShift: template.isNightShift,
      transportFee: template.transportFee,
    };

    onApplyTemplate(shiftData);
    onClose?.();
  };

  // お気に入り切り替え
  const toggleFavorite = (templateId: string) => {
    const updatedTemplates = templates.map(t =>
      t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
    );
    saveTemplates(updatedTemplates);
  };

  // テンプレート編集
  const handleEditTemplate = (template: ShiftTemplate) => {
    setEditingTemplate({ ...template });
    setEditDialogOpen(true);
  };

  // テンプレート削除
  const handleDeleteTemplate = (template: ShiftTemplate) => {
    setDeletingTemplate(template);
    setConfirmDeleteOpen(true);
  };

  // 新規テンプレート作成
  const handleCreateTemplate = () => {
    const newTemplate: ShiftTemplate = {
      id: `custom_${Date.now()}`,
      name: '新しいテンプレート',
      workplace: 'バイト先',
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 60,
      hourlyRate: 1000,
      isHoliday: false,
      isNightShift: false,
      transportFee: 0,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };
    setEditingTemplate(newTemplate);
    setEditDialogOpen(true);
  };

  // テンプレート保存
  const handleSaveTemplate = () => {
    if (!editingTemplate) return;

    const isNew = !templates.find(t => t.id === editingTemplate.id);
    let updatedTemplates;

    if (isNew) {
      updatedTemplates = [...templates, editingTemplate];
    } else {
      updatedTemplates = templates.map(t =>
        t.id === editingTemplate.id ? editingTemplate : t
      );
    }

    saveTemplates(updatedTemplates);
    setEditDialogOpen(false);
    setEditingTemplate(null);
  };

  // テンプレート削除確定
  const confirmDelete = () => {
    if (!deletingTemplate) return;

    const updatedTemplates = templates.filter(
      t => t.id !== deletingTemplate.id
    );
    saveTemplates(updatedTemplates);
    setConfirmDeleteOpen(false);
    setDeletingTemplate(null);
  };

  const favoriteTemplates = templates.filter(t => t.isFavorite);
  const otherTemplates = templates.filter(t => !t.isFavorite);

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6">シフトテンプレート</Typography>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={handleCreateTemplate}
        >
          新規作成
        </Button>
      </Box>

      {/* お気に入りテンプレート */}
      {favoriteTemplates.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            ⭐ お気に入り
          </Typography>
          <Grid container spacing={2}>
            {favoriteTemplates.map(template => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 },
                    border: '2px solid #FFD700',
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={1}
                    >
                      <Typography variant="h6" component="div">
                        {template.name}
                      </Typography>
                      <Box>
                        <Tooltip title="お気に入り解除">
                          <IconButton
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              toggleFavorite(template.id);
                            }}
                          >
                            <Star color="warning" />
                          </IconButton>
                        </Tooltip>
                        {!defaultTemplates.find(
                          dt => dt.id === template.id
                        ) && (
                          <>
                            <Tooltip title="編集">
                              <IconButton
                                size="small"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleEditTemplate(template);
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="削除">
                              <IconButton
                                size="small"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteTemplate(template);
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Business fontSize="small" color="action" />
                      <Typography variant="body2">
                        {template.workplace}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="body2">
                        {template.startTime} - {template.endTime}
                        {template.breakMinutes > 0 &&
                          ` (休憩${template.breakMinutes}分)`}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AttachMoney fontSize="small" color="action" />
                      <Typography variant="body2">
                        時給¥{template.hourlyRate.toLocaleString()}
                        {template.isNightShift && ' + 深夜手当'}
                        {template.isHoliday && ' + 休日手当'}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Chip
                        label={`予想収入: ¥${Math.round(calculateEarnings(template)).toLocaleString()}`}
                        color="success"
                        size="small"
                      />
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<ContentCopy />}
                      onClick={() => handleApplyTemplate(template)}
                    >
                      このテンプレートを適用
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* その他のテンプレート */}
      {otherTemplates.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            その他のテンプレート
          </Typography>
          <Grid container spacing={2}>
            {otherTemplates.map(template => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 },
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={1}
                    >
                      <Typography variant="h6" component="div">
                        {template.name}
                      </Typography>
                      <Box>
                        <Tooltip title="お気に入りに追加">
                          <IconButton
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              toggleFavorite(template.id);
                            }}
                          >
                            <StarBorder />
                          </IconButton>
                        </Tooltip>
                        {!defaultTemplates.find(
                          dt => dt.id === template.id
                        ) && (
                          <>
                            <Tooltip title="編集">
                              <IconButton
                                size="small"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleEditTemplate(template);
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="削除">
                              <IconButton
                                size="small"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteTemplate(template);
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Business fontSize="small" color="action" />
                      <Typography variant="body2">
                        {template.workplace}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="body2">
                        {template.startTime} - {template.endTime}
                        {template.breakMinutes > 0 &&
                          ` (休憩${template.breakMinutes}分)`}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AttachMoney fontSize="small" color="action" />
                      <Typography variant="body2">
                        時給¥{template.hourlyRate.toLocaleString()}
                        {template.isNightShift && ' + 深夜手当'}
                        {template.isHoliday && ' + 休日手当'}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Chip
                        label={`予想収入: ¥${Math.round(calculateEarnings(template)).toLocaleString()}`}
                        color="success"
                        size="small"
                      />
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<ContentCopy />}
                      onClick={() => handleApplyTemplate(template)}
                    >
                      このテンプレートを適用
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* テンプレート編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTemplate && templates.find(t => t.id === editingTemplate.id)
            ? 'テンプレート編集'
            : '新規テンプレート作成'}
        </DialogTitle>
        <DialogContent>
          {editingTemplate && (
            <Box sx={{ pt: 1 }}>
              <TextField
                label="テンプレート名"
                fullWidth
                margin="normal"
                value={editingTemplate.name}
                onChange={e =>
                  setEditingTemplate({
                    ...editingTemplate,
                    name: e.target.value,
                  })
                }
              />

              <TextField
                label="勤務先"
                fullWidth
                margin="normal"
                value={editingTemplate.workplace}
                onChange={e =>
                  setEditingTemplate({
                    ...editingTemplate,
                    workplace: e.target.value,
                  })
                }
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="開始時間"
                    type="time"
                    fullWidth
                    margin="normal"
                    value={editingTemplate.startTime}
                    onChange={e =>
                      setEditingTemplate({
                        ...editingTemplate,
                        startTime: e.target.value,
                      })
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="終了時間"
                    type="time"
                    fullWidth
                    margin="normal"
                    value={editingTemplate.endTime}
                    onChange={e =>
                      setEditingTemplate({
                        ...editingTemplate,
                        endTime: e.target.value,
                      })
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="休憩時間（分）"
                    type="number"
                    fullWidth
                    margin="normal"
                    value={editingTemplate.breakMinutes}
                    onChange={e =>
                      setEditingTemplate({
                        ...editingTemplate,
                        breakMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="時給"
                    type="number"
                    fullWidth
                    margin="normal"
                    value={editingTemplate.hourlyRate}
                    onChange={e =>
                      setEditingTemplate({
                        ...editingTemplate,
                        hourlyRate: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </Grid>
              </Grid>

              <TextField
                label="交通費"
                type="number"
                fullWidth
                margin="normal"
                value={editingTemplate.transportFee}
                onChange={e =>
                  setEditingTemplate({
                    ...editingTemplate,
                    transportFee: parseInt(e.target.value) || 0,
                  })
                }
              />

              <Alert severity="info" sx={{ mt: 2 }}>
                予想収入: ¥
                {Math.round(
                  calculateEarnings(editingTemplate)
                ).toLocaleString()}
                （
                {calculateWorkHours(
                  editingTemplate.startTime,
                  editingTemplate.endTime,
                  editingTemplate.breakMinutes
                ).toFixed(1)}
                時間勤務）
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
          <Button
            onClick={handleSaveTemplate}
            variant="contained"
            disabled={!editingTemplate?.name || !editingTemplate?.workplace}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>テンプレート削除</DialogTitle>
        <DialogContent>
          <Typography>
            「{deletingTemplate?.name}
            」を削除しますか？この操作は取り消せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
