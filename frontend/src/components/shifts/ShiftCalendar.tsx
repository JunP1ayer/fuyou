import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { CalendarMonth } from '@mui/icons-material';

import type { Shift } from '../../types/shift';

interface ShiftCalendarProps {
  compactMode?: boolean;
  onAddShift?: (date: string) => void;
  onEditShift?: (shift: Shift) => void;
}

// Mock ShiftCalendar component for demo
export const ShiftCalendar: React.FC<ShiftCalendarProps> = () => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <CalendarMonth sx={{ mr: 1 }} />
          <Typography variant="h6">シフトカレンダー</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          シフトカレンダー機能は開発中です。
        </Typography>
      </CardContent>
    </Card>
  );
};
