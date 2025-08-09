import React, { useMemo, useRef, useState } from 'react';
import { Box, IconButton, Typography, Fab, Chip } from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Add as AddIcon,
  Add,
} from '@mui/icons-material';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Shift } from '../../types/shift';

interface SimpleMobileCalendarProps {
  shifts: Shift[];
  onAddShift: (date: string) => void;
  onEditShift: (_shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  loading?: boolean;
}

// モバイル特化の極力シンプルな月間カレンダー（シンプルカレンダー風）
export const SimpleMobileCalendar: React.FC<SimpleMobileCalendarProps> = ({
  shifts,
  onAddShift,
  onEditShift,
  onDeleteShift: _onDeleteShift,
  loading = false,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedKey, setSelectedKey] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const list = eachDayOfInterval({ start, end });
    const pad = Array(start.getDay()).fill(null);
    return [...pad, ...list] as Array<Date | null>;
  }, [currentDate]);

  const shiftsByDate = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    for (const s of shifts) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [shifts]);

  const changeMonth = (delta: number) => {
    setCurrentDate(prev =>
      delta < 0 ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  // 祝日（簡易）：必要であれば年次表を拡張
  const holidaySet = useMemo(() => new Set<string>([]), []);

  // 集計
  const monthSummary = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const inMonth = shifts.filter(s => {
      const d = new Date(s.date);
      return d >= start && d <= end;
    });
    const hours = inMonth.reduce((sum, s) => sum + (s.workingHours || 0), 0);
    const earnings = inMonth.reduce(
      (sum, s) => sum + (s.calculatedEarnings || 0),
      0
    );
    return { hours, earnings };
  }, [currentDate, shifts]);

  const weekSummary = useMemo(() => {
    const selDate = selectedKey ? new Date(selectedKey) : new Date();
    const ws = startOfWeek(selDate, { weekStartsOn: 0 });
    const we = endOfWeek(selDate, { weekStartsOn: 0 });
    const inWeek = shifts.filter(s => {
      const d = new Date(s.date);
      return d >= ws && d <= we;
    });
    const hours = inWeek.reduce((sum, s) => sum + (s.workingHours || 0), 0);
    const earnings = inWeek.reduce(
      (sum, s) => sum + (s.calculatedEarnings || 0),
      0
    );
    return { hours, earnings };
  }, [selectedKey, shifts]);

  return (
    <Box sx={{ p: 1 }}>
      {/* ヘッダー */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <IconButton
          onClick={() => changeMonth(-1)}
          disabled={loading}
          size="small"
        >
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {format(currentDate, 'yyyy年M月', { locale: ja })}
        </Typography>
        <IconButton
          onClick={() => changeMonth(1)}
          disabled={loading}
          size="small"
        >
          <ChevronRight />
        </IconButton>
      </Box>

      {/* 曜日ヘッダー */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          mb: 0.5,
        }}
      >
        {weekDays.map((d, idx) => (
          <Typography
            key={d}
            variant="caption"
            sx={{
              fontWeight: 700,
              color:
                idx === 0
                  ? 'error.main'
                  : idx === 6
                    ? 'primary.main'
                    : 'text.secondary',
            }}
          >
            {d}
          </Typography>
        ))}
      </Box>

      {/* 月グリッド（スワイプ対応） */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.25,
        }}
        onTouchStart={e => {
          touchStartX.current = e.changedTouches[0].clientX;
          touchEndX.current = null;
        }}
        onTouchMove={e => {
          touchEndX.current = e.changedTouches[0].clientX;
        }}
        onTouchEnd={() => {
          if (touchStartX.current === null || touchEndX.current === null)
            return;
          const dx = touchEndX.current - touchStartX.current;
          if (Math.abs(dx) > 50) {
            // 右→左: 次月, 左→右: 前月
            changeMonth(dx < 0 ? 1 : -1);
          }
        }}
      >
        {days.map((date, i) => {
          if (!date) return <Box key={`empty-${i}`} sx={{ height: 56 }} />;
          const key = format(date, 'yyyy-MM-dd');
          const day = date.getDate();
          const dw = date.getDay();
          const list = shiftsByDate[key] || [];
          const isSel = selectedKey === key;
          const today = isToday(date);
          const isHoliday = holidaySet.has(key);

          return (
            <Box
              key={key}
              onClick={() => {
                setSelectedKey(key);
                onAddShift(key);
              }}
              sx={{
                height: 56,
                borderRadius: 1,
                bgcolor: isSel ? 'primary.50' : 'background.paper',
                border: '1px solid',
                borderColor: isSel ? 'primary.main' : 'divider',
                px: 0.5,
                py: 0.25,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: today || isSel ? 700 : 500,
                    color:
                      dw === 0 || isHoliday
                        ? 'error.main'
                        : dw === 6
                          ? 'primary.main'
                          : 'text.primary',
                  }}
                >
                  {day}
                </Typography>
                {/* シフト件数 */}
                {list.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.25 }}>
                    {Array.from({ length: Math.min(3, list.length) }).map(
                      (_, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            width: 6,
                            height: 6,
                            bgcolor: list[idx]?.isConfirmed
                              ? 'success.main'
                              : 'warning.main',
                            borderRadius: '50%',
                          }}
                        />
                      )
                    )}
                  </Box>
                )}
              </Box>
              {/* 右下ミニ追加 */}
              <Box sx={{ mt: 'auto', textAlign: 'right' }}>
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    onAddShift(key);
                  }}
                  sx={{ p: 0.25 }}
                >
                  <Add fontSize="inherit" />
                </IconButton>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* 追加ボタン */}
      <Fab
        color="primary"
        size="medium"
        sx={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1100 }}
        onClick={() => onAddShift(format(new Date(), 'yyyy-MM-dd'))}
        disabled={loading}
      >
        <AddIcon />
      </Fab>

      {/* サマリー */}
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Chip
          label={`週: ${weekSummary.hours.toFixed(1)}h / ¥${weekSummary.earnings.toLocaleString()}`}
          size="small"
        />
        <Chip
          label={`月: ${monthSummary.hours.toFixed(1)}h / ¥${monthSummary.earnings.toLocaleString()}`}
          size="small"
          color="primary"
        />
      </Box>
    </Box>
  );
};
