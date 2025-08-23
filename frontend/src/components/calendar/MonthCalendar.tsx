// Enhanced Month Calendar Component with横長予定ピル
// Material-UI版 - 提供されたコンポーネントを基にMUI変換

import React, { useMemo } from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  max as dfMax,
  min as dfMin,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarEvent } from '../../types/calendar';

// 内部で使用するイベント型（既存のCalendarEventから変換）
type CalEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  originalEvent: CalendarEvent;
};

type Props = {
  activeMonth: Date;
  events?: CalendarEvent[];
  weekStartsOn?: 0 | 1;
  showOutsideDays?: boolean;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
};

export default function MonthCalendar({
  activeMonth,
  events = [],
  weekStartsOn = 1,
  showOutsideDays = false,
  onDateClick,
  onEventClick,
}: Props) {
  const theme = useTheme();

  // 既存のCalendarEventを内部形式に変換
  const convertedEvents = useMemo((): CalEvent[] => {
    return events.map(event => {
      const start = new Date(event.date);
      const end = event.endDate ? new Date(event.endDate) : new Date(event.date);
      
      return {
        id: event.id,
        title: event.type === 'shift' 
          ? (event.workplace?.name || event.title || '')
          : (event.title || ''),
        start,
        end,
        color: event.color,
        originalEvent: event,
      };
    });
  }, [events]);

  // グリッドの日付配列（42マス）
  const monthStart = startOfMonth(activeMonth);
  const monthEnd = endOfMonth(activeMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weeks = chunk(days, 7);
  
  // PC版はそのまま、モバイルのみ5週間表示に制限（35マス）
  const limitedWeeks = weeks;

  // 週ごとのイベントセグメントを作成
  const weekSegments = useMemo(() => {
    return weeks.map(([w0]) => {
      const wStart = w0;
      const wEnd = addDays(wStart, 6);
      
      // 週にかかるイベントを切り出してgridColumnを計算
      const segs = convertedEvents
        .filter((ev) => !(isBefore(ev.end, wStart) || isAfter(ev.start, wEnd)))
        .map((ev) => {
          const segStart = dfMax([ev.start, wStart]);
          const segEnd = dfMin([ev.end, wEnd]);
          const colStart = dayIndex(segStart, wStart) + 1; // 1..7
          const colEnd = dayIndex(segEnd, wStart) + 1;     // 1..7
          return {
            ev,
            colStart,
            colEnd,
            span: colEnd - colStart + 1, // 両端含む
            continueLeft: isBefore(ev.start, wStart),
            continueRight: isAfter(ev.end, wEnd),
          };
        })
        // 長いものを先に置くと重なり処理が見栄え良い
        .sort((a, b) => b.span - a.span);

      // 重なりを段に割り当て（最大3段）
      const rows: typeof segs[] = [[], [], []];
      const overflow: typeof segs = [];
      segs.forEach((s) => {
        const placed = rows.find((row) => !row.some((r) => overlap(r, s)));
        if (placed) placed.push(s);
        else overflow.push(s);
      });

      return { wStart, rows, more: overflow.length };
    });
  }, [weeks, convertedEvents]);

  const handleDateClick = (day: Date) => {
    if (onDateClick) onDateClick(day);
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (onEventClick) onEventClick(event);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* ヘッダ（年／月） */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: '0.02em' }}>
          {format(activeMonth, "yyyy/M", { locale: ja })}
        </Typography>
      </Box>

      {/* 曜日ヘッダ */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)',
        fontSize: '12px',
        color: 'text.secondary',
        px: 1,
        pb: 1,
      }}>
        {weekdayLabels(weekStartsOn).map((w, i) => (
          <Box
            key={w}
            sx={{
              px: 2,
              color: isSun(i, weekStartsOn) 
                ? 'error.main'
                : isSat(i, weekStartsOn) 
                  ? 'info.main'
                  : 'text.secondary',
            }}
          >
            {w}
          </Box>
        ))}
      </Box>

      {/* 月グリッド */}
      <Box sx={{ position: 'relative' }}>
        {/* ウォーターマーク（中央の大きな月数字） */}
        <Box sx={{ 
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 1, // 日付セルの上に配置
        }}>
          <Typography sx={{
            fontSize: { xs: '120px', md: '200px' },
            fontWeight: 700,
            color: alpha(theme.palette.text.primary, 0.08), // 少し濃くして見やすく
            lineHeight: 1,
            userSelect: 'none',
          }}>
            {format(activeMonth, "M")}
          </Typography>
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateRows: 'repeat(6, 1fr)',
          gap: '1px',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: 'divider',
        }}>
          {weeks.map((week, wi) => (
            <Box
              key={format(week[0], "yyyy-MM-dd")}
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                backgroundColor: alpha(theme.palette.background.paper, 0.8), // 半透明にして背景月数字が見えるように
                position: 'relative',
                minHeight: '84px',
              }}
            >
              {/* 日付セル */}
              {week.map((day) => {
                const inMonth = isSameMonth(day, activeMonth);
                const isTodayDate = isToday(day);
                const dayOfWeek = day.getDay();
                
                return (
                  <Box
                    key={format(day, "yyyy-MM-dd")}
                    onClick={() => handleDateClick(day)}
                    sx={{
                      borderTop: '0.5px solid',
                      borderColor: alpha(theme.palette.divider, 0.5),
                      p: 2,
                      position: 'relative',
                      textAlign: 'right',
                      verticalAlign: 'top',
                      cursor: 'pointer',
                      zIndex: 1,
                      color: !inMonth && !showOutsideDays
                        ? 'transparent'
                        : !inMonth && showOutsideDays
                          ? 'text.disabled'
                          : isSun(colOf(day, week[0], weekStartsOn), weekStartsOn)
                            ? 'error.main'
                            : isSat(colOf(day, week[0], weekStartsOn), weekStartsOn)
                              ? 'info.main'
                              : 'text.primary',
                      backgroundColor: isTodayDate 
                        ? alpha(theme.palette.primary.main, 0.1)
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    {(inMonth || showOutsideDays) && (
                      <Typography variant="body2" sx={{ 
                        fontSize: '14px',
                        fontWeight: isTodayDate ? 700 : 400,
                      }}>
                        {format(day, "d")}
                      </Typography>
                    )}
                  </Box>
                );
              })}

              {/* 予定（最大3段） */}
              <Box sx={{ 
                position: 'absolute',
                left: 0,
                right: 0,
                top: '24px',
                px: 1,
                zIndex: 2,
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {weekSegments[wi]?.rows.map((row, ri) => (
                    <Box key={ri} sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '4px',
                    }}>
                      {row.map((s) => (
                        <Box
                          key={s.ev.id}
                          onClick={() => handleEventClick(s.ev.originalEvent)}
                          sx={{
                            height: '20px',
                            fontSize: '11px',
                            lineHeight: '20px',
                            fontWeight: 500,
                            px: 2,
                            color: 'white',
                            backgroundColor: s.ev.color || theme.palette.primary.main,
                            borderRadius: '10px',
                            borderTopLeftRadius: s.continueLeft ? 0 : '10px',
                            borderBottomLeftRadius: s.continueLeft ? 0 : '10px',
                            borderTopRightRadius: s.continueRight ? 0 : '10px',
                            borderBottomRightRadius: s.continueRight ? 0 : '10px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            gridColumn: `${s.colStart} / span ${s.span}`,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textShadow: '0 1px 1px rgba(0,0,0,0.35)',
                            '&:hover': {
                              opacity: 0.8,
                            },
                            transition: 'opacity 0.2s ease',
                          }}
                          title={`${s.ev.title} (${format(s.ev.start, "M/d")}–${format(s.ev.end, "M/d")})`}
                        >
                          {s.ev.title}
                        </Box>
                      ))}
                    </Box>
                  ))}

                  {/* +more */}
                  {weekSegments[wi]?.more > 0 && (
                    <Typography sx={{
                      fontSize: '11px',
                      color: 'text.secondary',
                      px: 2,
                    }}>
                      +{weekSegments[wi].more} more
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ---------- helpers ---------- */

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function dayIndex(d: Date, weekStart: Date) {
  // 0..6（週開始からのオフセット）
  const diff = Math.floor((d.getTime() - weekStart.getTime()) / 86400000);
  return diff;
}

function overlap(a: { colStart: number; colEnd: number }, b: { colStart: number; colEnd: number }) {
  return !(a.colEnd < b.colStart || b.colEnd < a.colStart);
}

function weekdayLabels(weekStartsOn: 0 | 1) {
  const sunFirst = ["日", "月", "火", "水", "木", "金", "土"];
  if (weekStartsOn === 0) return sunFirst;
  return [...sunFirst.slice(1), sunFirst[0]]; // 月..日
}

function colOf(day: Date, weekStart: Date, weekStartsOn: 0 | 1) {
  return dayIndex(day, weekStart); // 0..6
}

function isSun(i: number, weekStartsOn: 0 | 1) {
  return (weekStartsOn === 1 && i === 6) || (weekStartsOn === 0 && i === 0);
}

function isSat(i: number, weekStartsOn: 0 | 1) {
  return (weekStartsOn === 1 && i === 5) || (weekStartsOn === 0 && i === 6);
}