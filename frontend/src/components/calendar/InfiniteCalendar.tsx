import React, { useEffect, useMemo, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { addMonths, format } from 'date-fns';
import { MonthGrid } from './MonthGrid';

interface InfiniteCalendarProps {
  around?: number; // 表示する前後の月数
  weekStartsOnMonday?: boolean;
}

export const InfiniteCalendar: React.FC<InfiniteCalendarProps> = ({
  around = 12,
  weekStartsOnMonday,
}) => {
  const months = useMemo(() => {
    const arr: Date[] = [];
    const now = new Date();
    for (let i = -around; i <= around; i++) arr.push(addMonths(now, i));
    return arr;
  }, [around]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 初期表示で当月の位置へスクロール
    const node = containerRef.current;
    if (!node) return;
    const currentIndex = around;
    const child = node.children[currentIndex] as HTMLElement | undefined;
    if (child) {
      const top = child.offsetTop - 16;
      node.scrollTo({ top, behavior: 'smooth' });
    }
  }, [around]);

  return (
    <Box ref={containerRef} sx={{ maxHeight: 600, overflowY: 'auto', pr: 1 }}>
      {months.map((m, idx) => (
        <Box key={idx} sx={{ mb: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, textAlign: 'left', ml: 1, mb: 1 }}
          >
            {format(m, 'M/yyyy')}
          </Typography>
          <MonthGrid month={m} weekStartsOnMonday={weekStartsOnMonday} />
        </Box>
      ))}
    </Box>
  );
};
