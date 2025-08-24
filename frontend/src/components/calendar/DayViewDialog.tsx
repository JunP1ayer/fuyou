// 日別予定表示ダイアログ
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Fab,
  Paper,
  Divider,
} from '@mui/material';
import {
  Add,
  ChevronRight,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useCalendarStore } from '../../store/calendarStore';
import type { CalendarEvent } from '../../types/calendar';

interface DayViewDialogProps {
  open: boolean;
  selectedDate: string | null;
  onClose: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onCreateEvent: () => void;
}

export const DayViewDialog: React.FC<DayViewDialogProps> = ({
  open,
  selectedDate,
  onClose,
  onEditEvent,
  onCreateEvent,
}) => {
  const { events } = useCalendarStore();

  // その日の予定を取得してソート
  const dayEvents = selectedDate 
    ? events
        .filter(event => event.date === selectedDate)
        .sort((a, b) => {
          const timeA = a.startTime || '00:00';
          const timeB = b.startTime || '00:00';
          return timeA.localeCompare(timeB);
        })
    : [];

  // 日付のフォーマット
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'M/d/yyyy(E)', { locale: ja });
  };

  // 時間のフォーマット
  const formatTimeRange = (event: CalendarEvent) => {
    if (event.isAllDay) return '終日';
    if (!event.startTime) return '';
    
    const startTime = event.startTime.substring(0, 5); // HH:MM形式
    const endTime = event.endTime ? event.endTime.substring(0, 5) : '';
    
    return endTime ? `${startTime} - ${endTime}` : startTime;
  };

  // イベントの表示名を取得
  const getEventDisplayName = (event: CalendarEvent) => {
    if (event.type === 'shift') {
      const workplace = (event as any).workplace;
      if (workplace?.isOneTime) {
        const oneTimeDetails = (event as any).oneTimeDetails;
        return oneTimeDetails?.companyName || event.title || '単発バイト';
      }
      return workplace?.name || event.title || 'シフト';
    }
    return event.title || '予定';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* ヘッダー */}
        <Box sx={{ 
          px: 2, 
          py: 1.5, 
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {selectedDate && formatDateHeader(selectedDate)}
          </Typography>
        </Box>

        {/* 予定リスト */}
        <Box sx={{ minHeight: 200, maxHeight: 400, overflow: 'auto' }}>
          {dayEvents.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              py: 4,
              color: 'text.secondary' 
            }}>
              <Typography variant="body2">
                この日の予定はありません
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {dayEvents.map((event, index) => (
                <React.Fragment key={event.id}>
                  <ListItemButton
                    onClick={() => onEditEvent(event)}
                    sx={{ 
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      }
                    }}
                  >
                    {/* 時間表示とカラーバー */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      minWidth: 60,
                      mr: 2
                    }}>
                      {/* カラーバー */}
                      <Box
                        sx={{
                          width: 4,
                          height: 40,
                          backgroundColor: event.color || '#2196F3',
                          borderRadius: 2,
                          mr: 1,
                        }}
                      />
                      <Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            lineHeight: 1.2,
                            minWidth: 45,
                          }}
                        >
                          {event.isAllDay ? '' : formatTimeRange(event).split(' - ')[0]}
                        </Typography>
                        {formatTimeRange(event).includes(' - ') && !event.isAllDay && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.875rem',
                              lineHeight: 1.2,
                              color: 'text.secondary',
                            }}
                          >
                            {formatTimeRange(event).split(' - ')[1]}
                          </Typography>
                        )}
                        {event.isAllDay && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.75rem',
                              color: 'text.secondary',
                            }}
                          >
                            終日
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* イベント詳細 */}
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: '1rem',
                            lineHeight: 1.3,
                          }}
                        >
                          {getEventDisplayName(event)}
                        </Typography>
                      }
                      secondary={
                        event.description && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: '0.875rem',
                              mt: 0.5,
                            }}
                          >
                            {event.description}
                          </Typography>
                        )
                      }
                    />

                    <ChevronRight sx={{ color: 'text.secondary', ml: 1 }} />
                  </ListItemButton>
                  
                  {index < dayEvents.length - 1 && (
                    <Divider sx={{ ml: 10 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* フッター */}
        <Box sx={{ 
          px: 2, 
          py: 2, 
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Add sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography 
              variant="body1" 
              onClick={onCreateEvent}
              sx={{ 
                fontWeight: 500,
                cursor: 'pointer',
                '&:hover': {
                  color: 'primary.main'
                }
              }}
            >
              予定を追加
            </Typography>
          </Box>
          
          <IconButton
            onClick={onClose}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <KeyboardArrowDown />
          </IconButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};