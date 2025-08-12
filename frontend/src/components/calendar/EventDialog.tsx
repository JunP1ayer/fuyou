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
      {value === index && <Box sx={{ py: 1 }}>{children}</Box>}
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
        extraBreakMinutes: 0,
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

    // 休憩時間の算出
    let breakMinutes = 0;
    if (!isOneTime) {
      // 手動休憩
      if (formData.extraBreakMinutes) breakMinutes += Math.max(0, Number(formData.extraBreakMinutes) || 0);
      // 自動休憩（6h/8h）
      const workHours = totalMinutes / 60;
      if (formData.autoBreak8Hours && workHours > 8) {
        breakMinutes += 60;
      } else if (formData.autoBreak6Hours && workHours > 6) {
        breakMinutes += 45;
      }
    }

    const actualMinutes = Math.max(0, totalMinutes - breakMinutes);
    const actualHours = actualMinutes / 60;

    let earnings = 0;
    if (isOneTime) {
      // 単発バイトの場合は入力された総額をそのまま使用
      earnings = formData.oneTimeTotalPay || 0;
    } else {
      // 通常のシフトの場合は時給計算
      const rate = formData.hourlyRate;
      earnings = Math.floor(actualHours * rate);

      // 残業割増（8h超は1.25倍）
      if (formData.overtimeEnabled && actualHours > 8) {
        const regularHours = 8;
        const overtimeHours = actualHours - 8;
        earnings = Math.floor(regularHours * rate + overtimeHours * rate * 1.25);
      }
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
    const baseEvent: Omit<CalendarEvent, 'id'> = {
      date: formData.date,
      type: eventType,
      title: formData.title,
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
      } else {
        // 登録済みバイト先
        (baseEvent as any).workplace = {
          id: formData.workplaceId,
          name: formData.workplaceName,
          hourlyRate: formData.hourlyRate,
          isOneTime: false,
        };
      }
      (baseEvent as any).earnings = calculateEarnings();
    }

    if (editingEvent) {
      updateEvent(editingEvent.id, baseEvent);
    } else {
      // 複数日の個人予定の場合、各日にイベントを作成
      if (eventType === 'personal' && formData.endDate && formData.endDate > formData.date) {
        const startDate = new Date(formData.date);
        const endDate = new Date(formData.endDate);
        
        // 各日付でイベントを作成
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const eventForDay = {
            ...baseEvent,
            date: d.toISOString().split('T')[0],
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
      maxWidth="sm"
      fullWidth
      PaperProps={{ 
        sx: { 
          borderRadius: 2,
          maxHeight: '90vh',
          overflow: 'hidden'
        } 
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingEvent ? t('calendar.event.editTitle', '予定を編集') : t('calendar.event.newTitle', '新しい予定を追加')}
            {formData.date && (
              <Chip
                label={format(new Date(formData.date), 'M月d日(E)', { locale: ja })}
                size="small"
                color="primary"
              />
            )}
          </Box>
          {!editingEvent && (
            <Button
              size="small"
              variant="contained"
              startIcon={<FlashOn />}
              onClick={handleOpenQuickShift}
              sx={{
                minWidth: 'auto',
                px: 2,
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)',
                },
              }}
            >
              {t('calendar.event.quickAdd', 'クイック登録')}
            </Button>
          )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ overflow: 'auto', px: 3, py: 2 }}>
        {/* イベントタイプ選択タブ */}
        <Tabs 
          value={tabValue} 
          onChange={(_, v) => {
            setTabValue(v);
            setEventType(['shift', 'personal'][v] as EventType);
          }}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}
        >
          <Tab label={t('calendar.event.tab.shift', 'シフト')} icon={<Work />} iconPosition="start" />
          <Tab label={t('calendar.event.tab.personal', '個人')} icon={<Person />} iconPosition="start" />
        </Tabs>

        {/* シフトタブ */}
        <TabPanel value={tabValue} index={0}>
          {/* バイト先未登録の場合の誘導 */}
          {workplaces.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
              <Business sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                {t('calendar.event.howToRegisterShift', 'シフトを登録する方法')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('calendar.event.registerWorkplaceHint', '定期的にバイトをする場合は先にバイト先を登録しましょう')}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="contained" 
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
                    background: 'linear-gradient(135deg, #64B5F6 0%, #42A5F5 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #42A5F5 0%, #64B5F6 100%)',
                    }
                  }}
                >
                  {t('calendar.event.registerWorkplace', 'バイト先を登録する')}
                </Button>
                
                <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                  {t('common.or', 'または')}
                </Typography>
                
                <Button 
                  variant="outlined" 
                  startIcon={<AttachMoney />}
                  onClick={() => {
                    setIsOneTime(true);
                    setFormData(prev => ({ ...prev, title: '', workplaceId: '', workplaceName: '' }));
                  }}
                  sx={{
                    borderColor: '#FFA726',
                    color: '#FFA726',
                    '&:hover': {
                      borderColor: '#FF9800',
                      backgroundColor: 'rgba(255, 167, 38, 0.1)'
                    }
                  }}
                >
                  {t('calendar.event.registerOneTime', '単発バイトとして登録')}
                </Button>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                {t('calendar.event.oneTimeDesc', '単発バイト：一回限りのバイトやイベントスタッフなど')}
              </Typography>
            </Box>
          ) : null}
          
          {/* バイト先登録済み または 単発バイト選択時のフォーム */}
          {(workplaces.length > 0 || isOneTime) && (
            <>
              {/* バイト先選択（登録済みバイト先がある場合のみ表示） */}
              {workplaces.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {t('calendar.event.pickWorkplace', 'バイト先を選択')}
                  </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {workplaces.map((workplace) => (
                    <Chip
                      key={workplace.id}
                      label={workplace.name}
                      clickable
                      color={formData.workplaceId === workplace.id && !isOneTime ? 'primary' : 'default'}
                      variant={formData.workplaceId === workplace.id && !isOneTime ? 'filled' : 'outlined'}
                      onClick={() => handleWorkplaceSelect(workplace)}
                      sx={{ 
                        fontSize: '0.8rem',
                        '& .MuiChip-label': {
                          px: 2
                        }
                      }}
                    />
                  ))}
                  <Chip
                    label={t('calendar.event.oneTime', '単発バイト')}
                    clickable
                    color={isOneTime ? 'secondary' : 'default'}
                    variant={isOneTime ? 'filled' : 'outlined'}
                    onClick={() => {
                      setIsOneTime(true);
                      setFormData(prev => ({ ...prev, title: '', workplaceId: '', workplaceName: '' }));
                    }}
                    sx={{ fontSize: '0.8rem' }}
                  />
                </Box>
                </Box>
              )}

              {/* 単発バイト詳細入力（簡潔版） */}
              {isOneTime && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label={t('calendar.event.company', 'バイト先名')}
                    value={formData.oneTimeCompany}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      oneTimeCompany: e.target.value,
                      title: e.target.value,
                    }))}
                    placeholder={t('calendar.event.company.placeholder', '例: イベントスタッフ')}
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

              {/* 色選択（共通パレット） */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('calendar.event.pickColor', '色を選択')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {APP_COLOR_PALETTE.map(option => (
                    <Box
                      key={option.key}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: option.color,
                        cursor: 'pointer',
                        border: formData.color === option.color ? '3px solid' : '1px solid',
                        borderColor: formData.color === option.color ? 'primary.main' : 'divider',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        '&:hover': { transform: 'scale(1.1)' },
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, color: option.color }))}
                      title={option.label}
                    />
                  ))}
                </Box>
              </Box>

              {/* 時間選択（シンプル版） */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('calendar.event.pickTime', '時間を選択')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label={t('calendar.event.startTime', '開始時間')}
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label={t('calendar.event.endTime', '終了時間')}
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      helperText={formData.startTime && formData.endTime && formData.endTime <= formData.startTime ? '夜勤など翌日にまたがる場合OK（例: 23:00-02:00）' : ''}
                    />
                  </Grid>
                </Grid>
              </Box>



              {/* 予想収入表示 */}
              {formData.startTime && formData.endTime && (formData.workplaceId || isOneTime) && (
                <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 1, textAlign: 'center', mb: 2 }}>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
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
                      let breakMinutes = 0;
                      if (!isOneTime) {
                        if (formData.extraBreakMinutes) breakMinutes += Math.max(0, Number(formData.extraBreakMinutes) || 0);
                        const workHours = totalMinutes / 60;
                        if (formData.autoBreak8Hours && workHours > 8) breakMinutes += 60;
                        else if (formData.autoBreak6Hours && workHours > 6) breakMinutes += 45;
                      }
                      const workMinutes = Math.max(0, totalMinutes - breakMinutes);
                      return `${t('calendar.event.workMinutes','勤務時間')}: ${Math.floor(totalMinutes / 60)}${t('calendar.event.hours','時間')}${Math.floor(totalMinutes % 60)}${t('calendar.event.minutes','分')} ／ 休憩: ${breakMinutes}分 → 実働: ${Math.floor(workMinutes / 60)}h`;
                    })()}
                  </Typography>
                </Box>
              )}

              {/* シフト用繰り返し設定 */}
              {(formData.workplaceId || isOneTime) && !isOneTime && (
                <Box sx={{ mb: 2 }}>
                  <List 
                    sx={{ 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: 2, 
                      p: 0,
                      bgcolor: 'background.paper'
                    }}
                  >
                    <ListItem sx={{ py: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Repeat sx={{ fontSize: 20, color: 'text.secondary' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={t('calendar.event.repeat', '繰り返し')} 
                        sx={{ '& .MuiTypography-root': { fontWeight: 500 } }}
                      />
                      <FormControl sx={{ minWidth: 120 }}>
                        <Select
                          value={formData.repeatFrequency}
                          onChange={(e) => setFormData(prev => ({ ...prev, repeatFrequency: e.target.value as RepeatFrequency }))}
                          variant="standard"
                          disableUnderline
                          sx={{ 
                            fontSize: '0.9rem',
                            color: 'text.secondary',
                            '& .MuiSelect-select': {
                              paddingRight: '24px !important'
                            }
                          }}
                        >
                          <MenuItem value="none">{t('common.none', 'なし')}</MenuItem>
                          <MenuItem value="weekly">{t('calendar.event.weekly', '毎週')}</MenuItem>
                          <MenuItem value="monthly">{t('calendar.event.monthly', '毎月')}</MenuItem>
                        </Select>
                      </FormControl>
                      <ChevronRight sx={{ fontSize: 16, color: 'text.disabled', ml: 1 }} />
                    </ListItem>
                  </List>
                  
                  {/* メモ入力 */}
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label={t('calendar.event.memo', 'メモ')}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('calendar.event.memo.placeholder', 'シフトに関するメモや注意事項')}
                    sx={{ mt: 2 }}
                    size="small"
                  />
                </Box>
              )}
            </>
          )}
        </TabPanel>

          {/* 個人タブ */}
        <TabPanel value={tabValue} index={1}>
          {/* タイトル入力 */}
          <TextField
            fullWidth
              label={t('calendar.event.title', 'タイトル')}
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('calendar.event.title.placeholder', '例: 友達と遊ぶ、英語の勉強、病院など')}
            sx={{ mb: 2 }}
          />

          {/* 色選択（共通パレット） */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: '0.9rem' }}>
              {t('calendar.event.pickColor', '色を選択')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {APP_COLOR_PALETTE.map(option => (
                <Box
                  key={option.key}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: option.color,
                    cursor: 'pointer',
                    border: formData.color === option.color ? '2px solid' : '1px solid',
                    borderColor: formData.color === option.color ? 'primary.main' : 'divider',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    '&:hover': { transform: 'scale(1.1)' },
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, color: option.color }))}
                  title={option.label}
                />
              ))}
            </Box>
          </Box>
        </TabPanel>

        {/* 個人タブの共通項目 */}
        {tabValue === 1 && (
          <Box>
            {/* ホテル予約スタイルの日付選択 */}
            <Box sx={{ mb: 2 }}>
              <HotelStyleDateRangePicker
                startDate={formData.date}
                endDate={formData.endDate}
                onStartDateChange={(date) => setFormData(prev => ({ ...prev, date }))}
                onEndDateChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isAllDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))}
                />
              }
              label={t('calendar.event.allDay', '終日')}
              sx={{ mb: 1.5 }}
            />
            
            {!formData.isAllDay && (
              <Grid container spacing={2} sx={{ mb: 1.5 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label={t('calendar.event.startTime', '開始時間')}
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label={t('calendar.event.endTime', '終了時間')}
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
              </Grid>
            )}
            
            {/* 通知・繰り返し設定（コンパクト版） */}
            <Grid container spacing={2} sx={{ mb: 1.5 }}>
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

      <DialogActions>
        {editingEvent && (
          <Button onClick={handleDelete} color="error">
            {t('common.delete', '削除')}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={closeEventDialog}>{t('common.cancel', 'キャンセル')}</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={
            !formData.title || 
            (eventType === 'shift' && workplaces.length > 0 && !formData.workplaceId && !isOneTime) ||
            (eventType === 'shift' && (!formData.startTime || !formData.endTime)) ||
            (isOneTime && !formData.oneTimeCompany)
          }
        >
          {t('common.save', '保存')}
        </Button>
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