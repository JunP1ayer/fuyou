import React, { useState } from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from 'date-fns';
import { ja } from 'date-fns/locale';

export const SimpleCalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 月の変更
  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  // カレンダーの日付を生成
  const generateCalendarDates = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });

    // 月初の曜日に合わせて空白を追加
    const startDayOfWeek = start.getDay();
    const emptyDays = Array(startDayOfWeek).fill(null);

    return [...emptyDays, ...days];
  };

  const calendarDates = generateCalendarDates();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f5f5f5',
      }}
    >
      {/* ヘッダー */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1.5,
          bgcolor: 'white',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <IconButton onClick={handlePrevMonth} size="small">
          <ChevronLeft />
        </IconButton>

        <Typography variant="h6" sx={{ fontSize: '1.2rem', fontWeight: 500 }}>
          {format(currentDate, 'yyyy年M月', { locale: ja })}
        </Typography>

        <IconButton onClick={handleNextMonth} size="small">
          <ChevronRight />
        </IconButton>
      </Box>

      {/* カレンダー本体 */}
      <Box sx={{ flex: 1, p: 1 }}>
        {/* 曜日ヘッダー */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0.5,
            mb: 0.5,
          }}
        >
          {weekDays.map((day, index) => (
            <Box
              key={day}
              sx={{
                textAlign: 'center',
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color:
                  index === 0 ? '#ef5350' : index === 6 ? '#1976d2' : '#666',
              }}
            >
              {day}
            </Box>
          ))}
        </Box>

        {/* 日付グリッド */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: 'repeat(6, 1fr)',
            gap: 0.5,
            height: 'calc(100% - 40px)',
          }}
        >
          {calendarDates.map((date, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                p: 0.5,
                cursor: date ? 'pointer' : 'default',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                bgcolor: date ? 'white' : 'transparent',
                '&:hover': date ? { bgcolor: '#f5f5f5' } : {},
              }}
            >
              {date && (
                <>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight:
                        format(date, 'd') === format(new Date(), 'd')
                          ? 'bold'
                          : 'normal',
                      color:
                        date.getDay() === 0
                          ? '#ef5350'
                          : date.getDay() === 6
                            ? '#1976d2'
                            : '#333',
                    }}
                  >
                    {format(date, 'd')}
                  </Typography>

                  {/* シフト情報のプレースホルダー */}
                  <Box sx={{ flex: 1, mt: 0.5 }}>
                    <Typography sx={{ fontSize: '0.65rem', color: '#666' }}>
                      {Math.random() > 0.7 ? '2件' : ''}
                    </Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: '#4caf50' }}>
                      {Math.random() > 0.7 ? '¥8K' : ''}
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
