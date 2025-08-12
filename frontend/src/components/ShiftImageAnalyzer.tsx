// 🤖 GPT-5 シフト表画像解析コンポーネント

import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Fade,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material';
import {
  PhotoCamera,
  Clear,
  SmartToy,
  CalendarMonth,
  Check,
  Close,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface ShiftData {
  date: string;
  startTime: string;
  endTime: string;
  workplace?: string;
  notes?: string;
}

interface ShiftImageAnalyzerProps {
  onShiftsExtracted: (shifts: ShiftData[]) => void;
  onClose?: () => void;
}

export const ShiftImageAnalyzer: React.FC<ShiftImageAnalyzerProps> = ({
  onShiftsExtracted,
  onClose,
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedShifts, setExtractedShifts] = useState<ShiftData[]>([]);
  const [error, setError] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setError('');
      setExtractedShifts([]);
      setAnalysisResult('');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setExtractedShifts([]);
    setError('');
    setAnalysisResult('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeShiftImage = async () => {
    if (!selectedImage || !imagePreview) return;

    setIsAnalyzing(true);
    setError('');

    try {
      // 同一バックエンドの解析APIに統一
      const API = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api/gpt5-shift-analyzer'
        : 'https://fuyou-sigma.vercel.app/api/gpt5-shift-analyzer';

      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview }),
      });

      if (!response.ok) {
        throw new Error(`API エラー: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.shifts)) {
        // バックエンドの標準フォーマットをShiftDataへマップ
        const mapped = data.shifts.map((s: any) => ({
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          workplace: s.workplace || s.jobSourceName,
          notes: '',
        }));
        setExtractedShifts(mapped);
        setAnalysisResult(data.processingNotes || `${mapped.length}件のシフトを検出しました`);
      } else {
        setError(data.error || 'シフト情報を検出できませんでした。より鮮明な画像をお試しください。');
      }

    } catch (err) {
      console.error('シフト表解析エラー:', err);
      setError('画像の解析中にエラーが発生しました。しばらく待ってから再度お試しください。');
    }

    setIsAnalyzing(false);
  };

  const handleConfirmShifts = () => {
    onShiftsExtracted(extractedShifts);
    if (onClose) {
      onClose();
    }
  };

  const removeShift = (index: number) => {
    setExtractedShifts(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SmartToy sx={{ color: 'primary.main', fontSize: 28, mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
            GPT-5 シフト表解析
          </Typography>
          {onClose && (
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          シフト表の画像をアップロードすると、GPT-5がシフト情報を自動で読み取り、
          カレンダーに反映できる形式に変換します。
        </Typography>

        {/* 画像アップロード */}
        {!imagePreview ? (
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              textAlign: 'center',
              borderStyle: 'dashed',
              borderColor: 'primary.main',
              bgcolor: 'primary.light',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'primary.lighter',
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <PhotoCamera sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              シフト表画像をアップロード
            </Typography>
            <Typography variant="body2" color="text.secondary">
              PNG、JPG、JPEG形式に対応
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              startIcon={<PhotoCamera />}
            >
              画像を選択
            </Button>
          </Paper>
        ) : (
          <Box>
            {/* 画像プレビュー */}
            <Box sx={{ position: 'relative', mb: 2 }}>
              <img
                src={imagePreview}
                alt="シフト表プレビュー"
                style={{
                  width: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                }}
              />
              <IconButton
                onClick={clearImage}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'error.dark' },
                }}
              >
                <Clear />
              </IconButton>
            </Box>

            {/* 解析ボタン */}
            {!isAnalyzing && extractedShifts.length === 0 && !error && (
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={analyzeShiftImage}
                startIcon={<SmartToy />}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  },
                }}
              >
                GPT-5で解析開始
              </Button>
            )}
          </Box>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />

        {/* ローディング */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Fade in={isAnalyzing}>
                <Alert
                  severity="info"
                  icon={<CircularProgress size={20} />}
                  sx={{ mt: 2 }}
                >
                  GPT-5がシフト表を解析しています...
                  <br />
                  <Typography variant="caption">
                    複雑な画像の場合、少し時間がかかることがあります
                  </Typography>
                </Alert>
              </Fade>
            </motion.div>
          )}
        </AnimatePresence>

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* 解析結果 */}
        <AnimatePresence>
          {extractedShifts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  ✅ 解析完了！
                </Typography>
                {analysisResult}
              </Alert>

              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                検出されたシフト ({extractedShifts.length}件)
              </Typography>

              <List>
                {extractedShifts.map((shift, index) => (
                  <ListItem
                    key={index}
                    divider
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarMonth sx={{ fontSize: 18, color: 'primary.main' }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {new Date(shift.date).toLocaleDateString('ja-JP', {
                              month: 'short',
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </Typography>
                          <Chip
                            label={`${shift.startTime} - ${shift.endTime}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          {shift.workplace && (
                            <Typography variant="caption" color="text.secondary">
                              📍 {shift.workplace}
                            </Typography>
                          )}
                          {shift.notes && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              📝 {shift.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        color="error"
                        size="small"
                        onClick={() => removeShift(index)}
                      >
                        <Close />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={clearImage}
                  sx={{ flex: 1 }}
                >
                  やり直し
                </Button>
                <Button
                  variant="contained"
                  onClick={handleConfirmShifts}
                  startIcon={<Check />}
                  sx={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #45a049 0%, #4caf50 100%)',
                    },
                  }}
                >
                  カレンダーに追加 ({extractedShifts.length}件)
                </Button>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};