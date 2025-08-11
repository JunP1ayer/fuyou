// カレンダーグリッドコンポーネント（前のロジック使用）

import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, alpha, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday
} from 'date-fns';
import { useI18n } from '@/hooks/useI18n';
import { useCalendarStore } from '../../store/calendarStore';
import type { CalendarEvent } from '../../types/calendar';

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];

// イベントチップコンポーネント
const EventChip: React.FC<{ event: CalendarEvent }> = ({ event }) => {
  return (
    <Box
      sx={{
        backgroundColor: event.color,
        color: '#000',
        px: 0.5,
        py: 0.25,
        borderRadius: 0.5,
        fontSize: '10px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        mb: 0.25,
        cursor: 'pointer',
        '&:hover': {
          opacity: 0.8,
        },
      }}
    >
      {event.startTime && `${event.startTime.substring(0, 5)} `}
      {event.title}
    </Box>
  );
};

interface CalendarGridProps {
  onDateClick?: (date: string) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ onDateClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal'>('vertical');
  const { 
    currentMonth, 
    events, 
    openEventDialog
  } = useCalendarStore();

  // 設定から表示モードを読み込み
  useEffect(() => {
    const savedMode = localStorage.getItem('calendarViewMode') as 'vertical' | 'horizontal';
    if (savedMode) {
      setViewMode(savedMode);
    } else {
      // デフォルト設定: モバイルは縦、PCは横
      const defaultMode = isMobile ? 'vertical' : 'horizontal';
      setViewMode(defaultMode);
      localStorage.setItem('calendarViewMode', defaultMode);
    }
  }, [isMobile]);

