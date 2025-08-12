// 🤖 GPT-5 シフト表提出フロー - プロフェッショナル版

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  Grid,
} from '@mui/material';
import {
  Upload,
  AutoAwesome,
  Visibility,
  Edit,
  Check,
  Error as ErrorIcon,
  Info,
  CalendarMonth,
  Business,
  Person,
  Schedule,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimpleShiftStore } from '../store/simpleShiftStore';
import { useCalendarStore } from '../store/calendarStore';

// 型定義
interface ShiftData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  confidence: number;
  workplaceName: string;
  hourlyRate: number;
}

interface GPT5AnalysisResult {
  success: boolean;
  analysis: {
    detectedWorkerName: string;
    workplaceDetected: string;
    totalShiftsFound: number;
  };
  shifts: Array<{
    date: string;
    startTime: string;
    endTime: string;
    confidence: number;
  }>;
  warnings: string[];
  processingNotes: string;
}

const STEPS = ['情報入力', 'AI解析', '結果確認', 'カレンダー反映'];

export const GPT5ShiftSubmissionFlow: React.FC = () => {
  const { workplaces, addShift } = useSimpleShiftStore();
  const { importFromShifts } = useCalendarStore();
  
  // State管理
  const [activeStep, setActiveStep] = useState(0);
  const [selectedWorkplace, setSelectedWorkplace] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GPT5AnalysisResult | null>(null);
  const [extractedShifts, setExtractedShifts] = useState<ShiftData[]>([]);
  const [editingShift, setEditingShift] = useState<ShiftData | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 選択された職場の詳細取得
  const workplace = workplaces.find(w => w.id === selectedWorkplace);

  // ファイル選択処理
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイル形式検証
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrors({ file: '対応していないファイル形式です。PNG、JPG、WebP、PDFのみ対応しています。' });
      return;
    }

    // ファイルサイズ検証（10MB制限）
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ file: 'ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。' });
      return;
    }

    setSelectedFile(file);
    setErrors({});
  }, []);

  // バリデーション
  const validateStep1 = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    
    if (!selectedWorkplace) {
      newErrors.workplace = 'バイト先を選択してください';
    }
    if (!workerName.trim()) {
      newErrors.workerName = '作業者名を入力してください';
    }
    if (!selectedFile) {
      newErrors.file = 'シフト表ファイルを選択してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedWorkplace, workerName, selectedFile]);

  // GPT-5解析実行
  const executeGPT5Analysis = useCallback(async () => {
    if (!selectedFile || !workplace) return;

    setIsAnalyzing(true);
    setActiveStep(1);
    
    try {
      // Base64変換
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result && (result.startsWith('data:image/') || result.startsWith('data:application/pdf'))) {
            resolve(result);
          } else {
            reject(new Error('ファイルの読み込みに失敗しました'));
          }
        };
        reader.onerror = () => reject(new Error('ファイル読み込みエラー'));
        reader.readAsDataURL(selectedFile);
      });

      // GPT-5 API呼び出し（ローカル・プロダクション対応）
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api/gpt5-shift-analyzer'
        : 'https://fuyou-sigma.vercel.app/api/gpt5-shift-analyzer';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          workerName: workerName.trim(),
          workplaceName: workplace.name
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: GPT5AnalysisResult = await response.json();
      
      if (!result.success) {
        throw new Error(result.processingNotes || 'GPT-5解析に失敗しました');
      }

      // シフトデータの変換・拡張
      const processedShifts: ShiftData[] = result.shifts.map((shift, index) => ({
        id: `gpt5-${Date.now()}-${index}`,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        confidence: shift.confidence,
        workplaceName: result.analysis.workplaceDetected || workplace.name,
        hourlyRate: workplace.defaultHourlyRate || 1000,
      }));

      setAnalysisResult(result);
      setExtractedShifts(processedShifts);
      setActiveStep(2);
      
    } catch (error: any) {
      console.error('GPT-5 Analysis Error:', error);
      const errorMessage = error?.message || 'AI解析でエラーが発生しました';
      setErrors({ analysis: errorMessage });
      setActiveStep(0);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, workplace, workerName]);

  // シフト編集
  const handleEditShift = useCallback((shift: ShiftData) => {
    setEditingShift({ ...shift });
  }, []);

  const handleSaveShift = useCallback(() => {
    if (!editingShift) return;
    
    setExtractedShifts(prev => 
      prev.map(shift => shift.id === editingShift.id ? editingShift : shift)
    );
    setEditingShift(null);
  }, [editingShift]);

  // カレンダー反映
  const handleConfirmToCalendar = useCallback(() => {
    if (!extractedShifts.length) return;

    // シフトストアに追加
    extractedShifts.forEach(shift => {
      const startTime = new Date(`2024-01-01T${shift.startTime}`);
      const endTime = new Date(`2024-01-01T${shift.endTime}`);
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const totalEarnings = Math.round(hours * shift.hourlyRate);

      addShift({
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        workplaceName: shift.workplaceName,
        hourlyRate: shift.hourlyRate,
        totalEarnings,
        status: 'confirmed',
      });
    });

    // カレンダーにインポート
    importFromShifts(extractedShifts.map(s => ({
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      workplaceName: s.workplaceName,
      hourlyRate: s.hourlyRate,
      totalEarnings: 0, // 後で計算
    })));

    setActiveStep(3);
    setTimeout(() => {
      // リセット
      setActiveStep(0);
      setSelectedWorkplace('');
      setWorkerName('');
      setSelectedFile(null);
      setAnalysisResult(null);
      setExtractedShifts([]);
    }, 2000);
  }, [extractedShifts, addShift, importFromShifts]);

  // 信頼度による色分け
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      {/* ヘッダー */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          <AutoAwesome sx={{ mr: 1, verticalAlign: 'bottom' }} />
          AI シフト表提出
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI powered shift schedule analysis and calendar integration
        </Typography>
      </Box>

      {/* ステッパー */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stepper activeStep={activeStep}>
            {STEPS.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* Step 1: 情報入力 */}
        {activeStep === 0 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <Info sx={{ mr: 1 }} />
                  基本情報を入力してください
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.workplace}>
                      <InputLabel>バイト先</InputLabel>
                      <Select
                        value={selectedWorkplace}
                        onChange={(e) => setSelectedWorkplace(e.target.value)}
                        startAdornment={<Business sx={{ mr: 1, color: 'action.active' }} />}
                      >
                        {workplaces.map((wp) => (
                          <MenuItem key={wp.id} value={wp.id}>
                            {wp.name} (時給: ¥{wp.defaultHourlyRate})
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.workplace && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                          {errors.workplace}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="作業者名"
                      value={workerName}
                      onChange={(e) => setWorkerName(e.target.value)}
                      error={!!errors.workerName}
                      helperText={errors.workerName}
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                      placeholder="例: 田中太郎"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Button
                        component="label"
                        variant="contained"
                        size="large"
                        startIcon={<Upload />}
                        sx={{ mb: 2 }}
                      >
                        シフト表ファイルを選択
                        <input
                          type="file"
                          hidden
                          accept="image/*,.pdf"
                          onChange={handleFileSelect}
                        />
                      </Button>
                      
                      {selectedFile && (
                        <Box sx={{ mt: 2 }}>
                          <Chip
                            icon={<Check />}
                            label={`選択: ${selectedFile.name}`}
                            color="success"
                            variant="outlined"
                          />
                        </Box>
                      )}
                      
                      {errors.file && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          {errors.file}
                        </Alert>
                      )}
                      
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                        PNG, JPG, WebP, PDF対応（最大10MB）
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => {
                      if (validateStep1()) {
                        executeGPT5Analysis();
                      }
                    }}
                    disabled={!selectedWorkplace || !workerName.trim() || !selectedFile}
                    sx={{
                      px: 4,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      }
                    }}
                  >
                    AIで解析開始
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: AI解析中 */}
        {activeStep === 1 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <AutoAwesome sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  AIがシフト表を解析中...
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  最新のAI技術でシフト情報を正確に抽出しています
                </Typography>
                <LinearProgress sx={{ mb: 2, height: 8, borderRadius: 4 }} />
                <Typography variant="caption" color="text.secondary">
                  通常15〜30秒程度で完了します
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: 結果確認 */}
        {activeStep === 2 && analysisResult && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <Visibility sx={{ mr: 1 }} />
                  AI 解析結果
                </Typography>

                {/* 解析サマリー */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                      <Schedule sx={{ color: 'info.contrastText', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.contrastText' }}>
                        {analysisResult.analysis.totalShiftsFound}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'info.contrastText' }}>
                        シフト検出
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                      <Person sx={{ color: 'success.contrastText', mb: 1 }} />
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.contrastText' }}>
                        {analysisResult.analysis.detectedWorkerName || '検出なし'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'success.contrastText' }}>
                        作業者名
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                      <Business sx={{ color: 'warning.contrastText', mb: 1 }} />
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'warning.contrastText' }}>
                        {analysisResult.analysis.workplaceDetected || '検出なし'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'warning.contrastText' }}>
                        職場名
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* 警告表示 */}
                {analysisResult.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2">注意事項:</Typography>
                    {analysisResult.warnings.map((warning, index) => (
                      <Typography key={index} variant="body2">• {warning}</Typography>
                    ))}
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* シフト一覧テーブル */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  抽出されたシフト一覧
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>日付</TableCell>
                        <TableCell>時間</TableCell>
                        <TableCell>信頼度</TableCell>
                        <TableCell align="center">操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {extractedShifts.map((shift) => (
                        <TableRow key={shift.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {new Date(shift.date).toLocaleDateString('ja-JP', {
                                month: 'short',
                                day: 'numeric',
                                weekday: 'short'
                              })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {shift.date}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {shift.startTime} - {shift.endTime}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${Math.round(shift.confidence * 100)}%`}
                              color={getConfidenceColor(shift.confidence) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleEditShift(shift)}
                            >
                              <Edit />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* アクションボタン */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => setActiveStep(0)}
              >
                最初に戻る
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={<CalendarMonth />}
                onClick={handleConfirmToCalendar}
                disabled={extractedShifts.length === 0}
                sx={{
                  px: 4,
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)',
                  }
                }}
              >
                {extractedShifts.length}件をカレンダーに追加
              </Button>
            </Box>
          </motion.div>
        )}

        {/* Step 4: 完了 */}
        {activeStep === 3 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Check sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  カレンダーに反映完了！
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  AIで解析したシフトデータがカレンダーに正常に追加されました
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* シフト編集ダイアログ */}
      <Dialog
        open={!!editingShift}
        onClose={() => setEditingShift(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>シフト編集</DialogTitle>
        <DialogContent>
          {editingShift && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="日付"
                type="date"
                value={editingShift.date}
                onChange={(e) => setEditingShift(prev => prev ? { ...prev, date: e.target.value } : null)}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="開始時間"
                    type="time"
                    value={editingShift.startTime}
                    onChange={(e) => setEditingShift(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="終了時間"
                    type="time"
                    value={editingShift.endTime}
                    onChange={(e) => setEditingShift(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingShift(null)}>キャンセル</Button>
          <Button onClick={handleSaveShift} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};