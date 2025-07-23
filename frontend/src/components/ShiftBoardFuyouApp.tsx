import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Fab,
  Dialog,
  DialogContent,
  DialogTitle,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  CameraAlt,
  AccountBalance,
  Add,
  PhotoCamera,
  EventNote,
} from '@mui/icons-material';
import { ShiftManager } from './shifts/ShiftManager';
import { OCRShiftManager } from './OCRShiftManager';
import { IntelligentOCRWorkflow } from './ocr/IntelligentOCRWorkflow';
import { ShiftFormDialog } from './shifts/ShiftFormDialog';
import { MonthlySalaryCard } from './MonthlySalaryCard';
import { WorkplaceManager } from './workplaces/WorkplaceManager';
import * as api from '../services/api';
import type { Shift, CreateShiftData, Workplace } from '../types/shift';

export const ShiftBoardFuyouApp: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [intelligentOCROpen, setIntelligentOCROpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [manualShiftDialogOpen, setManualShiftDialogOpen] = useState(false);
  const [workplaceManagerOpen, setWorkplaceManagerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  // 初期職場データを設定
  React.useEffect(() => {
    const demoWorkplaces: Workplace[] = [
      {
        id: 'wp-1',
        userId: 'demo-user',
        name: 'コンビニA',
        hourlyRate: 1000,
        color: '#2196F3',
        payDay: 25,
        description: '近所のコンビニ',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'wp-2',
        userId: 'demo-user',
        name: 'ファミレスB',
        hourlyRate: 1200,
        color: '#4CAF50',
        payDay: 15,
        description: 'キッチンスタッフ',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setWorkplaces(demoWorkplaces);
  }, []);

  // アクション選択の処理
  const handleActionSelect = (action: 'manual' | 'ocr' | 'workplace') => {
    setActionDialogOpen(false);
    if (action === 'manual') {
      setManualShiftDialogOpen(true);
    } else if (action === 'ocr') {
      setIntelligentOCROpen(true);
    } else if (action === 'workplace') {
      setWorkplaceManagerOpen(true);
    }
  };

  // 手動シフト登録の処理
  const handleManualShiftSubmit = async (data: CreateShiftData) => {
    try {
      setLoading(true);
      const response = await api.createShift(data);
      if (response.success && response.data) {
        // 新しいシフトを追加
        setShifts(prev => [...prev, response.data!]);
        setManualShiftDialogOpen(false);
      } else {
        throw new Error(
          response.error?.message || 'シフトの登録に失敗しました'
        );
      }
    } catch (error: any) {
      console.error('Shift creation error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

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
      workingHours: calculateWorkingHours(
        shift.startTime,
        shift.endTime,
        shift.breakMinutes || 0
      ),
      calculatedEarnings:
        calculateWorkingHours(
          shift.startTime,
          shift.endTime,
          shift.breakMinutes || 0
        ) * shift.hourlyRate,
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
        <Grid item xs={12} md={8}>
          <ShiftManager 
            showAddButton={false} 
            onShiftsChange={setShifts} 
            workplaces={workplaces}
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

      {/* アクション選択ダイアログ */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>追加方法を選択</DialogTitle>
        <DialogContent>
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleActionSelect('manual')}>
                <ListItemIcon>
                  <EventNote color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="シフト登録"
                  secondary="手動でシフトを入力"
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleActionSelect('ocr')}>
                <ListItemIcon>
                  <CameraAlt color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="シフト表提出"
                  secondary="写真からAIで読み取り"
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleActionSelect('workplace')}>
                <ListItemIcon>
                  <AccountBalance color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="バイト先管理"
                  secondary="職場の追加・編集・削除"
                />
              </ListItemButton>
            </ListItem>
          </List>
        </DialogContent>
      </Dialog>

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
          onShiftsSaved={newShifts => {
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

      {/* 手動シフト登録ダイアログ */}
      <ShiftFormDialog
        open={manualShiftDialogOpen}
        onClose={() => setManualShiftDialogOpen(false)}
        onSubmit={handleManualShiftSubmit}
        loading={loading}
        workplaces={workplaces}
      />

      {/* バイト先管理ダイアログ */}
      <Dialog
        open={workplaceManagerOpen}
        onClose={() => setWorkplaceManagerOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalance />
            バイト先管理
          </Box>
        </DialogTitle>
        <DialogContent>
          <WorkplaceManager 
            workplaces={workplaces}
            onWorkplacesChange={setWorkplaces}
          />
        </DialogContent>
      </Dialog>

      {/* フローティングボタン */}
      <Tooltip title="シフト追加" placement="left">
        <Fab
          color="primary"
          size="large"
          onClick={() => setActionDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <Add />
        </Fab>
      </Tooltip>
    </Box>
  );
};
