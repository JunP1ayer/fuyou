// ⚡ 仮想スクロール対応カレンダー

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { format, addMonths, startOfMonth } from 'date-fns';
import { motion } from 'framer-motion';
import { useCalendarStore } from '../../store/calendarStore';

interface VirtualMonthProps {
  index: number;
  style: React.CSSProperties;
  data: {
    baseDate: Date;
    onDateClick: (date: string) => void;
  };
}

// メモ化された月表示コンポーネント
const VirtualMonth = React.memo<VirtualMonthProps>(({ index, style, data }) => {
  const theme = useTheme();
  const { events } = useCalendarStore();
  const { baseDate, onDateClick } = data;
  
  // 現在の月を計算
  const currentMonthDate = useMemo(() => 
    addMonths(baseDate, index - 12), // 12ヶ月前から開始
    [baseDate, index]
  );
  
  // 月のイベントデータをメモ化
  const monthEvents = useMemo(() => {
    const monthKey = format(currentMonthDate, 'yyyy-MM');
    return events.filter(event => 
      event.date.startsWith(monthKey)
    );
  }, [events, currentMonthDate]);

  return (
    <div style={style}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ padding: '16px' }}
      >
        {/* 月ヘッダー */}
        <Box sx={{
          py: 2,
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          backgroundColor: 'background.paper',
          mb: 2,
        }}>
          <Typography variant="h6" align="center" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {format(currentMonthDate, 'yyyy年M月')}
          </Typography>
          {monthEvents.length > 0 && (
            <Typography variant="body2" align="center" color="text.secondary">
              {monthEvents.length}件の予定
            </Typography>
          )}
        </Box>

        {/* シンプルなカレンダー表示（パフォーマンス重視） */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1,
          minHeight: '300px',
        }}>
          {/* 曜日ヘッダー */}
          {['日', '月', '火', '水', '木', '金', '土'].map((day, idx) => (
            <Box key={day} sx={{
              textAlign: 'center',
              fontWeight: 600,
              color: idx === 0 ? 'error.main' : idx === 6 ? 'primary.main' : 'text.secondary',
              py: 1,
            }}>
              {day}
            </Box>
          ))}
          
          {/* 日付セル（最適化版） */}
          {generateMonthDays(currentMonthDate).map(({ date, isCurrentMonth }) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayEvents = monthEvents.filter(e => e.date === dateStr);
            const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;
            
            return (
              <Box
                key={dateStr}
                onClick={() => onDateClick(dateStr)}
                sx={{
                  minHeight: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: 1,
                  backgroundColor: isToday 
                    ? 'primary.light' 
                    : 'transparent',
                  opacity: isCurrentMonth ? 1 : 0.3,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: isToday ? 700 : 400 }}>
                  {format(date, 'd')}
                </Typography>
                {dayEvents.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <Box key={idx} sx={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                      }} />
                    ))}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </motion.div>
    </div>
  );
}, areEqual);

// 月の日付を生成するヘルパー関数（最適化）
const generateMonthDays = (monthDate: Date) => {
  const startDate = startOfMonth(monthDate);
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayWeek = startDate.getDay();
  
  const days = [];
  
  // 前月の日付
  const prevMonth = new Date(year, month - 1, 0).getDate();
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonth - i),
      isCurrentMonth: false,
    });
  }
  
  // 当月の日付
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
    });
  }
  
  // 次月の日付（42日まで埋める）
  const remaining = 42 - days.length;
  for (let day = 1; day <= remaining; day++) {
    days.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
    });
  }
  
  return days;
};

interface VirtualizedCalendarProps {
  onDateClick?: (date: string) => void;
}

export const VirtualizedCalendar: React.FC<VirtualizedCalendarProps> = ({ onDateClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const listRef = useRef<List>(null);
  const [baseDate] = useState(new Date());

  // 初期位置を現在月に設定
  useEffect(() => {
    if (listRef.current) {
      // 12ヶ月前から開始するので、現在月は12番目
      listRef.current.scrollToItem(12, 'start');
    }
  }, []);

  // 日付クリックハンドラー（メモ化）
  const handleDateClick = useCallback((date: string) => {
    console.log('Date clicked:', date);
    onDateClick?.(date);
  }, [onDateClick]);

  // リストアイテムデータ（メモ化）
  const itemData = useMemo(() => ({
    baseDate,
    onDateClick: handleDateClick,
  }), [baseDate, handleDateClick]);

  return (
    <Box sx={{ 
      height: '100%',
      width: '100%',
      backgroundColor: 'background.default',
    }}>
      <List
        ref={listRef}
        height={window.innerHeight - (isMobile ? 140 : 100)}
        width="100%"
        itemCount={24} // 前12ヶ月 + 後12ヶ月
        itemSize={400} // 各月の高さ
        itemData={itemData}
        overscanCount={2} // パフォーマンス最適化
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.palette.primary.main} ${theme.palette.background.default}`,
        }}
      >
        {VirtualMonth}
      </List>
    </Box>
  );
};