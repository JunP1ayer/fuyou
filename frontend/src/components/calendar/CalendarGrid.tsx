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
const EventChip: React.FC<{ event: CalendarEvent; isPC?: boolean }> = ({ event, isPC = false }) => {
  return (
    <Box
      sx={{
        backgroundColor: event.color,
        color: '#000',
        px: isPC ? 0.5 : 0.75,
        py: isPC ? 0.15 : 0.25,
        borderRadius: isPC ? 1 : 2,
        fontSize: isPC ? '10px' : '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        mb: isPC ? 0.15 : 0.25,
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
    openEventDialog,
    setHeaderMonth,
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

  // 縦スクロール用の月間データ生成（モバイル）
  const generateMultipleMonths = () => {
    // 現在月を中心に前後10年（±120ヶ月）を生成
    const months: Date[] = [];
    for (let i = -120; i <= 120; i++) {
      months.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1));
    }
    return months;
  };

  // PC版は単月表示、モバイル版は縦スクロール
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
      overflowY: isMobile && viewMode === 'vertical' ? 'auto' : 'hidden',
      overflowX: 'hidden',
      // 端まで表示（親の余白に依存しない）
      px: 0,
    }}>
      {/* 曜日ヘッダー - モバイル:月曜始まり、PC:日曜始まり */}
      {true && (
        <Box sx={{ height: { xs: '34px', md: '36px' }, flexShrink: 0 }}>
          <Grid container spacing={0} sx={{ height: '100%' }}>
            {(isMobile ? [1,2,3,4,5,6,0] : [0,1,2,3,4,5,6]).map((dow, index) => {
              const day = t(`calendar.weekdays.${dow}`, WEEKDAYS_JA[dow]);
              const isWeekend = dow === 0 || dow === 6;
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
                      fontSize: { xs: '12px', md: '13px' },
                      color: dow === 0 ? 'error.main' : dow === 6 ? 'info.main' : 'text.secondary',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: { xs: 'transparent', md: isWeekend ? alpha(theme.palette.action.hover, 0.03) : 'transparent' },
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
        height: isMobile && viewMode === 'vertical' ? 'auto' : 'calc(100% - 36px)', // 曜日ヘッダー分を差し引く（PC版は36px）
        minHeight: 0,
        px: { xs: 0, md: 2 }, // PC版には左右余白を追加
        py: { xs: 0, md: 1 }, // PC版には上下余白も追加
      }}>
        {multipleMonths.map((month, monthIndex) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          // モバイル:月曜始まり、PC:日曜始まり
          const weekStartsOn = isMobile ? 1 : 0;
          // PC版は標準的な月表示、モバイル版は前後の月も含めた表示
          const calendarStart = isMobile 
            ? startOfWeek(new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - 7), { weekStartsOn })
            : startOfWeek(monthStart, { weekStartsOn });
          const calendarEnd = isMobile
            ? endOfWeek(new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 1, 7), { weekStartsOn })
            : endOfWeek(monthEnd, { weekStartsOn });
          const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
          
          const weeks: Date[][] = [];
          for (let i = 0; i < calendarDays.length; i += 7) {
            weeks.push(calendarDays.slice(i, i + 7));
          }
          
          // 交差監視でヘッダーの月表示を更新
          const monthRef = (el: HTMLDivElement | null) => {
            if (!el || !(isMobile && viewMode === 'vertical')) return;
            const observer = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
                    setHeaderMonth(month);
                  }
                });
              },
              { root: containerRef.current, threshold: [0.6] }
            );
            observer.observe(el);
          };

          return (
            <Box
              key={monthIndex}
              ref={(node) => {
                if (isSameMonth(month, currentMonth)) currentMonthRef.current = node as HTMLDivElement;
                monthRef(node as HTMLDivElement);
              }}
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                mb: 0,
                flex: 1,
                minHeight: 0,
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
                  fontSize: isMobile ? '112px' : '200px',
                  color: alpha(theme.palette.text.primary, isMobile ? 0.06 : 0.04),
                  lineHeight: 1,
                  display: { xs: 'block', md: isMobile ? 'none' : 'block' }, // PC版単月表示時のみ表示
                }}
              >
                {format(month, 'M')}
              </Box>
              {/* 月表示ヘッダーを削除してシームレススクロールを実現 */}

              {weeks.map((week, weekIndex) => (
                <Box key={weekIndex} sx={{ 
                  flex: isMobile && viewMode === 'vertical' ? 'none' : 1,
                  height: isMobile && viewMode === 'vertical' ? '118px' : `calc(100% / ${weeks.length})`,
                  minHeight: isMobile && viewMode === 'vertical' ? '118px' : 0,
                  // 最下段のみ下枠線を描く（重複や隙間を防ぐ）
                  borderBottom: weekIndex === weeks.length - 1 ? '1px solid' : 0,
                  borderColor: 'divider'
                }}>
                  <Grid container spacing={0} sx={{ height: '100%' }}>
                  {week.map((day, dayIndex) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayEvents = events.filter(e => e.date === dateStr);
                    const isCurrentMonth = isSameMonth(day, month);
                    const isTodayDate = isToday(day);
                    const dayOfWeek = day.getDay();
                    const dimOutsideMonth = !isMobile; // スマホは当月以外も薄くしない
                    
                    return (
                      <Grid item xs key={dayIndex} sx={{ 
                        height: '100%',
                      }}>
                        <Box
                          sx={{
                            height: '100%',
                            width: '100%',
                            p: { xs: 0.75, md: 1 }, // PC版は余白を大きく
                            cursor: 'pointer',
                            // 線の重なりを防ぎ、月間境界の"微妙なすきま"を解消
                            border: 0,
                            borderTop: '1px solid',
                            borderLeft: dayIndex === 0 ? '1px solid' : 0,
                            borderRight: dayIndex === 6 ? '1px solid' : 0,
                            borderBottom: 0,
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: !isCurrentMonth && dimOutsideMonth 
                              ? alpha(theme.palette.action.disabledBackground, 0.3)
                              : dayOfWeek === 0 || dayOfWeek === 6
                                ? { xs: 'background.paper', md: alpha(theme.palette.action.hover, 0.02) }
                                : 'background.paper',
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
                                fontSize: { xs: '16px', md: '14px' },
                                color:
                                  !isCurrentMonth && dimOutsideMonth
                                    ? 'text.disabled'
                                    : dayOfWeek === 0
                                      ? 'error.main'
                                      : dayOfWeek === 6
                                        ? 'info.main'
                                        : 'text.primary',
                                lineHeight: 1,
                                px: { xs: 0, md: 0.5 },
                              }}
                            >
                              {format(day, 'd')}
                            </Typography>
                          </Box>

                          {/* イベント表示 */}
                          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            {/* PC版は最大5件、モバイル版は最大3件表示 */}
                            {dayEvents.slice(0, isMobile ? 3 : 5).map((event) => (
                              <EventChip key={event.id} event={event} isPC={!isMobile} />
                            ))}
                            {dayEvents.length > (isMobile ? 3 : 5) && (
                              <Typography sx={{ fontSize: { xs: '10px', md: '11px' }, color: 'text.secondary', fontWeight: 600 }}>
                                +{dayEvents.length - (isMobile ? 3 : 5)}
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