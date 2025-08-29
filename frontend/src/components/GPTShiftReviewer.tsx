// 📋 GPT解析結果の確認・修正コンポーネント

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Edit,
  Delete,
  Add,
  Warning,
  Schedule,
  AttachMoney,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type {
  ShiftAnalysisResult,
  WorkplaceOption,
  AnalyzedShift,
} from '../services/gptShiftService';
import { useSimpleShiftStore } from '../store/simpleShiftStore';
import useI18nStore from '../store/i18nStore';
import { formatCurrency } from '../utils/calculations';
import { useCalendarStore } from '../store/calendarStore';

interface GPTShiftReviewerProps {
  analysisResult: ShiftAnalysisResult;
  workplace: WorkplaceOption;
  originalText: string;
  onConfirm: (shifts: AnalyzedShift[]) => void;
  onBack: () => void;
}

export const GPTShiftReviewer: React.FC<GPTShiftReviewerProps> = ({
  analysisResult,
  workplace,
  originalText,
  onConfirm,
  onBack,
}) => {
  const { addShift } = useSimpleShiftStore();
  const { importFromShifts } = useCalendarStore();
  const { language, country } = useI18nStore();
  const [shifts, setShifts] = useState<AnalyzedShift[]>(analysisResult.shifts);
  const [editingShift, setEditingShift] = useState<AnalyzedShift | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // シフト編集
  const handleEditShift = (shift: AnalyzedShift) => {
    setEditingShift({ ...shift });
    setEditDialogOpen(true);
  };

  // シフト削除
  const handleDeleteShift = (shiftId: string) => {
    setShifts(prev => prev.filter(shift => shift.id !== shiftId));
  };

  // シフト保存
  const handleSaveEdit = () => {
    if (!editingShift) return;

    // 労働時間再計算
    const start = new Date(`2024-01-01T${editingShift.startTime}`);
    const end = new Date(`2024-01-01T${editingShift.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalEarnings = Math.floor(hours * editingShift.hourlyRate);

    const updatedShift = {
      ...editingShift,
      totalEarnings,
    };

    setShifts(prev =>
      prev.map(shift => (shift.id === updatedShift.id ? updatedShift : shift))
    );

    setEditDialogOpen(false);
    setEditingShift(null);
  };

  // 確定処理
  const handleConfirmAllShifts = () => {
    // ストアにシフトを追加
    shifts.forEach(shift => {
      addShift({
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        workplaceName: shift.workplaceName,
        hourlyRate: shift.hourlyRate,
        totalEarnings: shift.totalEarnings,
        status: 'confirmed', // 確定後は confirmed に変更
      });
    });

    // カレンダーにも即時反映（重複インポートを避けるため、今回確定した分のみ）
    importFromShifts(
      shifts.map(s => ({
        id: s.id,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        workplaceName: s.workplaceName,
        hourlyRate: s.hourlyRate,
        totalEarnings: s.totalEarnings,
      }))
    );
    // 初回自動インポートとの二重反映を防止
    localStorage.setItem('calendar-shifts-imported', 'true');

    onConfirm(shifts);
  };

  const totalEarnings = shifts.reduce(
    (sum, shift) => sum + shift.totalEarnings,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 解析結果サマリー */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              GPT-5 解析完了
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  backgroundColor: 'info.light',
                }}
              >
                <Schedule sx={{ color: 'info.contrastText', mb: 1 }} />
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: 'info.contrastText' }}
                >
                  {shifts.length}
                </Typography>
                <Typography variant="body2" sx={{ color: 'info.contrastText' }}>
                  解析されたシフト
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  backgroundColor: 'success.light',
                }}
              >
                <AttachMoney sx={{ color: 'success.contrastText', mb: 1 }} />
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: 'success.contrastText' }}
                >
                  {formatCurrency(totalEarnings, { language, currency: country === 'UK' ? 'GBP' : country === 'DE' ? 'EUR' : 'JPY' })}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'success.contrastText' }}
                >
                  予想収入
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  backgroundColor:
                    analysisResult.warnings.length > 0
                      ? 'warning.light'
                      : 'success.light',
                }}
              >
                <Warning
                  sx={{
                    color:
                      analysisResult.warnings.length > 0
                        ? 'warning.contrastText'
                        : 'success.contrastText',
                    mb: 1,
                  }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color:
                      analysisResult.warnings.length > 0
                        ? 'warning.contrastText'
                        : 'success.contrastText',
                  }}
                >
                  {analysisResult.warnings.length}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color:
                      analysisResult.warnings.length > 0
                        ? 'warning.contrastText'
                        : 'success.contrastText',
                  }}
                >
                  警告・エラー
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* 警告があれば表示 */}
          {analysisResult.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                解析できなかった項目:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {analysisResult.warnings.map((warning, index) => (
                  <li key={index}>
                    <Typography variant="body2">{warning}</Typography>
                  </li>
                ))}
              </Box>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 解析されたシフト一覧 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            📅 解析結果を確認・修正
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>日付</TableCell>
                  <TableCell>時間</TableCell>
                  <TableCell align="right">時給</TableCell>
                  <TableCell align="right">収入</TableCell>
                  <TableCell>信頼度</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.map(shift => (
                  <TableRow key={shift.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {new Date(shift.date).toLocaleDateString(language, {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {shift.date}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {shift.startTime} - {shift.endTime}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(
                          (new Date(`2024-01-01T${shift.endTime}`).getTime() -
                            new Date(
                              `2024-01-01T${shift.startTime}`
                            ).getTime()) /
                          (1000 * 60 * 60)
                        ).toFixed(1)}
                        h
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(shift.hourlyRate, { language, currency: country === 'UK' ? 'GBP' : country === 'DE' ? 'EUR' : 'JPY' })}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: 'success.main' }}
                      >
                        {formatCurrency(shift.totalEarnings, { language, currency: country === 'UK' ? 'GBP' : country === 'DE' ? 'EUR' : 'JPY' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${Math.round(shift.confidence * 100)}%`}
                        size="small"
                        color={
                          shift.confidence > 0.8
                            ? 'success'
                            : shift.confidence > 0.6
                              ? 'warning'
                              : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleEditShift(shift)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteShift(shift.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={onBack}>
          入力に戻る
        </Button>

        <Button
          variant="contained"
          size="large"
          onClick={handleConfirmAllShifts}
          disabled={shifts.length === 0}
          sx={{
            background: 'linear-gradient(135deg, #5ac8fa 0%, #0fb5f0 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #6fd0fb 0%, #1cc0f2 100%)',
            },
            px: 4,
          }}
        >
          {shifts.length}件のシフトを確定
        </Button>
      </Box>

      {/* 編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>シフト編集</DialogTitle>
        <DialogContent>
          {editingShift && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="日付"
                type="date"
                value={editingShift.date}
                onChange={e =>
                  setEditingShift(prev =>
                    prev ? { ...prev, date: e.target.value } : null
                  )
                }
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="開始時間"
                    type="time"
                    value={editingShift.startTime}
                    onChange={e =>
                      setEditingShift(prev =>
                        prev ? { ...prev, startTime: e.target.value } : null
                      )
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="終了時間"
                    type="time"
                    value={editingShift.endTime}
                    onChange={e =>
                      setEditingShift(prev =>
                        prev ? { ...prev, endTime: e.target.value } : null
                      )
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="時給"
                type="number"
                value={editingShift.hourlyRate}
                onChange={e =>
                  setEditingShift(prev =>
                    prev
                      ? { ...prev, hourlyRate: parseInt(e.target.value) || 0 }
                      : null
                  )
                }
                InputProps={{
                  startAdornment: (
                    <span style={{ marginRight: 8 }}>
                      {(() => {
                        const cur = country === 'UK' ? '£' : country === 'DE' || country === 'FI' || country === 'AT' ? '€' : country === 'DK' || country === 'NO' ? 'kr' : country === 'PL' ? 'zł' : country === 'HU' ? 'Ft' : '¥';
                        return cur;
                      })()}
                    </span>
                  ),
                }}
              />

              {editingShift.rawText && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1,
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    元のテキスト: {editingShift.rawText}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};
