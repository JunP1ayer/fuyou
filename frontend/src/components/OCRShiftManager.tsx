import React, { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Alert,
  Stack,
  Chip,
  Paper,
} from '@mui/material';
import {
  CameraAlt,
  Upload,
  AutoAwesome,
  Visibility,
  SmartToy,
} from '@mui/icons-material';

import type { CreateShiftData } from '../types/shift';

interface OCRShiftManagerProps {
  onShiftsSaved?: (shifts: CreateShiftData[]) => void;
  onClose?: () => void;
  onComplete?: (shifts: CreateShiftData[]) => void;
}

interface AIProvider {
  name: string;
  icon: React.ReactNode;
  endpoint: string;
  description: string;
  priority: number;
  available: boolean;
}

export const OCRShiftManager: React.FC<OCRShiftManagerProps> = ({
  onShiftsSaved,
  onClose,
  onComplete,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [results, setResults] = useState<CreateShiftData[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI プロバイダ設定（優先順位: Gemini > OpenAI > Vision）
  const aiProviders: AIProvider[] = [
    {
      name: 'gemini',
      icon: <AutoAwesome />,
      endpoint: '/api/gemini-vision',
      description: 'Google Gemini - 高精度画像解析',
      priority: 1,
      available: true,
    },
    {
      name: 'openai',
      icon: <SmartToy />,
      endpoint: '/api/openai-vision',
      description: 'OpenAI GPT-4o - 自然言語処理',
      priority: 2,
      available: true, // APIキー更新済み
    },
    {
      name: 'vision',
      icon: <Visibility />,
      endpoint: '/api/ocr/upload',
      description: 'Google Cloud Vision - OCR専門',
      priority: 3,
      available: true,
    },
  ];

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    // ファイルサイズチェック (5MB制限)
    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    // Base64に変換
    const reader = new FileReader();
    reader.onload = e => {
      setSelectedImage(e.target?.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError('');

    try {
      const provider = aiProviders.find(p => p.name === selectedProvider);
      if (!provider) throw new Error('プロバイダが見つかりません');

      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          prompt:
            'この画像からシフト情報を抽出してください。日付、開始時間、終了時間、職場名、時給を含むJSONデータで出力してください。',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'AI処理に失敗しました');
      }

      // 結果の処理
      if (result.success && result.shifts) {
        setResults(result.shifts);
        if (onShiftsSaved) {
          onShiftsSaved(result.shifts);
        }
        if (onComplete) {
          onComplete(result.shifts);
        }
      } else {
        throw new Error('シフトデータを抽出できませんでした');
      }
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const availableProviders = aiProviders
    .filter(p => p.available)
    .sort((a, b) => a.priority - b.priority);

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <CameraAlt sx={{ mr: 1 }} />
          <Typography variant="h6">AI シフト表解析</Typography>
        </Box>

        {/* AI プロバイダ選択 */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            解析エンジン選択
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {availableProviders.map(provider => (
              <Chip
                key={provider.name}
                icon={provider.icon}
                label={provider.description}
                variant={
                  selectedProvider === provider.name ? 'filled' : 'outlined'
                }
                color={
                  selectedProvider === provider.name ? 'primary' : 'default'
                }
                clickable
                onClick={() => setSelectedProvider(provider.name)}
                size="small"
              />
            ))}
          </Stack>
        </Box>

        {/* 画像選択 */}
        <Box mb={3}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => fileInputRef.current?.click()}
            fullWidth
            disabled={loading}
          >
            シフト表画像をアップロード
          </Button>
        </Box>

        {/* 画像プレビュー */}
        {selectedImage && (
          <Box mb={3}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                選択された画像:
              </Typography>
              <img
                src={selectedImage}
                alt="選択された画像"
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            </Paper>
          </Box>
        )}

        {/* 処理ボタン */}
        {selectedImage && (
          <Box mb={3}>
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={processImage}
              disabled={loading}
              fullWidth
            >
              {loading ? 'AI解析中...' : 'AIでシフト解析開始'}
            </Button>
          </Box>
        )}

        {/* ローディング */}
        {loading && (
          <Box mb={2}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {selectedProvider === 'gemini' && 'Gemini AIで解析中...'}
              {selectedProvider === 'openai' && 'OpenAI GPT-4oで解析中...'}
              {selectedProvider === 'vision' && 'Google Vision OCRで解析中...'}
            </Typography>
          </Box>
        )}

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 結果表示 */}
        {results.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              抽出されたシフト ({results.length}件):
            </Typography>
            {results.map((shift, index) => (
              <Paper key={index} elevation={1} sx={{ p: 2, mb: 1 }}>
                <Typography variant="body2">
                  <strong>{shift.jobSourceName}</strong> - {shift.date}
                  <br />
                  {shift.startTime} 〜 {shift.endTime}
                  {shift.breakMinutes && ` (休憩${shift.breakMinutes}分)`}
                  <br />
                  時給: ¥{shift.hourlyRate?.toLocaleString()}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
