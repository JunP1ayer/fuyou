import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Chip,
  Alert,
  LinearProgress,
  Fab,
  Dialog,
  DialogContent,
  DialogTitle,
  Badge,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  CameraAlt,
  TrendingUp,
  AccountBalance,
  Add,
  PhotoCamera,
  Upload,
  School,
  Psychology,
} from '@mui/icons-material';
import { ShiftCalendar } from './shifts/ShiftCalendar';
import { OCRShiftManager } from './OCRShiftManager';
import { ProfessionalFuyouStatusCard } from './ProfessionalFuyouStatusCard';
import type { Shift, CreateShiftData } from '../types/shift';

// 扶養状況の型定義
interface FuyouStatus {
  currentEarnings: number;
  limit: number;
  remaining: number;
  riskLevel: 'safe' | 'warning' | 'danger';
  projection: {
    yearEnd: number;
    overageRisk: boolean;
  };
}

export const ShiftBoardFuyouApp: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [fuyouStatus, setFuyouStatus] = useState<FuyouStatus>({
    currentEarnings: 650000,
    limit: 1030000,
    remaining: 380000,
    riskLevel: 'safe',
    projection: {
      yearEnd: 980000,
      overageRisk: false,
    },
  });
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);

  // 新機能: 学生モードと新UI切替
  const [isStudentMode, setIsStudentMode] = useState(true);
  const [useNewUI, setUseNewUI] = useState(true);

  // 学生プロファイル（デモ用）
  const studentProfile = {
    isStudent: isStudentMode,
    age: 20,
    university: '○○大学',
    graduationYear: 2026,
    preferredTaxStrategy: 'optimal' as const,
  };

  // 扶養ステータスの色を取得
  const getFuyouStatusColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      default:
        return 'primary';
    }
  };

  // 扶養ステータスメッセージ
  const getFuyouStatusMessage = (status: FuyouStatus) => {
    if (status.riskLevel === 'safe') {
      return `扶養内です！あと${status.remaining.toLocaleString()}円まで安全`;
    } else if (status.riskLevel === 'warning') {
      return '注意: 扶養限度額に近づいています';
    } else {
      return '危険: 扶養限度額を超過する可能性があります';
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

    // 扶養状況を再計算
    const totalEarnings = [...shifts, ...shiftsToAdd].reduce(
      (sum, shift) => sum + shift.calculatedEarnings,
      0
    );

    setFuyouStatus(prev => ({
      ...prev,
      currentEarnings: totalEarnings,
      remaining: Math.max(0, prev.limit - totalEarnings),
      riskLevel: totalEarnings > prev.limit * 0.9 ? 'warning' : 'safe',
    }));
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
            扶養管理 - シフトボード
          </Typography>

          {/* デモ用コントロール */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isStudentMode}
                  onChange={e => setIsStudentMode(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School fontSize="small" />
                  学生モード
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={useNewUI}
                  onChange={e => setUseNewUI(e.target.checked)}
                  color="secondary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology fontSize="small" />
                  新UI
                </Box>
              }
            />
          </Box>
        </Box>

        <Typography variant="subtitle1" color="text.secondary">
          学生アルバイター向け扶養控除自動管理システム
          {isStudentMode && (
            <Chip
              icon={<School />}
              label="2025年新制度：学生なら150万円まで安全"
              color="primary"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
      </Box>

      {/* 扶養ステータス */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          {useNewUI ? (
            // 新しいプロフェッショナルUI
            <ProfessionalFuyouStatusCard
              userProfile={studentProfile}
              compact={false}
            />
          ) : (
            // 従来のシンプルUI
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <TrendingUp />
                  扶養ステータス（従来版）
                </Typography>

                <Alert
                  severity={
                    getFuyouStatusColor(fuyouStatus.riskLevel) as
                      | 'error'
                      | 'warning'
                      | 'info'
                      | 'success'
                  }
                  sx={{ mb: 2 }}
                >
                  {getFuyouStatusMessage(fuyouStatus)}
                </Alert>

                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">
                      今年の収入: {fuyouStatus.currentEarnings.toLocaleString()}
                      円
                    </Typography>
                    <Typography variant="body2">
                      限度額:{' '}
                      {(isStudentMode
                        ? 1500000
                        : fuyouStatus.limit
                      ).toLocaleString()}
                      円
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={
                      (fuyouStatus.currentEarnings /
                        (isStudentMode ? 1500000 : fuyouStatus.limit)) *
                      100
                    }
                    color={
                      getFuyouStatusColor(fuyouStatus.riskLevel) as
                        | 'primary'
                        | 'secondary'
                        | 'error'
                        | 'info'
                        | 'success'
                        | 'warning'
                    }
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {Math.round(
                          (fuyouStatus.currentEarnings /
                            (isStudentMode ? 1500000 : fuyouStatus.limit)) *
                            100
                        )}
                        %
                      </Typography>
                      <Typography variant="caption">達成率</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color="success.main">
                        {(
                          (isStudentMode ? 1500000 : fuyouStatus.limit) -
                          fuyouStatus.currentEarnings
                        ).toLocaleString()}
                        円
                      </Typography>
                      <Typography variant="caption">残り余裕</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography
                        variant="h6"
                        color={
                          fuyouStatus.projection.overageRisk
                            ? 'error.main'
                            : 'info.main'
                        }
                      >
                        {fuyouStatus.projection.yearEnd.toLocaleString()}円
                      </Typography>
                      <Typography variant="caption">年末予測</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {isStudentMode && (
                  <Alert severity="info" sx={{ mt: 2 }} icon={<School />}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      学生制度適用中
                    </Typography>
                    <Typography variant="body2">
                      2025年新制度により年収150万円まで扶養控除が適用されます。
                      ただし社会保険は130万円から発生するのでご注意を。
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
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
