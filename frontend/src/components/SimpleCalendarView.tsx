// 📅 シンプルなカレンダー表示コンポーネント

import React, { useState } from 'react';
import { Card, CardContent, Typography, Grid, Box, IconButton, useTheme, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { useSimpleShiftStore } from '../store/simpleShiftStore';

export const SimpleCalendarView: React.FC = () => {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { shifts, getShiftsByDate, getTotalEarnings } = useSimpleShiftStore();

  // カレンダーの日付を生成
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 月移動
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev =>
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  // 週を分ける
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  days.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || day === days[days.length - 1]) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent>
          {/* ヘッダー */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <IconButton onClick={() => navigateMonth('prev')}>
              <ChevronLeft />
            </IconButton>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                📅 {format(currentMonth, 'yyyy年M月', { locale: ja })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                総収入: ¥{getTotalEarnings().toLocaleString()} | シフト数:{' '}
                {shifts.length}件
              </Typography>
            </Box>
            <IconButton onClick={() => navigateMonth('next')}>
              <ChevronRight />
            </IconButton>
          </Box>

          {/* 曜日ヘッダー */}
          <Grid container spacing={0} sx={{ mb: 2 }}>
            {weekDays.map((day, index) => (
              <Grid item xs key={day}>
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 1,
                    fontWeight: 600,
                    color:
                      index === 0
                        ? 'error.main'
                        : index === 6
                          ? 'primary.main'
                          : 'text.secondary',
                  }}
                >
                  {day}
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* カレンダー本体 */}
          {weeks.map((week, weekIndex) => (
            <Grid container spacing={0.5} key={weekIndex} sx={{ mb: 0.5 }}>
              {week.map((day, dayIndex) => (
                <Grid item xs key={dayIndex}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Box
                      sx={{
                        minHeight: 60,
                        p: 1,
                        cursor: 'pointer',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'transparent',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                      onClick={() => {
                        console.log(
                          'Selected date:',
                          format(day, 'yyyy-MM-dd')
                        );
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                        }}
                      >
                        {format(day, 'd')}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          ))}

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, display: 'block' }}
          >
            💡 日付をクリックしてシフト詳細を表示（準備中）
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};
