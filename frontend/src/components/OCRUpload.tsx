import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  Chip,
  ButtonGroup,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  PhotoCamera,
  Close,
  CloudUpload,
  Image as ImageIcon,
  CameraAlt,
  FileUpload,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import type {
  OCRResponse,
  ImageUploadState,
  OCRProcessingState,
  ImageInputSource,
  CameraSettings,
  ExtractedShiftData,
} from '../types/ocr';

interface OCRUploadProps {
  onOCRComplete?: (result: OCRResponse) => void;
  onError?: (error: string) => void;
  onShiftDataExtracted?: (shifts: ExtractedShiftData[]) => void;
}

export const OCRUpload: React.FC<OCRUploadProps> = ({
  onOCRComplete,
  onError,
  onShiftDataExtracted,
}) => {
  const { token } = useAuth();
  const [uploadState, setUploadState] = useState<ImageUploadState>({
    file: null,
    preview: null,
    uploading: false,
    progress: 0,
    error: null,
  });
  const [processingState, setProcessingState] = useState<OCRProcessingState>({
    step: 'idle',
    progress: 0,
    message: '',
  });
  const [cameraOpen, setCameraOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [ocrResult, setOCRResult] = useState<OCRResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cameraSettings: CameraSettings = {
    facingMode: 'environment',
    width: 1920,
    height: 1080,
    quality: 0.8,
  };

  // ファイル選択処理
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        processSelectedFile(file, 'file');
      }
    },
    [processSelectedFile]
  );

  // ドラッグ&ドロップ処理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        processSelectedFile(file, 'drag-drop');
      }
    },
    [processSelectedFile]
  );

  // 選択されたファイルの処理
  const processSelectedFile = useCallback(
    (
      file: File,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      source: ImageInputSource
    ) => {
      // ファイル形式チェック
      if (!file.type.startsWith('image/')) {
        setUploadState(prev => ({
          ...prev,
          error: '画像ファイルを選択してください',
        }));
        onError?.('画像ファイルを選択してください');
        return;
      }

      // サイズチェック (5MB制限)
      if (file.size > 5 * 1024 * 1024) {
        setUploadState(prev => ({
          ...prev,
          error: 'ファイルサイズは5MB以下にしてください',
        }));
        onError?.('ファイルサイズは5MB以下にしてください');
        return;
      }

      // プレビュー画像の生成
      const reader = new FileReader();
      reader.onload = e => {
        setUploadState({
          file,
          preview: e.target?.result as string,
          uploading: false,
          progress: 0,
          error: null,
        });
      };
      reader.readAsDataURL(file);
    },
    [onError]
  );

  // カメラ起動
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraSettings.facingMode,
          width: { ideal: cameraSettings.width },
          height: { ideal: cameraSettings.height },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOpen(true);
    } catch (error) {
      console.error('カメラの起動に失敗しました:', error);
      setUploadState(prev => ({
        ...prev,
        error: 'カメラの起動に失敗しました',
      }));
      onError?.('カメラの起動に失敗しました');
    }
  };

  // カメラ停止
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  // 写真撮影
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx?.drawImage(video, 0, 0);

      canvas.toBlob(
        blob => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', {
              type: 'image/jpeg',
            });
            processSelectedFile(file, 'camera');
            stopCamera();
          }
        },
        'image/jpeg',
        cameraSettings.quality
      );
    }
  };

  // OCR処理開始
  const startOCRProcessing = async () => {
    if (!uploadState.file || !token) return;

    setProcessingState({
      step: 'uploading',
      progress: 0,
      message: '画像をアップロード中...',
    });

    try {
      // プログレス更新のシミュレーション
      const progressInterval = setInterval(() => {
        setProcessingState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 80),
        }));
      }, 300);

      const response = await apiService.uploadImageForOCR(
        token,
        uploadState.file
      );

      clearInterval(progressInterval);

      setProcessingState({
        step: 'complete',
        progress: 100,
        message: 'OCR処理が完了しました',
        result: response,
      });

      setOCRResult(response);
      setResultOpen(true);
      onOCRComplete?.(response);

      // シフトデータの抽出も試行
      if (response.success && response.data?.extractedText) {
        const extractedShifts = extractShiftDataFromText(
          response.data.extractedText
        );
        if (extractedShifts.length > 0) {
          onShiftDataExtracted?.(extractedShifts);
        }
      }
    } catch (error) {
      setProcessingState({
        step: 'error',
        progress: 0,
        message:
          error instanceof Error ? error.message : 'OCR処理に失敗しました',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      onError?.(
        error instanceof Error ? error.message : 'OCR処理に失敗しました'
      );
    }
  };

  // テキストからシフトデータを抽出（簡易版）
  const extractShiftDataFromText = (text: string): ExtractedShiftData[] => {
    const shifts: ExtractedShiftData[] = [];

    // 簡単な日付と時間の抽出パターン
    const datePattern = /(\d{1,2})\/(\d{1,2})|(\d{4})-(\d{1,2})-(\d{1,2})/g;
    // TODO: Implement time and rate extraction
    // const timePattern = /(\d{1,2}):(\d{2})/g;
    // const ratePattern = /(\d+)円/g;

    let dateMatch;
    while ((dateMatch = datePattern.exec(text)) !== null) {
      const shift: ExtractedShiftData = {
        confidence: 0.7, // 仮の信頼度
      };

      if (dateMatch[1] && dateMatch[2]) {
        shift.date = `2024-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
      }

      shifts.push(shift);
    }

    return shifts;
  };

  // リセット処理
  const resetUpload = () => {
    setUploadState({
      file: null,
      preview: null,
      uploading: false,
      progress: 0,
      error: null,
    });
    setProcessingState({
      step: 'idle',
      progress: 0,
      message: '',
    });
    setOCRResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box>
      {/* メインアップロード領域 */}
      <Paper
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          bgcolor: dragActive ? 'primary.50' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50',
          },
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {uploadState.preview ? (
          // 画像プレビュー表示
          <Box>
            <Card sx={{ maxWidth: 400, mx: 'auto' }}>
              <CardMedia
                component="img"
                height="200"
                image={uploadState.preview}
                alt="アップロード予定の画像"
              />
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    {uploadState.file?.name}
                  </Typography>
                  <IconButton onClick={resetUpload} size="small">
                    <Close />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>

            <Box textAlign="center" mt={2}>
              <Button
                variant="contained"
                onClick={startOCRProcessing}
                disabled={processingState.step !== 'idle'}
                startIcon={
                  processingState.step === 'uploading' ? (
                    <CircularProgress size={20} />
                  ) : (
                    <CloudUpload />
                  )
                }
                size="large"
              >
                {processingState.step === 'uploading'
                  ? 'OCR処理中...'
                  : 'OCR処理開始'}
              </Button>
            </Box>
          </Box>
        ) : (
          // アップロード選択UI
          <Box textAlign="center">
            <ImageIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              シフト表の画像をアップロード
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              画像からシフト情報を自動抽出します
            </Typography>

            <ButtonGroup variant="outlined" sx={{ mb: 2 }}>
              <Button
                onClick={() => fileInputRef.current?.click()}
                startIcon={<FileUpload />}
              >
                ファイル選択
              </Button>
              <Button onClick={startCamera} startIcon={<CameraAlt />}>
                カメラ撮影
              </Button>
            </ButtonGroup>

            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
            >
              対応形式: JPG, PNG, JPEG（最大5MB）
            </Typography>
          </Box>
        )}
      </Paper>

      {/* 処理状況表示 */}
      {processingState.step !== 'idle' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            {processingState.message}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={processingState.progress}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}

      {/* エラー表示 */}
      {(uploadState.error || processingState.error) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {uploadState.error || processingState.error}
        </Alert>
      )}

      {/* カメラダイアログ */}
      <Dialog open={cameraOpen} onClose={stopCamera} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PhotoCamera />
            シフト表を撮影
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                maxWidth: '500px',
                height: 'auto',
                borderRadius: '8px',
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={stopCamera}>キャンセル</Button>
          <Button
            onClick={capturePhoto}
            variant="contained"
            startIcon={<PhotoCamera />}
          >
            撮影
          </Button>
        </DialogActions>
      </Dialog>

      {/* OCR結果ダイアログ */}
      <Dialog
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>OCR処理結果</DialogTitle>
        <DialogContent>
          {ocrResult && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    抽出されたテキスト
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      maxHeight: 300,
                      overflow: 'auto',
                    }}
                  >
                    <Typography
                      variant="body2"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {ocrResult.data?.extractedText ||
                        'テキストが抽出されませんでした'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    処理情報
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={`信頼度: ${Math.round((ocrResult.data?.confidence || 0) * 100)}%`}
                      color={
                        ocrResult.data?.confidence &&
                        ocrResult.data.confidence > 0.8
                          ? 'success'
                          : 'warning'
                      }
                    />
                    <Chip
                      label={`処理時間: ${ocrResult.metadata?.processingTimeMs || 0}ms`}
                      color="info"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultOpen(false)}>閉じる</Button>
          <Button
            variant="contained"
            onClick={() => {
              setResultOpen(false);
              // シフト登録画面に遷移する処理をここに追加
            }}
          >
            シフト登録に進む
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
