// 🏢 シフトボード風バイト先管理コンポーネント

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  Business,
  Edit,
  Delete,
  AttachMoney,
  Palette,
  Work,
  Schedule,
  ExpandMore,
  MonetizationOn,
  NightlightRound,
  WbSunny,
  CalendarToday,
  DirectionsCar,
  AddCircle,
  RemoveCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSimpleShiftStore } from '../store/simpleShiftStore';

interface WorkplaceFormData {
  name: string;
  defaultHourlyRate: number;
  color: string;
  description?: string;
  paymentDate?: number;
  timeBasedRates?: {
    startTime: string;
    endTime: string;
    rate: number;
    name: string;
  }[];
  transportationFee?: number;
  weekdayRates?: {
    monday?: number;
    tuesday?: number;
    wednesday?: number;
    thursday?: number;
    friday?: number;
    saturday?: number;
    sunday?: number;
  };
  allowances?: {
    name: string;
    amount: number;
    type: 'daily' | 'monthly' | 'shift';
  }[];
  deductions?: {
    name: string;
    amount: number;
    type: 'percentage' | 'fixed';
  }[];
}

const defaultColors = [
  '#4caf50',
  '#2196f3',
  '#ff9800',
  '#f44336',
  '#9c27b0',
  '#00bcd4',
  '#cddc39',
  '#ff5722',
  '#607d8b',
  '#795548',
];

