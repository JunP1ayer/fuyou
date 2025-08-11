// 日付押下時の予定一覧表示コンポーネント

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Paper,
} from '@mui/material';
import {
  Work,
  Person,
  School,
  Event,
  Add,
  Edit,
  AccessTime,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useI18n } from '@/hooks/useI18n';
import { useCalendarStore } from '../../store/calendarStore';
import type { CalendarEvent, EventType } from '../../types/calendar';

interface DayEventsViewProps {
  open: boolean;
  selectedDate: string | null;
  onClose: () => void;
  onAddEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
}

export const DayEventsView: React.FC<DayEventsViewProps> = ({
  open,
  selectedDate,
  onClose,
  onAddEvent,
  onEditEvent,
}) => {
  const { events } = useCalendarStore();
  const { t } = useI18n();

  // その日の予定を取得
  const dayEvents = selectedDate 
    ? events.filter(event => event.date === selectedDate)
    : [];

  // イベントタイプに応じたアイコンを取得
  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'shift':
        return <Work />;
      case 'personal':
        return <Person />;
      case 'study':
        return <School />;
      default:
        return <Event />;
    }
  };

  // イベントタイプに応じた色を取得
  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'shift':
        return '#FFD54F'; // 黄色
      case 'personal':
        return '#64B5F6'; // 青色
      case 'study':
        return '#81C784'; // 緑色
      default:
        return '#A1C181'; // グレー
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, maxHeight: '80vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {selectedDate && format(new Date(selectedDate), 'M月d日(E)', { locale: ja })}{t('calendar.dayEvents.of', 'の予定')}
          </Typography>
          <Chip
            label={`${dayEvents.length}件`}
            size="small"
            color={dayEvents.length > 0 ? 'primary' : 'default'}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {dayEvents.length > 0 ? (
          <List sx={{ py: 0 }}>
            {dayEvents.map((event, index) => (
              <React.Fragment key={event.id}>
                <ListItem
                  sx={{ 
                    py: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => onEditEvent(event)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: getEventColor(event.type),
                      width: 40,
                      height: 40
                    }}>
                      {getEventIcon(event.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {event.title}
                        </Typography>
                        {event.earnings && (
                          <Chip
                            label={`¥${event.earnings.toLocaleString()}`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        {!event.isAllDay && event.startTime && event.endTime && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {event.startTime} - {event.endTime}
                            </Typography>
                          </Box>
                        )}
                        {event.isAllDay && (
                          <Typography variant="body2" color="text.secondary">
                            終日
                          </Typography>
                        )}
                        {event.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {event.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <Edit fontSize="small" />
                  </IconButton>
                </ListItem>
                {index < dayEvents.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ 
            py: 6, 
            px: 3, 
            textAlign: 'center',
            color: 'text.secondary'
          }}>
            <Event sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              {t('calendar.dayEvents.empty', '予定がありません')}
            </Typography>
            <Typography variant="body2">
              {t('calendar.dayEvents.hint', '下のボタンから新しい予定を追加できます')}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
        <Paper
          elevation={2}
          sx={{
            borderRadius: '50%',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
          onClick={onAddEvent}
        >
          <Add sx={{ fontSize: 32 }} />
        </Paper>
      </DialogActions>
    </Dialog>
  );
};