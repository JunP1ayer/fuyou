import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
} from '@mui/material';
import { AccountBalance } from '@mui/icons-material';
import { ShiftManager } from './shifts/ShiftManager';
import { MonthlySalaryCard } from './MonthlySalaryCard';
import type { Shift, Workplace } from '../types/shift';

export const ShiftBoardFuyouApp: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  // デバッグ用：shiftsの変更を監視
  React.useEffect(() => {
    console.log('Shifts updated:', shifts);
  }, [shifts]);

  // 初期職場データを設定
  React.useEffect(() => {
    const demoWorkplaces: Workplace[] = [
      {
        id: 'wp-1',
        name: 'カフェ A',
        hourlyRate: 1000,
        color: '#2196f3',
        description: '駅前カフェ',
      },
      {
        id: 'wp-2',
        name: 'コンビニ B',
        hourlyRate: 950,
        color: '#4caf50',
        description: '24時間営業',
      },
      {
        id: 'wp-3',
        name: '家庭教師',
        hourlyRate: 1500,
        color: '#ff9800',
        description: '個別指導',
      },
    ];
    setWorkplaces(demoWorkplaces);
  }, []);

  // テスト用シフトデータ（デモ）
  React.useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const testShifts: Shift[] = [
      {
        id: 'test-shift-1',
        userId: 'demo-user',
        jobSourceId: 'wp-1',
        jobSourceName: 'カフェ A',
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`,
        startTime: '09:00',
        endTime: '17:00',
        hourlyRate: 1000,
        breakMinutes: 60,
        workingHours: 7,
        calculatedEarnings: 7000,
        isConfirmed: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'test-shift-2',
        userId: 'demo-user',
        jobSourceId: 'wp-2',
        jobSourceName: 'コンビニ B',
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-18`,
        startTime: '18:00',
        endTime: '22:00',
        hourlyRate: 950,
        breakMinutes: 0,
        workingHours: 4,
        calculatedEarnings: 3800,
        isConfirmed: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    setShifts(testShifts);
    console.log('Test shifts set:', testShifts);
  }, []);

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              fontWeight: 'bold',
              color: 'primary.main',
            }}
          >
            <AccountBalance />
            シフトボード風 給料管理
          </Typography>

          {/* 月間タブ */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label="月" color="primary" clickable />
            <Chip label="年" variant="outlined" clickable />
          </Box>
        </Box>

        <Typography variant="subtitle1" color="text.secondary">
          シフトを記録して給料を自動計算
        </Typography>
      </Box>

      {/* シフトボード風給料計算UI */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <ShiftManager
            workplaces={workplaces}
            initialShifts={shifts}
            onShiftsChange={setShifts}
            showAddButton={true}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MonthlySalaryCard
            shifts={shifts}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </Grid>
      </Grid>
    </Box>
  );
};