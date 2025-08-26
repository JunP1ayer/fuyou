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
import { APP_COLOR_PALETTE } from '@/utils/colors';
import { computeShiftEarnings } from '@/utils/calcShift';

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
    over4h: number; // 4時間超の休憩（分）
    over6h: number; // 6時間超の休憩（分）
    over8h: number; // 8時間超の休憩（分）
  };
  freeBreakDefault: number; // 自由休憩（分）
  freeBreakMinHoursEnabled: boolean; // 廃止予定（常にfalse）
  freeBreakMinHours: number; // 廃止予定（常に0）
  breakAuto4hEnabled: boolean; // 4時間超の自動休憩ON/OFF
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
  
  // カスタム休憩ルール
  customBreakRules?: {
    hours: number;
    breakMinutes: number;
  }[];
  customBreakRulesEnabled?: boolean;
  incomePreviewEnabled?: boolean;
}

// 共通パレット
const defaultColors = APP_COLOR_PALETTE.map(c => c.color);

export const WorkplaceManager: React.FC = () => {
  const { workplaces, addWorkplace, updateWorkplace, deleteWorkplace, shifts } =
    useSimpleShiftStore();
  const { country } = useI18nStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkplaceFormData>({
    name: '',
    defaultHourlyRate: '' as any, // 空の状態から開始
    color: '#FFB3BA',
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
      over4h: 15, // デフォルト15分
      over6h: 45, // デフォルト45分
      over8h: 60, // デフォルト60分
    },
    freeBreakDefault: '' as any,
    freeBreakMinHoursEnabled: false, // 常にfalse（UI削除済み）
    freeBreakMinHours: 0, // 使用しない
    breakAuto4hEnabled: true,
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
    startTime: '18:00',
    endTime: '02:00',
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
    const workHours = totalMinutes / 60;
    
    // 休憩時間の計算（calcShift.tsと一致させる）
    // 自由休憩（常に適用）
    let freeBreak = 0;
    if (formData.freeBreakDefault && Number(formData.freeBreakDefault) > 0) {
      freeBreak = Math.max(0, Number(formData.freeBreakDefault) || 0);
    }

    // 自動休憩（最も長いルールのみ適用）
    let autoBreak = 0;
    if (workHours > 8) {
      if (formData.breakAuto8hEnabled && formData.breakRules.over8h) {
        autoBreak = formData.breakRules.over8h;
      }
    } else if (workHours > 6) {
      if (formData.breakAuto6hEnabled && formData.breakRules.over6h) {
        autoBreak = formData.breakRules.over6h;
      }
    } else if (workHours > 4) {
      if (formData.breakAuto4hEnabled && formData.breakRules.over4h) {
        autoBreak = formData.breakRules.over4h;
      }
    }

    // 自由休憩と自動休憩は「大きい方のみ」を採用（重複控除防止）
    const breakMinutes = Math.max(freeBreak, autoBreak);

    const actualMinutes = Math.max(0, totalMinutes - breakMinutes);
    const actualHours = actualMinutes / 60;

    // computeShiftEarnings関数を使用して一貫性を保つ
    const mockWorkplace = {
      defaultHourlyRate: rate,
      freeBreakDefault: Number(formData.freeBreakDefault) || 0,
      breakRules: formData.breakRules,
      breakAuto4hEnabled: formData.breakAuto4hEnabled,
      breakAuto6hEnabled: formData.breakAuto6hEnabled,
      breakAuto8hEnabled: formData.breakAuto8hEnabled,
      overtimeSettings: formData.overtimeSettings,
      timeBasedRates: formData.timeBasedRatesEnabled ? formData.timeBasedRates : undefined,
      weekdayRates: formData.weekdayRatesEnabled ? formData.weekdayRates : undefined,
    };

    const result = computeShiftEarnings(mockWorkplace, {
      startTime: preview.startTime,
      endTime: preview.endTime,
      shiftDate: '2024-01-01' // 月曜日（サンプル計算用）
    });

    // computeShiftEarningsの結果を使用
    return { 
      earnings: result.totalEarnings, 
      totalMinutes, 
      breakMinutes: result.breakMinutes, 
      actualMinutes: result.actualMinutes,
      baseEarnings: result.totalEarnings,
      transportationFee: 0, // 交通費は別途計算が必要
      nightHours: 0, // 詳細計算は複雑なため簡略化
      overtimeHours: Math.max(0, (result.actualMinutes - 8*60) / 60)
    };
  };

  const previewResult = useMemo(() => {
    // 時給制以外は計算しない
    if (formData.paymentType !== 'hourly') {
      return { 
        earnings: 0, 
        totalMinutes: 0, 
        breakMinutes: 0, 
        actualMinutes: 0,
        baseEarnings: 0,
        transportationFee: 0,
        nightHours: 0,
        overtimeHours: 0
      };
    }
    return computePreviewEarnings();
  }, [
    formData.paymentType,
    formData.defaultHourlyRate,
    formData.freeBreakDefault,
    formData.breakAuto4hEnabled,
    formData.breakAuto6hEnabled,
    formData.breakAuto8hEnabled,
    formData.breakRules?.over4h,
    formData.breakRules?.over6h,
    formData.breakRules?.over8h,
    formData.overtimeSettings?.nightShift,
    formData.overtimeSettings?.overtime,
    formData.overtimeSettings?.holiday,
    formData.transportationSettings?.type,
    formData.transportationSettings?.amount,
    formData.transportationSettings?.unit,
    formData.timeBasedRatesEnabled,
    formData.timeBasedRates,
    formData.weekdayRatesEnabled,
    formData.weekdayRates,
    preview.startTime,
    preview.endTime,
  ]);

  // フォームリセット
  const resetForm = () => {
    setFormData({
      name: '',
      defaultHourlyRate: '' as any,
      color: '#FFB3BA',
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
        over4h: 15, // デフォルト15分
        over6h: 45, // デフォルト45分
        over8h: 60, // デフォルト60分
      },
      freeBreakDefault: '' as any,
      freeBreakMinHoursEnabled: false, // 常にfalse
      freeBreakMinHours: 0, // 使用しない
      breakAuto4hEnabled: true,
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
          over4h: 15,
          over6h: 45,
          over8h: 60,
        },
        freeBreakDefault: (workplace as any).freeBreakDefault || 0,
        freeBreakMinHoursEnabled: false, // 常にfalse（UI削除済み）
        freeBreakMinHours: 0, // 使用しない
        breakAuto4hEnabled: (workplace as any).breakAuto4hEnabled ?? true,
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

    if (!formData.cutoffDay) {
      newErrors.cutoffDay = '締日を選択してください';
    }

    if (
      !formData.paymentDay ||
      formData.paymentDay < 1 ||
      formData.paymentDay > 31
    ) {
      newErrors.paymentDay = '支給日を入力してください（1-31）';
    }

    if (
      formData.breakAuto4hEnabled &&
      (formData.breakRules.over4h === undefined || formData.breakRules.over4h === null || Number(formData.breakRules.over4h) < 0)
    ) {
      newErrors.over4h = '休憩時間を入力してください（0以上）';
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

    let confirmMessage = `「${workplace.name}」を削除してもよろしいですか？`;
    
    if (relatedShifts.length > 0) {
      confirmMessage = `「${workplace.name}」には${relatedShifts.length}件のシフトが登録されています。\n削除すると、これらのシフトも削除されます。\n本当に削除しますか？`;
    }

    if (!window.confirm(confirmMessage)) {
      return;
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

      {workplaces.length === 0 && (
        <Box sx={{ 
          height: '50vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: 3
        }}>
          <Box sx={{ mb: 4 }}>
            <Business sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary', whiteSpace: 'nowrap' }}>
              バイト先の登録を始めよう！
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, mx: 'auto', lineHeight: 1.6 }}>
              登録してバイト先管理や給料を<br />自動計算できるようにしよう！
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={handleAddClick}
            sx={{
              background: 'linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #81d4fa 0%, #b3e5fc 100%)' },
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              boxShadow: '0 8px 24px rgba(179, 229, 252, 0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            バイト先を登録
          </Button>
        </Box>
      )}

      {/* バイト先登録ボタン */}
      {workplaces.length > 0 && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 400, mx: 'auto' }}>
            💡 複数のバイト先を登録すると、シフトごとに自動で収入計算・扶養管理ができます
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={handleAddClick}
            sx={{
              background: 'linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #81d4fa 0%, #b3e5fc 100%)' },
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              boxShadow: '0 8px 24px rgba(179, 229, 252, 0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            バイト先を追加
          </Button>
        </Box>
      )}

      {/* バイト先一覧 */}
      {workplaces.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              登録済みバイト先 ({workplaces.length}件)
            </Typography>

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
                          border: '2px solid',
                          borderColor: workplace.color,
                          borderRadius: 2,
                          mb: 2,
                          backgroundColor: workplace.color + '10',
                          py: 2,
                          alignItems: 'flex-start',
                          '&:hover': {
                            backgroundColor: workplace.color + '20',
                            borderColor: workplace.color,
                            boxShadow: `0 2px 8px ${workplace.color}40`,
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              backgroundColor: workplace.color,
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.9rem'
                            }}
                          >
                            {workplace.name[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}
                            >
                              {workplace.name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  icon={<AttachMoney />}
                                  label={`¥${workplace.defaultHourlyRate?.toLocaleString() || '未設定'}/時`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                {workplace.transportationFee && (
                                  <Chip
                                    icon={<DirectionsCar />}
                                    label={`交通費 ¥${workplace.transportationFee}`}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  締日: {(workplace as any).cutoffDay || workplace.paymentDate || '未設定'}日
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  |
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  支給日: {(workplace as any).paymentDay || workplace.paymentDate || '未設定'}日
                                </Typography>
                              </Box>
                              {stats.shiftCount > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Chip
                                    icon={<Schedule />}
                                    label={`${stats.shiftCount}件のシフト`}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                  <Chip
                                    icon={<MonetizationOn />}
                                    label={`総収入 ¥${stats.totalEarnings.toLocaleString()}`}
                                    size="small"
                                    color="success"
                                    variant="filled"
                                  />
                                </Box>
                              )}
                            </Box>
                          }
                        />

                        <ListItemSecondaryAction sx={{ top: '50%', transform: 'translateY(-50%)' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(workplace.id)}
                              sx={{ 
                                bgcolor: 'primary.lighter',
                                '&:hover': { bgcolor: 'primary.light' },
                                border: '1px solid',
                                borderColor: 'primary.main'
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(workplace.id)}
                              sx={{ 
                                bgcolor: 'error.lighter',
                                '&:hover': { bgcolor: 'error.light' },
                                border: '1px solid',
                                borderColor: 'error.main'
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
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
        fullScreen
        PaperProps={{
          sx: { 
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          pt: 3,
          textAlign: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Business sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {editingWorkplace ? 'バイト先を編集' : '新しいバイト先を追加'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ 
          overflow: 'auto',
          px: { xs: 1.5, sm: 3 },
          py: 1.5,
          maxWidth: '500px',
          mx: 'auto',
          width: '100%',
          height: 'calc(100vh - 120px)'
        }}>
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            minHeight: '100%',
            justifyContent: 'center',
            py: 1
          }}>
            {/* スペーサー */}
            <Box sx={{ height: 16 }} />
            
            {/* 基本情報 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              
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

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
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

                <TextField
                  fullWidth
                  type="number"
                  label="交通費（日額）"
                  value={formData.transportationFee}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      transportationFee: e.target.value ? parseInt(e.target.value) : '' as any,
                    }))
                  }
                  error={Boolean(errors.transportationFee)}
                  helperText={errors.transportationFee}
                  placeholder="500"
                  InputProps={{
                    startAdornment: (
                      <span style={{ marginRight: 6 }}>¥</span>
                    ),
                  }}
                  inputProps={{ min: 0, step: 50 }}
                  size="small"
                />
              </Box>

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

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel error={Boolean(errors.cutoffDay)}>締日</InputLabel>
                  <Select
                    value={formData.cutoffDay}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        cutoffDay: e.target.value as number,
                      }))
                    }
                    label="締日"
                    error={Boolean(errors.cutoffDay)}
                  >
                    {[...Array(31)].map((_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        {i + 1}日
                      </MenuItem>
                    ))}
                    <MenuItem value={31}>月末</MenuItem>
                  </Select>
                  {errors.cutoffDay && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.cutoffDay}
                    </Typography>
                  )}
                </FormControl>

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
                  InputProps={{
                    endAdornment: <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>日</Typography>,
                  }}
                  inputProps={{ min: 1, max: 31, step: 1 }}
                  size="small"
                />
              </Box>

              <FormControl fullWidth size="small">
                <InputLabel>支給タイミング</InputLabel>
                <Select
                  value={formData.paymentTiming}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTiming: e.target.value as any }))}
                  label="支給タイミング"
                >
                  <MenuItem value="nextMonth">翌月支給</MenuItem>
                  <MenuItem value="sameMonth">当月支給</MenuItem>
                </Select>
              </FormControl>

              {/* カラー選択 - 小さく一列表示 */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  <Palette sx={{ mr: 0.5, fontSize: 16 }} />
                  カラー選択
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.3, justifyContent: 'space-between', maxWidth: '100%', overflowX: 'auto' }}>
                  {defaultColors.map((color, index) => (
                    <Box
                      key={color}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: formData.color === color ? '2px solid' : '1px solid',
                        borderColor: formData.color === color ? 'primary.main' : 'divider',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        '&:hover': { transform: 'scale(1.1)' },
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* メモ */}
              <TextField
                fullWidth
                multiline
                rows={1.5}
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
            </Box>

            {/* 高度な設定 - 折りたたみ式 */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary 
                expandIcon={<ExpandMore />}
                sx={{ 
                  bgcolor: 'primary.lighter',
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'primary.light' }
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  ⚙️ 高度な設定
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    
                  {/* 時間帯別時給設定 - 時給制のみ表示 */}
                  {formData.paymentType === 'hourly' && (
                    <Box sx={{ mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          🕒 時間帯別時給設定
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={!!formData.timeBasedRatesEnabled} 
                              onChange={(e) => setFormData(prev => ({ ...prev, timeBasedRatesEnabled: e.target.checked, timeBasedRates: e.target.checked ? prev.timeBasedRates : [] }))}
                              color="primary"
                            />
                          }
                          label={
                            <Typography variant="caption" sx={{ fontWeight: 600, color: formData.timeBasedRatesEnabled ? 'primary.main' : 'text.secondary' }}>
                              {formData.timeBasedRatesEnabled ? 'ON' : 'OFF'}
                            </Typography>
                          }
                        />
                      </Box>
                    {formData.timeBasedRatesEnabled && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {formData.timeBasedRates?.map((rate, index) => (
                          <Box
                            key={index}
                            sx={{ 
                              mb: 3
                            }}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <TextField
                                  fullWidth
                                  label="開始時間"
                                  type="time"
                                  value={rate.startTime}
                                  onChange={e => {
                                    const newRates = [...(formData.timeBasedRates || [])];
                                    newRates[index] = { ...rate, startTime: e.target.value };
                                    setFormData(prev => ({ ...prev, timeBasedRates: newRates }));
                                  }}
                                  size="small"
                                  sx={{ 
                                    '& .MuiInputBase-root': { 
                                      height: '48px'
                                    }
                                  }}
                                />
                                <TextField
                                  fullWidth
                                  label="終了時間"
                                  type="time"
                                  value={rate.endTime}
                                  onChange={e => {
                                    const newRates = [...(formData.timeBasedRates || [])];
                                    newRates[index] = { ...rate, endTime: e.target.value };
                                    setFormData(prev => ({ ...prev, timeBasedRates: newRates }));
                                  }}
                                  size="small"
                                  sx={{ 
                                    '& .MuiInputBase-root': { 
                                      height: '48px'
                                    }
                                  }}
                                />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <TextField
                                  fullWidth
                                  label="時給"
                                  type="number"
                                  value={rate.rate}
                                  onChange={e => {
                                    const newRates = [...(formData.timeBasedRates || [])];
                                    newRates[index] = { ...rate, rate: parseInt(e.target.value) || 0 };
                                    setFormData(prev => ({ ...prev, timeBasedRates: newRates }));
                                  }}
                                  size="small"
                                  sx={{ 
                                    '& .MuiInputBase-root': { 
                                      height: '48px'
                                    }
                                  }}
                                  InputProps={{
                                    endAdornment: <span style={{ marginLeft: 4, color: 'text.secondary' }}>円</span>,
                                  }}
                                />
                                <IconButton
                                  onClick={() => {
                                    const newRates = formData.timeBasedRates?.filter((_, i) => i !== index) || [];
                                    setFormData(prev => ({ ...prev, timeBasedRates: newRates }));
                                  }}
                                  size="medium"
                                  color="error"
                                  sx={{ 
                                    minWidth: '48px', 
                                    height: '48px',
                                    border: '1px solid',
                                    borderColor: 'error.main'
                                  }}
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </Box>
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
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          時間帯を追加
                        </Button>
                      </Box>
                    )}
                    </Box>
                  )}

                  {/* 曜日別時給設定 - 時給制のみ表示 */}
                  {formData.paymentType === 'hourly' && (
                    <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        📅 曜日別時給設定
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={!!formData.weekdayRatesEnabled} 
                            onChange={(e) => setFormData(prev => ({ ...prev, weekdayRatesEnabled: e.target.checked, weekdayRates: e.target.checked ? prev.weekdayRates : {} }))}
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="caption" sx={{ fontWeight: 600, color: formData.weekdayRatesEnabled ? 'primary.main' : 'text.secondary' }}>
                            {formData.weekdayRatesEnabled ? 'ON' : 'OFF'}
                          </Typography>
                        }
                      />
                    </Box>
                    {formData.weekdayRatesEnabled && (
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        {[
                          'monday', 'tuesday', 'wednesday', 'thursday', 
                          'friday', 'saturday', 'sunday'
                        ].map((day, index) => (
                          <TextField
                            key={day}
                            fullWidth
                            type="number"
                            label={['月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜'][index]}
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
                              endAdornment: <span style={{ marginLeft: 4, color: 'text.secondary' }}>円</span>,
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    </Box>
                  )}

                  {/* 休憩時間設定 - 新仕様 */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        ⏰ 休憩時間設定
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={!!formData.customBreakRulesEnabled} 
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              customBreakRulesEnabled: e.target.checked,
                              customBreakRules: e.target.checked ? prev.customBreakRules : []
                            }))}
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="caption" sx={{ fontWeight: 600, color: formData.customBreakRulesEnabled ? 'primary.main' : 'text.secondary' }}>
                            {formData.customBreakRulesEnabled ? 'ON' : 'OFF'}
                          </Typography>
                        }
                      />
                    </Box>
                    {formData.customBreakRulesEnabled && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        
                        {/* 基本休憩時間 */}
                        <TextField
                          fullWidth
                          type="number"
                          label="基本休憩時間"
                          value={formData.freeBreakDefault}
                          onChange={e => setFormData(prev => ({ ...prev, freeBreakDefault: e.target.value ? Math.max(0, parseInt(e.target.value)) : '' as any }))}
                          size="small"
                          placeholder="0"
                          helperText="毎シフト固定で引かれる休憩時間"
                          inputProps={{ min: 0, step: 5 }}
                          InputProps={{
                            endAdornment: <span style={{ marginLeft: 4, color: 'text.secondary' }}>分</span>,
                          }}
                        />

                        {/* 自動休憩ルール設定 */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            自動休憩ルール
                          </Typography>
                          
                          {/* 4時間超 */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Switch 
                              checked={formData.breakAuto4hEnabled}
                              onChange={(e) => setFormData(prev => ({ ...prev, breakAuto4hEnabled: e.target.checked }))}
                              size="small"
                            />
                            <TextField
                              type="number"
                              label="4時間超"
                              value={formData.breakRules.over4h || ''}
                              onChange={e => setFormData(prev => ({ 
                                ...prev, 
                                breakRules: { 
                                  ...prev.breakRules, 
                                  over4h: e.target.value ? parseInt(e.target.value) : 0 
                                }
                              }))}
                              size="small"
                              disabled={!formData.breakAuto4hEnabled}
                              inputProps={{ min: 0, step: 5 }}
                              InputProps={{
                                endAdornment: <span style={{ marginLeft: 4, color: 'text.secondary' }}>分</span>,
                              }}
                              sx={{ minWidth: 100 }}
                            />
                          </Box>

                          {/* 6時間超 */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Switch 
                              checked={formData.breakAuto6hEnabled}
                              onChange={(e) => setFormData(prev => ({ ...prev, breakAuto6hEnabled: e.target.checked }))}
                              size="small"
                            />
                            <TextField
                              type="number"
                              label="6時間超"
                              value={formData.breakRules.over6h || ''}
                              onChange={e => setFormData(prev => ({ 
                                ...prev, 
                                breakRules: { 
                                  ...prev.breakRules, 
                                  over6h: e.target.value ? parseInt(e.target.value) : 0 
                                }
                              }))}
                              size="small"
                              disabled={!formData.breakAuto6hEnabled}
                              inputProps={{ min: 0, step: 5 }}
                              InputProps={{
                                endAdornment: <span style={{ marginLeft: 4, color: 'text.secondary' }}>分</span>,
                              }}
                              sx={{ minWidth: 100 }}
                            />
                          </Box>

                          {/* 8時間超 */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Switch 
                              checked={formData.breakAuto8hEnabled}
                              onChange={(e) => setFormData(prev => ({ ...prev, breakAuto8hEnabled: e.target.checked }))}
                              size="small"
                            />
                            <TextField
                              type="number"
                              label="8時間超"
                              value={formData.breakRules.over8h || ''}
                              onChange={e => setFormData(prev => ({ 
                                ...prev, 
                                breakRules: { 
                                  ...prev.breakRules, 
                                  over8h: e.target.value ? parseInt(e.target.value) : 0 
                                }
                              }))}
                              size="small"
                              disabled={!formData.breakAuto8hEnabled}
                              inputProps={{ min: 0, step: 5 }}
                              InputProps={{
                                endAdornment: <span style={{ marginLeft: 4, color: 'text.secondary' }}>分</span>,
                              }}
                              sx={{ minWidth: 100 }}
                            />
                          </Box>
                        </Box>
                        
                        {/* ルール追加ボタン */}
                        <Button
                          startIcon={<AddCircle />}
                          onClick={() => {
                            const newRule = { hours: 4, breakMinutes: 45 };
                            setFormData(prev => ({
                              ...prev,
                              customBreakRules: [...(prev.customBreakRules || []), newRule],
                            }));
                          }}
                          variant="outlined"
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          休憩ルールを追加
                        </Button>
                        
                        {/* 休憩ルール一覧（追加後に表示） */}
                        {(formData.customBreakRules || []).length > 0 && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              設定済み休憩ルール
                            </Typography>
                            {(formData.customBreakRules || []).map((rule, index) => (
                              <Box
                                key={index}
                                sx={{ 
                                  p: 1.5,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  bgcolor: 'grey.50',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}
                              >
                                <Typography variant="body2">
                                  {rule.hours}時間以上 → {rule.breakMinutes}分休憩
                                </Typography>
                                <IconButton
                                  onClick={() => {
                                    const newRules = (formData.customBreakRules || []).filter((_, i) => i !== index);
                                    setFormData(prev => ({ ...prev, customBreakRules: newRules }));
                                  }}
                                  size="small"
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                      )}
                  </Box>

                  {/* 収入シミュレーション - 時給制のみ表示 */}
                  {formData.paymentType === 'hourly' && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          💰 収入シミュレーション（時給制）
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={!!formData.incomePreviewEnabled} 
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                incomePreviewEnabled: e.target.checked
                              }))}
                              color="primary"
                            />
                          }
                          label={
                            <Typography variant="caption" sx={{ fontWeight: 600, color: formData.incomePreviewEnabled ? 'primary.main' : 'text.secondary' }}>
                              {formData.incomePreviewEnabled ? 'ON' : 'OFF'}
                            </Typography>
                          }
                        />
                      </Box>
                      {formData.incomePreviewEnabled && (
                        <Box>
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1 }}>
                            <TextField
                              type="time"
                              label="開始時間"
                              value={preview.startTime}
                              onChange={(e) => setPreview(prev => ({ ...prev, startTime: e.target.value }))}
                              size="small"
                            />
                            <TextField
                              type="time"
                              label="終了時間"
                              value={preview.endTime}
                              onChange={(e) => setPreview(prev => ({ ...prev, endTime: e.target.value }))}
                              size="small"
                            />
                          </Box>
                          <Box sx={{ p: 3, bgcolor: 'success.lighter', borderRadius: 2, border: '1px solid', borderColor: 'success.main' }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                              💵 試算結果: ¥{previewResult.earnings.toLocaleString()}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                              総勤務 {(previewResult.totalMinutes/60).toFixed(1)}h → 
                              休憩 {previewResult.breakMinutes}分除く → 
                              実働 {(previewResult.actualMinutes/60).toFixed(1)}h
                            </Typography>
                            {previewResult.nightHours > 0 && (
                              <Typography variant="body2" color="info.main" sx={{ display: 'block', fontWeight: 600 }}>
                                🌙 深夜勤務 {previewResult.nightHours.toFixed(1)}h含む
                              </Typography>
                            )}
                            {previewResult.overtimeHours > 0 && (
                              <Typography variant="body2" color="warning.main" sx={{ display: 'block', fontWeight: 600 }}>
                                ⚡ 残業時間 {previewResult.overtimeHours.toFixed(1)}h含む
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !formData.name.trim() ||
              (formData.paymentType === 'hourly' && (!formData.defaultHourlyRate || formData.defaultHourlyRate <= 0))
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
