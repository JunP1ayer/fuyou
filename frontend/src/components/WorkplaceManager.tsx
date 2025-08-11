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
  FormControlLabel,
  Switch,
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
  
  // 締日・支給日の分離
  cutoffDay: number; // 締日（1-31）
  paymentDay: number; // 支給日（1-31）  
  paymentTiming: 'nextMonth' | 'sameMonth'; // 翌月/当月
  
  // 支払い形態
  paymentType: 'hourly' | 'daily' | 'monthly' | 'commission';
  
  // 法定割増設定
  overtimeSettings: {
    nightShift: boolean; // 深夜25%
    holiday: boolean; // 休日35%
    overtime: boolean; // 残業25%
  };
  
  // 丸め・休憩ルール
  roundingRule: {
    minutes: 1 | 5 | 10 | 15 | 30;
    method: 'up' | 'down' | 'round';
  };
  breakRules: {
    over6h: number; // 6時間超の休憩（分）
    over8h: number; // 8時間超の休憩（分）
  };
  
  // 交通費詳細設定
  transportationSettings: {
    type: 'none' | 'fixed' | 'actual';
    amount: number;
    limit?: number;
    unit: 'daily' | 'monthly';
  };
  
  // 跨日シフト対応
  allowCrossDayShifts: boolean;
  
  // 既存フィールド（後方互換性のため残す）
  paymentDate?: number; // 非推奨
  transportationFee?: number; // 非推奨
  
  timeBasedRates?: {
    startTime: string;
    endTime: string;
    rate: number;
    name: string;
  }[];
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
  '#b3e5fc', // 非常に薄い水色
  '#81d4fa', // 薄い水色
  '#4fc3f7', // ライトブルー
  '#29b6f6', // ブルー
  '#03a9f4', // ライトブルー2
  '#00bcd4', // シアン
  '#4dd0e1', // ライトシアン
  '#26c6da', // シアン2
  '#0288d1', // ディープブルー
  '#0277bd', // ダークブルー
];

