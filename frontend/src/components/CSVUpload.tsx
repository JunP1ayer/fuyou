import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface ParsedIncome {
  date: string;
  amount: number;
  description: string;
  source: string;
  confidence: number;
}

interface UploadResult {
  success: boolean;
  totalTransactions: number;
  incomeTransactions: ParsedIncome[];
  errors: string[];
  bankType: string;
}

export interface ParsedIncomeData {
  date: string;
  amount: number;
  description: string;
  source: string;
  confidence: number;
}

interface CSVUploadProps {
  onUploadComplete?: (data: ParsedIncomeData[]) => void;
  onError?: (error: string) => void;
}

export const CSVUpload: React.FC<CSVUploadProps> = ({
  onUploadComplete,
  onError,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processFile(file);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);

    const file = event.dataTransfer.files[0];
    if (!file) return;

    await processFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const processFile = async (file: File) => {
    // ファイル形式チェック
    if (!file.name.endsWith('.csv')) {
      const errorMsg = 'CSVファイルを選択してください';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // プログレス更新のシミュレーション
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 80));
      }, 200);

      const uploadResult = await apiService.uploadCSV(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!uploadResult.success) {
        throw new Error('アップロードに失敗しました');
      }

      const resultData = {
        success: uploadResult.success,
        totalTransactions: uploadResult.totalTransactions,
        incomeTransactions: uploadResult.incomeTransactions,
        errors: uploadResult.errors || [],
        bankType: uploadResult.bankType,
      };

      setResult(resultData);
      setShowResultDialog(true);
      onUploadComplete?.(uploadResult.incomeTransactions);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'アップロードエラーが発生しました';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleCloseDialog = () => {
    setShowResultDialog(false);
    setResult(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  return (
    <Box>
      <Paper
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          bgcolor: isDragActive ? 'primary.50' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50',
          },
        }}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="csv-file-input"
        />
        <Box textAlign="center">
          <CloudUploadIcon
            sx={{
              fontSize: 48,
              color: isDragActive ? 'primary.main' : 'grey.400',
              mb: 2,
            }}
          />
          <Typography variant="h6" gutterBottom>
            {isDragActive
              ? 'ファイルをドロップしてください'
              : '銀行明細CSVファイルをアップロード'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            対応銀行: 三菱UFJ、三井住友、みずほ、ゆうちょ銀行
          </Typography>
          <Button
            variant="outlined"
            component="label"
            disabled={uploading}
            htmlFor="csv-file-input"
          >
            ファイルを選択
          </Button>
        </Box>
      </Paper>

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            CSVファイルを処理中...
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* 結果表示ダイアログ */}
      <Dialog
        open={showResultDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {result?.success ? (
              <CheckCircleIcon color="success" />
            ) : (
              <ErrorIcon color="error" />
            )}
            CSV処理結果
          </Box>
        </DialogTitle>
        <DialogContent>
          {result && (
            <Box>
              <Box display="flex" gap={1} mb={2}>
                <Chip
                  label={`${result.bankType} 形式`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`${result.totalTransactions}件の取引`}
                  color="info"
                  variant="outlined"
                />
                <Chip
                  label={`${result.incomeTransactions.length}件の収入を検出`}
                  color="success"
                  variant="outlined"
                />
              </Box>

              {result.incomeTransactions.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    検出された収入
                  </Typography>
                  <List dense>
                    {result.incomeTransactions
                      .slice(0, 5)
                      .map((income, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <MoneyIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${formatCurrency(income.amount)} - ${income.source}`}
                            secondary={`${income.date} | 信頼度: ${Math.round(income.confidence * 100)}%`}
                          />
                        </ListItem>
                      ))}
                    {result.incomeTransactions.length > 5 && (
                      <ListItem>
                        <ListItemText
                          primary={`...他 ${result.incomeTransactions.length - 5}件`}
                          sx={{ textAlign: 'center', fontStyle: 'italic' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}

              {result.errors.length > 0 && (
                <Box mt={2}>
                  <Typography variant="h6" color="error" gutterBottom>
                    処理エラー
                  </Typography>
                  <List dense>
                    {result.errors.map((error, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <ErrorIcon color="error" />
                        </ListItemIcon>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>閉じる</Button>
          {result?.incomeTransactions.length &&
            result.incomeTransactions.length > 0 && (
              <Button
                variant="contained"
                onClick={() => {
                  handleCloseDialog();
                  // ダッシュボードを更新
                  window.location.reload();
                }}
              >
                ダッシュボードで確認
              </Button>
            )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
