// イベント入力ダイアログ

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  Divider,
  InputAdornment,
  Chip,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Work,
  Person,
  School,
  Groups,
  Event,
  Business,
  AttachMoney,
  AccessTime,
  LocalShipping,
  Notifications,
  Repeat,
  ChevronRight,
  FlashOn,
  CalendarToday,
  Today,
  ArrowForward,
  ChevronLeft,
} from '@mui/icons-material';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useCalendarStore } from '../../store/calendarStore';
import { useSimpleShiftStore } from '../../store/simpleShiftStore';
import { QuickShiftDialog } from './QuickShiftDialog';
import type { CalendarEvent, EventType, NotificationTime, RepeatFrequency } from '../../types/calendar';
import { DEFAULT_EVENT_CATEGORIES } from '../../types/calendar';
import { computeShiftEarnings } from '@/utils/calcShift';
import { useI18n } from '@/hooks/useI18n';
import { APP_COLOR_PALETTE } from '@/utils/colors';

interface EventDialogProps {
  onNavigateToWorkplaceManager?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 0.5 }}>{children}</Box>}
    </div>
  );
};

// ホテル予約スタイルの日付範囲選択コンポーネント
const HotelStyleDateRangePicker: React.FC<{
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}> = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'start' | 'end'>('start');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // カレンダーの日付を生成（指定月の全日付）
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // 月の最初の日
    const firstDay = new Date(year, month, 1);
    // 月の最後の日
    const lastDay = new Date(year, month + 1, 0);
    
    // カレンダーグリッドの最初の日（月曜日から開始）
    const startDate = new Date(firstDay);
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // 月曜日を0とする
    startDate.setDate(firstDay.getDate() - dayOfWeek);
    
    // カレンダーグリッドの日付を生成（6週分 = 42日）
    const days = [] as Array<{ date: Date; isCurrentMonth: boolean; isPast: boolean }>;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isPast: date.getTime() < todayStart.getTime()
      });
    }
    
    return days;
  };
  
  const calendarDays = generateCalendarDays();
  
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return '今日';
    if (date.toDateString() === tomorrow.toDateString()) return '明日';
    
    return format(date, 'M/d(E)', { locale: ja });
  };
  
  const handleDateClick = (dayInfo: { date: Date; isCurrentMonth: boolean; isPast: boolean }) => {
    const { date, isPast } = dayInfo;
    
    // 過去の日付は選択できない（今日は選択可能）
    if (isPast) return;
    
    const dateStr = date.toISOString().split('T')[0];
    
    if (selectionMode === 'start') {
      onStartDateChange(dateStr);
      if (endDate && dateStr > endDate) {
        onEndDateChange(''); // 開始日が終了日より後の場合、終了日をクリア
      }
      setSelectionMode('end');
    } else {
      if (startDate && dateStr >= startDate) {
        onEndDateChange(dateStr);
        setIsOpen(false);
        setSelectionMode('start');
      } else {
        // 開始日より前を選択した場合は開始日として設定
        onStartDateChange(dateStr);
        onEndDateChange('');
        setSelectionMode('end');
      }
    }
  };
  
  const isInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    const dateStr = date.toISOString().split('T')[0];
    return dateStr >= startDate && dateStr <= endDate;
  };
  
  const isStartOrEnd = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === startDate || dateStr === endDate;
  };
  
  return (
    <Box>
      {/* 選択された期間の表示 */}
      <Paper
        sx={{
          p: 2,
          cursor: 'pointer',
          border: '2px solid',
          borderColor: isOpen ? 'primary.main' : 'divider',
          borderRadius: 2,
          '&:hover': { borderColor: 'primary.main' }
        }}
        onClick={() => {
          setIsOpen(!isOpen);
          setSelectionMode('start');
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="caption" color="text.secondary">開始日</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {startDate ? formatDisplayDate(startDate) : '今日'}
            </Typography>
          </Box>
          
          <ArrowForward sx={{ color: 'text.secondary' }} />
          
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="caption" color="text.secondary">終了日</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {endDate ? formatDisplayDate(endDate) : '日付を選択'}
            </Typography>
          </Box>
        </Box>
        
        {startDate && endDate && (
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Chip
              size="small"
              label={`${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}日間`}
              color="primary"
              variant="outlined"
            />
          </Box>
        )}
      </Paper>
      
      {/* カレンダー */}
      {isOpen && (
        <Paper sx={{ mt: 1, p: 2, border: '1px solid', borderColor: 'divider', maxHeight: '400px', overflow: 'auto' }}>
          {/* ヘッダー（月の表示と切り替え） */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <IconButton
              size="small"
              onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            >
              <ChevronLeft />
            </IconButton>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {format(currentMonth, 'yyyy年M月', { locale: ja })}
              </Typography>
              <Typography variant="caption" color="primary.main">
                {selectionMode === 'start' ? '📍 開始日を選択' : '📍 終了日を選択'}
              </Typography>
            </Box>
            
            <IconButton
              size="small"
              onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            >
              <ChevronRight />
            </IconButton>
          </Box>

          {/* 曜日ヘッダー */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
              mb: 1,
            }}
          >
            {['月', '火', '水', '木', '金', '土', '日'].map((day) => (
              <Box key={day} sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>
          
          {/* カレンダーグリッド */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
            }}
          >
            {calendarDays.map((dayInfo, index) => {
              const { date, isCurrentMonth, isPast } = dayInfo;
              const isSelected = isStartOrEnd(date);
              const inRange = isInRange(date);
              
              return (
                <Box
                  key={index}
                  onClick={() => handleDateClick(dayInfo)}
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    cursor: isPast ? 'default' : 'pointer',
                    borderRadius: 1,
                    minHeight: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    opacity: isPast ? 0.3 : isCurrentMonth ? 1 : 0.5,
                    backgroundColor: isSelected
                      ? 'primary.main'
                      : inRange
                      ? 'primary.light'
                      : 'transparent',
                    color: isSelected
                      ? 'primary.contrastText'
                      : inRange
                      ? 'primary.contrastText'
                      : isCurrentMonth
                      ? 'text.primary'
                      : 'text.secondary',
                    '&:hover': !isPast ? {
                      backgroundColor: isSelected
                        ? 'primary.dark'
                        : 'action.hover',
                    } : {},
                  }}
                >
                  <Typography variant="body2" sx={{ 
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: isCurrentMonth ? '0.875rem' : '0.75rem'
                  }}>
                    {date.getDate()}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button size="small" onClick={() => setIsOpen(false)}>完了</Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export const EventDialog: React.FC<EventDialogProps> = ({ 
  onNavigateToWorkplaceManager 
}) => {
  const { t } = useI18n();
  const { 
    isEventDialogOpen, 
    selectedDate, 
    editingEvent,
    initialEventType,
    closeEventDialog,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useCalendarStore();
  
  const { workplaces } = useSimpleShiftStore();

  const [tabValue, setTabValue] = useState(0);
  const [eventType, setEventType] = useState<EventType>('shift');
  const [isOneTime, setIsOneTime] = useState(false);
  const [shiftSelectionStep, setShiftSelectionStep] = useState(1); // 1: workplace selection, 2: shift details
  const [quickShiftDialogOpen, setQuickShiftDialogOpen] = useState(false);
  
  // フォームデータ
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    color: '#64B5F6', // 個人予定のデフォルトは青色
    isAllDay: false,
    description: '',
    // シフト関連
    workplaceId: '',
    workplaceName: '',
    hourlyRate: 1000,
    // 単発詳細
    oneTimeCompany: '',
    oneTimeTotalPay: 0,
    // 労働条件設定（通常シフト用）
    overtimeEnabled: true,
    dayOfWeekSettingsEnabled: false,
    autoBreak6Hours: true,
    autoBreak8Hours: true,
    extraBreakMinutes: 0,
    // 通知・繰り返し設定
    notification: 'none' as NotificationTime,
    repeatFrequency: 'none' as RepeatFrequency,
    // 個人予定の複数日対応
    endDate: '',
  });

  // 初期化
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    } else {
      // selectedDateがない場合は今日の日付を設定
      setFormData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
    }
    
    // 初期タブを設定（優先度：編集モード > 初期イベントタイプ > デフォルトシフト）
    if (editingEvent) {
      // 編集モード：イベントのタイプに基づいてタブを設定
      const tabIndex = editingEvent.type === 'shift' ? 0 : 1;
      setTabValue(tabIndex);
      setEventType(editingEvent.type);
      setFormData({
        title: editingEvent.title,
        date: editingEvent.date,
        startTime: editingEvent.startTime || '',
        endTime: editingEvent.endTime || '',
        color: editingEvent.color,
        isAllDay: editingEvent.isAllDay || false,
        description: editingEvent.description || '',
        workplaceId: editingEvent.workplace?.id || '',
        workplaceName: editingEvent.workplace?.name || '',
        hourlyRate: editingEvent.workplace?.hourlyRate || 1000,
        oneTimeCompany: editingEvent.oneTimeDetails?.companyName || '',
        oneTimeTotalPay: editingEvent.oneTimeDetails?.totalPay || 0,
        // 新規追加フィールド（編集時はデフォルトを付与）
        overtimeEnabled: true,
        dayOfWeekSettingsEnabled: false,
        autoBreak6Hours: true,
        autoBreak8Hours: true,
        extraBreakMinutes: editingEvent.breakTime || 0,
        // 通知・繰り返し設定
        notification: editingEvent.notification || 'none',
        repeatFrequency: editingEvent.repeat?.frequency || 'none',
        // 個人予定の複数日対応
        endDate: editingEvent.endDate || '',
      });
      setIsOneTime(editingEvent.workplace?.isOneTime || false);
    } else {
      // 新規作成モード
      if (initialEventType) {
        // 初期イベントタイプが指定されている場合
        const tabIndex = initialEventType === 'shift' ? 0 : 1;
        setTabValue(tabIndex);
        setEventType(initialEventType);
      } else {
        // デフォルトはシフトタブ
        setTabValue(0);
        setEventType('shift');
      }
      
      // イベントタイプに応じて色とタイトルを設定
      if (initialEventType === 'personal') {
        setFormData(prev => ({ 
          ...prev, 
          color: '#64B5F6', // 個人予定は青
          title: '', // 個人予定は空欄で開始
          date: prev.date || new Date().toISOString().split('T')[0] // デフォルトは今日
        })); 
      } else if (initialEventType === 'shift' || !initialEventType) {
        setFormData(prev => ({ 
          ...prev, 
          color: '#FFD54F', // シフトは黄色
          date: prev.date || new Date().toISOString().split('T')[0] // デフォルトは今日
        })); 
      }
      
      // 単発ではなく通常のシフトを初期選択
      setIsOneTime(false);
      // バイト先が登録されている場合は最初のバイト先を自動選択
      if (workplaces.length > 0 && (initialEventType === 'shift' || !initialEventType)) {
        const firstWorkplace = workplaces[0];
        setFormData(prev => ({
          ...prev,
          workplaceId: firstWorkplace.id,
          workplaceName: firstWorkplace.name,
          hourlyRate: firstWorkplace.defaultHourlyRate,
          // バイト先の労働条件設定を自動反映
          overtimeEnabled: firstWorkplace.overtimeEnabled ?? true,
          autoBreak6Hours: firstWorkplace.autoBreak6Hours ?? true,
          autoBreak8Hours: firstWorkplace.autoBreak8Hours ?? true,
          dayOfWeekSettingsEnabled: firstWorkplace.dayOfWeekSettingsEnabled ?? false,
        }));
      }
    }
  }, [selectedDate, editingEvent, initialEventType, workplaces]);

  // 収入計算
  const calculateEarnings = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    
    const start = parse(formData.startTime, 'HH:mm', new Date());
    let end = parse(formData.endTime, 'HH:mm', new Date());
    
    // 終了時間が開始時間より早い場合、次の日とみなす（例: 23:00 - 02:00）
    if (end.getTime() <= start.getTime()) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000); // 24時間追加
    }
    
    const totalMinutes = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));

    // 休憩時間の算出（手動休憩を優先）
    let breakMinutes = 0;
    if (!isOneTime) {
      // 手動休憩時間が指定されている場合は、それを優先
      // 編集時は既存のbreakTime、新規作成時はextraBreakMinutesを使用
      if (editingEvent?.breakTime !== undefined && editingEvent.breakTime > 0) {
        breakMinutes = editingEvent.breakTime;
      } else if (formData.extraBreakMinutes > 0) {
        breakMinutes = formData.extraBreakMinutes;
      } else {
        // 手動休憩が指定されていない場合のみ自動休憩を適用
        const workHours = totalMinutes / 60;
        const wp = workplaces.find(w => w.id === formData.workplaceId || w.name === formData.workplaceName);
        
        // バイト先の休憩設定を使用（calcShift.tsと同じロジック）
        // 自由休憩（常に適用）
        let freeBreak = 0;
        if (wp?.freeBreakDefault && wp.freeBreakDefault > 0) {
          freeBreak = Math.max(0, wp.freeBreakDefault);
        }

        // 自動休憩（最も長いルールのみ適用）
        let autoBreak = 0;
        if (workHours > 8) {
          if (wp?.breakAuto8hEnabled && wp?.breakRules?.over8h) {
            autoBreak = wp.breakRules.over8h;
          } else if (wp?.autoBreak8Hours) {
            autoBreak = 60; // 旧フィールドのフォールバック
          }
        } else if (workHours > 6) {
          if (wp?.breakAuto6hEnabled && wp?.breakRules?.over6h) {
            autoBreak = wp.breakRules.over6h;
          } else if (wp?.autoBreak6Hours) {
            autoBreak = 45; // 旧フィールドのフォールバック
          }
        } else if (workHours > 4) {
          if (wp?.breakAuto4hEnabled && wp?.breakRules?.over4h) {
            autoBreak = wp.breakRules.over4h;
          }
        }

        // 自由休憩と自動休憩は「大きい方のみ」を採用（重複控除）
        breakMinutes = Math.max(freeBreak, autoBreak);
      }
    }

    const actualMinutes = Math.max(0, totalMinutes - breakMinutes);
    const actualHours = actualMinutes / 60;

    let earnings = 0;
    if (isOneTime) {
      earnings = formData.oneTimeTotalPay || 0;
    } else {
      const wp = workplaces.find(w => w.id === formData.workplaceId || w.name === formData.workplaceName);
      const res = computeShiftEarnings(wp, {
        startTime: formData.startTime,
        endTime: formData.endTime,
        manualBreakMinutes: editingEvent?.breakTime !== undefined && editingEvent.breakTime > 0 
          ? editingEvent.breakTime 
          : (formData.extraBreakMinutes > 0 ? formData.extraBreakMinutes : 0),
        shiftDate: selectedDate,
      });
      earnings = res.totalEarnings;
    }

    return earnings;
  };

  // バイト先選択
  const handleWorkplaceSelect = (workplace: any) => {
    setFormData(prev => ({
      ...prev,
      workplaceId: workplace.id,
      workplaceName: workplace.name,
      hourlyRate: workplace.defaultHourlyRate,
      title: workplace.name,
      // バイト先の労働条件設定を自動反映
      overtimeEnabled: workplace.overtimeEnabled ?? true,
      autoBreak6Hours: workplace.autoBreak6Hours ?? true,
      autoBreak8Hours: workplace.autoBreak8Hours ?? true,
      dayOfWeekSettingsEnabled: workplace.dayOfWeekSettingsEnabled ?? false,
    }));
    setIsOneTime(false);
  };

  // クイック登録を開く
  const handleOpenQuickShift = () => {
    setQuickShiftDialogOpen(true);
  };

  // 保存処理
  const handleSave = () => {
    // タイトルは種類に応じて自動決定（シフト=職場名/単発会社名、プライベート=入力値）
    const computedShiftTitle = isOneTime
      ? (formData.oneTimeCompany || formData.title)
      : (formData.workplaceName || formData.title);

    const baseEvent: Omit<CalendarEvent, 'id'> = {
      date: formData.date,
      type: eventType,
      title: eventType === 'shift' ? (computedShiftTitle || '') : formData.title,
      startTime: formData.isAllDay ? undefined : formData.startTime,
      endTime: formData.isAllDay ? undefined : formData.endTime,
      color: formData.color,
      isAllDay: formData.isAllDay,
      description: formData.description,
      // 通知・繰り返し設定
      notification: formData.notification !== 'none' ? formData.notification : undefined,
      repeat: formData.repeatFrequency !== 'none' ? { frequency: formData.repeatFrequency } : undefined,
      // 複数日対応
      endDate: formData.endDate || undefined,
    };

    // シフトの場合
    if (eventType === 'shift') {
      if (isOneTime) {
        // 単発バイト
        (baseEvent as any).workplace = {
          id: 'onetime-' + Date.now(),
          name: formData.oneTimeCompany,
          hourlyRate: 0, // 単発は時給ベースではない
          isOneTime: true,
        };
        (baseEvent as any).oneTimeDetails = {
          companyName: formData.oneTimeCompany,
          totalPay: formData.oneTimeTotalPay,
        };
        // タイトルを会社名で上書き（念のため）
        (baseEvent as any).title = formData.oneTimeCompany || baseEvent.title;
      } else {
        // 登録済みバイト先
        (baseEvent as any).workplace = {
          id: formData.workplaceId,
          name: formData.workplaceName,
          hourlyRate: formData.hourlyRate,
          isOneTime: false,
        };
        // タイトルを職場名で上書き（念のため）
        (baseEvent as any).title = formData.workplaceName || baseEvent.title;
      }
      (baseEvent as any).earnings = calculateEarnings();
      // 休憩時間を保存（編集時は既存のbreakTime、新規作成時はextraBreakMinutesを使用）
      const breakTimeValue = editingEvent?.breakTime || (formData.extraBreakMinutes > 0 ? formData.extraBreakMinutes : undefined);
      if (breakTimeValue !== undefined) {
        (baseEvent as any).breakTime = breakTimeValue;
      }
    }

    if (editingEvent) {
      updateEvent(editingEvent.id, baseEvent);
    } else {
      // 複数日イベント（個人 or シフト）は帯表示用に分割保存
      if ((eventType === 'personal' || eventType === 'shift') && formData.endDate && formData.endDate > formData.date) {
        const startDate = new Date(formData.date);
        const endDate = new Date(formData.endDate);
        const spanParentId = `span-${Date.now()}`;
        
        // 各日付でイベントを作成
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const eventForDay = {
            ...baseEvent,
            date: d.toISOString().split('T')[0],
            parentId: spanParentId,
          };
          addEvent(eventForDay);
        }
      } else {
        // 通常の単日イベント
        addEvent(baseEvent);
      }
    }
    
    closeEventDialog();
  };

  // 削除処理
  const handleDelete = () => {
    if (editingEvent) {
      deleteEvent(editingEvent.id);
      closeEventDialog();
    }
  };

  return (
    <Dialog
      open={isEventDialogOpen}
      onClose={closeEventDialog}
      fullScreen
      PaperProps={{ 
        sx: { 
          borderRadius: 0,
          maxHeight: '100vh',
          overflow: 'hidden'
        } 
      }}
    >
      <DialogTitle sx={{ pb: 0.5, pt: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {editingEvent ? '予定編集' : '新しい予定'}
          </Typography>
          {formData.date && (
            <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
              <Chip
                label={format(new Date(formData.date), 'M/d', { locale: ja })}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: '18px' }}
              />
            </Box>
          )}
          {!editingEvent && (
            <Button
              size="small"
              variant="contained"
              startIcon={<FlashOn />}
              onClick={handleOpenQuickShift}
              sx={{
                minWidth: 'auto',
                px: 1,
                py: 0.25,
                fontSize: '0.7rem',
                height: '24px',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)',
                },
              }}
            >
              クイック
            </Button>
          )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ overflow: 'auto', px: 3, py: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* コンパクトタブ */}
        <Box sx={{ display: 'flex', mb: 1, borderRadius: 1, bgcolor: 'rgba(0, 188, 212, 0.1)', p: 0.25 }}>
          <Button
            onClick={() => { setTabValue(0); setEventType('shift'); }}
            variant="text"
            size="small"
            sx={{
              flex: 1,
              py: 0.5,
              fontSize: '0.8rem',
              minHeight: '32px',
              borderRadius: 1,
              ...(tabValue === 0 ? {
                bgcolor: 'white',
                color: '#00838F',
                fontWeight: 600,
              } : {
                color: 'text.secondary',
                bgcolor: 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                }
              })
            }}
          >
            <Work sx={{ mr: 0.5, fontSize: '16px' }} />
            シフト
          </Button>
          <Button
            onClick={() => { setTabValue(1); setEventType('personal'); }}
            variant="text"
            size="small"
            sx={{
              flex: 1,
              py: 0.5,
              fontSize: '0.8rem',
              minHeight: '32px',
              borderRadius: 1,
              ...(tabValue === 1 ? {
                bgcolor: 'white',
                color: '#00838F',
                fontWeight: 600,
              } : {
                color: 'text.secondary',
                bgcolor: 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                }
              })
            }}
          >
            <Person sx={{ mr: 0.5, fontSize: '16px' }} />
            個人
          </Button>
        </Box>

        {/* シフトタブ */}
        <TabPanel value={tabValue} index={0}>
          {/* シンプルなシフト登録選択 */}
          {workplaces.length === 0 && !isOneTime && (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center',
              px: 2,
              py: 4
            }}>
              <Typography variant="h6" sx={{ mb: 4, fontWeight: 600, textAlign: 'center' }}>
                シフトの種類を選択
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', maxWidth: 400 }}>
                <Button 
                  variant="outlined" 
                  size="large"
                  startIcon={<Business />}
                  onClick={() => {
                    if (onNavigateToWorkplaceManager) {
                      closeEventDialog();
                      onNavigateToWorkplaceManager();
                    } else {
                      alert('バイト先登録画面に移動します（実装予定）');
                    }
                  }}
                  sx={{
                    py: 3,
                    fontSize: '1.2rem',
                    borderColor: '#00BCD4',
                    color: '#00BCD4',
                    borderWidth: 2,
                    borderRadius: 2,
                    minHeight: 64,
                    '&:hover': {
                      borderColor: '#0097A7',
                      backgroundColor: 'rgba(0, 188, 212, 0.08)',
                      borderWidth: 2,
                    }
                  }}
                >
                  バイト先を登録
                </Button>
                
                <Button 
                  variant="outlined" 
                  size="large"
                  startIcon={<AttachMoney />}
                  onClick={() => {
                    setIsOneTime(true);
                    setFormData(prev => ({ ...prev, title: '', workplaceId: '', workplaceName: '' }));
                  }}
                  sx={{
                    py: 3,
                    fontSize: '1.2rem',
                    borderColor: '#FF9800',
                    color: '#FF9800',
                    borderWidth: 2,
                    borderRadius: 2,
                    minHeight: 64,
                    '&:hover': {
                      borderColor: '#F57C00',
                      backgroundColor: 'rgba(255, 152, 0, 0.08)',
                      borderWidth: 2,
                    }
                  }}
                >
                  単発バイト
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 3, fontSize: '0.9rem', lineHeight: 1.4, textAlign: 'center' }}>
                定期：毎回同じ職場でのシフト<br />
                単発：一度きりのお仕事
              </Typography>
            </Box>
          )}

          {/* 単発バイト選択時のフォーム */}
          {workplaces.length === 0 && isOneTime && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  単発バイト情報
                </Typography>
                <Button 
                  size="small" 
                  variant="text" 
                  onClick={() => setIsOneTime(false)}
                  sx={{ fontSize: '0.8rem', color: 'text.secondary' }}
                >
                  選択に戻る
                </Button>
              </Box>
              
              <TextField
                fullWidth
                label="バイト先名"
                value={formData.oneTimeCompany}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  oneTimeCompany: e.target.value,
                  title: e.target.value,
                }))}
                placeholder="例: イベントスタッフ"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label="合計給料"
                value={formData.oneTimeTotalPay}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setFormData(prev => ({ 
                    ...prev, 
                    oneTimeTotalPay: value,
                  }));
                }}
                placeholder="時給・交通費・手当などを含む総額"
                InputProps={{
                  startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                }}
                helperText="時給・交通費・各種手当を含めた総支給額を入力してください"
              />
            </Box>
          )}
          
          {/* ステップ1: バイト先または単発選択 */}
          {shiftSelectionStep === 1 && (workplaces.length > 0 || isOneTime) && (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center',
              px: 2,
              py: 2
            }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                バイト先を選択
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 400 }}>
                {/* 登録済みバイト先ボタン */}
                {workplaces.map((workplace) => (
                  <Button
                    key={workplace.id}
                    variant="outlined"
                    size="large"
                    onClick={() => {
                      handleWorkplaceSelect(workplace);
                      setShiftSelectionStep(2);
                    }}
                    sx={{
                      py: 2,
                      fontSize: '1.1rem',
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      borderRadius: 2,
                      borderColor: '#81d4fa',
                      color: '#01579b',
                      borderWidth: 2,
                      '&:hover': {
                        borderColor: '#4fc3f7',
                        backgroundColor: 'rgba(129, 212, 250, 0.08)',
                        borderWidth: 2,
                      }
                    }}
                  >
                    <Business sx={{ mr: 1 }} />
                    {workplace.name}
                  </Button>
                ))}
                
                {/* 単発バイトボタン */}
                <Button 
                  variant="outlined" 
                  size="large"
                  startIcon={<AttachMoney />}
                  onClick={() => {
                    setIsOneTime(true);
                    setFormData(prev => ({ ...prev, title: '', workplaceId: '', workplaceName: '' }));
                    setShiftSelectionStep(2);
                  }}
                  sx={{
                    py: 2,
                    fontSize: '1.1rem',
                    borderColor: '#FF9800',
                    color: '#FF9800',
                    borderWidth: 2,
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: '#F57C00',
                      backgroundColor: 'rgba(255, 152, 0, 0.08)',
                      borderWidth: 2,
                    }
                  }}
                >
                  単発バイト
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontSize: '0.9rem', lineHeight: 1.4, textAlign: 'center' }}>
                定期：毎回同じ職場でのシフト<br />
                単発：一度きりのお仕事
              </Typography>
            </Box>
          )}

          {/* ステップ2: シフト詳細入力 */}
          {shiftSelectionStep === 2 && (workplaces.length > 0 || isOneTime) && (
            <>
              {/* 戻るボタン */}
              <Box sx={{ mb: 1 }}>
                <Button 
                  size="small" 
                  variant="text" 
                  startIcon={<ChevronLeft />}
                  onClick={() => {
                    setShiftSelectionStep(1);
                    if (isOneTime) {
                      setIsOneTime(false);
                      setFormData(prev => ({ ...prev, workplaceId: '', workplaceName: '', oneTimeCompany: '', oneTimeTotalPay: 0 }));
                    }
                  }}
                  sx={{ fontSize: '0.8rem', color: 'text.secondary' }}
                >
                  選択に戻る
                </Button>
              </Box>

              {/* 選択されたバイト先表示 */}
              {!isOneTime && formData.workplaceName && (
                <Box sx={{ p: 1.5, bgcolor: 'rgba(129, 212, 250, 0.1)', borderRadius: 1, mb: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#01579b' }}>
                    {formData.workplaceName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    時給: ¥{formData.hourlyRate?.toLocaleString()}
                  </Typography>
                </Box>
              )}

              {/* 単発バイト詳細入力 */}
              {isOneTime && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
                    単発バイト情報
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="バイト先名"
                    value={formData.oneTimeCompany}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      oneTimeCompany: e.target.value,
                      title: e.target.value,
                    }))}
                    placeholder="例: イベントスタッフ"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="合計給料"
                    value={formData.oneTimeTotalPay}
                    onChange={(e) => {
                      const value = Math.max(0, parseInt(e.target.value) || 0);
                      setFormData(prev => ({ 
                        ...prev, 
                        oneTimeTotalPay: value,
                      }));
                    }}
                    placeholder="時給・交通費・手当などを含む総額"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                    }}
                    helperText="時給・交通費・各種手当を含めた総支給額を入力してください"
                    sx={{ mb: 2 }}
                  />
                </Box>
              )}


              {/* 色選択（コンパクト版） */}
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                  {t('calendar.event.pickColor', '色を選択')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'space-between', maxWidth: '100%', overflowX: 'auto' }}>
                  {APP_COLOR_PALETTE.map(option => (
                    <Box
                      key={option.key}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: option.color,
                        cursor: 'pointer',
                        border: formData.color === option.color ? '2px solid' : '1px solid',
                        borderColor: formData.color === option.color ? 'primary.main' : 'divider',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        '&:hover': { transform: 'scale(1.1)' },
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, color: option.color }))}
                      title={option.label}
                    />
                  ))}
                </Box>
              </Box>

              {/* 日付・時間（コンパクト版） */}
              <Box sx={{ mb: 1 }}>
                <FormControlLabel
                  control={<Switch checked={formData.isAllDay} onChange={(e) => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))} size="small" />}
                  label={<Typography variant="body2">{t('calendar.event.allDay', '終日')}</Typography>}
                  sx={{ mb: 0.25 }}
                />
                <Grid container spacing={1} sx={{ mb: 0.5 }}>
                  <Grid item xs={7}>
                    <TextField
                      fullWidth
                      type="date"
                      label={t('calendar.event.startDate', '開始日')}
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      type="time"
                      label={t('calendar.event.startTime', '開始時間')}
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      disabled={formData.isAllDay}
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={1}>
                  <Grid item xs={7}>
                    <TextField
                      fullWidth
                      type="date"
                      label={t('calendar.event.endDate', '終了日')}
                      value={formData.endDate || formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      type="time"
                      label={t('calendar.event.endTime', '終了時間')}
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      disabled={formData.isAllDay}
                    />
                  </Grid>
                </Grid>
              </Box>



              {/* 予想収入表示（コンパクト版） */}
              {formData.startTime && formData.endTime && (formData.workplaceId || isOneTime) && (
                <Box sx={{ p: 1, bgcolor: '#bae6fd', borderRadius: 1, textAlign: 'center', mb: 1 }}>
                  <Typography variant="body1" color="#0c4a6e" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                    {t('calendar.event.estimatedIncome', '予想収入')}: ¥{calculateEarnings().toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(() => {
                      const start = new Date(`2000-01-01T${formData.startTime}`);
                      let end = new Date(`2000-01-01T${formData.endTime}`);
                      
                      // 終了時間が開始時間より早い場合、次の日とみなす
                      if (end.getTime() <= start.getTime()) {
                        end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
                      }
                      
                      const totalMinutes = Math.max(0, (end.getTime() - start.getTime()) / 60000);
                      // 休憩は手動優先（入力があればそれを採用）。無ければ自動（6h/8h）
                      let breakMinutes = 0;
                      if (!isOneTime) {
                        // 編集時は既存のbreakTime、新規作成時はextraBreakMinutesを使用
                        if (editingEvent?.breakTime !== undefined && editingEvent.breakTime > 0) {
                          breakMinutes = editingEvent.breakTime;
                        } else if (formData.extraBreakMinutes > 0) {
                          breakMinutes = formData.extraBreakMinutes;
                        } else {
                          const workHours = totalMinutes / 60;
                          const wp = workplaces.find(w => w.id === formData.workplaceId || w.name === formData.workplaceName);
                          
                          // バイト先の休憩設定を使用（calcShift.tsと同じロジック）
                          
                          // 自由休憩（常に適用）
                          let freeBreak = 0;
                          if (wp?.freeBreakDefault && wp.freeBreakDefault > 0) {
                            freeBreak = Math.max(0, wp.freeBreakDefault);
                          }

                          // 自動休憩（最も長いルールのみ適用）
                          let autoBreak = 0;
                          if (workHours > 8) {
                            if (wp?.breakAuto8hEnabled && wp?.breakRules?.over8h) {
                              autoBreak = wp.breakRules.over8h;
                            } else if (wp?.autoBreak8Hours) {
                              autoBreak = 60; // 旧フィールドのフォールバック
                            }
                          } else if (workHours > 6) {
                            if (wp?.breakAuto6hEnabled && wp?.breakRules?.over6h) {
                              autoBreak = wp.breakRules.over6h;
                            } else if (wp?.autoBreak6Hours) {
                              autoBreak = 45; // 旧フィールドのフォールバック
                            }
                          } else if (workHours > 4) {
                            if (wp?.breakAuto4hEnabled && wp?.breakRules?.over4h) {
                              autoBreak = wp.breakRules.over4h;
                            }
                          }

                          // 自由休憩と自動休憩は「大きい方のみ」を採用（重複控除）
                          breakMinutes = Math.max(freeBreak, autoBreak);
                        }
                      }
                      const workMinutes = Math.max(0, totalMinutes - breakMinutes);
                      const actualHours = workMinutes / 60;
                      const formatHours = (hours: number) => {
                        return hours % 1 === 0 ? hours.toString() : hours.toFixed(2).replace(/\.?0+$/, '');
                      };
                      return `${t('calendar.event.workMinutes','勤務時間')}: ${Math.floor(totalMinutes / 60)}${t('calendar.event.hours','時間')}${Math.floor(totalMinutes % 60)}${t('calendar.event.minutes','分')} ／ 休憩: ${breakMinutes}分 → 実働: ${formatHours(actualHours)}h`;
                    })()}
                  </Typography>
                </Box>
              )}

              {/* シフト用繰り返し設定（コンパクト版） */}
              {(formData.workplaceId || isOneTime) && !isOneTime && (
                <Box sx={{ mb: 1 }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>{t('calendar.event.repeat', '繰り返し')}</InputLabel>
                        <Select
                          value={formData.repeatFrequency}
                          onChange={(e) => setFormData(prev => ({ ...prev, repeatFrequency: e.target.value as RepeatFrequency }))}
                          label={t('calendar.event.repeat', '繰り返し')}
                          size="small"
                        >
                          <MenuItem value="none">{t('common.none', 'なし')}</MenuItem>
                          <MenuItem value="weekly">{t('calendar.event.weekly', '毎週')}</MenuItem>
                          <MenuItem value="monthly">{t('calendar.event.monthly', '毎月')}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}></Grid>
                  </Grid>
                  
                  {/* メモ入力 */}
                  <TextField
                    fullWidth
                    multiline
                    rows={1}
                    label={t('calendar.event.memo', 'メモ')}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('calendar.event.memo.placeholder', 'シフトに関するメモや注意事項')}
                    sx={{ mt: 0.5 }}
                    size="small"
                  />
                </Box>
              )}
            </>
          )}
        </TabPanel>

          {/* 個人タブ */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'flex-start',
            height: '100%',
            gap: 2
          }}>
            {/* タイトル入力 */}
            <TextField
              fullWidth
              label={t('calendar.event.title', 'タイトル')}
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('calendar.event.title.placeholder', '例: 友達と遊ぶ、英語の勉強、病院など')}
            />

            {/* 色選択（コンパクト版） */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.85rem' }}>
                {t('calendar.event.pickColor', '色を選択')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'space-between', maxWidth: '100%', overflowX: 'auto' }}>
                {APP_COLOR_PALETTE.map(option => (
                  <Box
                    key={option.key}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: option.color,
                      cursor: 'pointer',
                      border: formData.color === option.color ? '2px solid' : '1px solid',
                      borderColor: formData.color === option.color ? 'primary.main' : 'divider',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      '&:hover': { transform: 'scale(1.1)' },
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, color: option.color }))}
                    title={option.label}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </TabPanel>

        {/* 個人タブの共通項目 */}
        {tabValue === 1 && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1.5,
            mt: 2
          }}>
            {/* 日付・時間（コンパクト版） */}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isAllDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))}
                  size="small"
                />
              }
              label={<Typography variant="body2">{t('calendar.event.allDay', '終日')}</Typography>}
            />

            <Grid container spacing={1}>
              <Grid item xs={7}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('calendar.event.startDate', '開始日')}
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  type="time"
                  label={t('calendar.event.startTime', '開始時間')}
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  disabled={formData.isAllDay}
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={1}>
              <Grid item xs={7}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('calendar.event.endDate', '終了日')}
                  value={formData.endDate || formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  type="time"
                  label={t('calendar.event.endTime', '終了時間')}
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  disabled={formData.isAllDay}
                />
              </Grid>
            </Grid>

            {/* 通知・繰り返し設定（コンパクト版） */}
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('calendar.event.notification', '通知')}</InputLabel>
                  <Select
                    value={formData.notification}
                    onChange={(e) => setFormData(prev => ({ ...prev, notification: e.target.value as NotificationTime }))}
                    label={t('calendar.event.notification', '通知')}
                  >
                    <MenuItem value="none">{t('common.none', 'なし')}</MenuItem>
                    <MenuItem value="5">5分前</MenuItem>
                    <MenuItem value="15">15分前</MenuItem>
                    <MenuItem value="30">30分前</MenuItem>
                    <MenuItem value="60">1時間前</MenuItem>
                    <MenuItem value="1440">1日前</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('calendar.event.repeat', '繰り返し')}</InputLabel>
                  <Select
                    value={formData.repeatFrequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, repeatFrequency: e.target.value as RepeatFrequency }))}
                    label={t('calendar.event.repeat', '繰り返し')}
                  >
                    <MenuItem value="none">{t('common.none', 'なし')}</MenuItem>
                    <MenuItem value="daily">毎日</MenuItem>
                    <MenuItem value="weekly">毎週</MenuItem>
                    <MenuItem value="monthly">毎月</MenuItem>
                    <MenuItem value="yearly">毎年</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <TextField
              fullWidth
              multiline
              rows={2}
              label={t('calendar.event.memo', 'メモ')}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('calendar.event.memo.placeholder', '詳細をメモ')}
              size="small"
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        borderTop: '1px solid', 
        borderColor: 'divider', 
        px: 3, 
        py: 2.5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2
      }}>
        {editingEvent ? (
          <Button 
            onClick={handleDelete} 
            color="error"
            variant="outlined"
            sx={{ 
              minWidth: 80,
              borderRadius: 2,
              fontWeight: 600
            }}
          >
            {t('common.delete', '削除')}
          </Button>
        ) : (
          <Box sx={{ minWidth: 80 }} />
        )}
        
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button 
            onClick={closeEventDialog}
            variant="outlined"
            sx={{ 
              minWidth: 100,
              borderRadius: 2,
              fontWeight: 600,
              borderColor: 'grey.400',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'grey.600',
                backgroundColor: 'grey.50'
              }
            }}
          >
            {t('common.cancel', 'キャンセル')}
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={false}
            sx={{ 
              minWidth: 100,
              borderRadius: 2,
              fontWeight: 600,
              py: 1
            }}
          >
            {t('common.save', '保存')}
          </Button>
        </Box>
      </DialogActions>

      {/* クイックシフト登録ダイアログ */}
      <QuickShiftDialog
        open={quickShiftDialogOpen}
        selectedDate={formData.date}
        onClose={() => setQuickShiftDialogOpen(false)}
      />
    </Dialog>
  );
};