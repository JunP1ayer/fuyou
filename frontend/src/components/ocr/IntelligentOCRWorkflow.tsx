import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Fade,
  Backdrop,
  CircularProgress,
  Alert,
  Chip,
  Container,
  FormControlLabel,
  Switch,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Save,
  ArrowBack,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';

import { SmartUploadZone } from './SmartUploadZone';
import { AIProcessingView } from './AIProcessingView';
import { IntelligentResultsEditor } from './IntelligentResultsEditor';
import { ProcessingSummary } from './ProcessingSummary';

import type {
  ProcessingSession,
  ProcessingStage,
  OCRProcessingResponse,
  EditableShift,
  UserProfile,
  UploadState,
} from '../../types/intelligentOCR';
import type { CreateShiftData } from '../../types/shift';

interface IntelligentOCRWorkflowProps {
  onShiftsSaved: (shifts: CreateShiftData[]) => void;
  onClose?: () => void;
  userProfile?: UserProfile;
}

const PROCESSING_STAGES: ProcessingStage[] = [
  {
    stage: 'upload',
    title: 'シフト表アップロード',
    description: '画像を選択またはドラッグ&ドロップ',
    progress: 0,
    canGoBack: false,
    canSkip: false,
  },
  {
    stage: 'processing',
    title: 'AI解析処理',
    description: '複数のAIでシフト情報を抽出中',
    progress: 25,
    canGoBack: true,
    canSkip: false,
  },
  {
    stage: 'results',
    title: '結果確認',
    description: 'AI解析結果の比較と選択',
    progress: 50,
    canGoBack: true,
    canSkip: false,
  },
  {
    stage: 'editing',
    title: '詳細編集',
    description: 'シフト情報の確認と修正',
    progress: 60,
    canGoBack: true,
    canSkip: true,
  },
  {
    stage: 'confirmation',
    title: '保存確認',
    description: 'カレンダー保存前の最終確認',
    progress: 80,
    canGoBack: true,
    canSkip: false,
  },
  {
    stage: 'saving',
    title: 'カレンダー保存',
    description: 'シフトをカレンダーに反映',
    progress: 100,
    canGoBack: false,
    canSkip: false,
  },
];

