import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  CameraAlt,
  PhotoLibrary,
  AutoAwesome,
  Schedule,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';

import { OCRShiftManager } from '../OCRShiftManager';
import type { CreateShiftData } from '../../types/shift';

interface AIFeatureProps {
  onShiftsSaved?: (shifts: CreateShiftData[]) => void;
}

export const AIFeature: React.FC<AIFeatureProps> = ({ onShiftsSaved }) => {
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastProcessedShifts, setLastProcessedShifts] = useState<
    CreateShiftData[]
  >([]);

  const handleOpenOCR = () => {
    setOcrDialogOpen(true);
  };

  const handleShiftsSaved = useCallback(
    (shifts: CreateShiftData[]) => {
      setLastProcessedShifts(shifts);
      onShiftsSaved?.(shifts);
      setOcrDialogOpen(false);
    },
    [onShiftsSaved]
  );

  const features = [
    {
      icon: <CameraAlt color="primary" />,
      title: 'シフト表自動読み取り',
      description: '写真を撮影するだけでシフト情報を自動抽出',
      status: '利用可能',
      color: 'success' as const,
    },
    {
      icon: <PhotoLibrary color="primary" />,
      title: 'ギャラリーから選択',
      description: '既存の画像からシフト情報を読み取り',
      status: '利用可能',
      color: 'success' as const,
    },
    {
      icon: <AutoAwesome color="primary" />,
      title: 'AI自動補正',
      description: '曖昧な文字も高精度で認識・補正',
      status: '利用可能',
      color: 'success' as const,
    },
    {
      icon: <Schedule color="warning" />,
      title: 'スケジュール最適化',
      description: 'AI による最適なシフト配置提案',
      status: '開発中',
      color: 'warning' as const,
    },
  ];

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto', p: 2 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          AI シフト管理
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI の力でシフト管理を自動化・最適化します
        </Typography>
      </Box>

      {/* メイン機能カード */}
      <Card
        elevation={3}
        sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CameraAlt sx={{ fontSize: 32, mr: 2 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                シフト表提出
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                写真を撮るだけで自動でシフトを登録
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={handleOpenOCR}
            disabled={processing}
            startIcon={
              processing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CameraAlt />
              )
            }
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontWeight: 600,
              py: 1.5,
              px: 3,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            {processing ? '処理中...' : 'シフト表を提出'}
          </Button>
        </CardContent>
      </Card>

      {/* 最後に処理したシフト情報 */}
      {lastProcessedShifts.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="h6" color="success.main">
                前回の処理結果
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {lastProcessedShifts.length}件のシフトを自動登録しました
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {lastProcessedShifts.slice(0, 3).map((shift, index) => (
                <Chip
                  key={index}
                  label={`${shift.jobSourceName} ${shift.date}`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              ))}
              {lastProcessedShifts.length > 3 && (
                <Chip
                  label={`+${lastProcessedShifts.length - 3}件`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 機能一覧 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            AI 機能一覧
          </Typography>

          <List>
            {features.map((feature, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>{feature.icon}</ListItemIcon>
                  <ListItemText
                    primary={feature.title}
                    secondary={feature.description}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: 500,
                      },
                    }}
                  />
                  <Chip
                    label={feature.status}
                    size="small"
                    color={feature.color}
                    variant={
                      feature.color === 'success' ? 'filled' : 'outlined'
                    }
                  />
                </ListItem>
                {index < features.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* 注意事項 */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>ご利用について：</strong>
          AI機能は画像の品質や内容により認識精度が変わる場合があります。
          処理後は必ず内容をご確認ください。
        </Typography>
      </Alert>

      {/* OCR処理ダイアログ */}
      <Dialog
        open={ocrDialogOpen}
        onClose={() => setOcrDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AutoAwesome color="primary" sx={{ mr: 1 }} />
            AI シフト表解析
          </Box>
        </DialogTitle>
        <DialogContent>
          <OCRShiftManager
            onShiftsSaved={handleShiftsSaved}
            onComplete={() => setOcrDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};
