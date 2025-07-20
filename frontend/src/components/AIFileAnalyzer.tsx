import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  AutoAwesome,
  Image,
  Description,
  PictureAsPdf,
  TableChart,
} from '@mui/icons-material';
import { EnhancedFileUpload } from './EnhancedFileUpload';
import type { CreateShiftData } from '../types/shift';

interface AIFileAnalyzerProps {
  onShiftsSaved: (shifts: CreateShiftData[]) => void;
  onError: (error: string) => void;
  onClose?: () => void;
  compactMode?: boolean;
}

interface AnalysisResult {
  type: string;
  filename: string;
  shifts: CreateShiftData[];
  confidence: number;
  provider: 'openai' | 'gemini';
  metadata?: {
    originalShiftsCount: number;
    analysisProvider: string;
  };
}

export const AIFileAnalyzer: React.FC<AIFileAnalyzerProps> = ({
  onShiftsSaved,
  onError,
  onClose,
  compactMode = false,
}) => {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesProcessed = (processedResults: any[]) => {
    const analysisResults: AnalysisResult[] = processedResults.map(result => ({
      type: result.data.type || 'unknown',
      filename: result.data.filename || 'unknown',
      shifts: result.data.shifts || [],
      confidence: result.data.confidence || 0,
      provider: result.data.provider || 'unknown',
      metadata: result.data.metadata,
    }));

    setResults(analysisResults);
    setIsProcessing(false);

    // 全てのシフトを統合
    const allShifts = analysisResults.flatMap(result => result.shifts);
    
    if (allShifts.length > 0) {
      onShiftsSaved(allShifts);
    } else {
      onError('シフト情報が見つかりませんでした。ファイル形式やデータの配置を確認してください。');
    }
  };

  const handleError = (error: string) => {
    setIsProcessing(false);
    onError(error);
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image color="primary" />;
      case 'excel':
        return <TableChart color="success" />;
      case 'csv':
        return <Description color="info" />;
      case 'pdf':
        return <PictureAsPdf color="error" />;
      default:
        return <Description />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'primary';
      case 'gemini':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* ヘッダー */}
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ color: 'white', py: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <AutoAwesome sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6">
                AI ファイル解析
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                OpenAI・Gemini を使用した高精度シフト表解析
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ファイルアップロード */}
      <EnhancedFileUpload
        onFilesProcessed={handleFilesProcessed}
        onError={handleError}
        maxFiles={3}
        disabled={isProcessing}
      />

      {/* 処理中インジケーター */}
      {isProcessing && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="body2" gutterBottom>
              AI解析処理中...
            </Typography>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              OpenAI または Gemini がファイルを解析しています
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* 解析結果 */}
      {results.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              解析結果
            </Typography>

            {results.map((result, index) => (
              <Box key={index}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {getFileTypeIcon(result.type)}
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {result.filename}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                      <Chip
                        label={`${result.shifts.length}件のシフト`}
                        color="primary"
                        size="small"
                      />
                      <Chip
                        label={`精度: ${(result.confidence * 100).toFixed(0)}%`}
                        color={getConfidenceColor(result.confidence)}
                        size="small"
                      />
                      <Chip
                        label={result.provider.toUpperCase()}
                        color={getProviderColor(result.provider)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Box>

                {/* シフト詳細 */}
                {result.shifts.length > 0 && (
                  <Box ml={4} mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      検出されたシフト:
                    </Typography>
                    {result.shifts.slice(0, 3).map((shift, shiftIndex) => (
                      <Typography key={shiftIndex} variant="body2" sx={{ ml: 1 }}>
                        • {shift.date} {shift.startTime}-{shift.endTime} ({shift.jobSourceName})
                      </Typography>
                    ))}
                    {result.shifts.length > 3 && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        他 {result.shifts.length - 3} 件...
                      </Typography>
                    )}
                  </Box>
                )}

                {index < results.length - 1 && <Divider sx={{ my: 2 }} />}
              </Box>
            ))}

            {/* 総合情報 */}
            <Divider sx={{ my: 2 }} />
            <Alert severity="success">
              合計 {results.reduce((sum, result) => sum + result.shifts.length, 0)} 件のシフトを検出しました。
              カレンダーに反映されます。
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* 説明 */}
      {!compactMode && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              対応ファイル形式
            </Typography>
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Image color="primary" />
                <Typography variant="body2">
                  画像 (JPG, PNG, WebP)
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <TableChart color="success" />
                <Typography variant="body2">
                  Excel (.xlsx, .xls)
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Description color="info" />
                <Typography variant="body2">
                  CSV (.csv)
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <PictureAsPdf color="error" />
                <Typography variant="body2">
                  PDF (.pdf)
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              AI（OpenAI/Gemini）を使用することで、複雑なレイアウトのシフト表も高精度で解析できます。
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};