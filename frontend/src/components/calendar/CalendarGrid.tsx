// カレンダーグリッドコンポーネント（前のロジック使用）

import React, { useState, useEffect, useRef } from 'react';
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

// イベントチップコンポーネント（iOSカレンダー風の丸み・小さめフォント）
const EventChip: React.FC<{ event: CalendarEvent }> = ({ event }) => {
  return (
    <Box
      sx={{
        backgroundColor: event.color,
        color: '#000',
        px: 0.75,
        py: 0.25,
        borderRadius: 2,
        fontSize: '11px',
        fontWeight: 600,
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentMonthRef = useRef<HTMLDivElement | null>(null);

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
  
  // 初期スクロール位置を当月へ
  useEffect(() => {
    if (isMobile && viewMode === 'vertical' && containerRef.current && currentMonthRef.current) {
      const container = containerRef.current;
      const targetTop = currentMonthRef.current.offsetTop;
      container.scrollTop = Math.max(0, targetTop - 40);
    }
  }, [isMobile, viewMode, currentMonth]);

  return (
    <Box ref={containerRef} sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: isMobile && viewMode === 'vertical' ? 'auto' : 'hidden',
    }}>
      {/* 曜日ヘッダー（月曜始まり・iOSライク） */}
      {true && (
        <Box sx={{ height: { xs: '34px', md: '30px' }, flexShrink: 0 }}>
          <Grid container spacing={0} sx={{ height: '100%' }}>
            {[1,2,3,4,5,6,0].map((dow, index) => {
              const day = t(`calendar.weekdays.${dow}`, WEEKDAYS_JA[dow]);
              return (
                <Grid item xs key={day}>
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      letterSpacing: 0.2,
                      fontSize: { xs: '12px', md: '11px' },
                      color: index === 6 ? 'error.main' : 'text.secondary', // 末尾(日曜)を赤
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {day}
                  </Box>
                </Grid>
              );
            })}
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
          // iOSの月ビューに合わせてモバイルは月曜始まり
          const weekStartsOn = isMobile ? 1 : 0;
          const calendarStart = startOfWeek(monthStart, { weekStartsOn });
          const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });
          const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
          
          const weeks: Date[][] = [];
          for (let i = 0; i < calendarDays.length; i += 7) {
            weeks.push(calendarDays.slice(i, i + 7));
          }
          
          return (
            <Box
              key={monthIndex}
              ref={isSameMonth(month, currentMonth) ? currentMonthRef : undefined}
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                mb: 0,
                flex: isMobile && viewMode === 'vertical' ? 'none' : 1,
                minHeight: isMobile && viewMode === 'vertical' ? 'auto' : 'auto',
              }}
            >
              {/* 背景の薄い月数字 */}
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  fontWeight: 700,
                  fontSize: isMobile ? '112px' : '160px',
                  color: alpha(theme.palette.text.primary, 0.06),
                  lineHeight: 1,
                }}
              >
                {format(month, 'M')}
              </Box>
              {/* 月表示ヘッダーを削除してシームレススクロールを実現 */}

              {weeks.map((week, weekIndex) => (
                <Box key={weekIndex} sx={{ 
                  flex: isMobile && viewMode === 'vertical' ? 'none' : 1,
                  height: isMobile && viewMode === 'vertical' ? '118px' : `calc(100% / ${weeks.length})`,
                  minHeight: isMobile && viewMode === 'vertical' ? '118px' : 'auto',
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
                            p: isMobile && viewMode === 'vertical' ? 0.75 : 0.75,
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRight: dayIndex === 6 ? '1px solid' : '0',
                            borderBottom: weekIndex === weeks.length - 1 ? '1px solid' : '0',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: !isCurrentMonth ? 'grey.100' : 'background.paper',
                            outline: isTodayDate ? `2px solid ${alpha(theme.palette.primary.main, 0.6)}` : 'none',
                            outlineOffset: '-1px',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            },
                            transition: 'background-color 0.2s ease',
                          }}
                          onClick={() => handleDateClick(day)}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isTodayDate ? 700 : 500,
                                fontSize: isMobile && viewMode === 'vertical' ? '16px' : '13px',
                                color: !isCurrentMonth
                                  ? 'text.disabled'
                                  : dayOfWeek === 0
                                    ? 'error.main'
                                    : 'text.primary',
                                lineHeight: 1,
                              }}
                            >
                              {format(day, 'd')}
                            </Typography>
                          </Box>

                          {/* イベント表示 */}
                          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            {/* モバイルもチップ表示に統一 */}
                            {dayEvents.slice(0, 3).map((event) => (
                              <EventChip key={event.id} event={event} />
                            ))}
                            {dayEvents.length > 3 && (
                              <Typography sx={{ fontSize: '10px', color: 'text.secondary', fontWeight: 600 }}>
                                +{dayEvents.length - 3}
                              </Typography>
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