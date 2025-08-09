import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Alert,
  Stack,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  CameraAlt,
  Upload,
  AutoAwesome,
  SmartToy,
  Work,
} from '@mui/icons-material';

import type { CreateShiftData } from '../types/shift';
import { apiService, type JobSource } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ShiftEditDialog } from './shifts/ShiftEditDialog';

interface OCRShiftManagerProps {
  onShiftsSaved?: (shifts: CreateShiftData[]) => void;
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
  onComplete,
}) => {
  const { token } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedProvider] = useState<string>('openai');
  const [jobSources, setJobSources] = useState<JobSource[]>([]);
  const [selectedJobSource, setSelectedJobSource] = useState<string>('');
  const [jobSourcesLoading, setJobSourcesLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedResults, setConfirmedResults] = useState<CreateShiftData[]>(
    []
  );
  const [editingShiftIndex, setEditingShiftIndex] = useState<number | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI プロバイダ設定（優先順位: Gemini > OpenAI > Vision）
  const aiProviders: AIProvider[] = [
    {
      name: 'openai',
      icon: <SmartToy />,
      endpoint: '/api/openai-vision',
      description: 'OpenAI GPT-5 - 最新AI画像解析',
      priority: 1,
      available: true,
    },
  ];

  // バイト先一覧を取得
  useEffect(() => {
    const loadJobSources = async () => {
      try {
        setJobSourcesLoading(true);
        const response = await apiService.getJobSources(false, token);
        if (response.success && response.data) {
          setJobSources(response.data);
          if (response.data.length > 0) {
            setSelectedJobSource(response.data[0].id);
          }
        }
      } catch (err) {
        console.error('バイト先一覧の取得に失敗:', err);
      } finally {
        setJobSourcesLoading(false);
      }
    };

    loadJobSources();
  }, [token]);

  const handleJobSourceChange = (event: SelectChangeEvent) => {
    setSelectedJobSource(event.target.value);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイル形式チェック
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('対応していないファイル形式です。画像、PDF、Word、テキストファイルを選択してください');
      return;
    }

    // ファイルサイズチェック (10MB制限)
    if (file.size > 10 * 1024 * 1024) {
      setError('ファイルサイズは10MB以下にしてください');
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
    if (!selectedImage || !selectedJobSource) {
      setError('ファイルとバイト先を選択してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const provider = aiProviders.find(p => p.name === selectedProvider);
      if (!provider) throw new Error('プロバイダが見つかりません');

      const selectedJob = jobSources.find(job => job.id === selectedJobSource);
      const jobName = selectedJob?.name || '';

      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          jobSourceId: selectedJobSource,
          jobSourceName: jobName,
          prompt: `この画像からシフト情報を抽出してください。バイト先名は「${jobName}」です。日付、開始時間、終了時間、時給を含むJSONデータで出力してください。`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'AI処理に失敗しました');
      }

      // 結果の処理（バイト先情報を統合）
      if (result.success && result.shifts) {
        const enrichedShifts = result.shifts.map((shift: CreateShiftData) => ({
          ...shift,
          jobSourceId: selectedJobSource,
          jobSourceName: jobName,
        }));

        setConfirmedResults(enrichedShifts);
        setShowConfirmation(true);
      } else {
        throw new Error('シフトデータを抽出できませんでした');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 確認を承認してカレンダーに反映
  const handleConfirmAndSave = () => {
    if (onShiftsSaved) {
      onShiftsSaved(confirmedResults);
    }
    if (onComplete) {
      onComplete(confirmedResults);
    }
    setShowConfirmation(false);
  };

  // 確認をキャンセルして結果をリセット
  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setConfirmedResults([]);
  };

  // シフト編集
  const handleEditShift = (index: number) => {
    setEditingShiftIndex(index);
    setEditDialogOpen(true);
  };

  // 編集保存
  const handleSaveEdit = (updatedShift: CreateShiftData) => {
    if (editingShiftIndex !== null) {
      const updatedResults = [...confirmedResults];
      updatedResults[editingShiftIndex] = updatedShift;
      setConfirmedResults(updatedResults);
      setEditDialogOpen(false);
      setEditingShiftIndex(null);
    }
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditingShiftIndex(null);
  };

  // const availableProviders = aiProviders
  //   .filter(p => p.available)
  //   .sort((a, b) => a.priority - b.priority);

  // 確認画面のUI
  if (showConfirmation) {
    return (
      <Card>
        <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
            確認画面
          </Typography>

          <Alert severity="success" sx={{ mb: 2 }}>
            シフト情報を抽出しました。内容を確認してください。
          </Alert>

          <Typography variant="subtitle2" gutterBottom>
            抽出されたシフト ({confirmedResults.length}件):
          </Typography>

          {confirmedResults.map((shift, index) => (
            <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography variant="body1">
                    <strong>{shift.jobSourceName}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {shift.date} | {shift.startTime} 〜 {shift.endTime}
                    {shift.breakMinutes && ` (休憩${shift.breakMinutes}分)`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    時給: ¥{shift.hourlyRate?.toLocaleString()} | 勤務時間:{' '}
                    {shift.workingHours}時間 | 給与: ¥
                    {shift.calculatedEarnings?.toLocaleString()}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleEditShift(index)}
                  disabled={loading}
                >
                  編集
                </Button>
              </Box>
            </Paper>
          ))}

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleCancelConfirmation}
              fullWidth
            >
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmAndSave}
              fullWidth
            >
              カレンダーに反映
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          シフト提出
        </Typography>

        {/* バイト先選択 */}
        <Box mb={3}>
          <FormControl fullWidth disabled={jobSourcesLoading || loading}>
            <InputLabel id="job-source-select-label">
              <Box display="flex" alignItems="center">
                <Work sx={{ mr: 1, fontSize: 20 }} />
                バイト先を選択
              </Box>
            </InputLabel>
            <Select
              labelId="job-source-select-label"
              value={selectedJobSource}
              onChange={handleJobSourceChange}
              label="バイト先を選択"
            >
              {jobSources.map(job => (
                <MenuItem key={job.id} value={job.id}>
                  {job.name}
                  {job.hourly_rate && (
                    <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                      (¥{job.hourly_rate}/時)
                    </Typography>
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {jobSources.length === 0 && !jobSourcesLoading && (
            <Alert severity="info" sx={{ mt: 1 }}>
              バイト先が登録されていません。シフト管理画面で先にバイト先を登録してください。
            </Alert>
          )}
        </Box>


        {/* ファイル選択 */}
        <Box mb={3}>
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
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
            シフト表ファイルをアップロード
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
            対応形式: 画像（JPG, PNG, GIF）、PDF、Word、テキスト
          </Typography>
        </Box>

        {/* ファイルプレビュー */}
        {selectedImage && (
          <Box mb={3}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                選択されたファイル:
              </Typography>
              {selectedImage.startsWith('data:image/') ? (
                <img
                  src={selectedImage}
                  alt="選択されたファイル"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  minHeight: '100px',
                  bgcolor: 'grey.100',
                  borderRadius: 1
                }}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedImage.includes('pdf') ? 'PDFファイル' :
                     selectedImage.includes('word') || selectedImage.includes('document') ? 'Wordファイル' :
                     selectedImage.includes('text') ? 'テキストファイル' : 'ドキュメントファイル'}がアップロードされました
                  </Typography>
                </Box>
              )}
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
              disabled={
                loading || !selectedJobSource || jobSources.length === 0
              }
              fullWidth
            >
              {loading ? 'ファイル解析中...' : 'ファイルを解析'}
            </Button>
            {!selectedJobSource && jobSources.length > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 1, textAlign: 'center' }}
              >
                バイト先を選択してください
              </Typography>
            )}
          </Box>
        )}

        {/* ローディング */}
        {loading && (
          <Box mb={2}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              ファイルを解析中... お待ちください
            </Typography>
          </Box>
        )}

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </CardContent>

      {/* シフト編集ダイアログ */}
      {editingShiftIndex !== null && (
        <ShiftEditDialog
          open={editDialogOpen}
          onClose={handleCancelEdit}
          onSave={handleSaveEdit}
          shiftData={confirmedResults[editingShiftIndex]}
          loading={loading}
        />
      )}
    </Card>
  );
};
