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
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useCalendarStore } from '../../store/calendarStore';

interface QuickActionMenuProps {
  open: boolean;
  selectedDate: string | null;
  onClose: () => void;
  onAddPersonalEvent: () => void;
  onAddShiftEvent: () => void;
  onViewDayEvents: () => void;
}

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  open,
  selectedDate,
  onClose,
  onAddPersonalEvent,
  onAddShiftEvent,
  onViewDayEvents,
}) => {
  const { events } = useCalendarStore();

  // その日の予定数を取得
  const dayEventsCount = selectedDate 
    ? events.filter(event => event.date === selectedDate).length
    : 0;

  const quickActions = [
    {
      id: 'shift',
      label: 'シフトを追加',
      subtitle: 'バイト、アルバイトの予定',
      icon: <Work />,
      color: '#FFD54F',
      action: onAddShiftEvent,
    },
    {
      id: 'personal',
      label: '個人の予定を追加',
      subtitle: '遊び、勉強、病院など',
      icon: <Person />,
      color: '#64B5F6',
      action: onAddPersonalEvent,
    },
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
              label={`${dayEventsCount}件の予定`}
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
              この日の予定を見る ({dayEventsCount}件)
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};