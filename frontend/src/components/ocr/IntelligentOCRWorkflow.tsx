import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Fade,
  Slide,
  Backdrop,
  CircularProgress,
  Alert,
  Chip,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CloudUpload,
  AutoAwesome,
  Edit,
  Save,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Error as ErrorIcon,
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
    progress: 75,
    canGoBack: true,
    canSkip: true,
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
  const [currentStage, setCurrentStage] = useState<ProcessingStage['stage']>('upload');
  const [session, setSession] = useState<ProcessingSession | null>(null);
  const [ocrResults, setOcrResults] = useState<OCRProcessingResponse | null>(null);
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

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentStageConfig = PROCESSING_STAGES.find(s => s.stage === currentStage)!;
  const currentStageIndex = PROCESSING_STAGES.findIndex(s => s.stage === currentStage);

  /**
   * ファイルアップロード処理
   */
  const handleFileUpload = useCallback(async (file: File, method: UploadState['uploadMethod']) => {
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
      
    } catch (err: any) {
      setError(err.message || 'ファイルアップロードに失敗しました');
      setUploadState(prev => ({ ...prev, isProcessing: false }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 画像プレビュー生成
   */
  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * インテリジェントOCR処理
   */
  const processWithIntelligentOCR = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userName', userProfile?.shiftFilterName || '');
      formData.append('processingOptions', JSON.stringify({
        aiProviders: ['gemini', 'openai', 'vision'],
        enableComparison: true,
        confidenceThreshold: userProfile?.preferences.ocrConfidenceThreshold || 0.7,
      }));

      const response = await fetch('/api/intelligent-ocr/upload-and-process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('OCR処理に失敗しました');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'OCR処理でエラーが発生しました');
      }

      setOcrResults(data.data);
      
      // 編集可能なシフトデータに変換
      const shifts = convertToEditableShifts(data.data.consolidatedResult.recommendedShifts);
      setEditableShifts(shifts);

      // 結果表示ステージに進む
      setCurrentStage('results');
      
    } catch (err: any) {
      setError(err.message);
      setCurrentStage('upload');
    }
  };

  /**
   * OCR結果を編集可能な形式に変換
   */
  const convertToEditableShifts = (shifts: any[]): EditableShift[] => {
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
    const nextIndex = Math.min(currentStageIndex + 1, PROCESSING_STAGES.length - 1);
    setCurrentStage(PROCESSING_STAGES[nextIndex].stage);
  }, [currentStageIndex]);

  const goToPreviousStage = useCallback(() => {
    const prevIndex = Math.max(currentStageIndex - 1, 0);
    setCurrentStage(PROCESSING_STAGES[prevIndex].stage);
  }, [currentStageIndex]);

  /**
   * 最終保存処理
   */
  const handleFinalSave = async () => {
    setIsLoading(true);
    try {
      // CreateShiftData形式に変換
      const shiftsToSave: CreateShiftData[] = editableShifts.map(shift => ({
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        jobSourceName: shift.jobSourceName,
        hourlyRate: shift.hourlyRate,
        breakMinutes: shift.breakMinutes || 60,
        description: shift.description || 'OCR自動登録',
        isConfirmed: shift.isConfirmed,
      }));

      // 親コンポーネントに結果を渡す
      onShiftsSaved(shiftsToSave);
      
      setCurrentStage('saving');
      
      // 完了後、少し待ってから閉じる
      setTimeout(() => {
        onClose?.();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'シフト保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ステージ別レンダリング
   */
  const renderStageContent = () => {
    switch (currentStage) {
      case 'upload':
        return (
          <SmartUploadZone
            onFileUpload={handleFileUpload}
            uploadState={uploadState}
            setUploadState={setUploadState}
            userProfile={userProfile}
          />
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
              <Alert severity="info" sx={{ mb: 2 }}>
                信頼度: {Math.round(ocrResults.consolidatedResult.overallConfidence * 100)}% 
                {ocrResults.consolidatedResult.needsReview && ' (要確認)'}
              </Alert>
            )}
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              {editableShifts.map((shift, index) => (
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
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
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
                        index < currentStageIndex ? 'success.main' :
                        index === currentStageIndex ? 'primary.main' : 'grey.300'
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
                  <Typography variant={isMobile ? 'body2' : 'subtitle1'} fontWeight="medium">
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
            <Box>
              {renderStageContent()}
            </Box>
          </Fade>
        </Box>

        {/* ナビゲーションボタン */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
          <Button
            startIcon={<ArrowBack />}
            onClick={goToPreviousStage}
            disabled={!currentStageConfig.canGoBack || isLoading}
            variant="outlined"
          >
            戻る
          </Button>

          <Box flex={1} mx={2}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Step {currentStageIndex + 1} of {PROCESSING_STAGES.length}
            </Typography>
          </Box>

          {currentStage === 'editing' ? (
            <Button
              endIcon={<Save />}
              onClick={handleFinalSave}
              disabled={isLoading}
              variant="contained"
              color="primary"
              size="large"
            >
              カレンダーに保存
            </Button>
          ) : currentStage !== 'saving' ? (
            <Button
              endIcon={<ArrowForward />}
              onClick={goToNextStage}
              disabled={currentStageIndex === PROCESSING_STAGES.length - 1 || isLoading}
              variant="contained"
            >
              次へ
            </Button>
          ) : (
            <Button
              startIcon={<CheckCircle />}
              variant="contained"
              color="success"
              disabled
            >
              完了
            </Button>
          )}
        </Box>
      </Paper>

      {/* ローディングオーバーレイ */}
      <Backdrop open={isLoading && currentStage === 'processing'} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
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