export const WorkplaceManager: React.FC = () => {
  const { workplaces, addWorkplace, updateWorkplace, deleteWorkplace, shifts } =
    useSimpleShiftStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkplaceFormData>({
    name: '',
    defaultHourlyRate: 1000,
    color: '#4caf50',
    description: '',
    paymentDate: 25,
    timeBasedRates: [],
    transportationFee: 0,
    weekdayRates: {},
    allowances: [],
    deductions: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // フォームリセット
  const resetForm = () => {
    setFormData({
      name: '',
      defaultHourlyRate: 1000,
      color: '#4caf50',
      description: '',
      paymentDate: 25,
      timeBasedRates: [],
      transportationFee: 0,
      weekdayRates: {},
      allowances: [],
      deductions: [],
    });
    setErrors({});
    setEditingWorkplace(null);
  };

  // バイト先追加ダイアログを開く
  const handleAddClick = () => {
    resetForm();
    setDialogOpen(true);
  };

  // バイト先編集ダイアログを開く
  const handleEditClick = (workplaceId: string) => {
    const workplace = workplaces.find(w => w.id === workplaceId);
    if (workplace) {
      setFormData({
        name: workplace.name,
        defaultHourlyRate: workplace.defaultHourlyRate,
        color: workplace.color,
        description: workplace.description || '',
        paymentDate: workplace.paymentDate || 25,
        timeBasedRates: workplace.timeBasedRates || [],
        transportationFee: workplace.transportationFee || 0,
        weekdayRates: workplace.weekdayRates || {},
        allowances: workplace.allowances || [],
        deductions: workplace.deductions || [],
      });
      setEditingWorkplace(workplaceId);
      setDialogOpen(true);
    }
  };

  // バリデーション
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'バイト先名を入力してください';
    }

    if (formData.defaultHourlyRate <= 0) {
      newErrors.defaultHourlyRate = '正しい時給を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存処理
  const handleSave = () => {
    if (!validateForm()) return;

    if (editingWorkplace) {
      // 編集
      updateWorkplace(editingWorkplace, formData);
    } else {
      // 新規追加
      addWorkplace(formData);
    }

    setDialogOpen(false);
    resetForm();
  };

  // 削除処理
  const handleDelete = (workplaceId: string) => {
    const workplace = workplaces.find(w => w.id === workplaceId);
    if (!workplace) return;

    // そのバイト先のシフト数を確認
    const relatedShifts = shifts.filter(
      shift => shift.workplaceName === workplace.name
    );

    if (relatedShifts.length > 0) {
      if (
        !window.confirm(
          `${workplace.name}には${relatedShifts.length}件のシフトが登録されています。削除しますか？`
        )
      ) {
        return;
      }
    }

    deleteWorkplace(workplaceId);
  };

  // バイト先ごとのシフト数と収入を計算
  const getWorkplaceStats = (workplaceName: string) => {
    const relatedShifts = shifts.filter(
      shift => shift.workplaceName === workplaceName
    );
    const totalEarnings = relatedShifts.reduce(
      (sum, shift) => sum + shift.totalEarnings,
      0
    );
    return {
      shiftCount: relatedShifts.length,
      totalEarnings,
    };
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* ヘッダー */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              mb: 2,
            }}
          >
            <Business sx={{ color: 'primary.main', fontSize: 40, mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              バイト先管理
            </Typography>
            <Typography variant="body1" color="text.secondary">
              働いているバイト先を登録・管理できます
            </Typography>
          </Box>

          {workplaces.length === 0 && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={handleAddClick}
                sx={{
                  background:
                    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)',
                  },
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  boxShadow: '0 8px 24px rgba(67, 233, 123, 0.3)',
                }}
              >
                バイト先を登録
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* バイト先一覧 */}
      {workplaces.length > 0 && (
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                登録済みバイト先 ({workplaces.length}件)
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddClick}
                sx={{
                  background:
                    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)',
                  },
                  borderRadius: 3,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(67, 233, 123, 0.25)',
                }}
              >
                バイト先を登録
              </Button>
            </Box>

            <List>
              {workplaces.map((workplace, index) => {
                const stats = getWorkplaceStats(workplace.name);

                return (
                  <React.Fragment key={workplace.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <ListItem
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          mb: 2,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              backgroundColor: workplace.color,
                              width: 48,
                              height: 48,
                            }}
                          >
                            <Business />
                          </Avatar>
                        </ListItemAvatar>

                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {workplace.name}
                              </Typography>
                              {stats.shiftCount > 0 && (
                                <Chip
                                  label={`${stats.shiftCount}件`}
                                  size="small"
                                  color="primary"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  mb: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  <AttachMoney
                                    sx={{
                                      fontSize: 16,
                                      color: 'text.secondary',
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    時給 ¥
                                    {workplace.defaultHourlyRate.toLocaleString()}
                                  </Typography>
                                </Box>

                                {stats.totalEarnings > 0 && (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                    }}
                                  >
                                    <Schedule
                                      sx={{
                                        fontSize: 16,
                                        color: 'success.main',
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: 'success.main',
                                        fontWeight: 600,
                                      }}
                                    >
                                      総収入 ¥
                                      {stats.totalEarnings.toLocaleString()}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>

                              {workplace.description && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ fontSize: '0.8rem' }}
                                >
                                  {workplace.description}
                                </Typography>
                              )}
                            </Box>
                          }
                        />

                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleEditClick(workplace.id)}
                            sx={{ mr: 1 }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => handleDelete(workplace.id)}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </motion.div>

                    {index < workplaces.length - 1 && (
                      <Divider sx={{ my: 1 }} />
                    )}
                  </React.Fragment>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}

      {/* バイト先追加・編集ダイアログ */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Business sx={{ mr: 1, color: 'primary.main' }} />
            {editingWorkplace ? 'バイト先を編集' : '新しいバイト先を追加'}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          <Grid container spacing={2}>
            {/* 基本情報 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="バイト先名"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                error={Boolean(errors.name)}
                helperText={errors.name}
                placeholder="例: ファミリーマート〇〇店"
                size="small"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="基本時給"
                value={formData.defaultHourlyRate}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    defaultHourlyRate: parseInt(e.target.value) || 0,
                  }))
                }
                error={Boolean(errors.defaultHourlyRate)}
                helperText={errors.defaultHourlyRate}
                InputProps={{
                  startAdornment: <span style={{ marginRight: 8 }}>¥</span>,
                }}
                size="small"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="給料日"
                value={formData.paymentDate || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    paymentDate: parseInt(e.target.value) || undefined,
                  }))
                }
                placeholder="25"
                size="small"
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 4 }}>日</span>,
                }}
              />
            </Grid>

            {/* カラー選択 */}
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
              >
                <Palette sx={{ mr: 0.5, fontSize: 16 }} />
                カラー
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {defaultColors.map(color => (
                  <Box
                    key={color}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: color,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      border:
                        formData.color === color ? '2px solid' : '1px solid',
                      borderColor:
                        formData.color === color
                          ? 'primary.main'
                          : 'transparent',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </Box>
            </Grid>

            {/* 時間帯別時給 */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">時間帯別時給設定</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    {formData.timeBasedRates?.map((rate, index) => (
                      <Box
                        key={index}
                        sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                      >
                        <TextField
                          label="名前"
                          value={rate.name}
                          onChange={e => {
                            const newRates = [
                              ...(formData.timeBasedRates || []),
                            ];
                            newRates[index] = { ...rate, name: e.target.value };
                            setFormData(prev => ({
                              ...prev,
                              timeBasedRates: newRates,
                            }));
                          }}
                          size="small"
                          sx={{ width: '120px' }}
                          placeholder="深夜"
                        />
                        <TextField
                          label="開始時間"
                          type="time"
                          value={rate.startTime}
                          onChange={e => {
                            const newRates = [
                              ...(formData.timeBasedRates || []),
                            ];
                            newRates[index] = {
                              ...rate,
                              startTime: e.target.value,
                            };
                            setFormData(prev => ({
                              ...prev,
                              timeBasedRates: newRates,
                            }));
                          }}
                          size="small"
                          sx={{ width: '120px' }}
                        />
                        <TextField
                          label="終了時間"
                          type="time"
                          value={rate.endTime}
                          onChange={e => {
                            const newRates = [
                              ...(formData.timeBasedRates || []),
                            ];
                            newRates[index] = {
                              ...rate,
                              endTime: e.target.value,
                            };
                            setFormData(prev => ({
                              ...prev,
                              timeBasedRates: newRates,
                            }));
                          }}
                          size="small"
                          sx={{ width: '120px' }}
                        />
                        <TextField
                          label="時給"
                          type="number"
                          value={rate.rate}
                          onChange={e => {
                            const newRates = [
                              ...(formData.timeBasedRates || []),
                            ];
                            newRates[index] = {
                              ...rate,
                              rate: parseInt(e.target.value) || 0,
                            };
                            setFormData(prev => ({
                              ...prev,
                              timeBasedRates: newRates,
                            }));
                          }}
                          size="small"
                          sx={{ width: '100px' }}
                        />
                        <IconButton
                          onClick={() => {
                            const newRates =
                              formData.timeBasedRates?.filter(
                                (_, i) => i !== index
                              ) || [];
                            setFormData(prev => ({
                              ...prev,
                              timeBasedRates: newRates,
                            }));
                          }}
                          size="small"
                          color="error"
                        >
                          <RemoveCircle />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      startIcon={<AddCircle />}
                      onClick={() => {
                        const newRate = {
                          name: '',
                          startTime: '22:00',
                          endTime: '05:00',
                          rate: 0,
                        };
                        setFormData(prev => ({
                          ...prev,
                          timeBasedRates: [
                            ...(prev.timeBasedRates || []),
                            newRate,
                          ],
                        }));
                      }}
                      variant="outlined"
                      size="small"
                    >
                      時間帯を追加
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* 曜日別時給 */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">曜日別時給設定</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={1}>
                    {[
                      'monday',
                      'tuesday',
                      'wednesday',
                      'thursday',
                      'friday',
                      'saturday',
                      'sunday',
                    ].map((day, index) => (
                      <Grid item xs={6} sm={4} key={day}>
                        <TextField
                          fullWidth
                          type="number"
                          label={
                            ['月', '火', '水', '木', '金', '土', '日'][index]
                          }
                          value={
                            formData.weekdayRates?.[
                              day as keyof typeof formData.weekdayRates
                            ] || ''
                          }
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              weekdayRates: {
                                ...prev.weekdayRates,
                                [day]: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              },
                            }))
                          }
                          size="small"
                        />
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* 交通費 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="交通費 (日額)"
                value={formData.transportationFee || 0}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    transportationFee: parseInt(e.target.value) || 0,
                  }))
                }
                InputProps={{
                  startAdornment: (
                    <DirectionsCar sx={{ mr: 0.5, fontSize: 16 }} />
                  ),
                }}
                size="small"
              />
            </Grid>

            {/* メモ */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="メモ"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="例: 土日のみ、駅前店舗など"
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name.trim()}
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)',
              },
            }}
          >
            {editingWorkplace ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
