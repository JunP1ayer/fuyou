import React, { useState, useCallback } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Backdrop,
  CircularProgress,
  Fade,
  Slide,
} from '@mui/material';
import {
  CloudUpload,
  FindInPage,
  Edit,
  Save,
  CheckCircle,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { OCRUpload } from './OCRUpload';
import { OCRProcessor } from './OCRProcessor';
import { OCRResultEditor } from './OCRResultEditor';
import type {
  OCRResponse,
  OCRUsageStats,
  ExtractedShiftData,
} from '../types/ocr';
import type { CreateShiftData } from '../types/shift';

interface OCRShiftManagerProps {
  onShiftsSaved?: (shifts: CreateShiftData[]) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  compactMode?: boolean; // シフトボード型UI用のコンパクトモード
  autoNavigateToShifts?: boolean; // シフト保存後にシフトタブに移動
}

type OCRStep = 'upload' | 'processing' | 'editing' | 'complete';

interface OCRState {
  step: OCRStep;
  imageFile: File | null;
  imagePreview: string | null;
  ocrResult: OCRResponse | null;
  extractedShifts: ExtractedShiftData[];
  usage: OCRUsageStats | null;
  error: string | null;
  loading: boolean;
}

const steps = [
  {
    id: 'upload',
    label: '画像アップロード',
    description: 'シフト表の画像をアップロードまたは撮影',
    icon: CloudUpload,
  },
  {
    id: 'processing',
    label: 'OCR処理',
    description: 'Google Vision APIでテキストを抽出',
    icon: FindInPage,
  },
  {
    id: 'editing',
    label: '結果編集',
    description: '抽出されたシフト情報を確認・編集',
    icon: Edit,
  },
  {
    id: 'complete',
    label: '完了',
    description: 'シフト情報を保存',
    icon: Save,
  },
];

export const OCRShiftManager: React.FC<OCRShiftManagerProps> = ({
  onShiftsSaved,
  onError,
  onClose,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  compactMode = false,
  autoNavigateToShifts = false,
}) => {
  const { token } = useAuth();
  const [state, setState] = useState<OCRState>({
    step: 'upload',
    imageFile: null,
    imagePreview: null,
    ocrResult: null,
    extractedShifts: [],
    usage: null,
    error: null,
    loading: false,
  });
  const [notification, setNotification] = useState<{
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  const updateState = useCallback((updates: Partial<OCRState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const showNotification = useCallback(
    (
      message: string,
      severity: 'success' | 'error' | 'info' | 'warning' = 'info'
    ) => {
      setNotification({ message, severity });
    },
    []
  );

  const getCurrentStepIndex = (): number => {
    return steps.findIndex(step => step.id === state.step);
  };

  const canGoToNextStep = (): boolean => {
    switch (state.step) {
      case 'upload':
        return !!state.imageFile;
      case 'processing':
        return !!state.ocrResult && state.ocrResult.success;
      case 'editing':
        return state.extractedShifts.length > 0;
      case 'complete':
        return false;
      default:
        return false;
    }
  };

  const canGoToPrevStep = (): boolean => {
    return state.step !== 'upload' && !state.loading;
  };

  // 画像アップロード完了時 - 未使用のため削除
  // const handleImageSelected = useCallback(
  //   (file: File, preview: string) => {
  //     updateState({
  //       imageFile: file,
  //       imagePreview: preview,
  //       ocrResult: null,
  //       extractedShifts: [],
  //       error: null,
  //     });
  //     showNotification('画像が選択されました', 'success');
  //   },
  //   [updateState, showNotification]
  // );

  // OCR処理完了時
  const handleOCRComplete = useCallback(
    (result: OCRResponse) => {
      updateState({
        ocrResult: result,
        step: 'editing',
        loading: false,
      });

      if (result.success) {
        showNotification('OCR処理が完了しました', 'success');
      } else {
        showNotification('OCR処理でエラーが発生しました', 'error');
      }
    },
    [updateState, showNotification]
  );

  // 使用状況更新時
  const handleUsageUpdate = useCallback(
    (usage: OCRUsageStats) => {
      updateState({ usage });
    },
    [updateState]
  );

  // シフトデータ抽出完了時
  const handleShiftDataExtracted = useCallback(
    (shifts: ExtractedShiftData[]) => {
      updateState({ extractedShifts: shifts });
      showNotification(`${shifts.length}件のシフトが抽出されました`, 'info');
    },
    [updateState, showNotification]
  );

  // シフト編集完了時
  const handleEditComplete = useCallback(
    (editedShifts: ExtractedShiftData[]) => {
      updateState({ extractedShifts: editedShifts });
    },
    [updateState]
  );

  // シフト保存時
  const handleSaveShifts = useCallback(
    async (shifts: CreateShiftData[]) => {
      if (!token) {
        showNotification('認証が必要です', 'error');
        return;
      }

      updateState({ loading: true });

      try {
        // バルクシフト登録
        const response = await apiService.createBulkShifts(token, shifts);

        if (response.success) {
          updateState({
            step: 'complete',
            loading: false,
          });
          showNotification(
            `${shifts.length}件のシフトが登録されました`,
            'success'
          );
          onShiftsSaved?.(shifts);

          // シフトボード型UIでは自動的にシフトタブに移動
          if (autoNavigateToShifts) {
            setTimeout(() => {
              updateState({ step: 'upload' }); // ステップをリセット
            }, 2000); // 2秒後にリセット
          }
        } else {
          throw new Error('シフト登録に失敗しました');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'シフト登録でエラーが発生しました';
        updateState({
          error: errorMessage,
          loading: false,
        });
        showNotification(errorMessage, 'error');
        onError?.(errorMessage);
      }
    },
    [token, updateState, showNotification, onShiftsSaved, onError, autoNavigateToShifts]
  );

  // エラーハンドリング
  const handleError = useCallback(
    (error: string) => {
      updateState({ error });
      showNotification(error, 'error');
      onError?.(error);
    },
    [updateState, showNotification, onError]
  );

  // ステップナビゲーション
  const goToNextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1].id as OCRStep;
      updateState({ step: nextStep });

      // 処理ステップの場合は自動的に処理を開始
      if (nextStep === 'processing') {
        updateState({ loading: true });
      }
    }
  };

  const goToPrevStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1].id as OCRStep;
      updateState({ step: prevStep, loading: false });
    }
  };

  const resetToStart = () => {
    setState({
      step: 'upload',
      imageFile: null,
      imagePreview: null,
      ocrResult: null,
      extractedShifts: [],
      usage: null,
      error: null,
      loading: false,
    });
  };

  const renderStepContent = () => {
    switch (state.step) {
      case 'upload':
        return (
          <Fade in>
            <Box>
              <OCRUpload
                onOCRComplete={handleOCRComplete}
                onError={handleError}
                onShiftDataExtracted={handleShiftDataExtracted}
              />
            </Box>
          </Fade>
        );

      case 'processing':
        return (
          <Fade in>
            <Box>
              <OCRProcessor
                imageFile={state.imageFile}
                onProcessingComplete={handleOCRComplete}
                onError={handleError}
                onUsageUpdate={handleUsageUpdate}
              />
            </Box>
          </Fade>
        );

      case 'editing':
        return (
          <Slide direction="left" in>
            <Box>
              {state.ocrResult && state.imagePreview && (
                <OCRResultEditor
                  ocrResult={state.ocrResult}
                  originalImage={state.imagePreview}
                  onSave={handleSaveShifts}
                  onCancel={goToPrevStep}
                  onEditComplete={handleEditComplete}
                />
              )}
            </Box>
          </Slide>
        );

      case 'complete':
        return (
          <Fade in>
            <Box textAlign="center" py={4}>
              <CheckCircle
                sx={{ fontSize: 64, color: 'success.main', mb: 2 }}
              />
              <Typography variant="h5" gutterBottom>
                OCR処理が完了しました
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {state.extractedShifts.length}件のシフトが正常に登録されました
              </Typography>
              <Box display="flex" justifyContent="center" gap={2} mt={3}>
                <Button
                  variant="outlined"
                  onClick={resetToStart}
                  startIcon={<ArrowBack />}
                >
                  新しい画像を処理
                </Button>
                <Button
                  variant="contained"
                  onClick={onClose}
                  startIcon={<CheckCircle />}
                >
                  完了
                </Button>
              </Box>
            </Box>
          </Fade>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* プログレスステッパー */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={getCurrentStepIndex()}>
            {steps.map(step => (
              <Step key={step.id}>
                <StepLabel
                  icon={<step.icon />}
                  error={state.error && state.step === step.id}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {state.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {state.error}
        </Alert>
      )}

      {/* メインコンテンツ */}
      <Box sx={{ minHeight: '400px' }}>{renderStepContent()}</Box>

      {/* ナビゲーションボタン */}
      {state.step !== 'complete' && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={goToPrevStep}
            disabled={!canGoToPrevStep()}
            startIcon={<ArrowBack />}
          >
            戻る
          </Button>

          <Box>
            {state.step === 'upload' && (
              <Button
                onClick={goToNextStep}
                disabled={!canGoToNextStep()}
                variant="contained"
                endIcon={<ArrowForward />}
              >
                OCR処理開始
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* ローディングオーバーレイ */}
      <Backdrop
        open={state.loading}
        sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}
      >
        <Box textAlign="center">
          <CircularProgress color="inherit" />
          <Typography variant="h6" sx={{ mt: 2 }}>
            処理中...
          </Typography>
        </Box>
      </Backdrop>

      {/* 通知スナックバー */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
      >
        <Alert
          onClose={() => setNotification(null)}
          severity={notification?.severity}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
