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
} from '@mui/icons-material';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useCalendarStore } from '../../store/calendarStore';
import { useSimpleShiftStore } from '../../store/simpleShiftStore';
import type { CalendarEvent, EventType, NotificationTime, RepeatFrequency } from '../../types/calendar';
import { DEFAULT_EVENT_CATEGORIES } from '../../types/calendar';
import { useI18n } from '@/hooks/useI18n';

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
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
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
    oneTimeHourlyRate: 1000,
    oneTimeTransportFee: 0,
    oneTimeOtherAllowances: 0,
    oneTimeBreakMinutes: 0,
    oneTimeMemo: '',
    // 労働条件設定（通常シフト用）
    overtimeEnabled: true,
    dayOfWeekSettingsEnabled: false,
    autoBreak6Hours: true,
    autoBreak8Hours: true,
    extraBreakMinutes: 0,
    // 通知・繰り返し設定
    notification: 'none' as NotificationTime,
    repeatFrequency: 'none' as RepeatFrequency,
  });

  // 初期化
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
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
        oneTimeHourlyRate: editingEvent.oneTimeDetails?.hourlyRate || 1000,
        oneTimeTransportFee: editingEvent.oneTimeDetails?.transportFee || 0,
        oneTimeOtherAllowances: editingEvent.oneTimeDetails?.otherAllowances || 0,
        oneTimeBreakMinutes: editingEvent.oneTimeDetails?.breakMinutes || 0,
        oneTimeMemo: editingEvent.oneTimeDetails?.memo || '',
        // 新規追加フィールド（編集時はデフォルトを付与）
        overtimeEnabled: true,
        dayOfWeekSettingsEnabled: false,
        autoBreak6Hours: true,
        autoBreak8Hours: true,
        extraBreakMinutes: 0,
        // 通知・繰り返し設定
        notification: editingEvent.notification || 'none',
        repeatFrequency: editingEvent.repeat?.frequency || 'none',
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
      
      // イベントタイプに応じて色を設定
      if (initialEventType === 'personal') {
        setFormData(prev => ({ ...prev, color: '#64B5F6' })); // 個人予定は青
      } else if (initialEventType === 'shift' || !initialEventType) {
        setFormData(prev => ({ ...prev, color: '#FFD54F' })); // シフトは黄色
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
        }));
      }
    }
  }, [selectedDate, editingEvent, initialEventType, workplaces]);

  // 収入計算
  const calculateEarnings = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    
    const start = parse(formData.startTime, 'HH:mm', new Date());
    const end = parse(formData.endTime, 'HH:mm', new Date());
    const totalMinutes = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));

    // 休憩時間の算出
    let breakMinutes = 0;
    if (isOneTime) {
      breakMinutes += formData.oneTimeBreakMinutes || 0;
    } else {
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

    const rate = isOneTime ? formData.oneTimeHourlyRate : formData.hourlyRate;
    let earnings = Math.floor(actualHours * rate);

    // 残業割増（8h超は1.25倍）
    if (!isOneTime && formData.overtimeEnabled && actualHours > 8) {
      const regularHours = 8;
      const overtimeHours = actualHours - 8;
      earnings = Math.floor(regularHours * rate + overtimeHours * rate * 1.25);
    }

    // 単発は交通費等を加算
    if (isOneTime) {
      earnings += (formData.oneTimeTransportFee || 0) + (formData.oneTimeOtherAllowances || 0);
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
    }));
    setIsOneTime(false);
  };

  // 保存処理
  const handleSave = () => {
    const event: Omit<CalendarEvent, 'id'> = {
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
    };

    // シフトの場合
    if (eventType === 'shift') {
      if (isOneTime) {
        // 単発バイト
        event.workplace = {
          id: 'onetime-' + Date.now(),
          name: formData.oneTimeCompany,
          hourlyRate: formData.oneTimeHourlyRate,
          isOneTime: true,
        };
        event.oneTimeDetails = {
          companyName: formData.oneTimeCompany,
          hourlyRate: formData.oneTimeHourlyRate,
          transportFee: formData.oneTimeTransportFee,
          otherAllowances: formData.oneTimeOtherAllowances,
          breakMinutes: formData.oneTimeBreakMinutes,
          memo: formData.oneTimeMemo,
        };
      } else {
        // 登録済みバイト先
        event.workplace = {
          id: formData.workplaceId,
          name: formData.workplaceName,
          hourlyRate: formData.hourlyRate,
          isOneTime: false,
        };
      }
      event.earnings = calculateEarnings();
    }

    if (editingEvent) {
      updateEvent(editingEvent.id, event);
    } else {
      addEvent(event);
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
      PaperProps={{ sx: { borderRadius: 2 } }}
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
          {!editingEvent && workplaces.length > 0 && (
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                // クイックシフト登録
                const firstWorkplace = workplaces[0];
                setEventType('shift');
                setTabValue(0);
                setIsOneTime(false);
                setFormData(prev => ({
                  ...prev,
                  title: `${firstWorkplace.name}でのシフト`,
                  workplaceId: firstWorkplace.id,
                  workplaceName: firstWorkplace.name,
                  hourlyRate: firstWorkplace.defaultHourlyRate,
                  startTime: '09:00',
                  endTime: '17:00'
                }));
              }}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              {t('calendar.event.quickAdd', 'クイック登録')}
            </Button>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* イベントタイプ選択タブ */}
        <Tabs 
          value={tabValue} 
          onChange={(_, v) => {
            setTabValue(v);
            setEventType(['shift', 'personal'][v] as EventType);
          }}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
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
                    setFormData(prev => ({ ...prev, title: '単発バイト', workplaceId: '', workplaceName: '' }));
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
                      setFormData(prev => ({ ...prev, title: t('calendar.event.oneTime', '単発バイト'), workplaceId: '', workplaceName: '' }));
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
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label={t('calendar.event.hourlyRate', '時給')}
                        value={formData.oneTimeHourlyRate}
                        onChange={(e) => {
                          const value = Math.max(0, parseInt(e.target.value) || 0);
                          setFormData(prev => ({ 
                            ...prev, 
                            oneTimeHourlyRate: value,
                          }));
                        }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label={t('calendar.event.transportFee', '交通費')}
                        value={formData.oneTimeTransportFee}
                        onChange={(e) => {
                          const value = Math.max(0, parseInt(e.target.value) || 0);
                          setFormData(prev => ({ 
                            ...prev, 
                            oneTimeTransportFee: value,
                          }));
                        }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* 色選択 */}
              <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('calendar.event.pickColor', '色を選択')}
              </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[
                    { key: 'yellow', label: 'イエロー', color: '#FFD54F' },
                    { key: 'orange', label: 'オレンジ', color: '#FFB74D' },
                    { key: 'red', label: 'レッド', color: '#E57373' },
                    { key: 'pink', label: 'ピンク', color: '#F06292' },
                    { key: 'purple', label: 'パープル', color: '#BA68C8' },
                    { key: 'blue', label: 'ブルー', color: '#64B5F6' },
                    { key: 'cyan', label: 'シアン', color: '#4FC3F7' },
                    { key: 'green', label: 'グリーン', color: '#81C784' }
                  ].map(colorOption => (
                    <Box
                      key={colorOption.key}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: colorOption.color,
                        cursor: 'pointer',
                        border: formData.color === colorOption.color ? '3px solid #000' : '2px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, color: colorOption.color }))}
                      title={colorOption.label}
                    />
                  ))}
                </Box>
              </Box>

              {/* 時間選択（簡潔版） */}
              <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('calendar.event.pickTime', '時間を選択')}
              </Typography>
                {/* クイック時間設定 */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {[
                      { label: t('calendar.event.quick.morning','朝シフト'), start: '09:00', end: '13:00' },
                      { label: t('calendar.event.quick.noon','昼シフト'), start: '13:00', end: '17:00' },
                      { label: t('calendar.event.quick.evening','夜シフト'), start: '17:00', end: '21:00' },
                      { label: t('calendar.event.quick.full','フルタイム'), start: '09:00', end: '17:00' }
                    ].map((timeSet) => (
                      <Chip
                        key={timeSet.label}
                        label={`${timeSet.label} (${timeSet.start}-${timeSet.end})`}
                        size="small"
                        clickable
                        variant={formData.startTime === timeSet.start && formData.endTime === timeSet.end ? 'filled' : 'outlined'}
                        color={formData.startTime === timeSet.start && formData.endTime === timeSet.end ? 'primary' : 'default'}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          startTime: timeSet.start,
                          endTime: timeSet.end
                        }))}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                  </Box>
                </Box>
                
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
                      error={formData.startTime && formData.endTime && formData.endTime <= formData.startTime}
                      helperText={formData.startTime && formData.endTime && formData.endTime <= formData.startTime ? t('calendar.event.timeError', '終了時間は開始時間より後にしてください') : ''}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* 労働条件設定 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  💼 労働条件設定
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.overtimeEnabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, overtimeEnabled: e.target.checked }))}
                        />
                      }
                      label="残業割増25%（8時間超）"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.dayOfWeekSettingsEnabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeekSettingsEnabled: e.target.checked }))}
                        />
                      }
                      label="曜日別詳細設定"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* 曜日別設定が有効な場合の休憩設定 */}
              {formData.dayOfWeekSettingsEnabled && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    ⏱️ 休憩時間設定
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.autoBreak6Hours}
                            onChange={(e) => setFormData(prev => ({ ...prev, autoBreak6Hours: e.target.checked }))}
                          />
                        }
                        label="6時間越えで45分休憩"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.autoBreak8Hours}
                            onChange={(e) => setFormData(prev => ({ ...prev, autoBreak8Hours: e.target.checked }))}
                          />
                        }
                        label="8時間越えで60分休憩"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="number"
                        label="追加休憩時間（分）"
                        value={formData.extraBreakMinutes}
                        onChange={(e) => {
                          const value = Math.max(0, parseInt(e.target.value) || 0);
                          setFormData(prev => ({ ...prev, extraBreakMinutes: value }));
                        }}
                        helperText="手動で追加する休憩時間を分単位で入力"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* 予想収入表示 */}
              {formData.startTime && formData.endTime && formData.endTime > formData.startTime && (formData.workplaceId || isOneTime) && (
                <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 1, textAlign: 'center', mb: 2 }}>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                    {t('calendar.event.estimatedIncome', '予想収入')}: ¥{calculateEarnings().toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(() => {
                      const start = new Date(`2000-01-01T${formData.startTime}`);
                      const end = new Date(`2000-01-01T${formData.endTime}`);
                      const totalMinutes = Math.max(0, (end.getTime() - start.getTime()) / 60000);
                      let breakMinutes = 0;
                      if (isOneTime) {
                        breakMinutes += formData.oneTimeBreakMinutes || 0;
                      } else {
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
                        secondary={t('calendar.event.repeatHint', '定期シフトの場合に便利')}
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

          {/* 色選択 */}
          <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('calendar.event.pickColor', '色を選択')}
              </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[
                { key: 'orange', label: 'オレンジ', color: '#FFB74D' },
                { key: 'blue', label: 'ブルー', color: '#64B5F6' },
                { key: 'red', label: 'レッド', color: '#FF8A65' },
                { key: 'green', label: 'グリーン', color: '#A1C181' },
                { key: 'purple', label: 'パープル', color: '#BA68C8' },
                { key: 'cyan', label: 'シアン', color: '#4FC3F7' },
                { key: 'pink', label: 'ピンク', color: '#F06292' },
                { key: 'yellow', label: 'イエロー', color: '#FFD54F' }
              ].map(colorOption => (
                <Box
                  key={colorOption.key}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: colorOption.color,
                    cursor: 'pointer',
                    border: formData.color === colorOption.color ? '3px solid #000' : '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, color: colorOption.color }))}
                  title={colorOption.label}
                />
              ))}
            </Box>
          </Box>

          {/* iPhone風設定リスト */}
            <List 
            sx={{ 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 2, 
              mb: 2,
              p: 0,
              bgcolor: 'background.paper'
            }}
          >
            {/* 通知設定 */}
            <ListItem sx={{ py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Notifications sx={{ fontSize: 20, color: 'text.secondary' }} />
              </ListItemIcon>
              <ListItemText 
                  primary={t('calendar.event.notification', '通知')} 
                sx={{ '& .MuiTypography-root': { fontWeight: 500 } }}
              />
              <FormControl sx={{ minWidth: 120 }}>
                <Select
                  value={formData.notification}
                  onChange={(e) => setFormData(prev => ({ ...prev, notification: e.target.value as NotificationTime }))}
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
                    <MenuItem value="0">{t('calendar.event.notify.atStart', 'イベント開始時')}</MenuItem>
                    <MenuItem value="5">{t('calendar.event.notify.5', '5分前')}</MenuItem>
                    <MenuItem value="10">{t('calendar.event.notify.10', '10分前')}</MenuItem>
                    <MenuItem value="15">{t('calendar.event.notify.15', '15分前')}</MenuItem>
                    <MenuItem value="30">{t('calendar.event.notify.30', '30分前')}</MenuItem>
                    <MenuItem value="60">{t('calendar.event.notify.60', '1時間前')}</MenuItem>
                    <MenuItem value="120">{t('calendar.event.notify.120', '2時間前')}</MenuItem>
                    <MenuItem value="1440">{t('calendar.event.notify.1440', '1日前')}</MenuItem>
                    <MenuItem value="2880">{t('calendar.event.notify.2880', '2日前')}</MenuItem>
                </Select>
              </FormControl>
              <ChevronRight sx={{ fontSize: 16, color: 'text.disabled', ml: 1 }} />
            </ListItem>

            <Divider />

            {/* 繰り返し設定 */}
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
                  <MenuItem value="daily">{t('calendar.event.daily', '毎日')}</MenuItem>
                  <MenuItem value="weekly">{t('calendar.event.weekly', '毎週')}</MenuItem>
                  <MenuItem value="monthly">{t('calendar.event.monthly', '毎月')}</MenuItem>
                  <MenuItem value="yearly">{t('calendar.event.yearly', '毎年')}</MenuItem>
                </Select>
              </FormControl>
              <ChevronRight sx={{ fontSize: 16, color: 'text.disabled', ml: 1 }} />
            </ListItem>
          </List>
        </TabPanel>

        {/* 個人タブの共通項目 */}
        {tabValue === 1 && (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isAllDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))}
                />
              }
              label={t('calendar.event.allDay', '終日')}
              sx={{ mb: 2 }}
            />
            
            {!formData.isAllDay && (
              <Grid container spacing={2} sx={{ mb: 2 }}>
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
            
            <TextField
              fullWidth
              multiline
              rows={2}
              label={t('calendar.event.memo', 'メモ')}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('calendar.event.memo.placeholder', '詳細をメモ')}
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
            (eventType === 'shift' && formData.startTime && formData.endTime && formData.endTime <= formData.startTime) ||
            (isOneTime && !formData.oneTimeCompany) ||
            (eventType === 'personal' && !formData.isAllDay && formData.startTime && formData.endTime && formData.endTime <= formData.startTime)
          }
        >
          {t('common.save', '保存')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};