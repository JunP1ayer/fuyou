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
import { ShiftManager } from './shifts/ShiftManager';
import { OCRShiftManager } from './OCRShiftManager';
import { IntelligentOCRWorkflow } from './ocr/IntelligentOCRWorkflow';
import { ShiftboardSalaryCard } from './ShiftboardSalaryCard';
import type { Shift, CreateShiftData } from '../types/shift';

export const ShiftBoardFuyouApp: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [intelligentOCROpen, setIntelligentOCROpen] = useState(false);

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
      jobSourceName: shift.jobSourceName,
      breakMinutes: shift.breakMinutes || 0,
      workingHours: calculateWorkingHours(shift.startTime, shift.endTime, shift.breakMinutes || 0),
      calculatedEarnings:
        calculateWorkingHours(shift.startTime, shift.endTime, shift.breakMinutes || 0) *
        shift.hourlyRate,
      description: shift.description,
      isConfirmed: shift.isConfirmed || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setShifts(prev => [...prev, ...shiftsToAdd]);
    setOcrDialogOpen(false);
  };

  // 労働時間計算のヘルパー関数
  const calculateWorkingHours = (
    startTime: string,
    endTime: string,
    breakMinutes: number = 0
  ): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // 翌日跨ぎの場合
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const totalMinutes = endMinutes - startMinutes - breakMinutes;
    return Math.max(0, totalMinutes / 60);
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
        <Grid item xs={12}>
          <ShiftManager />
        </Grid>

      </Grid>


      {/* 従来のOCRダイアログ */}
      <Dialog
        open={ocrDialogOpen}
        onClose={() => setOcrDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCamera />
            シンプルOCR読み取り
          </Box>
        </DialogTitle>
        <DialogContent>
          <OCRShiftManager
            onShiftsSaved={handleOCRComplete}
            onClose={() => setOcrDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 新しいインテリジェントOCRダイアログ */}
      <Dialog
        open={intelligentOCROpen}
        onClose={() => setIntelligentOCROpen(false)}
        maxWidth="xl"
        fullWidth
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: 'background.default',
          },
        }}
      >
        <IntelligentOCRWorkflow
          onShiftsSaved={(newShifts) => {
            handleOCRComplete(newShifts);
            setIntelligentOCROpen(false);
          }}
          onClose={() => setIntelligentOCROpen(false)}
          userProfile={{
            displayName: 'デモユーザー',
            shiftFilterName: '田中',
            preferences: {
              defaultHourlyRate: 1000,
              defaultBreakMinutes: 60,
              autoConfirmHighConfidence: true,
              ocrConfidenceThreshold: 0.7,
            },
          }}
        />
      </Dialog>

      {/* フローティングボタン群 */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* メインのインテリジェントOCRボタン */}
        <Tooltip title="🤖 AI シフト解析 (推奨)" placement="left">
          <Fab
            color="primary"
            size="large"
            onClick={() => setIntelligentOCROpen(true)}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            }}
          >
            <Badge badgeContent="NEW" color="secondary">
              <CameraAlt />
            </Badge>
          </Fab>
        </Tooltip>

        {/* シンプルOCRボタン */}
        <Tooltip title="シンプルOCR読み取り" placement="left">
          <Fab
            color="default"
            size="medium"
            onClick={() => setOcrDialogOpen(true)}
            sx={{ opacity: 0.7 }}
          >
            <Upload />
          </Fab>
        </Tooltip>
      </Box>
    </Box>
  );
};
