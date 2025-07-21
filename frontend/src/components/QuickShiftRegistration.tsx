import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
} from '@mui/material';
import {
  AccessTime,
  AttachMoney,
  DirectionsBus,
  Close,
  Schedule,
  Check,
} from '@mui/icons-material';
import { format } from '../utils/dateUtils';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { JobTemplate, JobManagement } from './JobManagement';
import { calculateShiftEarnings } from '../utils/shiftCalculation';
import type { CreateShiftData } from '../types/shift';

interface QuickShiftRegistrationProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate: string | null;
}

export const QuickShiftRegistration: React.FC<QuickShiftRegistrationProps> = ({
  open,
  onClose,
  onSuccess,
  selectedDate,
}) => {
  const { token } = useAuth();
  const [step, setStep] = useState<'selectJob' | 'setTime' | 'confirm'>(
    'selectJob'
  );
  const [selectedJob, setSelectedJob] = useState<JobTemplate | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ダイアログが開かれたときの初期化
  useEffect(() => {
    if (open) {
      setStep('selectJob');
      setSelectedJob(null);
      setStartTime('09:00');
      setEndTime('17:00');
      setError(null);
    }
  }, [open]);

  // バイト先を選択したときに開始・終了時間を設定
  useEffect(() => {
    if (selectedJob) {
      setStartTime(selectedJob.defaultStartTime);
      setEndTime(selectedJob.defaultEndTime);
      setStep('setTime');
    }
  }, [selectedJob]);

  // 労働時間と収入の計算（深夜時給対応）
  const calculateShiftDetails = () => {
    if (!selectedJob || !selectedDate) {
      return {
        workingHours: 0,
        totalEarnings: 0,
        earnings: 0,
        breakdown: [],
        regularHours: 0,
        nightHours: 0,
        weekendHours: 0,
        transportationCost: 0,
        regularEarnings: 0,
        nightEarnings: 0,
        weekendEarnings: 0,
      } as ShiftCalculationResult;
    }

    return calculateShiftEarnings(
      selectedJob,
      selectedDate,
      startTime,
      endTime,
      selectedJob.defaultBreakMinutes || 0
    );
  };

  // シフト登録
  const handleCreateShift = async () => {
    if (!token || !selectedJob || !selectedDate) {
      setError('必要な情報が不足しています');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const shiftData: CreateShiftData = {
        jobSourceName: selectedJob.name,
        date: selectedDate,
        startTime,
        endTime,
        hourlyRate: selectedJob.hourlyRate,
        breakMinutes: selectedJob.defaultBreakMinutes || 0,
        isConfirmed: false, // クイック登録は未確定として登録
      };

      const response = (await apiService.createShift(token, shiftData)) as {
        success: boolean;
        data?: unknown;
        error?: unknown;
      };

      if ('success' in response && response.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error('シフトの登録に失敗しました');
      }
    } catch (err) {
      console.error('Failed to create shift:', err);
      setError(
        err instanceof Error ? err.message : 'シフトの登録に失敗しました'
      );
    } finally {
      setLoading(false);
    }
  };

  // バイト先選択ハンドラー
  const handleJobSelect = (job: JobTemplate) => {
    setSelectedJob(job);
  };

  // 戻るボタン
  const handleBack = () => {
    if (step === 'setTime') {
      setStep('selectJob');
      setSelectedJob(null);
    } else if (step === 'confirm') {
      setStep('setTime');
    }
  };

  // 次へボタン
  const handleNext = () => {
    if (step === 'setTime') {
      setStep('confirm');
    }
  };

  const shiftDetails = calculateShiftDetails();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: { xs: '95vh', sm: '85vh' },
          m: { xs: 1, sm: 2 },
          width: { xs: 'calc(100% - 16px)', sm: 'auto' },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* ヘッダー */}
        <Box
          sx={{
            p: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="h6">クイックシフト登録</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {selectedDate && format(new Date(selectedDate), 'M月d日 (E)')}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>

        {/* エラー表示 */}
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {/* ステップインジケーター */}
        <Box sx={{ p: 2, pb: 0 }}>
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{
              overflowX: 'auto',
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            <Chip
              label="1. バイト先"
              color={step === 'selectJob' ? 'primary' : 'default'}
              variant={['selectJob'].includes(step) ? 'filled' : 'outlined'}
              size="small"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
            />
            <Chip
              label="2. 時間設定"
              color={step === 'setTime' ? 'primary' : 'default'}
              variant={
                ['setTime', 'confirm'].includes(step) ? 'filled' : 'outlined'
              }
              size="small"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
            />
            <Chip
              label="3. 確認"
              color={step === 'confirm' ? 'primary' : 'default'}
              variant={step === 'confirm' ? 'filled' : 'outlined'}
              size="small"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
            />
          </Box>
        </Box>

        {/* コンテンツ */}
        <Box sx={{ p: 2 }}>
          {/* ステップ1: バイト先選択 */}
          {step === 'selectJob' && (
            <JobManagement compactMode onJobSelect={handleJobSelect} />
          )}

          {/* ステップ2: 時間設定 */}
          {step === 'setTime' && selectedJob && (
            <Box>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    backgroundColor: selectedJob.color,
                    borderRadius: '50%',
                  }}
                />
                <Typography variant="h6">{selectedJob.name}</Typography>
                <Chip label={`¥${selectedJob.hourlyRate}/h`} size="small" />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="開始時間"
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="終了時間"
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <Box
                sx={{
                  mt: 3,
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                >
                  収入詳細
                </Typography>

                {/* 時間内訳 */}
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    総労働時間:
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    {shiftDetails.workingHours.toFixed(1)}時間
                  </Typography>
                </Box>

                {/* 詳細内訳 */}
                {shiftDetails.breakdown.map((item, index) => (
                  <Box
                    key={index}
                    display="flex"
                    justifyContent="space-between"
                    mb={0.5}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
                    >
                      {item.label}: {item.hours.toFixed(1)}h × ¥
                      {item.rate.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
                    >
                      ¥{Math.round(item.earnings).toLocaleString()}
                    </Typography>
                  </Box>
                ))}

                {/* 交通費 */}
                {shiftDetails.transportationCost > 0 && (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                      交通費:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                      ¥{shiftDetails.transportationCost.toLocaleString()}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography
                    variant="body2"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    合計収入:
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{
                      color: '#4CAF50',
                      fontSize: { xs: '0.9rem', sm: '1.1rem' },
                    }}
                  >
                    ¥{Math.round(shiftDetails.totalEarnings).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* ステップ3: 確認 */}
          {step === 'confirm' && selectedJob && (
            <Box>
              <Typography variant="h6" gutterBottom>
                シフト内容を確認
              </Typography>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: selectedJob.color,
                        borderRadius: '50%',
                      }}
                    />
                    <Typography variant="h6">{selectedJob.name}</Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Schedule fontSize="small" />
                    <Typography variant="body2">
                      {selectedDate &&
                        format(new Date(selectedDate), 'M月d日 (E)')}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <AccessTime fontSize="small" />
                    <Typography variant="body2">
                      {startTime} - {endTime} (
                      {shiftDetails.workingHours.toFixed(1)}時間)
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <AttachMoney fontSize="small" />
                    <Typography variant="body2">
                      時給 ¥{selectedJob.hourlyRate.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <DirectionsBus fontSize="small" />
                    <Typography variant="body2">
                      交通費 ¥
                      {selectedJob.transportationCost?.toLocaleString() || 0}
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Box textAlign="center">
                    <Typography variant="h5" color="primary">
                      合計収入: ¥
                      {Math.round(shiftDetails.totalEarnings).toLocaleString()}
                    </Typography>
                    {shiftDetails.breakdown.length > 1 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {shiftDetails.breakdown
                          .map(
                            item => `${item.label}: ${item.hours.toFixed(1)}h`
                          )
                          .join(' / ')}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>

              <Alert severity="info" sx={{ mb: 2 }}>
                シフトは「未確定」として登録されます。後で確定に変更できます。
              </Alert>
            </Box>
          )}
        </Box>

        {/* フッター */}
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: { xs: 1, sm: 2 },
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <Button
            onClick={step === 'selectJob' ? onClose : handleBack}
            disabled={loading}
            sx={{
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              minWidth: { xs: '80px', sm: 'auto' },
            }}
          >
            {step === 'selectJob' ? 'キャンセル' : '戻る'}
          </Button>

          <Box display="flex" gap={1}>
            {step === 'setTime' && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!selectedJob}
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  minWidth: { xs: '80px', sm: 'auto' },
                }}
              >
                確認へ
              </Button>
            )}

            {step === 'confirm' && (
              <Button
                variant="contained"
                onClick={handleCreateShift}
                disabled={loading || !selectedJob}
                startIcon={loading ? <CircularProgress size={20} /> : <Check />}
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  minWidth: { xs: '90px', sm: 'auto' },
                }}
              >
                {loading ? '登録中...' : '登録完了'}
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
