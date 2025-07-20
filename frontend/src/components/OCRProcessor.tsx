import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  CircularProgress,
  Chip,
  Fade,
  Grow,
  Collapse,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  CloudUpload,
  Image as ImageIcon,
  FindInPage,
  CheckCircle,
  ErrorOutline,
  Timer,
  Assessment,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import type { OCRResponse, OCRUsageStats } from '../types/ocr';

interface OCRProcessorProps {
  imageFile: File | null;
  onProcessingComplete?: (result: OCRResponse) => void;
  onError?: (error: string) => void;
  onUsageUpdate?: (usage: OCRUsageStats) => void;
}

interface ProcessingStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  active: boolean;
  error?: string;
}

export const OCRProcessor: React.FC<OCRProcessorProps> = ({
  imageFile,
  onProcessingComplete,
  onError,
  onUsageUpdate,
}) => {
  const { token } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: 'upload',
      label: '画像アップロード',
      description: '画像をサーバーに送信中...',
      completed: false,
      active: false,
    },
    {
      id: 'analysis',
      label: 'OCR分析',
      description: 'Google Cloud Vision APIで画像を分析中...',
      completed: false,
      active: false,
    },
    {
      id: 'extraction',
      label: 'テキスト抽出',
      description: '画像からテキストを抽出中...',
      completed: false,
      active: false,
    },
    {
      id: 'processing',
      label: 'データ処理',
      description: '抽出されたテキストを処理中...',
      completed: false,
      active: false,
    },
    {
      id: 'complete',
      label: '完了',
      description: 'OCR処理が完了しました',
      completed: false,
      active: false,
    },
  ]);
  const [result, setResult] = useState<OCRResponse | null>(null);
  const [usage, setUsage] = useState<OCRUsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // 使用状況を取得
  useEffect(() => {
    if (token) {
      fetchUsage();
    }
  }, [token]);

  // 処理時間の計測
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (processing) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [processing]);

  const fetchUsage = async () => {
    if (!token) return;

    try {
      const usageData = (await apiService.getOCRUsage(token)) as OCRUsageStats;
      setUsage(usageData);
      onUsageUpdate?.(usageData);
    } catch (error) {
      console.error('使用状況の取得に失敗:', error);
    }
  };

  const updateStep = (stepIndex: number, updates: Partial<ProcessingStep>) => {
    setSteps(prev =>
      prev.map((step, index) =>
        index === stepIndex ? { ...step, ...updates } : step
      )
    );
  };

  const startProcessing = async () => {
    if (!imageFile || !token) return;

    setProcessing(true);
    setProgress(0);
    setCurrentStep(0);
    setError(null);
    setElapsedTime(0);
    setEstimatedTime(estimateProcessingTime(imageFile));

    try {
      // Step 1: アップロード開始
      updateStep(0, { active: true });
      setProgress(10);

      // Step 2: OCR分析開始
      updateStep(0, { completed: true, active: false });
      updateStep(1, { active: true });
      setCurrentStep(1);
      setProgress(30);

      // 実際のOCR処理
      const ocrResult = await apiService.uploadImageForOCR(token, imageFile);

      // Step 3: テキスト抽出完了
      updateStep(1, { completed: true, active: false });
      updateStep(2, { active: true });
      setCurrentStep(2);
      setProgress(70);

      // Step 4: データ処理
      updateStep(2, { completed: true, active: false });
      updateStep(3, { active: true });
      setCurrentStep(3);
      setProgress(90);

      // 少し待ってから完了
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 5: 完了
      updateStep(3, { completed: true, active: false });
      updateStep(4, { active: true, completed: true });
      setCurrentStep(4);
      setProgress(100);

      setResult(ocrResult);
      onProcessingComplete?.(ocrResult);

      // 使用状況を更新
      await fetchUsage();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'OCR処理に失敗しました';
      setError(errorMessage);
      updateStep(currentStep, { error: errorMessage, active: false });
      onError?.(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const estimateProcessingTime = (file: File): number => {
    // ファイルサイズに基づいて処理時間を推定（秒）
    const sizeInMB = file.size / (1024 * 1024);
    return Math.ceil(sizeInMB * 2 + 5); // 基本5秒 + サイズ依存
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {/* 処理状況ヘッダー */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                OCR処理状況
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Timer fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  経過時間: {formatTime(elapsedTime)}
                  {estimatedTime > 0 && processing && (
                    <span> / 推定: {formatTime(estimatedTime)}</span>
                  )}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {imageFile && (
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {imageFile.name} (
                    {(imageFile.size / 1024 / 1024).toFixed(1)}MB)
                  </Typography>
                  <Button
                    onClick={startProcessing}
                    disabled={processing}
                    variant="contained"
                    startIcon={
                      processing ? (
                        <CircularProgress size={20} />
                      ) : (
                        <CloudUpload />
                      )
                    }
                  >
                    {processing ? '処理中...' : 'OCR処理開始'}
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>

          {processing && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 処理ステップ */}
      {(processing || result || error) && (
        <Fade in>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                処理ステップ
              </Typography>

              <Stepper activeStep={currentStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.id} completed={step.completed}>
                    <StepLabel
                      error={!!step.error}
                      icon={
                        step.error ? (
                          <ErrorOutline color="error" />
                        ) : step.completed ? (
                          <CheckCircle color="success" />
                        ) : step.active ? (
                          <CircularProgress size={24} />
                        ) : (
                          index + 1
                        )
                      }
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {step.error || step.description}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* 結果表示 */}
      {result && (
        <Grow in>
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                OCR結果
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={`信頼度: ${Math.round((result.data?.confidence || 0) * 100)}%`}
                      color={getConfidenceColor(result.data?.confidence || 0)}
                      icon={<Assessment />}
                    />
                    <Chip
                      label={`処理時間: ${result.metadata?.processingTimeMs || 0}ms`}
                      color="info"
                      icon={<Timer />}
                    />
                    {result.data?.boundingBoxes && (
                      <Chip
                        label={`${result.data.boundingBoxes.length}個のテキスト領域`}
                        color="primary"
                        icon={<FindInPage />}
                      />
                    )}
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    <Typography
                      variant="body2"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {result.data?.extractedText ||
                        'テキストが抽出されませんでした'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grow>
      )}

      {/* 使用状況表示 */}
      {usage && (
        <Collapse in>
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API使用状況
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {usage.data?.currentHourUsage || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      今時間の使用回数
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      上限: {usage.data?.limits.hourly || 20}回
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="secondary">
                      {usage.data?.currentDayUsage || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      今日の使用回数
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main">
                      {usage.data?.currentMonthUsage || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      今月の使用回数
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      上限: {usage.data?.limits.monthly || 1000}回
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>
      )}

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};
