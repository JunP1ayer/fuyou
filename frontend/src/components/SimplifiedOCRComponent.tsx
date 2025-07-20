import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  Fade,
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  CameraAlt,
  PhotoLibrary,
  CheckCircle,
  Edit,
  SmartToy,
  Person,
  Refresh,
  Close,
  AutoAwesome,
  Schedule,
  LocationOn,
  AttachMoney,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import type { CreateShiftData } from '../types/shift';

interface SimplifiedOCRComponentProps {
  onShiftsSaved?: (shifts: CreateShiftData[]) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

interface NaturalLanguageResult {
  message: string;
  shifts: CreateShiftData[];
  confidence: number;
  needsReview: boolean;
}

type OCRStage = 'input' | 'processing' | 'result' | 'editing';

export const SimplifiedOCRComponent: React.FC<SimplifiedOCRComponentProps> = ({
  onShiftsSaved,
  onError,
  onClose,
}) => {
  const { token } = useAuth();
  const [stage, setStage] = useState<OCRStage>('input');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<NaturalLanguageResult | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingShifts, setEditingShifts] = useState<CreateShiftData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル選択処理
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    []
  );

  // ファイル処理
  const processFile = (file: File) => {
    // サポートされているファイル形式をチェック
    const supportedTypes = [
      'image/jpeg',
      'image/png', 
      'image/webp',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/pdf',
    ];

    const supportedExtensions = ['.xlsx', '.xls', '.csv', '.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (!supportedTypes.includes(file.type) && !supportedExtensions.includes(`.${fileExtension}`)) {
      setError('サポートされていないファイル形式です。画像、Excel、CSV、PDFファイルを選択してください');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('ファイルサイズは10MB以下にしてください');
      return;
    }

    setSelectedFile(file);
    setError(null);
    startAIFileProcessing(file);
  };

  // AI ファイル処理開始
  const startAIFileProcessing = async (file: File) => {
    if (!token) {
      setError('認証が必要です');
      return;
    }

    setStage('processing');
    setError(null);

    try {
      // AI統合ファイル解析処理（OpenAI/Gemini使用）
      const response = await apiService.uploadFileForAIAnalysis(token, file);

      if (!response.success || !response.data) {
        throw new Error('ファイル解析に失敗しました');
      }

      // AIファイル解析結果を自然言語結果形式に変換
      const shifts = response.data.shifts || [];
      const confidence = response.data.confidence || 0.8;
      const provider = response.data.provider || 'AI';
      
      let message = '';
      if (shifts.length > 0) {
        message = `${provider.toUpperCase()}がファイルを解析しました。\n\n`;
        message += `📊 検出されたシフト: ${shifts.length}件\n`;
        message += `✨ 解析精度: ${Math.round(confidence * 100)}%\n\n`;
        message += `以下のシフトが見つかりました:\n`;
        shifts.slice(0, 3).forEach((shift, index) => {
          message += `${index + 1}. ${shift.date} ${shift.startTime}-${shift.endTime} (${shift.jobSourceName})\n`;
        });
        if (shifts.length > 3) {
          message += `他 ${shifts.length - 3} 件...\n`;
        }
        message += `\n内容に間違いがなければ「はい、この通りです」を、修正が必要であれば「修正したいです」をクリックしてください。`;
      } else {
        message = `${provider.toUpperCase()}でファイルを解析しましたが、シフト情報を検出できませんでした。\n\nファイルにシフト表が含まれているか確認し、別のファイルで再試行してください。`;
      }

      const naturalLanguageResult: NaturalLanguageResult = {
        message,
        shifts,
        confidence,
        needsReview: confidence < 0.8 || shifts.length === 0,
      };

      setResult(naturalLanguageResult);
      setStage('result');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'ファイル解析に失敗しました';
      setError(errorMessage);
      setStage('input');
      onError?.(errorMessage);
    }
  };

  // 確認処理
  const handleConfirm = async () => {
    if (!result || !token) return;

    try {
      // バルクシフト登録
      const response = await apiService.createBulkShifts(token, result.shifts);

      if (response.success) {
        onShiftsSaved?.(result.shifts);
        onClose?.();
      } else {
        throw new Error('シフト登録に失敗しました');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'シフト登録に失敗しました';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  // 編集開始
  const handleEdit = () => {
    if (result) {
      setEditingShifts([...result.shifts]);
      setEditDialogOpen(true);
    }
  };

  // 編集完了
  const handleEditComplete = async () => {
    if (!token) return;

    try {
      const response = await apiService.createBulkShifts(token, editingShifts);

      if (response.success) {
        setEditDialogOpen(false);
        onShiftsSaved?.(editingShifts);
        onClose?.();
      } else {
        throw new Error('シフト登録に失敗しました');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'シフト登録に失敗しました';
      setError(errorMessage);
    }
  };

  // リセット
  const handleReset = () => {
    setStage('input');
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          {/* 入力ステージ */}
          {stage === 'input' && (
            <Fade in>
              <Box textAlign="center">
                <Avatar
                  sx={{
                    mx: 'auto',
                    mb: 2,
                    bgcolor: 'primary.main',
                    width: 64,
                    height: 64,
                  }}
                >
                  <CameraAlt sx={{ fontSize: 32 }} />
                </Avatar>

                <Typography variant="h5" gutterBottom fontWeight="bold">
                  📄 シフト表ファイルを選択してください
                </Typography>

                <Typography
                  variant="body1"
                  color="text.secondary"
                  paragraph
                  sx={{ mb: 4 }}
                >
                  画像・Excel・CSV・PDFファイルからAIが自動でシフト情報を読み取ります
                </Typography>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.xlsx,.xls,.csv,.pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                <Box sx={{ mb: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PhotoLibrary />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      minHeight: 60,
                      minWidth: 200,
                      fontSize: '1.1rem',
                      borderRadius: 3,
                    }}
                  >
                    ファイルを選択
                  </Button>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  対応形式: 画像(JPG, PNG), Excel(.xlsx, .xls), CSV(.csv), PDF(.pdf)（最大10MB）
                </Typography>
              </Box>
            </Fade>
          )}

          {/* 処理ステージ */}
          {stage === 'processing' && (
            <Fade in>
              <Box textAlign="center" py={4}>
                <CircularProgress size={60} sx={{ mb: 3 }} />

                <Typography variant="h6" gutterBottom>
                  ファイルを解析しています...
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  AIがファイルを解析中です（約10-30秒）
                </Typography>

                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    💡 解析精度向上のコツ：
                    明瞭な文字・整理されたデータ形式のファイルを使用してください
                  </Typography>
                </Box>
              </Box>
            </Fade>
          )}

          {/* 結果ステージ */}
          {stage === 'result' && result && (
            <Slide direction="left" in>
              <Box>
                {/* AIアシスタントのメッセージ */}
                <Box display="flex" gap={2} mb={3}>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <SmartToy />
                  </Avatar>
                  <Box flex={1}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      AI アシスタント
                    </Typography>
                    <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography
                        variant="body1"
                        sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}
                      >
                        {result.message}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>

                {/* 信頼度表示 */}
                {result.needsReview && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      読み取り精度が低い可能性があります。内容をご確認ください。
                    </Typography>
                  </Alert>
                )}

                {/* アクションボタン */}
                <Box
                  display="flex"
                  gap={2}
                  justifyContent="center"
                  flexWrap="wrap"
                >
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleConfirm}
                    startIcon={<CheckCircle />}
                    sx={{ minWidth: 150 }}
                  >
                    はい、この通りです
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleEdit}
                    startIcon={<Edit />}
                    sx={{ minWidth: 150 }}
                  >
                    修正したいです
                  </Button>
                </Box>

                {/* 再撮影ボタン */}
                <Box textAlign="center" mt={2}>
                  <Button
                    variant="text"
                    onClick={handleReset}
                    startIcon={<Refresh />}
                    size="small"
                  >
                    別のファイルで再試行
                  </Button>
                </Box>
              </Box>
            </Slide>
          )}

          {/* エラー表示 */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
              <Box mt={1}>
                <Button size="small" onClick={handleReset}>
                  最初からやり直す
                </Button>
              </Box>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">シフト情報を編集</Typography>
            <IconButton onClick={() => setEditDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            読み取った内容を確認・修正してください
          </Typography>

          {editingShifts.map((shift, index) => (
            <Card key={index} sx={{ mb: 2, p: 2 }}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                シフト {index + 1}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="日付"
                    type="date"
                    value={shift.date}
                    onChange={e => {
                      const newShifts = [...editingShifts];
                      newShifts[index].date = e.target.value;
                      setEditingShifts(newShifts);
                    }}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={6} sm={3}>
                  <TextField
                    label="開始時間"
                    type="time"
                    value={shift.startTime}
                    onChange={e => {
                      const newShifts = [...editingShifts];
                      newShifts[index].startTime = e.target.value;
                      setEditingShifts(newShifts);
                    }}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={6} sm={3}>
                  <TextField
                    label="終了時間"
                    type="time"
                    value={shift.endTime}
                    onChange={e => {
                      const newShifts = [...editingShifts];
                      newShifts[index].endTime = e.target.value;
                      setEditingShifts(newShifts);
                    }}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="勤務場所"
                    value={shift.jobSourceName}
                    onChange={e => {
                      const newShifts = [...editingShifts];
                      newShifts[index].jobSourceName = e.target.value;
                      setEditingShifts(newShifts);
                    }}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="時給"
                    type="number"
                    value={shift.hourlyRate}
                    onChange={e => {
                      const newShifts = [...editingShifts];
                      newShifts[index].hourlyRate = Number(e.target.value);
                      setEditingShifts(newShifts);
                    }}
                    fullWidth
                    InputProps={{
                      endAdornment: <Typography variant="body2">円</Typography>,
                    }}
                  />
                </Grid>
              </Grid>

              {/* 計算表示 */}
              <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="body2" color="text.secondary">
                  勤務時間: {calculateWorkHours(shift)}時間 | 予想収入:{' '}
                  {calculateEarnings(shift).toLocaleString()}円
                </Typography>
              </Box>
            </Card>
          ))}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleEditComplete}>
            シフトを登録
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ヘルパー関数
const calculateWorkHours = (shift: CreateShiftData): number => {
  const start = new Date(`2000-01-01T${shift.startTime}`);
  const end = new Date(`2000-01-01T${shift.endTime}`);
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return Math.max(0, hours - shift.breakMinutes / 60);
};

const calculateEarnings = (shift: CreateShiftData): number => {
  return calculateWorkHours(shift) * shift.hourlyRate;
};
