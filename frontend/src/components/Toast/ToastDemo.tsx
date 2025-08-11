// 🧪 トースト機能のデモ・テスト用コンポーネント

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  CloudUpload,
  BugReport,
} from '@mui/icons-material';
import { useToast, useApiToast } from './ToastProvider';

export const ToastDemo: React.FC = () => {
  const toast = useToast();
  const apiToast = useApiToast();

  const handleApiSuccess = () => {
    apiToast.apiSuccess('データの保存が完了しました！');
  };

  const handleApiError = () => {
    const mockError = {
      message: 'ネットワーク接続エラー',
      response: {
        data: {
          message: 'サーバーに接続できませんでした。しばらく時間をおいてから再試行してください。'
        }
      }
    };
    apiToast.apiError(mockError, 'デフォルトエラーメッセージ');
  };

  const handleUploadProgress = () => {
    apiToast.uploadProgress('CSVファイルをアップロード中...');
    
    // 3秒後に成功トースト
    setTimeout(() => {
      // 進捗トーストは手動クローズ想定のため全クリア
      toast.clearAll();
      apiToast.csvProcessed(156);
    }, 3000);
  };

  const handleOCRDemo = () => {
    apiToast.savingData();
    
    setTimeout(() => {
      toast.clearAll();
      apiToast.ocrProcessed(8);
    }, 2500);
  };

  const handleMultipleToasts = () => {
    toast.showInfo('処理を開始しました', 2000);
    
    setTimeout(() => {
      toast.showWarning('一部のデータに問題があります', 3000);
    }, 800);
    
    setTimeout(() => {
      toast.showSuccess('処理が完了しました！', 4000);
    }, 2000);
  };

  const handleCustomAction = () => {
    toast.showError(
      'アップロードに失敗しました',
      0, // 自動で閉じない
        <Button size="small" color="inherit" onClick={() => {
          toast.clearAll();
          toast.showInfo('再試行しています...');
        }}>
        再試行
      </Button>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReport color="primary" />
            トースト通知システム テスト
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            各ボタンをクリックしてトースト機能をテストできます。右下にトースト通知が表示されます。
          </Typography>

          <Stack spacing={3}>
            {/* 基本トースト */}
            <Box>
              <Typography variant="h6" gutterBottom>基本トースト</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => toast.showSuccess('成功しました！')}
                >
                  成功
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Error />}
                  onClick={() => toast.showError('エラーが発生しました')}
                >
                  エラー
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<Warning />}
                  onClick={() => toast.showWarning('注意が必要です')}
                >
                  警告
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<Info />}
                  onClick={() => toast.showInfo('お知らせがあります')}
                >
                  情報
                </Button>
              </Stack>
            </Box>

            <Divider />

            {/* API連携トースト */}
            <Box>
              <Typography variant="h6" gutterBottom>API連携トースト</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleApiSuccess}
                >
                  API成功
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleApiError}
                >
                  APIエラー
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CloudUpload />}
                  onClick={handleUploadProgress}
                >
                  CSV処理デモ
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleOCRDemo}
                >
                  OCR処理デモ
                </Button>
              </Stack>
            </Box>

            <Divider />

            {/* 応用トースト */}
            <Box>
              <Typography variant="h6" gutterBottom>応用機能</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  onClick={handleMultipleToasts}
                >
                  複数トースト
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCustomAction}
                >
                  カスタムアクション
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => toast.clearAll()}
                >
                  全て閉じる
                </Button>
              </Stack>
            </Box>
          </Stack>

          <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>使い方:</strong><br />
              • useToast() - 基本的なトースト表示<br />
              • useApiToast() - API処理専用のヘルパー関数<br />
              • 自動で消えるトースト、手動で閉じるトースト、カスタムアクション付きトーストが利用可能<br />
              • 複数のトーストが同時に表示でき、積み重ね表示されます
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};