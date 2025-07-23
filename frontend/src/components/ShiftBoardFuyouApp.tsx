import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Fab,
  Dialog,
  DialogContent,
  DialogTitle,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  CameraAlt,
  AccountBalance,
  Add,
  PhotoCamera,
  Upload,
} from '@mui/icons-material';
import { ShiftCalendar } from './shifts/ShiftCalendar';
import { OCRShiftManager } from './OCRShiftManager';
import { ShiftboardSalaryCard } from './ShiftboardSalaryCard';
import type { Shift, CreateShiftData } from '../types/shift';

export const ShiftBoardFuyouApp: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);


  // OCRシフト追加の処理
  const handleOCRComplete = (newShifts: CreateShiftData[]) => {
    // CreateShiftDataをShiftに変換（簡易版）
    const shiftsToAdd: Shift[] = newShifts.map(shift => ({
      id: `shift-${Date.now()}-${Math.random()}`,
      userId: 'demo-user',
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      hourlyRate: shift.hourlyRate,
      location: shift.location || '本店',
      workingHours: calculateWorkingHours(shift.startTime, shift.endTime),
      calculatedEarnings:
        calculateWorkingHours(shift.startTime, shift.endTime) *
        shift.hourlyRate,
      notes: shift.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    setShifts(prev => [...prev, ...shiftsToAdd]);
    setOcrDialogOpen(false);
  };

  // 労働時間計算のヘルパー関数
  const calculateWorkingHours = (
    startTime: string,
    endTime: string
  ): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return (endMinutes - startMinutes) / 60;
  };

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
            <Chip 
              label="月" 
              color="primary" 
              clickable 
            />
            <Chip 
              label="年" 
              variant="outlined" 
              clickable 
            />
          </Box>
        </Box>

        <Typography variant="subtitle1" color="text.secondary">
          シフトを記録して給料を自動計算
        </Typography>
      </Box>

      {/* シフトボード風給料計算UI */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <ShiftboardSalaryCard compact={false} shifts={shifts} />
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                クイックアクション
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Tooltip title="シフト表を撮影してAIが自動でシフトを登録">
                  <Box>
                    <Chip
                      icon={<CameraAlt />}
                      label="シフト表を撮影"
                      clickable
                      color="primary"
                      size="medium"
                      sx={{ width: '100%', height: 48 }}
                      onClick={() => setOcrDialogOpen(true)}
                    />
                  </Box>
                </Tooltip>

                <Chip
                  icon={<Add />}
                  label="手動でシフト追加"
                  clickable
                  variant="outlined"
                  size="medium"
                  sx={{ width: '100%', height: 48 }}
                />

                <Chip
                  icon={<Upload />}
                  label="給与明細アップロード"
                  clickable
                  variant="outlined"
                  size="medium"
                  sx={{ width: '100%', height: 48 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* シフトカレンダー */}
      <Card>
        <CardContent>
          <ShiftCalendar
            compactMode={false}
            onAddShift={(date: string) => {
              console.log('Add shift for date:', date);
            }}
            onEditShift={(shift: Shift) => {
              console.log('Edit shift:', shift);
            }}
          />
        </CardContent>
      </Card>

      {/* OCRダイアログ */}
      <Dialog
        open={ocrDialogOpen}
        onClose={() => setOcrDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCamera />
            シフト表AI読み取り
          </Box>
        </DialogTitle>
        <DialogContent>
          <OCRShiftManager
            onShiftsSaved={handleOCRComplete}
            onClose={() => setOcrDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* フローティングカメラボタン */}
      <Fab
        color="primary"
        size="large"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        onClick={() => setOcrDialogOpen(true)}
      >
        <Badge badgeContent="AI" color="secondary">
          <CameraAlt />
        </Badge>
      </Fab>
    </Box>
  );
};
