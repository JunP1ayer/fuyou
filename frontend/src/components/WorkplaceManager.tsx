// 🏢 シフトボード風バイト先管理コンポーネント

import React, { useMemo, useState } from 'react';
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
import { formatCurrency } from '../utils/calculations';
import useI18nStore from '../store/i18nStore';

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
  freeBreakDefault: number; // 自由休憩（分）
  breakAuto6hEnabled: boolean; // 6時間超の自動休憩ON/OFF
  breakAuto8hEnabled: boolean; // 8時間超の自動休憩ON/OFF
  
  // 交通費詳細設定
  transportationSettings: {
    type: 'none' | 'fixed' | 'actual';
    amount: number;
    limit?: number;
    unit: 'daily' | 'monthly';
  };
  
  // 跨日シフト対応
  allowCrossDayShifts: boolean;
  timeZone?: string;
  
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
  weekdayRatesEnabled?: boolean; // 曜日別時給の有効フラグ
  timeBasedRatesEnabled?: boolean; // 時間帯別時給の有効フラグ
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

// 虹色カラーパレット（彩度と明度を統一）
const defaultColors = [
  '#FF6B6B', // レッド
  '#4ECDC4', // ティール
  '#45B7D1', // ブルー
  '#96CEB4', // グリーン
  '#FFEAA7', // イエロー
  '#DDA0DD', // ライトパープル
  '#98D8C8', // ミント
  '#F7DC6F', // ゴールド
  '#BB8FCE', // パープル
  '#85C1E9', // ライトブルー
  '#F8C471', // オレンジ
  '#82E0AA', // ライトグリーン
];