export const WorkplaceManager: React.FC = () => {
  const { workplaces, addWorkplace, updateWorkplace, deleteWorkplace, shifts } =
    useSimpleShiftStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkplaceFormData>({
    name: '',
    defaultHourlyRate: 0, // 空の状態から開始
    color: '#b3e5fc',
    description: '',
    
    // 新しいフィールドのデフォルト値
    cutoffDay: 31, // 月末締め
    paymentDay: 25, // 25日支給
    paymentTiming: 'nextMonth', // 翌月支給
    paymentType: 'hourly', // 時給制
    overtimeSettings: {
      nightShift: true, // 深夜割増適用
      holiday: true, // 休日割増適用  
      overtime: false, // 残業割増は任意なのでデフォルトOFF
    },
    roundingRule: {
      minutes: 1, // 1分単位
      method: 'round', // 四捨五入
    },
    breakRules: {
      over6h: 45, // 6時間超で45分休憩
      over8h: 60, // 8時間超で60分休憩
    },
    transportationSettings: {
      type: 'none', // 交通費なし
      amount: 0,
      unit: 'daily',
    },
    allowCrossDayShifts: true, // 跨日シフト許可
    
    // 既存フィールド（後方互換性）
    paymentDate: 25,
    transportationFee: 0,
    timeBasedRates: [],
    weekdayRates: {},
    allowances: [],
    deductions: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // フォームリセット
  const resetForm = () => {
    setFormData({
      name: '',
      defaultHourlyRate: 0,
      color: '#b3e5fc',
      description: '',
      
      // 新しいフィールドのデフォルト値
      cutoffDay: 31,
      paymentDay: 25,
      paymentTiming: 'nextMonth',
      paymentType: 'hourly',
      overtimeSettings: {
        nightShift: true,
        holiday: true,
        overtime: false,
      },
      roundingRule: {
        minutes: 1,
        method: 'round',
      },
      breakRules: {
        over6h: 45,
        over8h: 60,
      },
      transportationSettings: {
        type: 'none',
        amount: 0,
        unit: 'daily',
      },
      allowCrossDayShifts: true,
      
      // 既存フィールド
      paymentDate: 25,
      transportationFee: 0,
      timeBasedRates: [],
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
        
        // 新フィールド（存在しない場合はデフォルト値）
        cutoffDay: (workplace as any).cutoffDay || 31,
        paymentDay: (workplace as any).paymentDay || workplace.paymentDate || 25,
        paymentTiming: (workplace as any).paymentTiming || 'nextMonth',
        paymentType: (workplace as any).paymentType || 'hourly',
        overtimeSettings: (workplace as any).overtimeSettings || {
          nightShift: true,
          holiday: true,
          overtime: false,
        },
        roundingRule: (workplace as any).roundingRule || {
          minutes: 1,
          method: 'round',
        },
        breakRules: (workplace as any).breakRules || {
          over6h: 45,
          over8h: 60,
        },
        transportationSettings: (workplace as any).transportationSettings || {
          type: workplace.transportationFee ? 'fixed' : 'none',
          amount: workplace.transportationFee || 0,
          unit: 'daily',
        },
        allowCrossDayShifts: (workplace as any).allowCrossDayShifts ?? true,
        
        // 既存フィールド（後方互換性）
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

    if (formData.paymentType === 'hourly' && formData.defaultHourlyRate <= 0) {
      newErrors.defaultHourlyRate = '正しい時給を入力してください';
    }

    if (formData.cutoffDay < 1 || formData.cutoffDay > 31) {
      newErrors.cutoffDay = '締日は1-31の間で入力してください';
    }

    if (formData.paymentDay < 1 || formData.paymentDay > 31) {
      newErrors.paymentDay = '支給日は1-31の間で入力してください';
    }

    if (formData.breakRules.over6h < 0) {
      newErrors.over6h = '休憩時間は0以上で入力してください';
    }

    if (formData.breakRules.over8h < formData.breakRules.over6h) {
      newErrors.over8h = '8時間超の休憩は6時間超以上で入力してください';
    }

    if (formData.transportationSettings.type !== 'none' && formData.transportationSettings.amount < 0) {
      newErrors.transportationAmount = '交通費は0以上で入力してください';
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
                    'linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #81d4fa 0%, #b3e5fc 100%)',
                  },
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  boxShadow: '0 8px 24px rgba(179, 229, 252, 0.4)',
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
                    'linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #81d4fa 0%, #b3e5fc 100%)',
                  },
                  borderRadius: 3,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(179, 229, 252, 0.3)',
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
              <FormControl fullWidth size="small">
                <InputLabel>支払い形態</InputLabel>
                <Select
                  value={formData.paymentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value as any }))}
                  label="支払い形態"
                >
                  <MenuItem value="hourly">時給制</MenuItem>
                  <MenuItem value="daily">日給制</MenuItem>
                  <MenuItem value="monthly">月給制</MenuItem>
                  <MenuItem value="commission">歩合制（出来高）</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="締日"
                value={formData.cutoffDay}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    cutoffDay: parseInt(e.target.value) || 31,
                  }))
                }
                error={Boolean(errors.cutoffDay)}
                helperText={errors.cutoffDay}
                size="small"
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 4 }}>日</span>,
                }}
              />
            </Grid>

            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="支給日"
                value={formData.paymentDay}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    paymentDay: parseInt(e.target.value) || 25,
                  }))
                }
                error={Boolean(errors.paymentDay)}
                helperText={errors.paymentDay}
                size="small"
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 4 }}>日</span>,
                }}
              />
            </Grid>

            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>支給タイミング</InputLabel>
                <Select
                  value={formData.paymentTiming}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTiming: e.target.value as any }))}
                  label="支給タイミング"
                >
                  <MenuItem value="nextMonth">翌月</MenuItem>
                  <MenuItem value="sameMonth">当月</MenuItem>
                </Select>
              </FormControl>
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

            {/* 詳細設定アコーディオン */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">詳細設定</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    
                    {/* 法定割増設定 */}
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        法定割増の自動適用
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.overtimeSettings.nightShift}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                overtimeSettings: {
                                  ...prev.overtimeSettings,
                                  nightShift: e.target.checked
                                }
                              }))}
                            />
                          }
                          label="深夜割増 25%（22:00-5:00）"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.overtimeSettings.holiday}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                overtimeSettings: {
                                  ...prev.overtimeSettings,
                                  holiday: e.target.checked
                                }
                              }))}
                            />
                          }
                          label="休日割増 35%"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.overtimeSettings.overtime}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                overtimeSettings: {
                                  ...prev.overtimeSettings,
                                  overtime: e.target.checked
                                }
                              }))}
                            />
                          }
                          label="残業割増 25%（8h/日・40h/週超）"
                        />
                      </Box>
                    </Grid>

                    {/* 丸め・休憩ルール */}
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        丸め・休憩ルール
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6} sm={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>丸め単位</InputLabel>
                            <Select
                              value={formData.roundingRule.minutes}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                roundingRule: {
                                  ...prev.roundingRule,
                                  minutes: e.target.value as any
                                }
                              }))}
                              label="丸め単位"
                            >
                              <MenuItem value={1}>1分</MenuItem>
                              <MenuItem value={5}>5分</MenuItem>
                              <MenuItem value={10}>10分</MenuItem>
                              <MenuItem value={15}>15分</MenuItem>
                              <MenuItem value={30}>30分</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>丸め方法</InputLabel>
                            <Select
                              value={formData.roundingRule.method}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                roundingRule: {
                                  ...prev.roundingRule,
                                  method: e.target.value as any
                                }
                              }))}
                              label="丸め方法"
                            >
                              <MenuItem value="down">切り捨て</MenuItem>
                              <MenuItem value="up">切り上げ</MenuItem>
                              <MenuItem value="round">四捨五入</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <TextField
                            fullWidth
                            type="number"
                            label="6h超休憩（分）"
                            value={formData.breakRules.over6h}
                            onChange={e =>
                              setFormData(prev => ({
                                ...prev,
                                breakRules: {
                                  ...prev.breakRules,
                                  over6h: parseInt(e.target.value) || 0
                                }
                              }))
                            }
                            error={Boolean(errors.over6h)}
                            helperText={errors.over6h}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <TextField
                            fullWidth
                            type="number"
                            label="8h超休憩（分）"
                            value={formData.breakRules.over8h}
                            onChange={e =>
                              setFormData(prev => ({
                                ...prev,
                                breakRules: {
                                  ...prev.breakRules,
                                  over8h: parseInt(e.target.value) || 0
                                }
                              }))
                            }
                            error={Boolean(errors.over8h)}
                            helperText={errors.over8h}
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </Grid>

                    {/* 交通費設定 */}
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        交通費設定
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth size="small">
                            <InputLabel>支給方式</InputLabel>
                            <Select
                              value={formData.transportationSettings.type}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                transportationSettings: {
                                  ...prev.transportationSettings,
                                  type: e.target.value as any
                                }
                              }))}
                              label="支給方式"
                            >
                              <MenuItem value="none">なし</MenuItem>
                              <MenuItem value="fixed">固定支給</MenuItem>
                              <MenuItem value="actual">実費支給</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        {formData.transportationSettings.type !== 'none' && (
                          <>
                            <Grid item xs={6} sm={4}>
                              <TextField
                                fullWidth
                                type="number"
                                label={formData.transportationSettings.type === 'fixed' ? '固定金額' : '上限金額'}
                                value={formData.transportationSettings.amount}
                                onChange={e =>
                                  setFormData(prev => ({
                                    ...prev,
                                    transportationSettings: {
                                      ...prev.transportationSettings,
                                      amount: parseInt(e.target.value) || 0
                                    }
                                  }))
                                }
                                error={Boolean(errors.transportationAmount)}
                                helperText={errors.transportationAmount}
                                size="small"
                                InputProps={{
                                  startAdornment: <span style={{ marginRight: 8 }}>¥</span>,
                                }}
                              />
                            </Grid>
                            <Grid item xs={6} sm={4}>
                              <FormControl fullWidth size="small">
                                <InputLabel>単位</InputLabel>
                                <Select
                                  value={formData.transportationSettings.unit}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    transportationSettings: {
                                      ...prev.transportationSettings,
                                      unit: e.target.value as any
                                    }
                                  }))}
                                  label="単位"
                                >
                                  <MenuItem value="daily">日額</MenuItem>
                                  <MenuItem value="monthly">月額</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </Grid>

                    {/* その他設定 */}
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        その他設定
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.allowCrossDayShifts}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              allowCrossDayShifts: e.target.checked
                            }))}
                          />
                        }
                        label="跨日シフトを許可（例：22:00-翌2:00）"
                      />
                    </Grid>

                  </Grid>
                </AccordionDetails>
              </Accordion>
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

            {/* プレビュー */}
            {formData.name.trim() && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    設定プレビュー
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>{formData.name}</strong> - {
                      formData.paymentType === 'hourly' ? `時給 ¥${formData.defaultHourlyRate.toLocaleString()}` :
                      formData.paymentType === 'daily' ? '日給制' :
                      formData.paymentType === 'monthly' ? '月給制' : '歩合制'
                    }
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    毎月{formData.cutoffDay === 31 ? '末日' : `${formData.cutoffDay}日`}締め、
                    {formData.paymentTiming === 'nextMonth' ? '翌月' : '当月'}
                    {formData.paymentDay}日支給 | 
                    交通費: {
                      formData.transportationSettings.type === 'none' ? 'なし' :
                      formData.transportationSettings.type === 'fixed' 
                        ? `固定${formData.transportationSettings.unit === 'daily' ? '日額' : '月額'} ¥${formData.transportationSettings.amount.toLocaleString()}`
                        : `実費（上限${formData.transportationSettings.unit === 'daily' ? '日額' : '月額'} ¥${formData.transportationSettings.amount.toLocaleString()}）`
                    } | 
                    丸め: {formData.roundingRule.minutes}分{
                      formData.roundingRule.method === 'up' ? '切り上げ' :
                      formData.roundingRule.method === 'down' ? '切り捨て' : '四捨五入'
                    }
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !formData.name.trim() || 
              (formData.paymentType === 'hourly' && formData.defaultHourlyRate <= 0)
            }
            sx={{
              background: 'linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #81d4fa 0%, #b3e5fc 100%)',
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
