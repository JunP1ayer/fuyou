import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  Grid,
  Fade,
  Slide,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  AutoAwesome,
  SmartToy,
  Visibility,
  CheckCircle,
  Error as ErrorIcon,
  Timer,
  Speed,
  Psychology,
} from '@mui/icons-material';

import type {
  ProcessingSession,
  OCRProcessingResponse,
  AIProcessingResult,
  AIProvider,
} from '../../types/intelligentOCR';

interface AIProcessingViewProps {
  session: ProcessingSession | null;
  ocrResults: OCRProcessingResponse | null;
  onProcessingComplete: () => void;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'gemini',
    displayName: 'Gemini AI',
    icon: <AutoAwesome />,
    description: '高精度画像解析・自然言語理解',
    priority: 1,
    available: true,
    status: 'idle',
  },
  {
    name: 'openai',
    displayName: 'OpenAI GPT-4o',
    icon: <SmartToy />,
    description: '複雑レイアウト対応・文脈理解',
    priority: 2,
    available: true,
    status: 'idle',
  },
  {
    name: 'vision',
    displayName: 'Google Vision',
    icon: <Visibility />,
    description: 'OCR専門・テキスト抽出',
    priority: 3,
    available: true,
    status: 'idle',
  },
];

export const AIProcessingView: React.FC<AIProcessingViewProps> = ({
  session,
  ocrResults,
  onProcessingComplete,
}) => {
  const [providers, setProviders] = useState<AIProvider[]>(AI_PROVIDERS);
  const [overallProgress, setOverallProgress] = useState(0);
  const [processingStartTime, setProcessingStartTime] = useState<number>(
    Date.now()
  );
  const [currentPhase, setCurrentPhase] = useState<
    'initializing' | 'processing' | 'consolidating' | 'completed'
  >('initializing');

  // シミュレートされた処理進捗
  useEffect(() => {
    if (!ocrResults) {
      const interval = setInterval(() => {
        setProviders(prev =>
          prev.map(provider => {
            const random = Math.random();
            let newStatus: AIProvider['status'] = provider.status;
            let newProgress = provider.processingTime || 0;

            // ステータス更新ロジック
            if (provider.status === 'idle' && random > 0.7) {
              newStatus = 'processing';
              setCurrentPhase('processing');
            } else if (provider.status === 'processing') {
              newProgress = Math.min(100, newProgress + Math.random() * 15);
              if (newProgress >= 100) {
                newStatus = 'completed';
              }
            }

            return {
              ...provider,
              status: newStatus,
              processingTime: newProgress,
              confidence:
                newStatus === 'completed'
                  ? 0.75 + Math.random() * 0.2
                  : undefined,
            };
          })
        );

        // 全体進捗計算
        setOverallProgress(prev => Math.min(95, prev + Math.random() * 5));
      }, 800);

      return () => clearInterval(interval);
    }
  }, [ocrResults]);

  // 処理完了検知
  useEffect(() => {
    if (ocrResults) {
      setCurrentPhase('consolidating');
      setOverallProgress(100);

      // 結果をプロバイダーに反映
      setProviders(prev =>
        prev.map(provider => ({
          ...provider,
          status: ocrResults.results[provider.name] ? 'completed' : 'failed',
          processingTime:
            ocrResults.results[provider.name]?.processingTime || 0,
          confidence: ocrResults.results[provider.name]?.confidence || 0,
        }))
      );

      setTimeout(() => {
        setCurrentPhase('completed');
        onProcessingComplete();
      }, 2000);
    }
  }, [ocrResults, onProcessingComplete]);

  const getPhaseMessage = () => {
    switch (currentPhase) {
      case 'initializing':
        return '🚀 AI処理を初期化中...';
      case 'processing':
        return '🧠 複数のAIでシフト情報を並列解析中...';
      case 'consolidating':
        return '🔄 AI結果を統合・最適化中...';
      case 'completed':
        return '✅ 処理完了！結果を表示します';
      default:
        return '';
    }
  };

  const completedCount = providers.filter(p => p.status === 'completed').length;
  const processingTime = Math.floor((Date.now() - processingStartTime) / 1000);

  return (
    <Box>
      {/* ヘッダー情報 */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          {getPhaseMessage()}
        </Typography>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Chip
            icon={<Timer />}
            label={`処理時間: ${processingTime}秒`}
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<Speed />}
            label={`完了: ${completedCount}/${providers.length} AI`}
            color={completedCount === providers.length ? 'success' : 'default'}
          />
        </Box>

        {/* 全体進捗バー */}
        <Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="body2" color="text.secondary">
              全体進捗
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {Math.round(overallProgress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={overallProgress}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </Box>

      {/* AI プロバイダー詳細 */}
      <Grid container spacing={3}>
        {providers.map((provider, index) => (
          <Grid item xs={12} md={4} key={provider.name}>
            <Slide in={true} direction="up" timeout={(index + 1) * 200}>
              <Card
                elevation={provider.status === 'processing' ? 8 : 2}
                sx={{
                  height: '100%',
                  border: provider.status === 'completed' ? 2 : 0,
                  borderColor: 'success.main',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                {/* 優先度バッジ */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    zIndex: 1,
                  }}
                >
                  {provider.priority}
                </Box>

                <CardContent>
                  {/* ヘッダー */}
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar
                      sx={{
                        bgcolor:
                          provider.status === 'completed'
                            ? 'success.main'
                            : provider.status === 'processing'
                              ? 'primary.main'
                              : provider.status === 'failed'
                                ? 'error.main'
                                : 'grey.400',
                        width: 48,
                        height: 48,
                      }}
                    >
                      {provider.status === 'completed' ? (
                        <CheckCircle />
                      ) : provider.status === 'failed' ? (
                        <ErrorIcon />
                      ) : provider.status === 'processing' ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        provider.icon
                      )}
                    </Avatar>

                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="bold">
                        {provider.displayName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {provider.description}
                      </Typography>
                    </Box>
                  </Box>

                  {/* ステータス */}
                  <Box mb={2}>
                    <Chip
                      label={
                        provider.status === 'idle'
                          ? '待機中'
                          : provider.status === 'processing'
                            ? '解析中'
                            : provider.status === 'completed'
                              ? '完了'
                              : '失敗'
                      }
                      color={
                        provider.status === 'completed'
                          ? 'success'
                          : provider.status === 'processing'
                            ? 'primary'
                            : provider.status === 'failed'
                              ? 'error'
                              : 'default'
                      }
                      size="small"
                    />
                  </Box>

                  {/* 進捗バー */}
                  {provider.status === 'processing' && (
                    <Box mb={2}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <Typography variant="caption">進捗</Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {Math.round(provider.processingTime || 0)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={provider.processingTime || 0}
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  )}

                  {/* 結果情報 */}
                  {provider.status === 'completed' && (
                    <Box>
                      <Divider sx={{ my: 1 }} />
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="caption" color="text.secondary">
                          信頼度
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="success.main"
                        >
                          {Math.round((provider.confidence || 0) * 100)}%
                        </Typography>
                      </Box>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="caption" color="text.secondary">
                          処理時間
                        </Typography>
                        <Typography variant="body2">
                          {Math.round(
                            ((provider.processingTime || 0) / 100) * 3
                          )}
                          s
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* エラー情報 */}
                  {provider.status === 'failed' && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      <Typography variant="caption">
                        処理に失敗しました
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Slide>
          </Grid>
        ))}
      </Grid>

      {/* 処理フェーズ情報 */}
      <Box mt={4}>
        <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Psychology color="primary" />
            <Typography variant="h6" fontWeight="bold">
              AI処理の詳細
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                並列処理
              </Typography>
              <Typography variant="body1">3つのAIが同時に画像を解析</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                結果統合
              </Typography>
              <Typography variant="body1">
                最適な結果を自動選択・統合
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                品質保証
              </Typography>
              <Typography variant="body1">信頼度スコアで精度を評価</Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* 完了メッセージ */}
      {currentPhase === 'completed' && (
        <Fade in={true} timeout={1000}>
          <Alert severity="success" sx={{ mt: 3 }} icon={<CheckCircle />}>
            <Typography variant="h6" gutterBottom>
              🎉 AI解析が完了しました！
            </Typography>
            <Typography variant="body2">
              {ocrResults?.consolidatedResult.recommendedShifts.length || 0}
              件のシフトを検出しました。 信頼度:{' '}
              {Math.round(
                (ocrResults?.consolidatedResult.overallConfidence || 0) * 100
              )}
              %
            </Typography>
          </Alert>
        </Fade>
      )}
    </Box>
  );
};