export const IntelligentOCRWorkflow: React.FC<IntelligentOCRWorkflowProps> = ({
  onShiftsSaved,
  onClose,
  userProfile,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ワークフロー状態
  const [currentStage, setCurrentStage] =
    useState<ProcessingStage['stage']>('upload');
  const [session, _setSession] = useState<ProcessingSession | null>(null);
  const [ocrResults, setOcrResults] = useState<OCRProcessingResponse | null>(
    null
  );
  const [editableShifts, setEditableShifts] = useState<EditableShift[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>({
    isDragging: false,
    isProcessing: false,
    selectedImage: null,
    imagePreview: null,
    uploadMethod: null,
    progress: 0,
  });

  // エラー状態
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 自動保存設定
  const [autoSave, setAutoSave] = useState<boolean>(true);

  const currentStageConfig = PROCESSING_STAGES.find(
    s => s.stage === currentStage
  )!;
  const currentStageIndex = PROCESSING_STAGES.findIndex(
    s => s.stage === currentStage
  );

  /**
   * ファイルアップロード処理
   */
  const handleFileUpload = useCallback(
    async (file: File, method: UploadState['uploadMethod']) => {
      setError('');
      setIsLoading(true);

      try {
        // 画像プレビュー生成
        const preview = await createImagePreview(file);

        setUploadState(prev => ({
          ...prev,
          selectedImage: file,
          imagePreview: preview,
          uploadMethod: method,
          isProcessing: true,
        }));

        // 次のステージに進む
        setCurrentStage('processing');

        // AI処理開始
        await processWithIntelligentOCR(file);
      } catch (err: unknown) {
        setError(err.message || 'ファイルアップロードに失敗しました');
        setUploadState(prev => ({ ...prev, isProcessing: false }));
      } finally {
        setIsLoading(false);
      }
    },
    [processWithIntelligentOCR]
  );

  /**
   * 画像プレビュー生成
   */
  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * インテリジェントOCR処理
   */
  const processWithIntelligentOCR = useCallback(
    async (file: File) => {
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('userName', userProfile?.shiftFilterName || '');
        formData.append('autoSave', autoSave.toString());
        formData.append(
          'processingOptions',
          JSON.stringify({
            aiProviders: ['gemini', 'openai', 'vision'],
            enableComparison: true,
            confidenceThreshold:
              userProfile?.preferences.ocrConfidenceThreshold || 0.7,
          })
        );

        const authToken = (() => {
          const direct = localStorage.getItem('token');
          if (direct) return direct;
          try {
            const auth = localStorage.getItem('auth');
            if (auth) return JSON.parse(auth).token;
          } catch {
            // Ignore parsing errors
          }
          return null;
        })();

        const response = await fetch(
          '/api/intelligent-ocr/upload-and-process',
          {
            method: 'POST',
            headers: {
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('OCR処理に失敗しました');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.error?.message || 'OCR処理でエラーが発生しました'
          );
        }

        setOcrResults(data.data);

        // 編集可能なシフトデータに変換
        const shifts = convertToEditableShifts(
          data.data.consolidatedResult.recommendedShifts
        );
        setEditableShifts(shifts);

        // 自動保存が実行された場合でも確認段階を経由する
        if (
          autoSave &&
          data.meta?.autoSave &&
          data.data.savedShifts?.length > 0
        ) {
          // 自動保存済みの情報を保存しておく
          setOcrResults({
            ...data.data,
            savedShifts: data.data.savedShifts,
            autoSaved: true,
          });
          // 確認ステージに進む
          setCurrentStage('confirmation');
        } else {
          // 結果表示ステージに進む
          setCurrentStage('results');
        }
      } catch (err: unknown) {
        setError(err.message);
        setCurrentStage('upload');
      }
    },
    [userProfile, autoSave]
  );

  /**
   * OCR結果を編集可能な形式に変換
   */
  const convertToEditableShifts = (
    shifts: {
      date: string;
      startTime: string;
      endTime: string;
      jobSourceName: string;
      hourlyRate: number;
      breakMinutes?: number;
      description?: string;
      isConfirmed: boolean;
      confidence?: number;
    }[]
  ): EditableShift[] => {
    return shifts.map((shift, index) => ({
      id: `shift-${index}`,
      ...shift,
      isEdited: false,
      originalData: { ...shift },
      validationErrors: [],
    }));
  };

  /**
   * ステージ遷移
   */
  const goToNextStage = useCallback(() => {
    const nextIndex = Math.min(
      currentStageIndex + 1,
      PROCESSING_STAGES.length - 1
    );
    setCurrentStage(PROCESSING_STAGES[nextIndex].stage);
  }, [currentStageIndex]);

  const goToPreviousStage = useCallback(() => {
    const prevIndex = Math.max(currentStageIndex - 1, 0);
    setCurrentStage(PROCESSING_STAGES[prevIndex].stage);
  }, [currentStageIndex]);

  /**
   * 確認段階からの最終カレンダー反映
   */
  const handleConfirmedSave = async () => {
    setIsLoading(true);
    try {
      if (ocrResults?.autoSaved && ocrResults.savedShifts) {
        // 既に自動保存済みの場合は、カレンダー反映のみ
        onShiftsSaved(ocrResults.savedShifts);
      } else {
        // 通常保存の場合
        const shiftsToSave = editableShifts.map(shift => ({
          date: shift.date,
          startTime: shift.startTime,
          endTime: shift.endTime,
          jobSourceName: shift.jobSourceName,
          hourlyRate: shift.hourlyRate,
          breakMinutes: shift.breakMinutes || 60,
          description: shift.description || 'OCR自動登録',
          isConfirmed: shift.isConfirmed,
        }));
        onShiftsSaved(shiftsToSave);
      }

      setCurrentStage('saving');

      // 完了後、少し待ってから閉じる
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (err: unknown) {
      setError(err.message || 'シフト保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 編集段階から確認段階へ進む
   */
  const handleProceedToConfirmation = () => {
    setCurrentStage('confirmation');
  };

  /**
   * ステージ別レンダリング
   */
  const renderStageContent = () => {
    switch (currentStage) {
      case 'upload':
        return (
          <Box>
            <Box display="flex" justifyContent="center" mb={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoSave}
                    onChange={e => setAutoSave(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      自動保存を有効にする
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      OCR解析後に自動でカレンダーに保存します
                    </Typography>
                  </Box>
                }
              />
            </Box>
            <SmartUploadZone
              onFileUpload={handleFileUpload}
              uploadState={uploadState}
              setUploadState={setUploadState}
              userProfile={userProfile}
            />
          </Box>
        );

      case 'processing':
        return (
          <AIProcessingView
            session={session}
            ocrResults={ocrResults}
            onProcessingComplete={() => setCurrentStage('results')}
          />
        );

      case 'results':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              🎯 AI解析結果 ({editableShifts.length}件のシフト)
            </Typography>
            {ocrResults && (
              <Box mb={2}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  信頼度:{' '}
                  {Math.round(
                    ocrResults.consolidatedResult.overallConfidence * 100
                  )}
                  %{ocrResults.consolidatedResult.needsReview && ' (要確認)'}
                </Alert>
                {/* 自動保存結果の表示 */}
                {ocrResults.meta?.autoSave && (
                  <Alert
                    severity={
                      ocrResults.meta.savedCount > 0 ? 'success' : 'warning'
                    }
                    sx={{ mb: 2 }}
                  >
                    自動保存結果: {ocrResults.meta.savedCount || 0}件保存、
                    {ocrResults.meta.skippedCount || 0}件スキップ
                    {ocrResults.meta.skippedCount > 0 && ' (時間重複等のため)'}
                  </Alert>
                )}
              </Box>
            )}
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              {editableShifts.map(shift => (
                <Chip
                  key={shift.id}
                  label={`${shift.date} ${shift.startTime}-${shift.endTime}`}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        );

      case 'editing':
        return (
          <IntelligentResultsEditor
            shifts={editableShifts}
            onShiftsChange={setEditableShifts}
            ocrResults={ocrResults}
            userProfile={userProfile}
          />
        );

      case 'confirmation':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              📋 保存確認
            </Typography>

            {ocrResults?.autoSaved ? (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  ✅ 自動保存完了
                </Typography>
                <Typography variant="body2">
                  {ocrResults.meta?.savedCount || 0}
                  件のシフトが自動保存されました。
                  {ocrResults.meta?.skippedCount > 0 &&
                    ` ${ocrResults.meta.skippedCount}件は時間重複等でスキップされました。`}
                </Typography>
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  以下のシフトをカレンダーに保存しますか？
                </Typography>
              </Alert>
            )}

            <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
              {editableShifts.map(shift => (
                <Chip
                  key={shift.id}
                  label={`${shift.date} ${shift.startTime}-${shift.endTime} ${shift.jobSourceName}`}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>

            <Typography variant="body2" color="text.secondary">
              「カレンダーに保存」ボタンを押すと、これらのシフトがカレンダーに反映されます。
            </Typography>
          </Box>
        );

      case 'saving':
        return (
          <ProcessingSummary
            shifts={editableShifts}
            ocrResults={ocrResults}
            isComplete={true}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, minHeight: '80vh' }}>
        {/* ヘッダー */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Typography variant="h4" component="h1" fontWeight="bold">
            🤖 インテリジェント シフト解析
          </Typography>
          {onClose && (
            <Button onClick={onClose} color="inherit">
              閉じる
            </Button>
          )}
        </Box>

        {/* プログレスステッパー */}
        <Box mb={4}>
          <Stepper
            activeStep={currentStageIndex}
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'vertical' : 'horizontal'}
          >
            {PROCESSING_STAGES.map((stage, index) => (
              <Step key={stage.stage}>
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      width={40}
                      height={40}
                      borderRadius="50%"
                      bgcolor={
                        index < currentStageIndex
                          ? 'success.main'
                          : index === currentStageIndex
                            ? 'primary.main'
                            : 'grey.300'
                      }
                      color="white"
                    >
                      {index < currentStageIndex ? (
                        <CheckCircle fontSize="small" />
                      ) : index === currentStageIndex && isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        index + 1
                      )}
                    </Box>
                  )}
                >
                  <Typography
                    variant={isMobile ? 'body2' : 'subtitle1'}
                    fontWeight="medium"
                  >
                    {stage.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stage.description}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* メインコンテンツ */}
        <Box minHeight="400px">
          <Fade in={true} timeout={500}>
            <Box>{renderStageContent()}</Box>
          </Fade>
        </Box>

        {/* ナビゲーションボタン */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={4}
        >
          <Button
            startIcon={<ArrowBack />}
            onClick={goToPreviousStage}
            disabled={!currentStageConfig.canGoBack || isLoading}
            variant="outlined"
          >
            戻る
          </Button>

          <Box flex={1} mx={2}>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Step {currentStageIndex + 1} of {PROCESSING_STAGES.length}
            </Typography>
          </Box>

          {currentStage === 'editing' ? (
            <Button
              endIcon={<ArrowForward />}
              onClick={handleProceedToConfirmation}
              disabled={isLoading}
              variant="contained"
              color="primary"
              size="large"
            >
              確認へ進む
            </Button>
          ) : currentStage === 'confirmation' ? (
            <Button
              endIcon={<Save />}
              onClick={handleConfirmedSave}
              disabled={isLoading}
              variant="contained"
              color="success"
              size="large"
            >
              カレンダーに保存
            </Button>
          ) : currentStage === 'saving' ? (
            <Button
              startIcon={<CheckCircle />}
              variant="contained"
              color="success"
              disabled
            >
              完了
            </Button>
          ) : (
            <Button
              endIcon={<ArrowForward />}
              onClick={goToNextStage}
              disabled={
                currentStageIndex === PROCESSING_STAGES.length - 1 || isLoading
              }
              variant="contained"
            >
              次へ
            </Button>
          )}
        </Box>
      </Paper>

      {/* ローディングオーバーレイ */}
      <Backdrop
        open={isLoading && currentStage === 'processing'}
        sx={{ zIndex: theme.zIndex.drawer + 1 }}
      >
        <Box textAlign="center" color="white">
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" mt={2}>
            AI解析中...
          </Typography>
          <Typography variant="body2" mt={1}>
            複数のAIでシフト情報を抽出しています
          </Typography>
        </Box>
      </Backdrop>
    </Container>
  );
};