export const WorkplaceManager: React.FC = () => {
  const { workplaces, addWorkplace, updateWorkplace, deleteWorkplace, shifts } =
    useSimpleShiftStore();
  const { country } = useI18nStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkplaceFormData>({
    name: '',
    defaultHourlyRate: '' as any, // 空の状態から開始
    color: '#FF6B6B',
    description: '',
    
    // 新しいフィールドのデフォルト値
    cutoffDay: '' as any, // 空の状態から開始
    paymentDay: '' as any, // 空の状態から開始
    paymentTiming: 'nextMonth', // 翌月支給
    paymentType: 'hourly', // 時給制
    overtimeSettings: {
      nightShift: true, // 深夜割増適用
      holiday: true, // 休日割増適用  
      overtime: true, // デフォルトON
    },
    roundingRule: {
      minutes: 1, // 1分単位
      method: 'round', // 四捨五入
    },
    breakRules: {
      over6h: 45, // デフォルト45分
      over8h: 60, // デフォルト60分
    },
    freeBreakDefault: '' as any,
    breakAuto6hEnabled: true,
    breakAuto8hEnabled: true,
    transportationSettings: {
      type: 'none', // 交通費なし
      amount: '' as any,
      unit: 'daily',
    },
    allowCrossDayShifts: true, // 跨日シフト許可
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // 既存フィールド（後方互換性）
    paymentDate: '' as any,
    transportationFee: '' as any,
    timeBasedRates: [],
    timeBasedRatesEnabled: false,
    weekdayRates: {},
    weekdayRatesEnabled: false,
    allowances: [],
    deductions: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // プレビュー用サンプルシフト（詳細設定の即時計算確認用）
  const [preview, setPreview] = useState({
    startTime: '09:00',
    endTime: '17:00',
  });

  const computePreviewEarnings = () => {
    // 時給制のみ試算（その他形態は対象外）
    if (formData.paymentType !== 'hourly') return { earnings: 0, totalMinutes: 0, breakMinutes: 0, actualMinutes: 0 };

    const rate = formData.defaultHourlyRate || 0;
    if (!preview.startTime || !preview.endTime || rate <= 0) return { earnings: 0, totalMinutes: 0, breakMinutes: 0, actualMinutes: 0 };

    const start = new Date(`2000-01-01T${preview.startTime}`);
    let end = new Date(`2000-01-01T${preview.endTime}`);
    
    // 日をまたぐ場合（終了時刻が開始時刻より早い場合）
    if (end <= start) {
      end = new Date(`2000-01-02T${preview.endTime}`);
    }
    
    const totalMinutes = Math.max(0, (end.getTime() - start.getTime()) / 60000);

    // 休憩（自動）
    let breakMinutes = Math.max(0, Number(formData.freeBreakDefault) || 0);
    const workHours = totalMinutes / 60;
    if (formData.breakAuto8hEnabled && formData.breakRules.over8h && workHours > 8) {
      breakMinutes += formData.breakRules.over8h;
    } else if (formData.breakAuto6hEnabled && formData.breakRules.over6h && workHours > 6) {
      breakMinutes += formData.breakRules.over6h;
    }

    const actualMinutes = Math.max(0, totalMinutes - breakMinutes);
    const actualHours = actualMinutes / 60;

    // 残業（8h超は1.25倍）
    let earnings = Math.floor(actualHours * rate);
    if (formData.overtimeSettings.overtime && actualHours > 8) {
      const regularHours = 8;
      const overtimeHours = actualHours - 8;
      earnings = Math.floor(regularHours * rate + overtimeHours * rate * 1.25);
    }

    return { earnings, totalMinutes, breakMinutes, actualMinutes };
  };

  const previewResult = useMemo(() => computePreviewEarnings(), [
    formData.paymentType,
    formData.defaultHourlyRate,
    formData.freeBreakDefault,
    formData.breakAuto6hEnabled,
    formData.breakAuto8hEnabled,
    formData.breakRules?.over6h,
    formData.breakRules?.over8h,
    preview.startTime,
    preview.endTime,
  ]);

  // フォームリセット
  const resetForm = () => {
    setFormData({
      name: '',
      defaultHourlyRate: '' as any,
      color: '#FF6B6B',
      description: '',
      
      // 新しいフィールドのデフォルト値
      cutoffDay: '' as any,
      paymentDay: '' as any,
      paymentTiming: 'nextMonth',
      paymentType: 'hourly',
      overtimeSettings: {
        nightShift: true,
        holiday: true,
        overtime: true,
      },
      roundingRule: {
        minutes: 1,
        method: 'round',
      },
      breakRules: {
        over6h: 45, // デフォルト45分
        over8h: 60, // デフォルト60分
      },
      freeBreakDefault: '' as any,
      breakAuto6hEnabled: true,
      breakAuto8hEnabled: true,
      transportationSettings: {
        type: 'none',
        amount: '' as any,
        unit: 'daily',
      },
      allowCrossDayShifts: true,
      
      // 既存フィールド
      paymentDate: '' as any,
      transportationFee: '' as any,
      timeBasedRates: [],
      timeBasedRatesEnabled: false,
      weekdayRates: {},
      weekdayRatesEnabled: false,
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
          overtime: true,
        },
        roundingRule: (workplace as any).roundingRule || {
          minutes: 1,
          method: 'round',
        },
        breakRules: (workplace as any).breakRules || {
          over6h: 45,
          over8h: 60,
        },
        freeBreakDefault: (workplace as any).freeBreakDefault || 0,
        breakAuto6hEnabled: (workplace as any).breakAuto6hEnabled ?? true,
        breakAuto8hEnabled: (workplace as any).breakAuto8hEnabled ?? true,
        transportationSettings: (workplace as any).transportationSettings || {
          type: workplace.transportationFee ? 'fixed' : 'none',
          amount: workplace.transportationFee || 0,
          unit: 'daily',
        },
        allowCrossDayShifts: (workplace as any).allowCrossDayShifts ?? true,
        timeZone: (workplace as any).timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        
        // 既存フィールド（後方互換性）
        paymentDate: workplace.paymentDate || 25,
        timeBasedRates: workplace.timeBasedRates || [],
        timeBasedRatesEnabled: (workplace as any).timeBasedRatesEnabled ?? (workplace.timeBasedRates ? workplace.timeBasedRates.length > 0 : false),
        transportationFee: workplace.transportationFee || 0,
        weekdayRates: workplace.weekdayRates || {},
        weekdayRatesEnabled: (workplace as any).weekdayRatesEnabled ?? (workplace.weekdayRates ? Object.keys(workplace.weekdayRates).length > 0 : false),
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

    if (
      formData.paymentType === 'hourly' &&
      (!formData.defaultHourlyRate || formData.defaultHourlyRate <= 0)
    ) {
      newErrors.defaultHourlyRate = '時給を入力してください';
    }

    if (
      !formData.cutoffDay ||
      formData.cutoffDay < 1 ||
      formData.cutoffDay > 31
    ) {
      newErrors.cutoffDay = '締日を入力してください（1-31）';
    }

    if (
      !formData.paymentDay ||
      formData.paymentDay < 1 ||
      formData.paymentDay > 31
    ) {
      newErrors.paymentDay = '支給日を入力してください（1-31）';
    }

    if (
      formData.breakAuto6hEnabled &&
      (formData.breakRules.over6h === undefined || formData.breakRules.over6h === null || Number(formData.breakRules.over6h) < 0)
    ) {
      newErrors.over6h = '休憩時間を入力してください（0以上）';
    }

    if (
      formData.breakAuto8hEnabled &&
      (formData.breakRules.over8h === undefined || formData.breakRules.over8h === null || Number(formData.breakRules.over8h) < 0)
    ) {
      newErrors.over8h = '休憩時間を入力してください（0以上）';
    }
    
    if (
      formData.breakAuto6hEnabled &&
      formData.breakAuto8hEnabled &&
      typeof formData.breakRules.over8h === 'number' &&
      typeof formData.breakRules.over6h === 'number' &&
      formData.breakRules.over8h < formData.breakRules.over6h
    ) {
      newErrors.over8h = '8時間超の休憩は6時間超以上で入力してください';
    }

    if (
      formData.transportationFee && 
      Number(formData.transportationFee) < 0
    ) {
      newErrors.transportationFee = '交通費は0以上で入力してください';
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
                                    時給 {formatCurrency(workplace.defaultHourlyRate)}
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
                                      総収入 {formatCurrency(stats.totalEarnings)}
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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="基本時給"
                value={formData.defaultHourlyRate}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    defaultHourlyRate: e.target.value ? parseInt(e.target.value) : '' as any,
                  }))
                }
                error={Boolean(errors.defaultHourlyRate)}
                helperText={errors.defaultHourlyRate}
                placeholder="1050"
                InputProps={{
                  startAdornment: (
                    <span style={{ marginRight: 8 }}>
                      {country === 'UK' ? '£' : country === 'DE' || country === 'FI' || country === 'AT' ? '€' : country === 'DK' || country === 'NO' ? 'kr' : country === 'PL' ? 'zł' : country === 'HU' ? 'Ft' : '¥'}
                    </span>
                  ),
                }}
                inputProps={{ min: 0, step: 1 }}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="交通費"
                value={formData.transportationFee}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    transportationFee: e.target.value ? parseInt(e.target.value) : '' as any,
                  }))
                }
                error={Boolean(errors.transportationFee)}
                helperText={errors.transportationFee || '1日あたりの交通費（0の場合は支給なし）'}
                placeholder="500"
                InputProps={{
                  startAdornment: (
                    <span style={{ marginRight: 6 }}>¥</span>
                  ),
                }}
                inputProps={{ min: 0, step: 50 }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
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
                    cutoffDay: e.target.value ? parseInt(e.target.value) : '' as any,
                  }))
                }
                error={Boolean(errors.cutoffDay)}
                helperText={errors.cutoffDay || '31の場合は月末'}
                placeholder="31"
                size="small"
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 4 }}>日</span>,
                }}
                inputProps={{ min: 1, max: 31, step: 1 }}
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
                    paymentDay: e.target.value ? parseInt(e.target.value) : '' as any,
                  }))
                }
                error={Boolean(errors.paymentDay)}
                helperText={errors.paymentDay}
                placeholder="25"
                size="small"
                InputProps={{
                  endAdornment: <span style={{ marginLeft: 4 }}>日</span>,
                }}
                inputProps={{ min: 1, max: 31, step: 1 }}
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
                カラー選択
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                バイト先を区別するための色を選んでください
              </Typography>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 1.5,
                maxWidth: 300
              }}>
                {defaultColors.map((color, index) => (
                  <Box
                    key={color}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    sx={{
                      width: 36,
                      height: 36,
                      backgroundColor: color,
                      borderRadius: 2,
                      cursor: 'pointer',
                      border: formData.color === color ? '3px solid' : '2px solid',
                      borderColor: formData.color === color ? 'primary.main' : 'rgba(255,255,255,0.3)',
                      boxShadow: formData.color === color 
                        ? `0 4px 12px ${color}40`
                        : `0 2px 8px ${color}30`,
                      position: 'relative',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: `0 6px 20px ${color}50`,
                      },
                      '&:active': {
                        transform: 'scale(0.95)',
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {formData.color === color && (
                      <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }} />
                    )}
                  </Box>
                ))}
              </Box>
            </Grid>


            {/* 詳細設定アコーディオン */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">詳細設定</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    
                    {/* 時間帯別時給設定 */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          時間帯別時給設定
                        </Typography>
                        <FormControlLabel
                          control={<Switch checked={!!formData.timeBasedRatesEnabled} onChange={(e) => setFormData(prev => ({ ...prev, timeBasedRatesEnabled: e.target.checked, timeBasedRates: e.target.checked ? prev.timeBasedRates : [] }))} />}
                          label={formData.timeBasedRatesEnabled ? 'ON' : 'OFF'}
                        />
                      </Box>
                      {formData.timeBasedRatesEnabled && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {formData.timeBasedRates?.map((rate, index) => (
                          <Box
                            key={index}
                            sx={{ 
                              display: 'flex', 
                              gap: 1, 
                              alignItems: 'center', 
                              flexWrap: 'wrap',
                              p: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              bgcolor: 'background.paper'
                            }}
                          >
                            <TextField
                              label="名前"
                              value={rate.name}
                              onChange={e => {
                                const newRates = [...(formData.timeBasedRates || [])];
                                newRates[index] = { ...rate, name: e.target.value };
                                setFormData(prev => ({ ...prev, timeBasedRates: newRates }));
                              }}
                              size="small"
                              sx={{ minWidth: '120px' }}
                              placeholder="深夜"
                            />
                            <TextField
                              label="開始時間"
                              type="time"
                              value={rate.startTime}
                              onChange={e => {
                                const newRates = [...(formData.timeBasedRates || [])];
                                newRates[index] = { ...rate, startTime: e.target.value };
                                setFormData(prev => ({ ...prev, timeBasedRates: newRates }));
                              }}
                              size="small"
                              sx={{ minWidth: '140px' }}
                            />
                            <TextField
                              label="終了時間"
                              type="time"
                              value={rate.endTime}
                              onChange={e => {
                                const newRates = [...(formData.timeBasedRates || [])];
                                newRates[index] = { ...rate, endTime: e.target.value };
                                setFormData(prev => ({ ...prev, timeBasedRates: newRates }));
                              }}
                              size="small"
                              sx={{ minWidth: '140px' }}
                            />
                            <TextField
                              label="時給"
                              type="number"
                              value={rate.rate}
                              onChange={e => {
                                const newRates = [...(formData.timeBasedRates || [])];
                                newRates[index] = { ...rate, rate: parseInt(e.target.value) || 0 };
                                setFormData(prev => ({ ...prev, timeBasedRates: newRates }));
                              }}
                              size="small"
                              sx={{ minWidth: '100px' }}
                              InputProps={{
                                startAdornment: <span style={{ marginRight: 4 }}>¥</span>,
                              }}
                            />
                            <IconButton
                              onClick={() => {
                                const newRates = formData.timeBasedRates?.filter((_, i) => i !== index) || [];
                                setFormData(prev => ({ ...prev, timeBasedRates: newRates }));
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
                              timeBasedRates: [...(prev.timeBasedRates || []), newRate],
                            }));
                          }}
                          variant="outlined"
                          size="small"
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          時間帯を追加
                        </Button>
                        </Box>
                      )}
                    </Grid>

                    {/* 曜日別時給設定（ON/OFF） */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          曜日別時給設定
                        </Typography>
                        <FormControlLabel
                          control={<Switch checked={!!formData.weekdayRatesEnabled} onChange={(e) => setFormData(prev => ({ ...prev, weekdayRatesEnabled: e.target.checked, weekdayRates: e.target.checked ? prev.weekdayRates : {} }))} />}
                          label={formData.weekdayRatesEnabled ? 'ON' : 'OFF'}
                        />
                      </Box>
                      {formData.weekdayRatesEnabled && (
                        <Grid container spacing={1}>
                          {[
                            'monday', 'tuesday', 'wednesday', 'thursday', 
                            'friday', 'saturday', 'sunday'
                          ].map((day, index) => (
                            <Grid item xs={6} sm={4} key={day}>
                              <TextField
                                fullWidth
                                type="number"
                                label={['月', '火', '水', '木', '金', '土', '日'][index]}
                                value={
                                  formData.weekdayRates?.[day as keyof typeof formData.weekdayRates] || ''
                                }
                                onChange={e =>
                                  setFormData(prev => ({
                                    ...prev,
                                    weekdayRates: {
                                      ...prev.weekdayRates,
                                      [day]: e.target.value ? parseInt(e.target.value) : undefined,
                                    },
                                  }))
                                }
                                size="small"
                                placeholder="未設定"
                                InputProps={{
                                  startAdornment: <span style={{ marginRight: 4 }}>¥</span>,
                                }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </Grid>
                    
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

                    {/* 休憩時間設定（自由入力 + 自動休憩） */}
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                        休憩時間設定
                      </Typography>
                      
                      {/* 自由休憩 */}
                      <Box sx={{ mb: 3 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="自由休憩時間（毎回適用）"
                          value={formData.freeBreakDefault}
                          onChange={e => setFormData(prev => ({ ...prev, freeBreakDefault: e.target.value ? Math.max(0, parseInt(e.target.value)) : '' as any }))}
                          size="small"
                          placeholder="0"
                          helperText="シフトに関係なく毎回引かれる休憩時間"
                          inputProps={{ min: 0, step: 5 }}
                          sx={{ maxWidth: 300 }}
                          InputProps={{
                            endAdornment: <span style={{ marginLeft: 4, color: 'text.secondary' }}>分</span>,
                          }}
                        />
                      </Box>

                      {/* 労働時間に応じた自動休憩 */}
                      <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
                        労働時間に応じた自動休憩
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ 
                            p: 2, 
                            border: '1px solid',
                            borderColor: formData.breakAuto6hEnabled ? 'primary.main' : 'divider',
                            borderRadius: 2,
                            bgcolor: formData.breakAuto6hEnabled ? 'primary.lighter' : 'transparent',
                            transition: 'all 0.3s ease'
                          }}>
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={formData.breakAuto6hEnabled} 
                                  onChange={(e) => setFormData(prev => ({ ...prev, breakAuto6hEnabled: e.target.checked }))}
                                  color="primary"
                                />
                              }
                              label={
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  6時間超勤務
                                </Typography>
                              }
                              sx={{ mb: 2 }}
                            />
                            <TextField
                              fullWidth
                              type="number"
                              label="休憩時間"
                              value={formData.breakRules.over6h}
                              onChange={e => setFormData(prev => ({ ...prev, breakRules: { ...prev.breakRules, over6h: e.target.value ? parseInt(e.target.value) : 45 } }))}
                              size="small"
                              disabled={!formData.breakAuto6hEnabled}
                              inputProps={{ min: 0, step: 5 }}
                              InputProps={{
                                endAdornment: <span style={{ marginLeft: 4, color: 'text.secondary' }}>分</span>,
                              }}
                              helperText="労働基準法推奨: 45分"
                            />
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Box sx={{ 
                            p: 2, 
                            border: '1px solid',
                            borderColor: formData.breakAuto8hEnabled ? 'primary.main' : 'divider',
                            borderRadius: 2,
                            bgcolor: formData.breakAuto8hEnabled ? 'primary.lighter' : 'transparent',
                            transition: 'all 0.3s ease'
                          }}>
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={formData.breakAuto8hEnabled} 
                                  onChange={(e) => setFormData(prev => ({ ...prev, breakAuto8hEnabled: e.target.checked }))}
                                  color="primary"
                                />
                              }
                              label={
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  8時間超勤務
                                </Typography>
                              }
                              sx={{ mb: 2 }}
                            />
                            <TextField
                              fullWidth
                              type="number"
                              label="休憩時間"
                              value={formData.breakRules.over8h}
                              onChange={e => setFormData(prev => ({ ...prev, breakRules: { ...prev.breakRules, over8h: e.target.value ? parseInt(e.target.value) : 60 } }))}
                              size="small"
                              disabled={!formData.breakAuto8hEnabled}
                              inputProps={{ min: 0, step: 5 }}
                              InputProps={{
                                endAdornment: <span style={{ marginLeft: 4, color: 'text.secondary' }}>分</span>,
                              }}
                              helperText="労働基準法推奨: 60分"
                            />
                          </Box>
                        </Grid>
                      </Grid>
                      
                      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'info.main' }}>
                        ※ 8時間超の休憩は6時間超の休憩を上書きします
                      </Typography>
                    </Grid>

                    {/* 収入シミュレーション（詳細設定の即時計算確認用） */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        サンプルシフト収入シミュレーション（時給制）
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
                        ※ 日をまたぐ勤務も対応（例: 22:00〜06:00）
                      </Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="time"
                            label="開始"
                            value={preview.startTime}
                            onChange={(e) => setPreview(prev => ({ ...prev, startTime: e.target.value }))}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="time"
                            label="終了"
                            value={preview.endTime}
                            onChange={(e) => setPreview(prev => ({ ...prev, endTime: e.target.value }))}
                            size="small"
                          />
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 2, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          試算結果: <strong>¥{previewResult.earnings.toLocaleString()}</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          総勤務 {(previewResult.totalMinutes/60).toFixed(1)}h ／ 休憩 {previewResult.breakMinutes}分 → 実働 {(previewResult.actualMinutes/60).toFixed(1)}h
                        </Typography>
                      </Box>
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
                      formData.paymentType === 'hourly'
                        ? (typeof formData.defaultHourlyRate === 'number' && formData.defaultHourlyRate > 0
                            ? `時給 ¥${formData.defaultHourlyRate.toLocaleString()}`
                            : '時給 未設定')
                        : formData.paymentType === 'daily'
                        ? '日給制'
                        : formData.paymentType === 'monthly'
                        ? '月給制'
                        : '歩合制'
                    }
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    毎月{formData.cutoffDay === 31 ? '末日' : `${formData.cutoffDay}日`}締め、
                    {formData.paymentTiming === 'nextMonth' ? '翌月' : '当月'}
                    {formData.paymentDay}日支給 | 
                    交通費: {
                      formData.transportationFee && formData.transportationFee > 0
                        ? `日額 ${formatCurrency(formData.transportationFee)}`
                        : 'なし'
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
              (formData.paymentType === 'hourly' && (!formData.defaultHourlyRate || formData.defaultHourlyRate <= 0)) ||
              !formData.cutoffDay ||
              !formData.paymentDay
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
