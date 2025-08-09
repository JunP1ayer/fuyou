import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Fade,
  Grow,
  Chip,
  Alert,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CloudUpload,
  ContentPaste,
  DragIndicator,
  PhotoCamera,
  Image,
  CheckCircle,
  Close,
} from '@mui/icons-material';

import type { UploadState, UserProfile } from '../../types/intelligentOCR';

interface SmartUploadZoneProps {
  onFileUpload: (
    file: File,
    method: UploadState['uploadMethod']
  ) => Promise<void>;
  uploadState: UploadState;
  setUploadState: React.Dispatch<React.SetStateAction<UploadState>>;
  userProfile?: UserProfile;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const SmartUploadZone: React.FC<SmartUploadZoneProps> = ({
  onFileUpload,
  uploadState,
  setUploadState,
  userProfile,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_dragCounter, _setDragCounter] = useState(0);
  const [validationError, setValidationError] = useState<string>('');

  /**
   * ファイル検証
   */
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `ファイルサイズが大きすぎます (最大: ${MAX_FILE_SIZE / 1024 / 1024}MB)`;
    }

    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return 'サポートされていないファイル形式です (JPG, PNG, WebP, GIF のみ)';
    }

    return null;
  };

  /**
   * ファイル処理の共通ロジック
   */
  const processFile = useCallback(
    async (file: File, method: UploadState['uploadMethod']) => {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        return;
      }

      setValidationError('');
      await onFileUpload(file, method);
    },
    [onFileUpload]
  );

  /**
   * ファイル選択ハンドラー
   */
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        await processFile(file, 'file');
      }
    },
    [processFile]
  );

  /**
   * ドラッグ&ドロップハンドラー
   */
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter(prev => prev + 1);

      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setUploadState(prev => ({ ...prev, isDragging: true }));
      }
    },
    [setUploadState]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter(prev => {
        const newCounter = prev - 1;
        if (newCounter === 0) {
          setUploadState(prev => ({ ...prev, isDragging: false }));
        }
        return newCounter;
      });
    },
    [setUploadState]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setDragCounter(0);
      setUploadState(prev => ({ ...prev, isDragging: false }));

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        await processFile(files[0], 'drag');
      }
    },
    [processFile, setUploadState]
  );

  /**
   * クリップボードから画像を処理
   */
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], 'clipboard-image.png', { type });
            await processFile(file, 'clipboard');
            return;
          }
        }
      }

      setValidationError('クリップボードに画像が見つかりません');
    } catch {
      setValidationError('クリップボードアクセスに失敗しました');
    }
  }, [processFile]);

  /**
   * カメラ撮影 (モバイル対応)
   */
  const handleCameraCapture = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  }, []);

  /**
   * キーボードショートカット
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        handlePasteFromClipboard();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlePasteFromClipboard]);

  return (
    <Box>
      {/* ユーザー設定表示 */}
      {userProfile?.shiftFilterName && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            📝 フィルタリング名: <strong>{userProfile.shiftFilterName}</strong>
            <br />
            この名前に関連するシフトを優先的に抽出します
          </Typography>
        </Alert>
      )}

      {/* メインアップロードエリア */}
      <Paper
        elevation={uploadState.isDragging ? 8 : 2}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          p: 4,
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px dashed ${
            uploadState.isDragging
              ? theme.palette.primary.main
              : theme.palette.divider
          }`,
          borderRadius: 2,
          bgcolor: uploadState.isDragging
            ? alpha(theme.palette.primary.main, 0.04)
            : 'background.paper',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* 背景アニメーション */}
        {uploadState.isDragging && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)} 25%, transparent 25%, transparent 75%, ${alpha(theme.palette.primary.main, 0.1)} 75%)`,
              backgroundSize: '20px 20px',
              animation: 'slide 1s linear infinite',
              '@keyframes slide': {
                '0%': { backgroundPosition: '0 0' },
                '100%': { backgroundPosition: '20px 20px' },
              },
            }}
          />
        )}

        {/* アップロード中の表示 */}
        {uploadState.isProcessing ? (
          <Fade in={true}>
            <Box textAlign="center" position="relative" zIndex={1}>
              <CloudUpload
                sx={{ fontSize: 80, color: 'primary.main', mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                アップロード中...
              </Typography>
              <LinearProgress sx={{ width: 200, mt: 2 }} />
            </Box>
          </Fade>
        ) : uploadState.imagePreview ? (
          /* 画像プレビュー */
          <Grow in={true}>
            <Box textAlign="center" position="relative" zIndex={1}>
              <Box
                component="img"
                src={uploadState.imagePreview}
                alt="アップロード画像"
                sx={{
                  maxWidth: '200px',
                  maxHeight: '150px',
                  borderRadius: 1,
                  mb: 2,
                }}
              />
              <Typography variant="h6" color="success.main" gutterBottom>
                <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                画像を選択しました
              </Typography>
              <Chip
                label={uploadState.uploadMethod}
                color="primary"
                size="small"
              />
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  setUploadState(prev => ({
                    ...prev,
                    selectedImage: null,
                    imagePreview: null,
                    uploadMethod: null,
                  }));
                }}
                sx={{ ml: 1 }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Grow>
        ) : (
          /* 初期状態 */
          <Box textAlign="center" position="relative" zIndex={1}>
            <DragIndicator
              sx={{
                fontSize: 80,
                color: uploadState.isDragging
                  ? 'primary.main'
                  : 'text.secondary',
                mb: 2,
                transition: 'color 0.3s ease',
              }}
            />
            <Typography
              variant="h5"
              gutterBottom
              color={uploadState.isDragging ? 'primary.main' : 'text.primary'}
              fontWeight="bold"
            >
              {uploadState.isDragging
                ? 'ドロップして解析開始！'
                : 'シフト表をアップロード'}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              画像をドラッグ&ドロップするか、下のボタンから選択してください
            </Typography>

            {/* サポート形式表示 */}
            <Box
              display="flex"
              gap={1}
              justifyContent="center"
              flexWrap="wrap"
              mb={3}
            >
              {['JPG', 'PNG', 'WebP', 'GIF'].map(format => (
                <Chip
                  key={format}
                  label={format}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* 隠しファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_FORMATS.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Paper>

      {/* アップロード方法ボタン */}
      <Box
        display="flex"
        gap={2}
        justifyContent="center"
        mt={3}
        flexWrap="wrap"
      >
        <Button
          variant="outlined"
          startIcon={<Image />}
          onClick={() => fileInputRef.current?.click()}
          size="large"
        >
          ファイル選択
        </Button>

        <Button
          variant="outlined"
          startIcon={<ContentPaste />}
          onClick={handlePasteFromClipboard}
          size="large"
        >
          クリップボード
        </Button>

        <Button
          variant="outlined"
          startIcon={<PhotoCamera />}
          onClick={handleCameraCapture}
          size="large"
          sx={{ display: { xs: 'flex', md: 'none' } }} // モバイルのみ表示
        >
          カメラ撮影
        </Button>
      </Box>

      {/* キーボードショートカット表示 */}
      <Box mt={2} textAlign="center">
        <Typography variant="caption" color="text.secondary">
          💡 ヒント: Ctrl+V でクリップボードから直接ペースト可能
        </Typography>
      </Box>

      {/* エラー表示 */}
      {validationError && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          onClose={() => setValidationError('')}
        >
          {validationError}
        </Alert>
      )}

      {/* 制限事項表示 */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          📋 <strong>最適な結果のためのヒント:</strong>
          <br />• 文字がはっきり見える画像を使用してください •
          ファイルサイズは5MB以下にしてください •
          シフト表全体が写っている画像が推奨です
        </Typography>
      </Alert>
    </Box>
  );
};
