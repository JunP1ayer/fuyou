// 🤖 GPTシフト解析・提出コンポーネント

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  LinearProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Upload, Psychology, Business, AddCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { GPTShiftReviewer } from './GPTShiftReviewer';
import {
  analyzeShiftText,
  type WorkplaceOption,
  type ShiftAnalysisResult,
} from '../services/gptShiftService';
import { useSimpleShiftStore } from '../store/simpleShiftStore';
import useI18nStore from '../store/i18nStore';
import { formatCurrency } from '../utils/calculations';
import { apiService } from '../services/apiService';

interface GPTShiftSubmitterProps {
  onNavigateToWorkplaces?: () => void;
}

export const GPTShiftSubmitter: React.FC<GPTShiftSubmitterProps> = ({
  onNavigateToWorkplaces,
}) => {
  const { workplaces } = useSimpleShiftStore();
  const { language, country } = useI18nStore();
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string>('');
  const [selectedWorkplace, setSelectedWorkplace] =
    useState<WorkplaceOption | null>(null);
  const [workerName, setWorkerName] = useState('');
  const [shiftText, setShiftText] = useState('');
  const [analysisResult, setAnalysisResult] =
    useState<ShiftAnalysisResult | null>(null);
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review' | 'input' | 'select'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showWorkplaceWarning, setShowWorkplaceWarning] = useState(false);

  const handleWorkplaceChange = (workplaceId: string) => {
    setSelectedWorkplaceId(workplaceId);
    const workplace = workplaces.find(w => w.id === workplaceId);
    if (workplace) {
      setSelectedWorkplace({
        id: workplace.id,
        name: workplace.name,
        defaultHourlyRate: workplace.defaultHourlyRate,
        color: workplace.color,
      });
    }
  };

  const handleSubmitShift = async () => {
    if (!workerName.trim()) return;

    // バイト先が選択されていない場合は警告表示
    if (!selectedWorkplaceId) {
      setShowWorkplaceWarning(true);
      return;
    }

    setStep('analyzing');

    try {
      let result: ShiftAnalysisResult | null = null;

      // トークン確保（無ければデモログイン）
      let token: string | undefined;
      try {
        const raw = localStorage.getItem('auth');
        if (raw) token = JSON.parse(raw)?.token;
      } catch {}
      if (!token) {
        const login = await apiService.loginDemo();
        if (login.success && login.data) {
          token = login.data.token;
          localStorage.setItem('auth', JSON.stringify({ user: login.data.user, token }));
        }
      }

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('userName', workerName.trim());
        formData.append('workplaceName', selectedWorkplace?.name || '');
        formData.append('autoSave', 'false');

        const resp = await apiService.processOCR(formData);
        if (!resp.success) {
          throw new Error(`OCR連携に失敗しました: ${resp.error?.message || 'Unknown error'}`);
        }

        const rec = resp.data?.consolidatedResult?.recommendedShifts || [];
        result = {
          success: true,
          shifts: rec.map((s: any) => ({
            id: s.id || `ocr-${crypto.randomUUID?.() || Date.now()}`,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            workplaceName: s.jobSourceName || s.workplaceName || '未設定',
            hourlyRate: s.hourlyRate || 1000,
            totalEarnings: s.calculatedEarnings || 0,
            status: s.isConfirmed ? 'confirmed' : 'tentative',
            confidence: s.confidence ?? 0.9,
            workerName: workerName.trim(),
          })),
          warnings: resp.data?.warnings || [],
          totalShifts: rec.length,
          estimatedEarnings: rec.reduce(
            (sum: number, s: any) => sum + (s.calculatedEarnings || 0),
            0
          ),
        };
      } else {
        // フォールバック: テキスト解析
        result = await analyzeShiftText(
          shiftText,
          selectedWorkplace || undefined,
          workerName.trim()
        );
      }

      setAnalysisResult(result);
      setStep('review');
    } catch (error) {
      console.error('GPT解析エラー:', error);
      // エラーハンドリング
    } finally {
    }
  };

  const handleBackToInput = () => {
    setStep('input');
    setAnalysisResult(null);
  };

  // const handleBackToSelect = () => {
  //   setStep('select');
  //   setSelectedWorkplace(null);
  //   setShiftText('');
  //   setAnalysisResult(null);
  // };

  const handleConfirmShifts = (confirmedShifts: any[]) => {
    console.log('確定されたシフト:', confirmedShifts);
    // カレンダーに反映する処理
    setStep('select'); // 完了後は最初に戻る
    setSelectedWorkplace(null);
    setShiftText('');
    setAnalysisResult(null);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 1.5, sm: 2 } }}>
      {/* 上の説明カードは不要のため削除 */}

      {/* Step 1: バイト先選択 */}
      {step === 'upload' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 1,
              }}
            >
              <Upload sx={{ color: 'primary.main', fontSize: 40, mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, fontSize: { xs: 18, sm: 20 } }}>
                シフト表を提出
              </Typography>
            </Box>

            {/* バイト先選択 */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                maxWidth: 500,
                mx: 'auto',
              }}
            >
              {workplaces.length === 0 ? (
                <Alert
                  severity="warning"
                  sx={{ mb: 3, width: '100%' }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      startIcon={<AddCircle />}
                      onClick={onNavigateToWorkplaces}
                    >
                      バイト先を登録
                    </Button>
                  }
                >
                  バイト先が登録されていません。先にバイト先を登録してください。
                </Alert>
              ) : (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>どのバイト先のシフト表ですか？</InputLabel>
                  <Select
                    value={selectedWorkplaceId}
                    label="どのバイト先のシフト表ですか？"
                    onChange={e => {
                      handleWorkplaceChange(e.target.value);
                      setShowWorkplaceWarning(false);
                    }}
                    startAdornment={
                      <Business sx={{ mr: 1, color: 'action.active' }} />
                    }
                  >
                    {workplaces.map(workplace => (
                      <MenuItem key={workplace.id} value={workplace.id}>
                        {workplace.name} (時給: {formatCurrency(workplace.defaultHourlyRate, { language, currency: country === 'UK' ? 'GBP' : country === 'DE' ? 'EUR' : 'JPY' })})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {showWorkplaceWarning && (
                <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
                  バイト先を選択してください
                </Alert>
              )}

              <TextField
                fullWidth
                label="解析する人の名前"
                placeholder="例: 田中 太郎"
                value={workerName}
                onChange={e => setWorkerName(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  mb: 3,
                  width: '100%',
                }}
              >
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<Upload />}
                  disabled={workplaces.length === 0}
                  sx={{ px: { xs: 2.5, sm: 4 }, py: 1.25 }}
                >
                  画像/ファイルを選択
                  <input
                    type="file"
                    hidden
                    accept="image/*,.png,.jpg,.jpeg,.webp,.pdf"
                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                  />
                </Button>
                <Typography variant="body2" color="text.secondary">
                  PNG/JPG/webp/PDF をサポート
                </Typography>
              </Box>

              <Button
                variant="contained"
                onClick={handleSubmitShift}
                disabled={
                  !workerName.trim() ||
                  (!imageFile && !shiftText.trim()) ||
                  workplaces.length === 0 ||
                  !selectedWorkplaceId
                }
                sx={{
                  px: { xs: 2.5, sm: 4 },
                  py: 1.25,
                  background:
                    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)',
                  },
                  '&:disabled': {
                    background: 'rgba(0, 0, 0, 0.12)',
                  },
                  fontWeight: 600,
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                }}
              >
                解析を開始
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 2: 旧テキスト入力UIは削除済み */}

      {/* Step 3: GPT解析中 */}
      {step === 'analyzing' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Psychology sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                AIで解析中...
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                シフト情報を解析しています。しばらくお待ちください。
              </Typography>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="caption" color="text.secondary">
                通常10〜15秒程度で完了します
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 4: 確認・修正 */}
      {step === 'review' && analysisResult && (
        <GPTShiftReviewer
          analysisResult={analysisResult}
          workplace={selectedWorkplace!}
          originalText={shiftText}
          onConfirm={handleConfirmShifts}
          onBack={handleBackToInput}
        />
      )}
    </Box>
  );
};