  // 日付クリック処理
  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (onDateClick) {
      onDateClick(dateStr);
    } else {
      openEventDialog(dateStr);
    }
  };

  // 縦スクロール用の月間データ生成（モバイル用）- より多くの月を表示
  const generateMultipleMonths = () => {
    const months = [];
    for (let i = -3; i <= 6; i++) { // 前3ヶ月、後6ヶ月の計10ヶ月表示
      const targetMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1);
      months.push(targetMonth);
    }
    return months;
  };

  const multipleMonths = isMobile && viewMode === 'vertical' ? generateMultipleMonths() : [currentMonth];

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: isMobile && viewMode === 'vertical' ? 'auto' : 'hidden',
    }}>
      {/* 曜日ヘッダー（固定高さ） - 縦スクロール時も表示 */}
      {true && (
        <Box sx={{ height: '30px', flexShrink: 0 }}>
          <Grid container spacing={0} sx={{ height: '100%' }}>
            {[0,1,2,3,4,5,6].map((dow, index) => {
              const day = t(`calendar.weekdays.${dow}`, WEEKDAYS_JA[dow]);
              return (
              <Grid item xs key={day}>
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 500,
                    fontSize: '11px',
                    color:
                      index === 0
                        ? 'error.main'
                        : index === 6
                          ? 'primary.main'
                          : 'text.secondary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {day}
                </Box>
              </Grid>
            );})}
          </Grid>
        </Box>
      )}

      {/* カレンダー本体 */}
      <Box sx={{ 
        flex: isMobile && viewMode === 'vertical' ? 'none' : 1,
        display: 'flex', 
        flexDirection: 'column',
        height: isMobile && viewMode === 'vertical' ? 'auto' : !(isMobile && viewMode === 'vertical') ? 'calc(100% - 30px)' : '100%',
        minHeight: isMobile && viewMode === 'vertical' ? 'auto' : undefined,
      }}>
        {multipleMonths.map((month, monthIndex) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
          const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
          const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
          
          const weeks: Date[][] = [];
          for (let i = 0; i < calendarDays.length; i += 7) {
            weeks.push(calendarDays.slice(i, i + 7));
          }
          
          return (
            <Box key={monthIndex} sx={{
              display: 'flex',
              flexDirection: 'column',
              mb: 0, // 月間のマージンを削除
              flex: isMobile && viewMode === 'vertical' ? 'none' : 1,
              minHeight: isMobile && viewMode === 'vertical' ? 'auto' : 'auto', // 固定高さを削除
            }}>
              {/* 月表示ヘッダーを削除してシームレススクロールを実現 */}

              {weeks.map((week, weekIndex) => (
                <Box key={weekIndex} sx={{ 
                  flex: isMobile && viewMode === 'vertical' ? 'none' : 1,
                  height: isMobile && viewMode === 'vertical' ? '70px' : `calc(100% / ${weeks.length})`,
                  minHeight: isMobile && viewMode === 'vertical' ? '70px' : 'auto',
                }}>
                  <Grid container spacing={0} sx={{ height: '100%' }}>
                  {week.map((day, dayIndex) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayEvents = events.filter(e => e.date === dateStr);
                    const isCurrentMonth = isSameMonth(day, month);
                    const isTodayDate = isToday(day);
                    const dayOfWeek = day.getDay();
                    
                    return (
                      <Grid item xs key={dayIndex} sx={{ 
                        height: '100%',
                      }}>
                        <Box
                          sx={{
                            height: '100%',
                            width: '100%',
                            p: isMobile && viewMode === 'vertical' ? 0.5 : 0.5,
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRight: dayIndex === 6 ? '1px solid' : '0',
                            borderBottom: weekIndex === weeks.length - 1 ? '1px solid' : '0',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: !isCurrentMonth 
                              ? 'grey.100' 
                              : isTodayDate 
                                ? alpha(theme.palette.primary.main, 0.15) 
                                : 'background.paper',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            },
                            transition: 'background-color 0.2s ease',
                          }}
                          onClick={() => handleDateClick(day)}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isTodayDate ? 700 : 500,
                              fontSize: isMobile && viewMode === 'vertical' ? '14px' : '13px',
                              color: !isCurrentMonth 
                                ? 'text.disabled'
                                : dayOfWeek === 0 
                                  ? 'error.main' 
                                  : dayOfWeek === 6 
                                    ? 'primary.main'
                                    : 'text.primary',
                              mb: 0.25,
                              textAlign: isMobile && viewMode === 'vertical' ? 'center' : 'left',
                              lineHeight: 1,
                            }}
                          >
                            {format(day, 'd')}
                          </Typography>

                          {/* イベント表示 */}
                          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: isMobile && viewMode === 'vertical' ? 'center' : 'flex-start' }}>
                            {isMobile && viewMode === 'vertical' ? (
                              // モバイル縦スクロールモード: ドット表示
                              dayEvents.length > 0 && (
                                <Box sx={{
                                  display: 'flex',
                                  gap: 0.5,
                                  flexWrap: 'wrap',
                                  justifyContent: 'center',
                                }}>
                                  {dayEvents.slice(0, 4).map((event, idx) => (
                                    <Box key={idx} sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      backgroundColor: event.color,
                                      border: '1px solid white',
                                    }} />
                                  ))}
                                  {dayEvents.length > 4 && (
                                    <Typography sx={{
                                      fontSize: '10px',
                                      color: 'text.secondary',
                                      fontWeight: 600,
                                    }}>
                                      +{dayEvents.length - 4}
                                    </Typography>
                                  )}
                                </Box>
                              )
                            ) : (
                              // PC横表示モード: チップ表示
                              <>
                                {dayEvents.slice(0, 2).map((event) => (
                                  <EventChip key={event.id} event={event} />
                                ))}
                                {dayEvents.length > 2 && (
                                  <Typography
                                    sx={{
                                      fontSize: '8px',
                                      color: 'text.secondary',
                                      fontWeight: 500,
                                    }}
                                  >
                                    +{dayEvents.length - 2}
                                  </Typography>
                                )}
                              </>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                  </Grid>
                </Box>
              ))}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};