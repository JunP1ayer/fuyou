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

// モバイル特化の軽量シンプルな月間カレンダー（シンプルカレンダー風）
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

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  const shiftsByDate = useMemo(() => {
    const grouped: Record<string, Shift[]> = {};
    shifts.forEach(shift => {
      const key = shift.date;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(shift);
    });
    return grouped;
  }, [shifts]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    if (!touchStartX.current || !touchEndX.current) return;

    const deltaX = touchEndX.current - touchStartX.current;
    if (Math.abs(deltaX) > 100) {
      if (deltaX > 0) {
        setCurrentDate(subMonths(currentDate, 1));
      } else {
        setCurrentDate(addMonths(currentDate, 1));
      }
    }
  };

  const handleSelectDate = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    setSelectedKey(key);
  };

  return (
    <Box
      sx={{
        px: 1,
        py: 1,
        userSelect: 'none',
        maxWidth: '600px',
        mx: 'auto',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <IconButton onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          {format(currentDate, 'yyyy年M月', { locale: ja })}
        </Typography>
        <IconButton onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
          <ChevronRight />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
          mb: 1,
        }}
      >
        {weekDays.map((day, idx) => (
          <Typography
            key={day}
            variant="caption"
            align="center"
            sx={{
              fontWeight: 600,
              color:
                idx === 0
                  ? 'error.main'
                  : idx === 6
                    ? 'primary.main'
                    : 'text.secondary',
            }}
          >
            {day}
          </Typography>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
        }}
      >
        {days.map((date, index) => {
          if (!date) {
            return <Box key={`empty-${index}`} />;
          }

          const key = format(date, 'yyyy-MM-dd');
          const isSelected = key === selectedKey;
          const isCurrentDay = isToday(date);
          const dayOfWeek = date.getDay();
          const dayShifts = shiftsByDate[key] || [];

          return (
            <Box
              key={key}
              onClick={() => handleSelectDate(date)}
              sx={{
                position: 'relative',
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1.5,
                bgcolor: isSelected
                  ? 'primary.main'
                  : isCurrentDay
                    ? '#e3f2fd'
                    : 'transparent',
                color: isSelected ? 'white' : 'inherit',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:active': {
                  transform: 'scale(0.95)',
                },
                '&:hover': {
                  bgcolor: isSelected 
                    ? 'primary.dark' 
                    : isCurrentDay 
                      ? '#bbdefb'
                      : 'action.hover',
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: isSelected || isCurrentDay ? 600 : 400,
                  color: isSelected
                    ? 'inherit'
                    : dayOfWeek === 0
                      ? 'error.main'
                      : dayOfWeek === 6
                        ? 'primary.main'
                        : 'text.primary',
                }}
              >
                {format(date, 'd')}
              </Typography>

              {dayShifts.length > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    bgcolor: isSelected ? 'white' : 'primary.main',
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      {selectedKey && (
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {format(new Date(selectedKey), 'M月d日(E)', { locale: ja })}
            </Typography>
            <Chip
              label={`${shiftsByDate[selectedKey]?.length || 0}件`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          {shiftsByDate[selectedKey] ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {shiftsByDate[selectedKey].map(shift => (
                <Box
                  key={shift.id}
                  onClick={() => onEditShift(shift)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: shift.isConfirmed ? 'success.50' : 'warning.50',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:active': {
                      transform: 'scale(0.98)',
                    },
                    '&:hover': {
                      bgcolor: shift.isConfirmed ? 'success.100' : 'warning.100',
                    },
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, mb: 0.5 }}
                  >
                    {shift.jobSourceName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {shift.startTime} - {shift.endTime}
                    {shift.breakMinutes && ` (休憩${shift.breakMinutes}分)`}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    ¥{shift.calculatedEarnings?.toLocaleString() || 0}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ py: 3 }}
            >
              シフトなし
            </Typography>
          )}
        </Box>
      )}

      <Fab
        color="primary"
        size="large"
        onClick={() => onAddShift(selectedKey || format(new Date(), 'yyyy-MM-dd'))}
        disabled={loading}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          boxShadow: 3,
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};