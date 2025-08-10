import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
} from 'date-fns';

interface MonthGridProps {
  month: Date;
  weekStartsOnMonday?: boolean;
}

export const MonthGrid: React.FC<MonthGridProps> = ({
  month,
  weekStartsOnMonday,
}) => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const weekStartsOn = weekStartsOnMonday ? 1 : 0;
  const gridStart = startOfWeek(monthStart, { weekStartsOn });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const weekLabels = weekStartsOnMonday
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Box sx={{ mb: 3 }}>
      {/* 曜日ヘッダー（sticky） */}
      <Grid
        container
        spacing={0}
        sx={{
          mb: 1,
          position: 'sticky',
          top: 40,
          zIndex: 2,
          bgcolor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {weekLabels.map(label => (
          <Grid item xs key={label}>
            <Box
              sx={{
                textAlign: 'center',
                py: 1,
                fontWeight: 600,
                color:
                  label === 'Sun'
                    ? 'error.main'
                    : label === 'Sat'
                      ? 'primary.main'
                      : 'text.secondary',
              }}
            >
              {label}
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* カレンダー本体 */}
      {weeks.map((week, idx) => (
        <Grid container spacing={0.5} key={idx} sx={{ mb: 0.5 }}>
          {week.map(day => {
            const inMonth = day.getMonth() === month.getMonth();
            return (
              <Grid item xs key={day.toISOString()}>
                <Box
                  sx={{
                    minHeight: 76,
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: inMonth ? 'divider' : 'transparent',
                    bgcolor: inMonth ? 'background.paper' : 'action.hover',
                    textAlign: 'center',
                    transition: 'background-color .2s ease',
                    '&:hover': {
                      bgcolor: inMonth ? 'action.hover' : 'action.selected',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        lineHeight: '28px',
                        borderRadius: '50%',
                        bgcolor: isToday(day) ? 'primary.light' : 'transparent',
                        color: isToday(day) ? 'primary.dark' : 'text.primary',
                        fontWeight: 600,
                        opacity: inMonth ? 1 : 0.6,
                      }}
                    >
                      {format(day, 'd')}
                    </Box>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      ))}
    </Box>
  );
};
