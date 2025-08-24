// 日付クリック時のクイックアクションメニュー

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import {
  Work,
  Person,
  School,
  Event,
  Add,
  Visibility,
  SmartToy,
  PhotoCamera,
  FlashOn,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useI18n } from '@/hooks/useI18n';
import { useCalendarStore } from '../../store/calendarStore';

interface QuickActionMenuProps {
  open: boolean;
  selectedDate: string | null;
  onClose: () => void;
  onAddPersonalEvent: () => void;
  onAddShiftEvent: () => void;
  onViewDayEvents: () => void;
  onOpenGPT5Analyzer?: () => void;
  onQuickShiftRegister?: () => void;
}

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  open,
  selectedDate,
  onClose,
  onAddPersonalEvent,
  onAddShiftEvent,
  onViewDayEvents,
  onOpenGPT5Analyzer,
  onQuickShiftRegister,
}) => {
  const { events } = useCalendarStore();
  const { t } = useI18n();

  // その日の予定数を取得
  const dayEventsCount = selectedDate 
    ? events.filter(event => event.date === selectedDate).length
    : 0;

  const quickActions = [
    ...(onQuickShiftRegister ? [{
      id: 'quick-shift',
      label: 'クイック登録',
      subtitle: 'テンプレートを使って素早くシフト登録',
      icon: <FlashOn />,
      color: '#4fc3f7',
      action: onQuickShiftRegister,
    }] : []),
    {
      id: 'shift',
      label: t('calendar.quick.addShift', 'シフトを追加'),
      subtitle: t('calendar.quick.shiftSubtitle', 'バイト、アルバイトの予定'),
      icon: <Work />,
      color: '#FFD54F',
      action: onAddShiftEvent,
    },
    {
      id: 'personal',
      label: t('calendar.quick.addPersonal', '個人の予定を追加'),
      subtitle: t('calendar.quick.personalSubtitle', '遊び、勉強、病院など'),
      icon: <Person />,
      color: '#64B5F6',
      action: onAddPersonalEvent,
    },
    ...(onOpenGPT5Analyzer ? [{
      id: 'gpt5',
      label: 'GPT-5 シフト表解析',
      subtitle: 'シフト表の画像から自動でスケジュール作成',
      icon: <SmartToy />,
      color: '#AB47BC',
      action: onOpenGPT5Analyzer,
    }] : []),
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ 
        sx: { 
          borderRadius: 3,
          maxWidth: 320,
        } 
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {selectedDate && format(new Date(selectedDate), 'M月d日(E)', { locale: ja })}
          </Typography>
          {dayEventsCount > 0 && (
            <Chip
              label={`${dayEventsCount}${t('calendar.quick.numEvents', '件の予定')}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 1 }}>
        <List sx={{ py: 0 }}>
          {quickActions.map((action, index) => (
            <ListItemButton
              key={action.id}
              onClick={() => {
                action.action();
                onClose();
              }}
              sx={{
                borderRadius: 2,
                my: 0.5,
                py: 2,
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: action.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                  }}
                >
                  {action.icon}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {action.label}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {action.subtitle}
                  </Typography>
                }
              />
            </ListItemButton>
          ))}
        </List>

        {dayEventsCount > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Visibility />}
              onClick={() => {
                onViewDayEvents();
                onClose();
              }}
              sx={{ py: 1.5 }}
            >
              {t('calendar.quick.viewDayEvents', 'この日の予定を見る')} ({dayEventsCount}{t('common.items','件')})
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};